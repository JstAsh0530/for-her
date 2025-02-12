const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const readline = require('readline');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
let connectedSockets = [];

io.on('connection', (socket) => {
  console.log('Browser connected:', socket.id);

  // This is from the normal user
  socket.on('userMessage', (msg) => {
    console.log('User typed:', msg);
    // broadcast or handle as you wish
    // e.g. socket.broadcast.emit(...) to show other clients
  });

  // This is from your admin page
  socket.on('serverMessage', (msg) => {
    console.log('Ash typed from admin page:', msg);
    // broadcast to all normal clients: they see "Ash: <msg>"
    io.emit('serverMessage', msg);
  });

  socket.on('serverTyping', (isTyping) => {
    // broadcast to all normal clients
    io.emit('serverTyping', isTyping);
  });

  socket.on('typing', (isTyping) => {
    // from the normal user, you can do whatever
    console.log(`User is typing: ${isTyping}`);
    // e.g. broadcast to other clients
    socket.broadcast.emit('typing', isTyping);
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
  console.log(`Server running on port ${PORT}`);
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/admin.html');
});