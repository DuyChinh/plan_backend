const mongoose = require('mongoose');

const DecisionSchema = new mongoose.Schema({
  questionKey: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  options: [{ type: String }],
  selectedOption: { type: String, default: '' },
  leaderNote: { type: String, default: '' },
  isDecided: { type: Boolean, default: false },
  decidedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Decision', DecisionSchema);
