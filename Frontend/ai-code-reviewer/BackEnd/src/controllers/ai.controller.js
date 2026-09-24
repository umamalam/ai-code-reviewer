const reviewService = require("../services/review.service");

module.exports.getReview = async (req, res) => {
    try {
        let files = req.body.files;

        // Backward compatible: still accept a single { code } snippet from the old UI.
        if ((!files || files.length === 0) && req.body.code) {
            files = [{ filename: req.body.filename || "snippet.js", content: req.body.code }];
        }

        if (!Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ error: 'Provide either "code" or a non-empty "files" array' });
        }

        const result = await reviewService.reviewFiles(files, { source: "manual" });
        res.json(result);
    } catch (err) {
        console.error("Review failed:", err);
        res.status(500).json({ error: "Failed to generate review" });
    }
};
