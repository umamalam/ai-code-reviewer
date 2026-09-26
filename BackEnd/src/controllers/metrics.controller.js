const db = require("../config/db");

module.exports.getSummary = (req, res) => {
    res.json(db.getSummary());
};

module.exports.getHistory = (req, res) => {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    res.json(db.getHistory(days));
};

module.exports.getRecent = (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    res.json(db.getRecent(limit));
};
