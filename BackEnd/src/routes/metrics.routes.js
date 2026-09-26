const express = require("express");
const metricsController = require("../controllers/metrics.controller");

const router = express.Router();

router.get("/summary", metricsController.getSummary);
router.get("/history", metricsController.getHistory);
router.get("/recent", metricsController.getRecent);

module.exports = router;
