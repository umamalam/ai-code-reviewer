const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'reviews.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL DEFAULT 'manual',   -- 'manual' | 'github'
    repo TEXT,                               -- e.g. 'owner/name'
    pr_number INTEGER,
    file_count INTEGER DEFAULT 1,
    files_json TEXT,                         -- JSON array of filenames reviewed
    summary TEXT,
    issues_json TEXT,                        -- JSON array of {file, line, severity, category, title, description, suggestion}
    critical_count INTEGER DEFAULT 0,
    major_count INTEGER DEFAULT 0,
    minor_count INTEGER DEFAULT 0,
    nit_count INTEGER DEFAULT 0,
    security_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

function saveReview(record) {
  const stmt = db.prepare(`
    INSERT INTO reviews (
      source, repo, pr_number, file_count, files_json, summary, issues_json,
      critical_count, major_count, minor_count, nit_count, security_count
    ) VALUES (
      @source, @repo, @pr_number, @file_count, @files_json, @summary, @issues_json,
      @critical, @major, @minor, @nit, @security
    )
  `);
  const info = stmt.run(record);
  return info.lastInsertRowid;
}

function getSummary() {
  const totals = db.prepare(`
    SELECT
      COUNT(*) AS total_reviews,
      COALESCE(SUM(file_count), 0) AS total_files,
      COALESCE(SUM(critical_count), 0) AS critical,
      COALESCE(SUM(major_count), 0) AS major,
      COALESCE(SUM(minor_count), 0) AS minor,
      COALESCE(SUM(nit_count), 0) AS nit,
      COALESCE(SUM(security_count), 0) AS security
    FROM reviews
  `).get();

  const bySource = db.prepare(`
    SELECT source, COUNT(*) AS count FROM reviews GROUP BY source
  `).all();

  return { totals, bySource };
}

function getHistory(days = 30) {
  return db.prepare(`
    SELECT
      date(created_at) AS day,
      COUNT(*) AS reviews,
      COALESCE(SUM(critical_count), 0) AS critical,
      COALESCE(SUM(major_count), 0) AS major,
      COALESCE(SUM(minor_count), 0) AS minor,
      COALESCE(SUM(nit_count), 0) AS nit
    FROM reviews
    WHERE created_at >= datetime('now', @range)
    GROUP BY day
    ORDER BY day ASC
  `).all({ range: `-${days} days` });
}

function getRecent(limit = 20) {
  return db.prepare(`
    SELECT id, source, repo, pr_number, file_count, summary,
           critical_count, major_count, minor_count, nit_count, created_at
    FROM reviews
    ORDER BY created_at DESC
    LIMIT @limit
  `).all({ limit });
}

module.exports = { saveReview, getSummary, getHistory, getRecent };
