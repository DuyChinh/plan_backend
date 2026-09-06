const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  week: { type: Number },
  day: { type: String },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  taskTitle: { type: String, default: '' },
  author: { type: String, default: 'Leader' },
  comment: { type: String, required: true },
  tag: { type: String, enum: ['Đánh giá chung', 'Góp ý kỹ thuật', 'Yêu cầu làm rõ', 'Đã duyệt', 'Cần sửa'], default: 'Góp ý kỹ thuật' },
  resolved: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
