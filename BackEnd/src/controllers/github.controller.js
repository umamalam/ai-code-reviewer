const githubService = require("../services/github.service");
const reviewService = require("../services/review.service");

const HANDLED_ACTIONS = ["opened", "synchronize", "reopened"];

module.exports.handleWebhook = async (req, res) => {
    const event = req.headers["x-github-event"];
    const payload = req.body;

    // Ack immediately -- GitHub expects a fast response and will retry on timeout.
    // The actual review runs after we respond.
    res.status(202).send("Accepted");

    if (event !== "pull_request" || !HANDLED_ACTIONS.includes(payload.action)) {
        return;
    }

    let owner, repo, pull_number;

    try {
        // Extraction moved inside the try: an unusual/malformed payload here would
        // otherwise throw before the try block starts, producing an unhandled
        // rejection instead of the clean, logged failure below.
        owner = payload.repository.owner.login;
        repo = payload.repository.name;
        pull_number = payload.pull_request.number;

        const files = await githubService.getPullRequestFiles(owner, repo, pull_number);

        if (files.length === 0) {
            console.log(`[webhook] No reviewable diffs in ${owner}/${repo}#${pull_number}`);
            return;
        }

        const result = await reviewService.reviewFiles(files, {
            source: "github",
            repo: `${owner}/${repo}`,
            prNumber: pull_number
        });

        const commentBody = reviewService.formatAsMarkdown(result);
        await githubService.postIssueComment(owner, repo, pull_number, commentBody);

        console.log(`[webhook] Posted AI review on ${owner}/${repo}#${pull_number}`);
    } catch (err) {
        const label = owner && repo ? `${owner}/${repo}#${pull_number}` : "(malformed payload)";
        console.error(`[webhook] Failed to review ${label}:`, err);
    }
};
