const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authMiddleware = require('./middleware/authMiddleWare');
const app = express();

app.use(express.json());
app.use('/api/projects', require('./routes/project'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/pipelines', require('./routes/pipeline'));

app.use(cors());
app.use(express.json());
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: "You accessed protected data", user: req.user });
});
app.get("/", (req, res) => {
  res.send("Intelligent CI/CD Monitor API running...");
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));
