const aiService = require("./ai.service");
const db = require("../config/db");

const SEVERITIES = ["critical", "major", "minor", "nit"];

function buildPrompt(files) {
    const fileBlocks = files
        .map((f) => {
            const label = f.status ? `${f.filename} (${f.status})` : f.filename;
            const body = f.patch || f.content || "";
            return `### File: ${label}\n\`\`\`\n${body}\n\`\`\``;
        })
        .join("\n\n");

    return `Review the following ${files.length} file(s) as one connected change set:\n\n${fileBlocks}`;
}

function parseAiResponse(raw) {
    let text = (raw || "").trim();

    // Defensive: strip markdown fences if the model adds them despite instructions.
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) text = fenceMatch[1].trim();

    try {
        const parsed = JSON.parse(text);
        return {
            summary: typeof parsed.summary === "string" ? parsed.summary : "",
            issues: Array.isArray(parsed.issues) ? parsed.issues : []
        };
    } catch (err) {
        // Model didn't return valid JSON -- degrade gracefully instead of crashing.
        return { summary: raw || "No response from model.", issues: [] };
    }
}

/**
 * Runs a multi-file review, persists it, and returns the parsed result
 * plus severity counts (used by both the API response and the dashboard).
 *
 * @param {Array<{filename: string, content?: string, patch?: string, status?: string}>} files
 * @param {{source?: 'manual'|'github', repo?: string, prNumber?: number}} meta
 */
async function reviewFiles(files, meta = {}) {
    const prompt = buildPrompt(files);
    const raw = await aiService(prompt);
    const parsed = parseAiResponse(raw);

    const counts = { critical: 0, major: 0, minor: 0, nit: 0, security: 0 };
    for (const issue of parsed.issues) {
        const sev = SEVERITIES.includes(issue.severity) ? issue.severity : "minor";
        counts[sev] += 1;
        if (issue.category === "security") counts.security += 1;
    }

    db.saveReview({
        source: meta.source || "manual",
        repo: meta.repo || null,
        pr_number: meta.prNumber || null,
        file_count: files.length,
        files_json: JSON.stringify(files.map((f) => f.filename)),
        summary: parsed.summary,
        issues_json: JSON.stringify(parsed.issues),
        critical: counts.critical,
        major: counts.major,
        minor: counts.minor,
        nit: counts.nit,
        security: counts.security
    });

    return { summary: parsed.summary, issues: parsed.issues, counts, fileCount: files.length };
}

function formatAsMarkdown(result) {
    const emoji = { critical: "🔴", major: "🟠", minor: "🟡", nit: "⚪" };
    const lines = ["### 🤖 AI Code Review", "", result.summary || "_No summary provided._"];

    if (result.issues && result.issues.length > 0) {
        lines.push("", "| Severity | Category | File | Issue |", "|---|---|---|---|");
        for (const issue of result.issues) {
            const sev = issue.severity || "minor";
            const title = (issue.title || issue.description || "").replace(/\|/g, "\\|");
            lines.push(`| ${emoji[sev] || "⚪"} ${sev} | ${issue.category || "-"} | \`${issue.file || "-"}\` | ${title} |`);
        }
    } else {
        lines.push("", "No specific issues flagged. ✅");
    }

    lines.push("", "_Posted automatically by the AI Code Review Assistant._");
    return lines.join("\n");
}

module.exports = { reviewFiles, buildPrompt, formatAsMarkdown };
