const express = require("express");
const githubController = require("../controllers/github.controller");
const verifyGithubSignature = require("../middleware/verifyGithubSignature");

const router = express.Router();

// express.raw() here (not express.json()) so verifyGithubSignature can hash the exact bytes GitHub signed.
router.post("/github", express.raw({ type: "application/json" }), verifyGithubSignature, githubController.handleWebhook);

module.exports = router;
