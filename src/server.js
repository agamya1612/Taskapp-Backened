
require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB(process.env.MONGO_URI);

  const server = http.createServer(app);

  const { Server } = require('socket.io');
  const io = new Server(server, { cors: { origin: '*' } });
  const socketsByUser = new Map();

  io.on('connection', (socket) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.id;
        const arr = socketsByUser.get(userId) || [];
        arr.push(socket.id);
        socketsByUser.set(userId, arr);
        socket.data.userId = userId;
      } catch (e) {}
    }
    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId) {
        const arr = socketsByUser.get(userId) || [];
        const filtered = arr.filter(sid => sid !== socket.id);
        if (filtered.length) socketsByUser.set(userId, filtered);
        else socketsByUser.delete(userId);
      }
    });
  });

  app.set('io', io);
  app.set('socketsByUser', socketsByUser);

  server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

start().catch(err => {
  console.error('Failed to start', err);
  process.exit(1);
});
