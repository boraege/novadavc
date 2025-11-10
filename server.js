const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('Kullanıcı bağlandı:', socket.id);

  socket.on('join-room', (roomId, userName) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add({ id: socket.id, name: userName });
    
    socket.to(roomId).emit('user-connected', socket.id, userName);
    
    const users = Array.from(rooms.get(roomId)).map(u => ({ id: u.id, name: u.name }));
    socket.emit('room-users', users.filter(u => u.id !== socket.id));
    
    console.log(`${userName} (${socket.id}) odaya katıldı: ${roomId}`);
  });

  socket.on('offer', (offer, roomId, targetId) => {
    socket.to(targetId).emit('offer', offer, socket.id);
  });

  socket.on('answer', (answer, roomId, targetId) => {
    socket.to(targetId).emit('answer', answer, socket.id);
  });

  socket.on('ice-candidate', (candidate, roomId, targetId) => {
    socket.to(targetId).emit('ice-candidate', candidate, socket.id);
  });

  socket.on('chat-message', (message, roomId, senderName) => {
    socket.to(roomId).emit('chat-message', message, senderName);
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
    
    rooms.forEach((users, roomId) => {
      const user = Array.from(users).find(u => u.id === socket.id);
      if (user) {
        users.delete(user);
        socket.to(roomId).emit('user-disconnected', socket.id);
        if (users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
