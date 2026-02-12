    const mongoose = require('mongoose');

const pipelineSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['running', 'success', 'failed'],
    default: 'running'
  },
  triggeredBy: {
    type: String,
    default: 'manual'
  }
}, { timestamps: true });

module.exports = mongoose.model('Pipeline', pipelineSchema);
