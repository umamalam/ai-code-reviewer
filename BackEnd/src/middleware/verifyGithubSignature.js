const crypto = require("crypto");

/**
 * Verifies the X-Hub-Signature-256 header GitHub sends with every webhook
 * delivery, so we only ever process payloads that actually came from GitHub
 * and were signed with our webhook secret.
 *
 * Must run AFTER express.raw() (needs the raw Buffer body, not parsed JSON)
 * and BEFORE the route handler.
 */
module.exports = function verifyGithubSignature(req, res, next) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    const signature = req.headers["x-hub-signature-256"];

    if (!secret) {
        console.error("GITHUB_WEBHOOK_SECRET is not configured");
        return res.status(500).send("Webhook secret not configured");
    }
    if (!signature) {
        return res.status(401).send("Missing signature");
    }
    if (!Buffer.isBuffer(req.body)) {
        return res.status(400).send("Expected raw request body");
    }

    const expected = "sha256=" + crypto.createHmac("sha256", secret).update(req.body).digest("hex");

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).send("Invalid signature");
    }

    try {
        req.body = JSON.parse(req.body.toString("utf8"));
    } catch (err) {
        return res.status(400).send("Invalid JSON payload");
    }

    next();
};
