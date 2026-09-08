const aiService = require("../services/ai.service");

module.exports.getReview = async (req, res) => {
    try {
        const code = req.body?.code;

        if (!code) {
            return res.status(400).send("Code is required");
        }

        const response = await aiService(code);

        res.send(response);
    } catch (error) {
        console.error("AI SERVICE ERROR:", error);
        console.error("ERROR DETAILS:", JSON.stringify(error, null, 2));

        res.status(500).send(
            error?.message || JSON.stringify(error)
        );
    }
};