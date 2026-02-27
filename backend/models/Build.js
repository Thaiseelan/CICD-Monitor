const mongoose = require("mongoose");

const buildSchema = new mongoose.Schema({
  repositoryName: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  commitId: {
    type: String,
    required: true
  },
  message: {
    type: String
  },
  author: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending", "running", "success", "failed"],
    default: "pending"
  },
  startedAt: {
    type: Date
  },
  finishedAt: {
    type: Date
  },
  duration: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Build", buildSchema);
