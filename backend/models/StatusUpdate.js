const mongoose = require('mongoose');

const statusUpdateSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    previousStatus: { type: String, enum: ['todo', 'in_progress', 'completed'] },
    newStatus: { type: String, enum: ['todo', 'in_progress', 'completed'], required: true },
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

statusUpdateSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('StatusUpdate', statusUpdateSchema);
