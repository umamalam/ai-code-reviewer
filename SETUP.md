# Setup

## 1. Backend

```bash
cd BackEnd
npm install
cp .env.example .env
```

Fill in `.env`:
- `GOOGLE_GEMINI_KEY` — from https://aistudio.google.com/app/apikey (you already have this)
- `GITHUB_TOKEN` — see step 3
- `GITHUB_WEBHOOK_SECRET` — see step 3

```bash
npm start   # or: node server.js
```

Runs on `http://localhost:3000`. The SQLite database is created automatically at `BackEnd/data/reviews.db` on first run — no setup needed.

## 2. Frontend

```bash
cd Frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. Two tabs: **Review** (paste one or more files, get a structured AI review) and **Dashboard** (charts + history, reads from the same database the webhook writes to).

## 3. Wiring up GitHub PR integration

This part needs a real public URL, since GitHub has to be able to reach your server to deliver webhook events. Locally, the easiest way to get one is a tunnel tool.

### Step A — Generate a webhook secret

```bash
openssl rand -hex 32
```
Copy this into `GITHUB_WEBHOOK_SECRET` in your `.env`.

### Step B — Create a GitHub Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
2. Scope: `repo` (needed to read PR diffs and post comments)
3. Copy the token into `GITHUB_TOKEN` in your `.env`

### Step C — Expose your local server

Using a tunnel (e.g. `ngrok`, `cloudflared`, or similar — pick whichever you already have):

```bash
ngrok http 3000
```

Copy the `https://...ngrok...` URL it gives you.

### Step D — Register the webhook on your repo

On the repo you want reviewed:
1. Settings → Webhooks → Add webhook
2. **Payload URL**: `https://<your-tunnel-url>/webhook/github`
3. **Content type**: `application/json`
4. **Secret**: the exact string you put in `GITHUB_WEBHOOK_SECRET`
5. **Which events**: select "Pull requests" only (not "Send me everything")
6. Save

### Step E — Test it

Open (or update) a pull request on that repo. Within a few seconds you should see:
- A new comment on the PR from your token's account, with a severity-tagged issues table
- A new row show up in the **Dashboard** tab of the frontend

If nothing happens, check your backend's terminal output — webhook failures are logged there (bad signature, missing token, GitHub API errors, etc.), and GitHub's own webhook delivery log (repo Settings → Webhooks → click the webhook → Recent Deliveries) shows exactly what was sent and what your server responded.

### Deploying for real (not just local testing)

For this to run continuously rather than only while your laptop + tunnel are on, deploy `BackEnd/` somewhere that stays up (Render, Railway, Fly.io, a small VPS, etc.), point the webhook's Payload URL at that instead, and keep the SQLite file on a persistent disk (or switch `src/config/db.js` to Postgres if your host doesn't offer persistent local disk — the query shapes are the same, only the driver changes).

## What's still not implemented (and what I'd tell an interviewer)

- **Multi-repo scale**: this reviews one PR's diff per event, not "a whole codebase." Real repo-wide context (e.g. indexing the full codebase with embeddings so the model knows how a changed function is used elsewhere) is a meaningfully bigger project — a natural "what I'd build next" answer.
- **Team accounts / multi-tenant dashboard**: the dashboard currently shows all reviews in one shared table, no auth or per-team filtering. Straightforward to add (a `team_id` column + login), just not built here.
- **No fine-tuned model**: as discussed, this uses prompt engineering + a structured output schema, not a custom-trained model. That's the accurate thing to say, and it's a fine, real technique to talk about.
