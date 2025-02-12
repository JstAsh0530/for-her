const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

const USER_PASS = process.env.USER_PASS;
const ADMIN_PASS = process.env.ADMIN_PASS;

function checkUserPass(req, res, next) {
  if (req.query.pass === USER_PASS) {
    next();
  } else {
    return res.status(401).send(`
      <h1>401 - Unauthorized</h1>
      <p>You must go to /?pass=USER_PASS</p>
    `);
  }
}
function checkAdminPass(req, res, next) {
  if (req.query.pass === ADMIN_PASS) {
    next();
  } else {
    return res.status(401).send(`
      <h1>401 - Unauthorized</h1>
      <p>Use /admin?pass=ADMIN_PASS</p>
    `);
  }
}

app.use(express.static(__dirname));

app.get('/', checkUserPass, (req, res) => {
  res.sendFile(path.join(__dirname, 'niks.html'));
});

app.get('/admin', checkAdminPass, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

io.on('connection', (socket) => {
  console.log('Browser connected:', socket.id);

  socket.on('userMessage', (msg) => {
    io.emit('userMsgToAdmin', msg);
  });

  socket.on('serverMessage', (msg) => {
    io.emit('serverMessage', msg);
  });

  socket.on('serverTyping', (isTyping) => {
    io.emit('serverTyping', isTyping);
  });

  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('typing', isTyping);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});