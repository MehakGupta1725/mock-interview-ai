const express = require("express");
const cors = require("cors");
const path = require("path");


const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/auth", require("./routes/auth"));
app.use("/question", require("./routes/interview"));
app.use("/ai", require("./routes/ai"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
