const socket = io();

let localStream;
let peers = {};
let roomId;
let userName;
let isAudioMuted = false;
let isVideoEnabled = false;
let screenStream;

const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const userNameInput = document.getElementById('userNameInput');
const roomIdInput = document.getElementById('roomIdInput');
const joinBtn = document.getElementById('joinBtn');
const muteBtn = document.getElementById('muteBtn');
const videoBtn = document.getElementById('videoBtn');
const shareBtn = document.getElementById('shareBtn');
const leaveBtn = document.getElementById('leaveBtn');
const videoGrid = document.getElementById('videoGrid');
const usersList = document.getElementById('usersList');

// Join Room
joinBtn.addEventListener('click', async () => {
  userName = userNameInput.value.trim();
  roomId = roomIdInput.value.trim();
  
  if (!userName || !roomId) {
    alert('Lütfen adınızı ve oda ID\'sini girin');
    return;
  }
  
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: false 
    });
    
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    
    document.getElementById('roomName').textContent = `Oda: ${roomId}`;
    document.getElementById('userName').textContent = `Kullanıcı: ${userName}`;
    
    addVideoStream('local', localStream, userName + ' (Sen)');
    
    socket.emit('join-room', roomId, userName);
  } catch (err) {
    console.error('Medya erişim hatası:', err);
    alert('Mikrofon erişimi reddedildi. Lütfen tarayıcı izinlerini kontrol edin.');
  }
});

// Socket Events
socket.on('room-users', (users) => {
  users.forEach(user => {
    createPeerConnection(user.id, true, user.name);
  });
  updateUsersList(users);
});

socket.on('user-connected', (userId, userName) => {
  console.log('Kullanıcı bağlandı:', userName);
  createPeerConnection(userId, false, userName);
  updateUsersList();
});

socket.on('user-disconnected', (userId) => {
  console.log('Kullanıcı ayrıldı:', userId);
  if (peers[userId]) {
    peers[userId].close();
    delete peers[userId];
  }
  removeVideoStream(userId);
  updateUsersList();
});

socket.on('offer', async (offer, userId) => {
  const peer = peers[userId];
  if (peer) {
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit('answer', answer, roomId, userId);
  }
});

socket.on('answer', async (answer, userId) => {
  const peer = peers[userId];
  if (peer) {
    await peer.setRemoteDescription(new RTCSessionDescription(answer));
  }
});

socket.on('ice-candidate', async (candidate, userId) => {
  const peer = peers[userId];
  if (peer && candidate) {
    await peer.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

// WebRTC Functions
function createPeerConnection(userId, isInitiator, userName) {
  const peer = new RTCPeerConnection(config);
  peers[userId] = peer;
  
  localStream.getTracks().forEach(track => {
    peer.addTrack(track, localStream);
  });
  
  peer.ontrack = (event) => {
    addVideoStream(userId, event.streams[0], userName);
  };
  
  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate, roomId, userId);
    }
  };
  
  if (isInitiator) {
    peer.createOffer()
      .then(offer => peer.setLocalDescription(offer))
      .then(() => {
        socket.emit('offer', peer.localDescription, roomId, userId);
      });
  }
  
  return peer;
}

function addVideoStream(id, stream, label) {
  if (document.getElementById(`video-${id}`)) return;
  
  const container = document.createElement('div');
  container.className = 'video-container';
  container.id = `video-${id}`;
  
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.playsInline = true;
  if (id === 'local') video.muted = true;
  
  const labelDiv = document.createElement('div');
  labelDiv.className = 'video-label';
  labelDiv.textContent = label;
  
  container.appendChild(video);
  container.appendChild(labelDiv);
  videoGrid.appendChild(container);
}

function removeVideoStream(id) {
  const container = document.getElementById(`video-${id}`);
  if (container) container.remove();
}

function updateUsersList(users = []) {
  usersList.innerHTML = '';
  
  const localUser = document.createElement('div');
  localUser.className = 'user-item';
  localUser.innerHTML = `<div class="user-status"></div>${userName} (Sen)`;
  usersList.appendChild(localUser);
  
  Object.keys(peers).forEach(peerId => {
    const user = document.createElement('div');
    user.className = 'user-item';
    user.innerHTML = `<div class="user-status"></div>Kullanıcı`;
    usersList.appendChild(user);
  });
}

// Controls
muteBtn.addEventListener('click', () => {
  isAudioMuted = !isAudioMuted;
  localStream.getAudioTracks()[0].enabled = !isAudioMuted;
  muteBtn.textContent = isAudioMuted ? '🔇' : '🎤';
  muteBtn.classList.toggle('active', !isAudioMuted);
});

videoBtn.addEventListener('click', async () => {
  if (!isVideoEnabled) {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = videoStream.getVideoTracks()[0];
      
      localStream.addTrack(videoTrack);
      
      Object.values(peers).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (!sender) {
          peer.addTrack(videoTrack, localStream);
        }
      });
      
      const localVideo = document.querySelector('#video-local video');
      if (localVideo) localVideo.srcObject = localStream;
      
      isVideoEnabled = true;
      videoBtn.textContent = '📹';
      videoBtn.classList.add('active');
    } catch (err) {
      console.error('Kamera erişim hatası:', err);
      alert('Kamera erişimi reddedildi');
    }
  } else {
    localStream.getVideoTracks().forEach(track => {
      track.stop();
      localStream.removeTrack(track);
    });
    
    Object.values(peers).forEach(peer => {
      const sender = peer.getSenders().find(s => s.track?.kind === 'video');
      if (sender) peer.removeTrack(sender);
    });
    
    isVideoEnabled = false;
    videoBtn.textContent = '📹';
    videoBtn.classList.remove('active');
  }
});

shareBtn.addEventListener('click', async () => {
  if (!screenStream) {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      
      Object.values(peers).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        } else {
          peer.addTrack(screenTrack, screenStream);
        }
      });
      
      addVideoStream('screen', screenStream, userName + ' - Ekran Paylaşımı');
      
      screenTrack.onended = () => {
        stopScreenShare();
      };
      
      shareBtn.classList.add('active');
    } catch (err) {
      console.error('Ekran paylaşım hatası:', err);
    }
  } else {
    stopScreenShare();
  }
});

function stopScreenShare() {
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    removeVideoStream('screen');
    
    if (isVideoEnabled && localStream.getVideoTracks().length > 0) {
      const videoTrack = localStream.getVideoTracks()[0];
      Object.values(peers).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
    }
    
    screenStream = null;
    shareBtn.classList.remove('active');
  }
}

leaveBtn.addEventListener('click', () => {
  localStream.getTracks().forEach(track => track.stop());
  if (screenStream) screenStream.getTracks().forEach(track => track.stop());
  
  Object.values(peers).forEach(peer => peer.close());
  peers = {};
  
  socket.disconnect();
  location.reload();
});
