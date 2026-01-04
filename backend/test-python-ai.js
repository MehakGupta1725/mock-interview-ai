const axios = require("axios");

(async () => {
  try {
    const response = await axios.post(
      "http://127.0.0.1:5001/evaluate",
      {
        user_answer: "Testing from Node backend",
        ideal_answer: "Testing from Node backend"
      }
    );

    console.log("NODE → PYTHON SUCCESS:");
    console.log(response.data);

  } catch (err) {
    console.error("NODE → PYTHON ERROR:");
    console.error(err.message);
  }
})();
