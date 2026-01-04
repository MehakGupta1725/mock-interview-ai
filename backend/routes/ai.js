const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/evaluate-answer", async (req, res) => {
  try {
    const { userAnswer, idealAnswer, speech } = req.body;

    // 🔒 safety check
    if (!userAnswer || !idealAnswer) {
      return res.status(400).json({
        error: "Missing userAnswer or idealAnswer"
      });
    }

    // 🔗 call Python AI
    const response = await axios.post(
      "http://127.0.0.1:5001/evaluate",
      {
        user_answer: userAnswer,
        ideal_answer: idealAnswer,
        speech: speech || null
      },
      {
        timeout: 10000 // ⬅ IMPORTANT (prevents silent failure)
      }
    );

    // ✅ send AI result to frontend
    return res.json({
      mode: "ai",
      evaluation: response.data
    });

  } catch (err) {
    console.error("NODE → PYTHON ERROR");
    console.error(err.message);

    return res.status(500).json({
      mode: "error",
      error: "AI service unavailable"
    });
  }
});

module.exports = router;
