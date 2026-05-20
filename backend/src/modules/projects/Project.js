const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  apiKey: { type: String, required: true, unique: true, index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
