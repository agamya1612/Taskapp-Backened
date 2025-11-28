
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Attachment = require('../models/Attachment');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

exports.uploadMiddleware = upload.single('file');

exports.addComment = async (req, res) => {
  const taskId = req.params.id;
  const { text } = req.body;
  if (!text && !req.file) return res.status(400).json({ message: 'Comment text or file required' });

  const task = await Task.findById(taskId);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  let attach = null;
  if (req.file) {
    attach = await Attachment.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id
    });
    task.attachments.push(attach._id);
  }

  const comment = await Comment.create({ author: req.user._id, task: taskId, text, attachments: attach ? [attach._id] : [] });
  task.comments.push(comment._id);
  await task.save();

  const io = req.app.get('io');
  if (io) io.emit('commentAdded', { taskId, commentId: comment._id, text });

  res.status(201).json(comment);
};

exports.listComments = async (req, res) => {
  const taskId = req.params.id;
  const comments = await Comment.find({ task: taskId }).populate('author', 'name email').populate('attachments');
  res.json(comments);
};
