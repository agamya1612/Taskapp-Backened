
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('express-async-errors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const teamRoutes = require('./routes/teams');
const commentRoutes = require('./routes/comments');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (req, res) => res.json({ ok: true, message: 'TaskApp API' }));

app.use(errorHandler);

module.exports = app;
