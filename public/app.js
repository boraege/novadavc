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
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000
      }, 
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
    // Ses seviyesi takibi ekle
    detectAudioLevel(userId, event.streams[0]);
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
  
  // Kendi sesimizi duymamak için local video her zaman muted
  if (id === 'local') {
    video.muted = true;
  } else {
    // Diğer kullanıcıların sesi için yankı önleme
    video.volume = 1.0;
  }
  
  const labelDiv = document.createElement('div');
  labelDiv.className = 'video-label';
  labelDiv.textContent = label;
  
  // Tam ekran butonu ekle (tüm videolar için)
  const fullscreenBtn = document.createElement('button');
  fullscreenBtn.className = 'fullscreen-btn';
  fullscreenBtn.innerHTML = '⛶';
  fullscreenBtn.title = 'Tam Ekran';
  fullscreenBtn.onclick = (e) => {
    e.stopPropagation();
    toggleFullscreen(container);
  };
  
  container.appendChild(fullscreenBtn);
  container.appendChild(video);
  container.appendChild(labelDiv);
  videoGrid.appendChild(container);
  
  // Local stream için de ses seviyesi takibi
  if (id === 'local') {
    detectAudioLevel(id, stream);
  }
}

// Ses seviyesi algılama fonksiyonu
function detectAudioLevel(id, stream) {
  // Audio track yoksa ses algılama yapma
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    console.log('Audio track bulunamadı:', id);
    return;
  }
  
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 512;
    
    microphone.connect(analyser);
    
    function checkAudioLevel() {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      const container = document.getElementById(`video-${id}`);
      if (container) {
        // Ses seviyesi eşik değerini aşarsa yeşil efekt ekle
        if (average > 15) {
          container.classList.add('speaking');
        } else {
          container.classList.remove('speaking');
        }
        requestAnimationFrame(checkAudioLevel);
      }
    }
    
    checkAudioLevel();
  } catch (err) {
    console.error('Ses algılama hatası:', id, err);
  }
}

function toggleFullscreen(element) {
  if (!document.fullscreenElement) {
    element.requestFullscreen().catch(err => {
      console.error('Tam ekran hatası:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

// Tam ekran değişikliklerini dinle ve buton ikonunu güncelle
document.addEventListener('fullscreenchange', () => {
  const fullscreenBtns = document.querySelectorAll('.fullscreen-btn');
  fullscreenBtns.forEach(btn => {
    btn.innerHTML = document.fullscreenElement ? '⛶' : '⛶';
    btn.title = document.fullscreenElement ? 'Tam Ekrandan Çık' : 'Tam Ekran';
  });
});

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
      const videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      const videoTrack = videoStream.getVideoTracks()[0];
      
      localStream.addTrack(videoTrack);
      
      // Her peer'a video track'i ekle ve renegotiation yap
      for (const [userId, peer] of Object.entries(peers)) {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (!sender) {
          peer.addTrack(videoTrack, localStream);
          // Yeni track eklendiğinde renegotiation gerekli
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit('offer', offer, roomId, userId);
        }
      }
      
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
    
    // Video track'lerini peer'lardan kaldır
    for (const [userId, peer] of Object.entries(peers)) {
      const sender = peer.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        peer.removeTrack(sender);
        // Track kaldırıldığında renegotiation gerekli
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('offer', offer, roomId, userId);
      }
    }
    
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
      
      // Her peer için ekran track'ini ekle veya değiştir
      for (const [userId, peer] of Object.entries(peers)) {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        } else {
          peer.addTrack(screenTrack, screenStream);
          // Yeni track eklendiğinde renegotiation gerekli
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit('offer', offer, roomId, userId);
        }
      }
      
      addVideoStream('screen', screenStream, userName + ' - Ekran Paylaşımı');
      
      // Ekran paylaşımı için de ses algılama (eğer audio varsa)
      detectAudioLevel('screen', screenStream);
      
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

async function stopScreenShare() {
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    removeVideoStream('screen');
    
    // Ekran paylaşımı durdurulduğunda kameraya geri dön veya video track'i kaldır
    for (const [userId, peer] of Object.entries(peers)) {
      const sender = peer.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        if (isVideoEnabled && localStream.getVideoTracks().length > 0) {
          const videoTrack = localStream.getVideoTracks()[0];
          await sender.replaceTrack(videoTrack);
        } else {
          peer.removeTrack(sender);
          // Track kaldırıldığında renegotiation gerekli
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit('offer', offer, roomId, userId);
        }
      }
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
