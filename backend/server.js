require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const authMiddleware = require('./middleware/authMiddleWare');

const webhookRoutes = require("./routes/webhook");
app.use("/api/webhook", webhookRoutes);
const logRoutes = require("./routes/log");
app.use("/api/logs", logRoutes);
const buildRoutes = require("./routes/build");
app.use("/api/builds", buildRoutes);
const metricsRoutes = require("./routes/metrics");
app.use("/api/metrics", metricsRoutes);


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
const aiRoutes = require("./routes/ai");
app.use("/api", aiRoutes);


const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));
