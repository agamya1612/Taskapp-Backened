
const Joi = require('joi');
const Task = require('../models/Task');
const Team = require('../models/Team');
const mongoose = require('mongoose');

exports.createTask = async (req, res) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow(''),
    dueDate: Joi.date().optional(),
    priority: Joi.string().valid('low','medium','high').optional(),
    assignees: Joi.array().items(Joi.string().length(24)).optional(),
    team: Joi.string().length(24).optional()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const task = new Task({
    title: value.title,
    description: value.description,
    dueDate: value.dueDate,
    priority: value.priority,
    createdBy: req.user._id,
    assignees: value.assignees || [],
    team: value.team || null
  });

  await task.save();
  res.status(201).json(task);
};

exports.listTasks = async (req, res) => {
  const { status, q, assignee, team, sortBy='dueDate', order='asc', page=1, limit=20 } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (team) filter.team = team;
  if (assignee) filter.assignees = mongoose.Types.ObjectId(assignee);
  if (q) filter.$or = [
    { title: new RegExp(q, 'i') },
    { description: new RegExp(q, 'i') }
  ];

  const teams = await Team.find({ members: req.user._id }).select('_id');
  const allowedTeamIds = teams.map(t => t._id);
  filter.$or = filter.$or || [];
  filter.$or.push({ assignees: req.user._id }, { createdBy: req.user._id }, { team: { $in: allowedTeamIds }});

  const tasks = await Task.find(filter)
    .populate('createdBy', 'name email')
    .populate('assignees', 'name email')
    .populate('team', 'name')
    .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
    .skip((page-1)*limit)
    .limit(parseInt(limit));

  res.json(tasks);
};

exports.getTask = async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('assignees', 'name email')
    .populate('team', 'name')
    .populate({ path: 'comments', populate: { path: 'author', select: 'name email' } })
    .populate('attachments');
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
};

exports.updateTask = async (req, res) => {
  const id = req.params.id;
  const payload = req.body;
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isCreator = task.createdBy.equals(req.user._id);
  const isAssignee = (task.assignees || []).some(a => a.equals(req.user._id));
  const isTeamMember = task.team ? (await Team.findOne({ _id: task.team, members: req.user._id })) : false;
  if (!isCreator && !isAssignee && !isTeamMember && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  Object.assign(task, payload);
  await task.save();
  res.json(task);
};

exports.assignTask = async (req, res) => {
  const id = req.params.id;
  const { assigneeId } = req.body;
  if (!assigneeId) return res.status(400).json({ message: 'assigneeId required' });
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isCreator = task.createdBy.equals(req.user._id);
  const isTeamMember = task.team ? (await Team.findOne({ _id: task.team, members: req.user._id })) : false;
  if (!isCreator && !isTeamMember && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  if (!task.assignees.map(String).includes(String(assigneeId))) task.assignees.push(assigneeId);
  await task.save();

  const io = req.app.get('io');
  const socketsByUser = req.app.get('socketsByUser');
  if (io && socketsByUser) {
    const arr = socketsByUser.get(String(assigneeId)) || [];
    for (const sid of arr) io.to(sid).emit('taskAssigned', { taskId: task._id, title: task.title });
  }

  res.json(task);
};

exports.markComplete = async (req, res) => {
  const id = req.params.id;
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  const isAssignee = task.assignees.some(a => a.equals(req.user._id));
  if (!isAssignee && !task.createdBy.equals(req.user._1) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  task.status = 'completed';
  await task.save();
  res.json(task);
};
