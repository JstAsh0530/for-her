const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const readline = require('readline');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

const USER_PASS = process.env.USER_PASS || "user123";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

function checkUserPass(req, res, next) {
  if (req.query.pass === USER_PASS) {
    next();
  } else {
    return res.status(401).send(`
      <h1>401 - Unauthorized</h1>
      <p>You must provide the correct <code>?pass=</code> query param to see this page.</p>
    `);
  }
}

function checkAdminPass(req, res, next) {
  if (req.query.pass === ADMIN_PASS) {
    next();
  } else {
    return res.status(401).send(`
      <h1>401 - Unauthorized</h1>
      <p>Use <code>/admin?pass=YOUR_ADMIN_PASS</code> with the correct password.</p>
    `);
  }
}

app.use(express.static(__dirname));

app.get('/', checkUserPass, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', checkAdminPass, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

io.on('connection', (socket) => {
  console.log('Browser connected:', socket.id);

  socket.on('userMessage', (msg) => {
    console.log('User typed:', msg);
  });

  socket.on('serverMessage', (msg) => {
    console.log('Ash typed from admin page:', msg);
    io.emit('serverMessage', msg);
  });

  socket.on('serverTyping', (isTyping) => {
    io.emit('serverTyping', isTyping);
  });

  socket.on('typing', (isTyping) => {
    console.log(`User is typing: ${isTyping}`);
    socket.broadcast.emit('typing', isTyping);
  });
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.on('line', (input) => {
  const msg = input.trim();
  if (msg) {
    io.emit('serverMessage', msg);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});