require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const Task = require('./models/Task');
const Feedback = require('./models/Feedback');
const Decision = require('./models/Decision');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

const path = require('path');
const fs = require('fs');

const CLIENT_URL = process.env.CLIENT_URL;
if (CLIENT_URL && CLIENT_URL.trim() !== '' && CLIENT_URL !== '*') {
  const allowedOrigins = CLIENT_URL.split(',').map(u => u.trim());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  }));
} else {
  app.use(cors());
}

app.use(express.json());

// Serve static client files in production if client/dist exists
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// 2. Get Tasks with Search and Filter
app.get('/api/tasks', async (req, res) => {
  try {
    const { search, day, week, status, hideCompleted } = req.query;
    const query = {};

    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { notes: { $regex: search.trim(), $options: 'i' } },
        { milestoneGoal: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (day && day !== 'all') {
      query.day = day;
    }

    if (week && week !== 'all') {
      query.week = Number(week);
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        // Active default: todo or inprogress
        query.status = { $in: ['todo', 'inprogress'] };
      } else {
        query.status = status;
      }
    }

    // Hide completed toggle
    if (hideCompleted === 'true' && (!status || status === 'all')) {
      query.status = { $ne: 'completed' };
    }

    const tasks = await Task.find(query).sort({ order: 1, week: 1 });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// 3. Create Task
app.post('/api/tasks', async (req, res) => {
  try {
    const { week, day, title, durationMinutes, phase, phaseName, notes, status, isMilestone, milestoneGoal } = req.body;
    const count = await Task.countDocuments();
    const durationHours = (Number(durationMinutes) || 30) / 60;

    const newTask = new Task({
      week: Number(week) || 1,
      day: day || 'T2',
      title,
      phase: Number(phase) || 0,
      phaseName: phaseName || 'Custom Tasks',
      durationMinutes: Number(durationMinutes) || 30,
      durationHours,
      notes: notes || '',
      status: status || 'todo',
      isMilestone: !!isMilestone,
      milestoneGoal: milestoneGoal || '',
      order: count + 1
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// 4. Update Task (including status, notes, leader comments)
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const oldTask = await Task.findById(id);
    if (!oldTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (updates.durationMinutes) {
      updates.durationHours = Number(updates.durationMinutes) / 60;
    }

    // Status transition tracking
    if (updates.status === 'completed' && oldTask.status !== 'completed') {
      updates.completedAt = new Date();
    } else if (updates.status !== 'completed') {
      updates.completedAt = null;
    }

    if (updates.status === 'reported' && oldTask.status !== 'reported') {
      updates.reportedAt = new Date();
    }

    // If Leader Comment is updated
    if (updates.leaderComment && updates.leaderComment.trim() !== '') {
      updates.leaderCommentAt = new Date();
      // Record in Feedback log
      await Feedback.create({
        week: oldTask.week,
        day: oldTask.day,
        taskId: oldTask._id,
        taskTitle: updates.title || oldTask.title,
        author: req.body.author || 'Leader',
        comment: updates.leaderComment.trim(),
        tag: 'Góp ý kỹ thuật'
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true });
    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// 5. Toggle Task completion (Quick tick)
app.patch('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status === 'completed') {
      task.status = 'todo';
      task.completedAt = null;
    } else {
      task.status = 'completed';
      task.completedAt = new Date();
    }

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Error toggling task:', err);
    res.status(500).json({ error: 'Failed to toggle task status' });
  }
});

// 6. Delete Task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully', id });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// 7. Overview KPIs and Timeline Breakdown
app.get('/api/overview', async (req, res) => {
  try {
    const tasks = await Task.find({}).sort({ order: 1 });
    const totalTasks = tasks.length;
    let totalMinutes = 0;
    let completedMinutes = 0;
    let completedCount = 0;
    let inprogressCount = 0;
    let reportedCount = 0;
    let todoCount = 0;

    const weeksMap = {};
    for (let w = 1; w <= 16; w++) {
      weeksMap[w] = {
        week: w,
        totalTasks: 0,
        completedTasks: 0,
        totalMinutes: 0,
        completedMinutes: 0,
        milestones: []
      };
    }

    tasks.forEach(task => {
      const minutes = task.durationMinutes || 30;
      totalMinutes += minutes;

      if (task.status === 'completed') {
        completedCount++;
        completedMinutes += minutes;
      } else if (task.status === 'inprogress') {
        inprogressCount++;
      } else if (task.status === 'reported') {
        reportedCount++;
      } else {
        todoCount++;
      }

      if (weeksMap[task.week]) {
        weeksMap[task.week].totalTasks++;
        weeksMap[task.week].totalMinutes += minutes;
        if (task.status === 'completed') {
          weeksMap[task.week].completedTasks++;
          weeksMap[task.week].completedMinutes += minutes;
        }
        if (task.isMilestone) {
          weeksMap[task.week].milestones.push({
            day: task.day,
            title: task.title,
            goal: task.milestoneGoal,
            status: task.status
          });
        }
      }
    });

    const totalHours = Number((totalMinutes / 60).toFixed(1));
    const completedHours = Number((completedMinutes / 60).toFixed(1));
    const percentHours = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;
    const percentTasks = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    const feedbacks = await Feedback.countDocuments();
    const decisions = await Decision.find({});
    const decidedCount = decisions.filter(d => d.isDecided).length;

    res.json({
      totalTasks,
      totalHours,
      completedHours,
      remainingHours: Number((totalHours - completedHours).toFixed(1)),
      percentHours,
      percentTasks,
      counts: {
        todo: todoCount,
        inprogress: inprogressCount,
        reported: reportedCount,
        completed: completedCount
      },
      feedbacksCount: feedbacks,
      decisions: {
        total: decisions.length,
        decided: decidedCount
      },
      weeks: Object.values(weeksMap)
    });
  } catch (err) {
    console.error('Error generating overview:', err);
    res.status(500).json({ error: 'Failed to get overview' });
  }
});

// 8. Leader Feedback Hub
app.get('/api/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({}).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedbacks:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { week, day, taskId, taskTitle, author, comment, tag } = req.body;
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const feedback = new Feedback({
      week: week ? Number(week) : undefined,
      day,
      taskId,
      taskTitle: taskTitle || '',
      author: author || 'Leader',
      comment: comment.trim(),
      tag: tag || 'Đánh giá chung'
    });

    await feedback.save();

    // If attached to a specific task, also update that task's leaderComment
    if (taskId) {
      await Task.findByIdAndUpdate(taskId, {
        leaderComment: comment.trim(),
        leaderCommentAt: new Date()
      });
    }

    res.status(201).json(feedback);
  } catch (err) {
    console.error('Error saving feedback:', err);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

app.patch('/api/feedback/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Feedback.findById(id);
    if (!item) return res.status(404).json({ error: 'Feedback not found' });
    item.resolved = !item.resolved;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle resolve state' });
  }
});

// 9. Requirements & Open Decisions
app.get('/api/decisions', async (req, res) => {
  try {
    const decisions = await Decision.find({}).sort({ createdAt: 1 });
    res.json(decisions);
  } catch (err) {
    console.error('Error fetching decisions:', err);
    res.status(500).json({ error: 'Failed to fetch decisions' });
  }
});

app.put('/api/decisions/:questionKey', async (req, res) => {
  try {
    const { questionKey } = req.params;
    const { selectedOption, leaderNote, isDecided } = req.body;

    const decision = await Decision.findOneAndUpdate(
      { questionKey },
      {
        selectedOption,
        leaderNote,
        isDecided: !!isDecided,
        decidedAt: isDecided ? new Date() : null
      },
      { new: true }
    );

    if (!decision) return res.status(404).json({ error: 'Decision item not found' });

    // Also add to Feedback tab for leader visibility
    if (leaderNote && leaderNote.trim() !== '') {
      await Feedback.create({
        taskTitle: `[Quyết định nghiệp vụ] ${decision.title}`,
        author: 'Leader',
        comment: `Phương án: ${selectedOption || 'Chưa chọn'} - Ghi chú: ${leaderNote}`,
        tag: 'Đã duyệt'
      });
    }

    res.json(decision);
  } catch (err) {
    console.error('Error updating decision:', err);
    res.status(500).json({ error: 'Failed to update decision' });
  }
});

// 10. T3 / T5 Report Generator
app.get('/api/reports/t3-t5', async (req, res) => {
  try {
    const { week, day } = req.query;
    const targetWeek = Number(week) || 1;
    const targetDay = day || 'T3';

    // Fetch tasks of this week up to this day or around it
    const weekTasks = await Task.find({ week: targetWeek }).sort({ order: 1 });
    
    // Day order helper
    const dayOrder = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const currentDayIdx = dayOrder.indexOf(targetDay);

    const completed = weekTasks.filter(t => t.status === 'completed');
    const inProgress = weekTasks.filter(t => t.status === 'inprogress' || t.status === 'reported');
    const milestones = weekTasks.filter(t => t.isMilestone && (t.day === targetDay || t.status === 'reported'));

    // Open questions
    const pendingDecisions = await Decision.find({ isDecided: false });

    // Upcoming tasks until next milestone
    let nextMilestoneDay = targetDay === 'T3' ? 'T5' : 'T3';
    let nextMilestoneWeek = targetDay === 'T3' ? targetWeek : targetWeek + 1;
    const upcomingTasks = await Task.find({
      $or: [
        { week: targetWeek, order: { $gt: (weekTasks[currentDayIdx]?.order || 0) } },
        { week: targetWeek + 1 }
      ]
    }).sort({ order: 1 }).limit(3);

    // Format professional 4-part report
    const reportText = `BÁO CÁO TIẾN ĐỘ DỰ ÁN - TUẦN ${targetWeek} (${targetDay})
-----------------------------------------------------------
1. ĐÃ HOÀN THÀNH:
${completed.length > 0 ? completed.map(t => `- [${t.day}] ${t.title} (${t.durationMinutes}p)`).join('\n') : '- Đang hoàn thiện các hạng mục theo kế hoạch.'}

2. ĐANG LÀM & KẾT QUẢ ĐẠT ĐƯỢC:
${inProgress.length > 0 ? inProgress.map(t => `- [${t.day}] ${t.title}${t.milestoneGoal ? ` -> Mục tiêu: ${t.milestoneGoal}` : ''}`).join('\n') : '- Đang triển khai công việc theo đúng khung giờ.'}
${milestones.length > 0 ? `* Trọng tâm ${targetDay}: ${milestones.map(m => m.milestoneGoal || m.title).join(', ')}` : ''}

3. VƯỚNG MẮC / CẦN LEADER QUYẾT ĐỊNH:
${pendingDecisions.length > 0 ? pendingDecisions.map((d, i) => `- [Vấn đề ${i + 1}] ${d.title}`).join('\n') : '- Hiện tại không có blocker kỹ thuật.'}

4. KẾ HOẠCH ĐẾN ${nextMilestoneDay} (TUẦN ${nextMilestoneWeek}):
${upcomingTasks.length > 0 ? upcomingTasks.map(t => `- [T${t.week}-${t.day}] ${t.title} (${t.durationMinutes}p)`).join('\n') : '- Tiếp tục bám sát timeline 16 tuần.'}`;

    res.json({
      week: targetWeek,
      day: targetDay,
      reportText,
      data: {
        completed,
        inProgress,
        milestones,
        upcomingTasks
      }
    });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// 11. Reset Database endpoint
app.post('/api/reset-seed', async (req, res) => {
  try {
    const { exec } = require('child_process');
    exec('node seeder.js', (error, stdout, stderr) => {
      if (error) {
        console.error('Reset seed error:', error);
        return res.status(500).json({ error: 'Reset failed' });
      }
      res.json({ message: 'Reset database to standard 16-week state successful' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed' });
  }
});

// SPA Fallback for client routing in production
if (fs.existsSync(clientDist)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
