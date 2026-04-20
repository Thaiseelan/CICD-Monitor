const mongoose = require('mongoose');
const crypto = require("crypto");
const { getDefaultWebhookBaseUrl } = require("../utils/publicUrl");

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  repoUrl: {
    type: String,
    required: true
  },
  webhookToken: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(24).toString("hex"),
  },
  webhookBaseUrl: {
    type: String,
    default: getDefaultWebhookBaseUrl,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
