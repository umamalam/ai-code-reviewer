const { Octokit } = require("@octokit/rest");

function getOctokit() {
    if (!process.env.GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN is not set in the environment");
    }
    return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

/**
 * Returns the changed files for a PR, each with its unified diff patch.
 * Files with no patch (binary, or too large for GitHub to diff) are skipped.
 */
async function getPullRequestFiles(owner, repo, pull_number, { maxFiles = 20 } = {}) {
    const octokit = getOctokit();
    const { data } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number,
        per_page: 100
    });

    return data
        .filter((f) => Boolean(f.patch))
        .slice(0, maxFiles)
        .map((f) => ({
            filename: f.filename,
            status: f.status,
            patch: f.patch
        }));
}

async function postIssueComment(owner, repo, issue_number, body) {
    const octokit = getOctokit();
    return octokit.rest.issues.createComment({ owner, repo, issue_number, body });
}

module.exports = { getPullRequestFiles, postIssueComment };
