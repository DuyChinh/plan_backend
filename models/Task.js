const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  week: { type: Number, required: true, index: true },
  day: { type: String, required: true, enum: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'], index: true },
  title: { type: String, required: true, trim: true },
  phase: { type: Number, required: true, default: 0 },
  phaseName: { type: String, default: '' },
  durationMinutes: { type: Number, required: true, default: 30 },
  durationHours: { type: Number, required: true, default: 0.5 },
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'reported', 'completed'],
    default: 'todo',
    index: true
  },
  isMilestone: { type: Boolean, default: false },
  milestoneGoal: { type: String, default: '' },
  notes: { type: String, default: '' },
  order: { type: Number, default: 0 },
  leaderComment: { type: String, default: '' },
  leaderCommentAt: { type: Date },
  completedAt: { type: Date },
  reportedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', TaskSchema);
