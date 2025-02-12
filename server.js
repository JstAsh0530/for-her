const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const readline = require('readline');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = 3000;

app.use(express.static(__dirname));
let connectedSockets = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  connectedSockets.push(socket);

  socket.on('userMessage', (msg) => {
    console.log('Browser user says:', msg);
  });

  socket.on('typing', (isTyping) => {
    console.log(`Browser is ${isTyping ? 'typing...' : 'not typing'}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedSockets = connectedSockets.filter(s => s.id !== socket.id);
  });
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let isTyping = false;
let typingTimeout = null;
rl.on('line', (input) => {
  isTyping = false;
  io.emit('serverTyping', false);
  const msg = input.trim();
  if (msg) {
    io.emit('serverMessage', msg); 
  }
});

process.stdin.on('data', (chunk) => {
  const str = chunk.toString();
  if (!str.includes('\n')) {
    if (!isTyping) {
      isTyping = true;
      io.emit('serverTyping', true);
    }
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping = false;
      io.emit('serverTyping', false);
    }, 2000);
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});