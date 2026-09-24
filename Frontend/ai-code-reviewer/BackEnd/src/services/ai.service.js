const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY);

/*
 * This is NOT a fine-tuned model. It's the stock Gemini model steered with a
 * structured system instruction + a fixed output schema (a "review taxonomy").
 * That's an honest and genuinely useful technique on its own -- it's what
 * gives every review a consistent, machine-parseable shape (so the dashboard
 * can chart it), and it's what most AI review tools actually do under the
 * hood rather than training a custom model per customer.
 */
const SEVERITIES = ["critical", "major", "minor", "nit"];
const CATEGORIES = [
    "security",
    "performance",
    "architecture",
    "readability",
    "testing",
    "style"
];

const SYSTEM_INSTRUCTION = `
You are a senior code reviewer with 7+ years of experience reviewing production codebases.

You will be given one or more files (or diff hunks) that belong to the SAME change set.
Review them together, not in isolation -- flag issues that only become visible when files
are considered as a connected unit (e.g. a function's contract changed in one file but
callers in another file weren't updated).

Focus areas, in priority order:
1. Security -- injection, auth/authz gaps, secrets, unsafe deserialization, XSS/CSRF, etc.
2. Correctness -- logic errors, unhandled edge cases, race conditions.
3. Architecture -- coupling, layering violations, poor separation of concerns.
4. Performance -- unnecessary work, N+1 patterns, blocking calls on hot paths.
5. Readability & maintainability -- naming, duplication, dead code.
6. Testing -- missing or weak coverage for the changed behavior.

You MUST respond with ONLY valid JSON (no markdown fences, no commentary outside the JSON),
matching exactly this shape:

{
  "summary": "2-4 sentence high-level assessment of the change set as a whole",
  "issues": [
    {
      "file": "filename this issue belongs to",
      "line": "approximate line or hunk reference, or null if not applicable",
      "severity": "one of: ${SEVERITIES.join(" | ")}",
      "category": "one of: ${CATEGORIES.join(" | ")}",
      "title": "short one-line description of the issue",
      "description": "why it matters, 1-3 sentences",
      "suggestion": "concrete fix or refactor, as a short code snippet or instruction"
    }
  ]
}

Severity guide:
- critical: will cause a security incident, data loss, or production outage.
- major: real bug or serious design problem, should block merge.
- minor: worth fixing, not urgent.
- nit: style/preference, optional.

If the code has no issues worth flagging, return an empty "issues" array and say so in the summary.
Never invent issues to pad the list.
`;

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
        responseMimeType: "application/json"
    }
});

async function generateContent(prompt) {
    const result = await model.generateContent(prompt);
    return result.response.text();
}

module.exports = generateContent;
module.exports.SEVERITIES = SEVERITIES;
module.exports.CATEGORIES = CATEGORIES;
