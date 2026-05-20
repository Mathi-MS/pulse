const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  eventName: { type: String, required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  userId: { type: String, index: true },
  sessionId: { type: String, index: true },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true },
  browser: { type: String },
  device: { type: String },
  location: { type: String }
}, { timestamps: true });

// Compound Indexes for fast queries
EventSchema.index({ projectId: 1, timestamp: -1 });
EventSchema.index({ projectId: 1, eventName: 1, timestamp: -1 });

module.exports = mongoose.model('Event', EventSchema);
