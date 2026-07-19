const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const users = {};
let waitingUsers = [];

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>ZapMeet</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:system-ui, sans-serif; }
    :root { --bg: #0b0e14; --surface: #1a1f2a; --text: #fff; --input-bg: #2a3140; }
    body.light { --bg: #f0f2f5; --surface: #ffffff; --text: #1a1f2a; --input-bg: #e8ecf1; }
    body { background: var(--bg); color: var(--text); display:flex; justify-content:center; align-items:center; min-height:100vh; padding:10px; transition:0.3s; font-family:system-ui, sans-serif; }
    
    #home-screen { text-align:center; width:100%; }
    #home-screen h1 { font-size:3.2rem; color:#4fc3f7; }
    #start-btn { background:#4fc3f7; border:none; padding:16px 40px; border-radius:50px; font-size:1.2rem; margin-top:20px; cursor:pointer; font-weight:bold; color:#0b0e14; }
    #start-btn:active { transform:scale(0.95); }
    
    #chat-screen { display:none; flex-direction:column; width:100%; max-width:650px; height:95vh; background:var(--surface); border-radius:20px; padding:15px; transition:0.3s; position:relative; }
    
    #video-container { position:relative; display:flex; flex-direction:column; gap:8px; flex:2; background:#111; border-radius:12px; padding:10px; }
    #remote-video { width:100%; min-height:55vh; background:#000; border-radius:12px; object-fit:cover; flex:3; }
    #local-video { width:100%; max-height:25vh; background:#000; border-radius:12px; object-fit:cover; border:2px solid #4fc3f7; transform:scaleX(-1); flex:1; }
    
    #watermark { position:absolute; top:20px; right:20px; color:#4fc3f7; font-size:1.5rem; font-weight:bold; background:rgba(0,0,0,0.6); padding:8px 20px; border-radius:30px; backdrop-filter:blur(5px); z-index:9999; pointer-events:none; user-select:none; border:1px solid rgba(79,195,247,0.3); box-shadow:0 0 30px rgba(79,195,247,0.2); }
    
    #theme-toggle { position:fixed; top:20px; left:20px; background:rgba(0,0,0,0.6); border:none; color:#fff; font-size:1.5rem; padding:8px 14px; border-radius:30px; cursor:pointer; z-index:9999; backdrop-filter:blur(5px); border:1px solid rgba(255,255,255,0.1); }
    
    #profile-section { display:none; flex-direction:column; align-items:center; gap:10px; padding:20px; background:var(--surface); border-radius:20px; margin-bottom:10px; border:1px solid rgba(79,195,247,0.2); }
    #profile-section .avatar { width:80px; height:80px; border-radius:50%; background:#4fc3f7; display:flex; align-items:center; justify-content:center; font-size:2.5rem; color:#0b0e14; font-weight:bold; border:3px solid #4fc3f7; cursor:pointer; overflow:hidden; }
    #profile-section input { padding:10px; border-radius:30px; border:none; background:var(--input-bg); color:var(--text); width:80%; text-align:center; }
    #profile-section .coins { font-size:1.2rem; color:#ffd700; }
    #profile-section .banner-preview { width:100%; height:60px; border-radius:12px; transition:0.3s; display:flex; align-items:center; justify-content:center; font-weight:bold; }
    
    #banner-shop { display:none; flex-wrap:wrap; gap:10px; justify-content:center; padding:10px; background:var(--surface); border-radius:16px; margin-top:10px; border:1px solid rgba(79,195,247,0.15); }
    .banner-card { width:100px; height:70px; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; border:2px solid transparent; transition:0.3s; font-size:0.8rem; font-weight:bold; color:#fff; text-shadow:0 0 10px rgba(0,0,0,0.5); }
    .banner-card:hover { transform:scale(1.05); border-color:#4fc3f7; }
    .banner-card .price { font-size:0.7rem; background:rgba(0,0,0,0.6); padding:2px 8px; border-radius:20px; margin-top:4px; }
    .banner-rainbow { background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet); animation:rainbow 3s linear infinite; background-size:300% 100%; }
    @keyframes rainbow { 0% { background-position:0% 50%; } 100% { background-position:100% 50%; } }
    .banner-diamond { background:linear-gradient(135deg,#fff,#e0e0e0,#fff); animation:glitter 2s infinite; }
    @keyframes glitter { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
    .banner-fire { background:linear-gradient(45deg,#ff4500,#ff6600,#ff8c00); animation:fire 1s infinite alternate; }
    @keyframes fire { 0% { transform:scale(1); } 100% { transform:scale(1.02); } }
    .banner-neon { background:#0ff; box-shadow:0 0 20px #0ff,0 0 40px #0ff; animation:neon 1.5s infinite alternate; }
    @keyframes neon { 0% { box-shadow:0 0 20px #0ff; } 100% { box-shadow:0 0 40px #0ff,0 0 80px #0ff; } }
    .banner-ocean { background:linear-gradient(135deg,#006994,#00b4d8,#48cae4); animation:wave 3s ease-in-out infinite; background-size:200% 200%; }
    @keyframes wave { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
    
    #text-chat { display:flex; flex-direction:column; gap:8px; margin-top:10px; flex:1; }
    #messages { flex:1; height:100px; overflow-y:auto; background:var(--input-bg); border-radius:10px; padding:10px; min-height:80px; opacity:0.8; }
    #messages p { margin:4px 0; word-wrap:break-word; }
    #msg-input { padding:12px; border-radius:30px; border:none; background:var(--input-bg); color:var(--text); font-size:1rem; }
    #send-btn { padding:12px; border:none; border-radius:30px; background:#4fc3f7; font-weight:bold; cursor:pointer; color:#0b0e14; }
    
    .controls { display:flex; gap:10px; margin-top:8px; flex-wrap:wrap; }
    .controls button { flex:1; padding:12px; border:none; border-radius:30px; background:var(--input-bg); color:var(--text); font-weight:bold; cursor:pointer; min-width:60px; }
    .controls #next-btn { background:#ff6b6b; color:#fff; }
    .controls #profile-btn { background:#4fc3f7; color:#0b0e14; }
    .controls #shop-btn { background:#ffd700; color:#0b0e14; }
    
    .coin-buttons { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-top:8px; }
    .coin-buttons button { padding:8px 16px; border:none; border-radius:30px; font-weight:bold; cursor:pointer; }
    
    #referral-section { display:none; flex-direction:column; align-items:center; gap:10px; padding:15px; background:var(--surface); border-radius:16px; margin-top:10px; border:1px solid rgba(79,195,247,0.15); }
    #referral-section input { width:100%; padding:10px; border-radius:30px; border:none; background:var(--input-bg); color:var(--text); text-align:center; }
    
    #profile-page {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--bg);
      z-index: 10000;
      padding: 20px;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      overflow-y: auto;
    }
    #profile-page .header {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    #profile-page .header h2 { color: #4fc3f7; }
    #profile-page .header button { 
      background: transparent; 
      border: none; 
      color: #4fc3f7; 
      font-size: 1.5rem; 
      cursor: pointer; 
    }
    #profile-page .profile-avatar { 
      width: 100px; 
      height: 100px; 
      border-radius: 50%; 
      background: #4fc3f7; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 3.5rem; 
      border: 4px solid #4fc3f7; 
      cursor: pointer; 
      overflow: hidden;
    }
    #profile-page .profile-username { 
      font-size: 1.8rem; 
      font-weight: bold; 
    }
    #profile-page .profile-stats {
      display: flex;
      gap: 30px;
      margin: 10px 0;
    }
    #profile-page .profile-stats div { text-align: center; }
    #profile-page .profile-stats div span { display: block; font-size: 1.5rem; font-weight: bold; color: #4fc3f7; }
    #profile-page .profile-stats div small { color: #888; }
    #profile-page .profile-banner-preview {
      width: 100%;
      height: 80px;
      border-radius: 16px;
      margin: 10px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
    }
    #profile-page .profile-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
      width: 100%;
    }
    #profile-page .profile-actions button {
      padding: 12px 24px;
      border: none;
      border-radius: 30px;
      font-weight: bold;
      cursor: pointer;
      flex: 1;
      min-width: 100px;
    }
    .profile-coin-display { font-size: 1.2rem; color: #ffd700; }
    
    @media (max-width:480px) {
      #watermark { font-size:1rem; padding:4px 12px; top:10px; right:10px; }
      #theme-toggle { font-size:1rem; padding:4px 12px; top:10px; left:10px; }
      .banner-card { width:70px; height:50px; font-size:0.6rem; }
      #profile-section .avatar { width:60px; height:60px; font-size:2rem; }
      #profile-page .profile-avatar { width:80px; height:80px; font-size:2.5rem; }
    }
  </style>
</head>
<body>

<button id="theme-toggle">🌙</button>
<div id="watermark">⚡ ZapMeet</div>

<div id="home-screen">
  <h1>⚡ ZapMeet</h1>
  <p>Random text & video chat</p>
  <button id="start-btn">🔗 Start Chat</button>
</div>

<div id="chat-screen">
  <div id="profile-section">
    <div class="avatar" id="avatar-upload">👤</div>
    <input id="username-input" placeholder="Enter username..." maxlength="20">
    <div class="coins">🪙 <span id="coin-display">0</span> coins</div>
    <div class="banner-preview" id="banner-preview">🌈 Your Banner</div>
    <div class="coin-buttons">
      <button id="watch-ad-btn" style="background:#4fc3f7;">📺 Watch Ad (+5)</button>
      <button id="buy-coins-btn" style="background:#ffd700;">🪙 Buy Coins</button>
      <button id="premium-btn" style="background:#ff6b6b;color:#fff;">💎 Premium (+500)</button>
    </div>
  </div>

  <div id="video-container">
    <video id="remote-video" autoplay playsinline></video>
    <video id="local-video" autoplay muted playsinline></video>
  </div>

  <div id="banner-shop">
    <div class="banner-card banner-rainbow" data-banner="rainbow">🌈 Rainbow<br><span class="price">50 🪙</span></div>
    <div class="banner-card banner-diamond" data-banner="diamond">💎 Diamond<br><span class="price">100 🪙</span></div>
    <div class="banner-card banner-fire" data-banner="fire">🔥 Fire<br><span class="price">75 🪙</span></div>
    <div class="banner-card banner-neon" data-banner="neon">⚡ Neon<br><span class="price">60 🪙</span></div>
    <div class="banner-card banner-ocean" data-banner="ocean">🌊 Ocean<br><span class="price">80 🪙</span></div>
  </div>

  <div id="referral-section">
    <p>🔗 Refer & Earn +50 coins</p>
    <input id="referral-link" readonly>
    <button id="copy-referral-btn" style="background:#4fc3f7;padding:8px 20px;border:none;border-radius:30px;cursor:pointer;">📋 Copy Link</button>
  </div>

  <div id="text-chat">
    <div id="messages"><p style="color:#888;">⏳ Connecting...</p></div>
    <input id="msg-input" placeholder="Type a message...">
    <button id="send-btn">📤 Send</button>
  </div>

  <div class="controls">
    <button id="next-btn">⏭ Next</button>
    <button id="profile-btn">👤 Profile</button>
    <button id="shop-btn">🛒 Shop</button>
    <button id="referral-btn">🔗 Refer</button>
  </div>
</div>

<div id="profile-page">
  <div class="header">
    <h2>⚡ Profile</h2>
    <button id="profile-close-btn">✕</button>
  </div>
  
  <div class="profile-avatar" id="profile-avatar-big">👤</div>
  <div class="profile-username" id="profile-username-big">Anonymous</div>
  
  <div class="profile-stats">
    <div><span id="profile-coins">0</span><small>Coins</small></div>
    <div><span id="profile-premium-badge">🟢</span><small>Premium</small></div>
  </div>
  
  <div class="profile-banner-preview" id="profile-banner-preview">🌈 Rainbow Banner</div>
  
  <div class="profile-actions">
    <button id="profile-edit-btn" style="background:#4fc3f7;color:#0b0e14;">✏️ Edit Profile</button>
    <button id="profile-premium-btn" style="background:#ff6b6b;color:#fff;">💎 Premium</button>
    <button id="profile-shop-btn" style="background:#ffd700;color:#0b0e14;">🛒 Shop</button>
  </div>
  
  <div style="margin-top:10px;width:100%;">
    <input id="profile-username-input" placeholder="Change username..." maxlength="20" style="width:100%;padding:12px;border-radius:30px;border:none;background:var(--input-bg);color:var(--text);text-align:center;">
  </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
  const user = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    username: 'Anonymous',
    avatar: '👤',
    coins: 0,
    banner: 'rainbow',
    isPremium: false,
    referralCode: Math.random().toString(36).substring(2, 8).toUpperCase()
  };

  const socket = io();
  const home = document.getElementById('home-screen');
  const chat = document.getElementById('chat-screen');
  const startBtn = document.getElementById('start-btn');
  const nextBtn = document.getElementById('next-btn');
  const profileBtn = document.getElementById('profile-btn');
  const shopBtn = document.getElementById('shop-btn');
  const referralBtn = document.getElementById('referral-btn');
  const messages = document.getElementById('messages');
  const msgInput = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');
  const localVideo = document.getElementById('local-video');
  const remoteVideo = document.getElementById('remote-video');
  const themeToggle = document.getElementById('theme-toggle');
  const profileSection = document.getElementById('profile-section');
  const bannerShop = document.getElementById('banner-shop');
  const referralSection = document.getElementById('referral-section');
  const usernameInput = document.getElementById('username-input');
  const coinDisplay = document.getElementById('coin-display');
  const avatarUpload = document.getElementById('avatar-upload');
  const bannerPreview = document.getElementById('banner-preview');
  const referralLink = document.getElementById('referral-link');
  const watchAdBtn = document.getElementById('watch-ad-btn');
  const buyCoinsBtn = document.getElementById('buy-coins-btn');
  const premiumBtn = document.getElementById('premium-btn');
  const copyReferralBtn = document.getElementById('copy-referral-btn');

  const profilePage = document.getElementById('profile-page');
  const profileCloseBtn = document.getElementById('profile-close-btn');
  const profileAvatarBig = document.getElementById('profile-avatar-big');
  const profileUsernameBig = document.getElementById('profile-username-big');
  const profileCoins = document.getElementById('profile-coins');
  const profilePremiumBadge = document.getElementById('profile-premium-badge');
  const profileBannerPreview = document.getElementById('profile-banner-preview');
  const profileEditBtn = document.getElementById('profile-edit-btn');
  const profilePremiumBtn = document.getElementById('profile-premium-btn');
  const profileShopBtn = document.getElementById('profile-shop-btn');
  const profileUsernameInput = document.getElementById('profile-username-input');

  let localStream, pc, room;
  let lastAdWatch = 0;
  const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  if (themeToggle) {
    themeToggle.onclick = function() {
      document.body.classList.toggle('light');
      this.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
      localStorage.setItem('zapmeet-theme', document.body.classList.contains('light') ? 'light' : 'dark');
    };
    if (localStorage.getItem('zapmeet-theme') === 'light') {
      document.body.classList.add('light');
      themeToggle.textContent = '☀️';
    }
  }

  function updateProfile() {
    avatarUpload.textContent = user.avatar;
    coinDisplay.textContent = user.coins;
    bannerPreview.className = 'banner-preview banner-' + user.banner;
    bannerPreview.textContent = '🌈 ' + user.banner.toUpperCase() + ' Banner';
    referralLink.value = window.location.origin + '/?ref=' + user.referralCode;
    
    profileAvatarBig.textContent = user.avatar;
    profileUsernameBig.textContent = user.username;
    profileCoins.textContent = user.coins;
    profilePremiumBadge.textContent = user.isPremium ? '💎' : '🟢';
    profileBannerPreview.className = 'profile-banner-preview banner-' + user.banner;
    profileBannerPreview.textContent = '🌈 ' + user.banner.toUpperCase() + ' Banner';
    profileUsernameInput.value = user.username;
  }

  function openFullProfile() {
    updateProfile();
    profilePage.style.display = 'flex';
    if (pc) { pc.close(); pc = null; }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }
    chat.style.display = 'none';
    profileSection.style.display = 'none';
    bannerShop.style.display = 'none';
    referralSection.style.display = 'none';
  }

  function closeFullProfile() {
    profilePage.style.display = 'none';
    chat.style.display = 'flex';
  }

  profileBtn.onclick = openFullProfile;
  profileCloseBtn.onclick = closeFullProfile;

  profileEditBtn.onclick = function() {
    const newName = profileUsernameInput.value.trim() || 'Anonymous';
    user.username = newName;
    usernameInput.value = newName;
    updateProfile();
    alert('✅ Username updated!');
  };

  profilePremiumBtn.onclick = function() {
    if (user.isPremium) {
      alert('✅ You are already premium!');
      return;
    }
    if (confirm('💎 Upgrade to Premium ₹99/month? (+500 coins)')) {
      user.isPremium = true;
      user.coins += 500;
      updateProfile();
      alert('✅ Premium activated! +500 coins.');
    }
  };

  profileShopBtn.onclick = function() {
    alert('🛒 Go to Shop from chat screen!');
    closeFullProfile();
    bannerShop.style.display = 'flex';
  };

  profileUsernameInput.oninput = function() {
    // Real-time update nahi, sirf edit button pe save hoga
  };

  shopBtn.onclick = () => {
    bannerShop.style.display = bannerShop.style.display === 'none' ? 'flex' : 'none';
    profileSection.style.display = 'none';
    referralSection.style.display = 'none';
  };

  referralBtn.onclick = () => {
    referralSection.style.display = referralSection.style.display === 'none' ? 'flex' : 'none';
    profileSection.style.display = 'none';
    bannerShop.style.display = 'none';
  };

  usernameInput.oninput = () => {
    user.username = usernameInput.value || 'Anonymous';
    updateProfile();
  };

  avatarUpload.onclick = () => {
    const emojis = ['👤', '😎', '🔥', '💎', '🚀', '⭐', '🎮', '💻', '🎵', '⚽'];
    user.avatar = emojis[Math.floor(Math.random() * emojis.length)];
    updateProfile();
  };

  document.querySelectorAll('.banner-card').forEach(card => {
    card.onclick = () => {
      const banner = card.dataset.banner;
      const prices = { rainbow: 50, diamond: 100, fire: 75, neon: 60, ocean: 80 };
      const price = prices[banner];
      if (user.coins >= price) {
        if (confirm('Buy ' + banner + ' banner for ' + price + ' coins?')) {
          user.coins -= price;
          user.banner = banner;
          updateProfile();
          alert('✅ Banner purchased!');
          bannerShop.style.display = 'none';
        }
      } else {
        alert('❌ Not enough coins!');
      }
    };
  });

  copyReferralBtn.onclick = () => {
    referralLink.select();
    document.execCommand('copy');
    alert('✅ Referral link copied! Share with friends.');
  };

  watchAdBtn.onclick = () => {
    const now = Date.now();
    if (now - lastAdWatch > 60000) {
      user.coins += 5;
      updateProfile();
      lastAdWatch = now;
      alert('✅ +5 coins! Next ad after 1 minute.');
    } else {
      const remaining = Math.ceil((60000 - (now - lastAdWatch)) / 1000);
      alert('⏳ Please wait ' + remaining + ' seconds.');
    }
  };

  buyCoinsBtn.onclick = () => {
    if (confirm('🪙 Buy 100 coins for ₹10?')) {
      user.coins += 100;
      updateProfile();
      alert('✅ +100 coins added!');
    }
  };

  premiumBtn.onclick = () => {
    if (user.isPremium) {
      alert('✅ You are already premium!');
      return;
    }
    if (confirm('💎 Upgrade to Premium ₹99/month? (+500 coins)')) {
      user.isPremium = true;
      user.coins += 500;
      updateProfile();
      alert('✅ Premium activated! +500 coins.');
    }
  };

  startBtn.onclick = function() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(function(stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        home.style.display = 'none';
        chat.style.display = 'flex';
        profileSection.style.display = 'none';
        bannerShop.style.display = 'none';
        referralSection.style.display = 'none';
        socket.emit('find-stranger');
      })
      .catch(function(err) {
        alert('❌ Camera/Mic access needed! Please allow permissions.');
        console.error(err);
      });
  };

  nextBtn.onclick = () => {
    if (pc) pc.close();
    messages.innerHTML = '<p style="color:#888;">Searching...</p>';
    socket.emit('find-stranger');
  };

  async function createPeer(roomId, isOfferer) {
    const peer = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(t => peer.addTrack(t, localStream));
    peer.ontrack = (e) => remoteVideo.srcObject = e.streams[0];
    peer.onicecandidate = (e) => {
      if (e.candidate) socket.emit('webrtc-ice', { room: roomId, candidate: e.candidate });
    };
    if (isOfferer) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit('webrtc-offer', { room: roomId, offer });
    }
    return peer;
  }

  socket.on('waiting', () => {
    messages.innerHTML = '<p style="color:#ffa500;">⏳ Searching...</p>';
  });

  socket.on('matched', async ({ room: roomId, initiator }) => {
    room = roomId;
    messages.innerHTML = '<p style="color:#4fc3f7;">✅ Connected!</p>';
    pc = await createPeer(roomId, initiator === socket.id);
  });

  socket.on('webrtc-offer', async ({ offer }) => {
    if (!pc) return;
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('webrtc-answer', { room, answer });
  });

  socket.on('webrtc-answer', async ({ answer }) => {
    if (pc) await pc.setRemoteDescription(answer);
  });

  socket.on('webrtc-ice', async ({ candidate }) => {
    try { if (pc) await pc.addIceCandidate(candidate); } catch(e) {}
  });

  sendBtn.onclick = () => {
    const msg = msgInput.value.trim();
    if (msg && room) {
      socket.emit('send-message', { room, message: msg });
      messages.innerHTML += '<p><b>You:</b> ' + msg + '</p>';
      msgInput.value = '';
      messages.scrollTop = messages.scrollHeight;
    }
  };

  socket.on('receive-message', ({ message }) => {
    messages.innerHTML += '<p><b>Stranger:</b> ' + message + '</p>';
    messages.scrollTop = messages.scrollHeight;
  });

  socket.on('stranger-disconnected', () => {
    messages.innerHTML += '<p style="color:#ff6b6b;">❌ Stranger left. Click Next.</p>';
    if (pc) { pc.close(); pc = null; }
  });

  socket.emit('user-data', {
    id: user.id,
    username: user.username,
    referralCode: user.referralCode
  });

  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  if (refCode) {
    socket.emit('referral-signup', { refCode, userId: user.id });
  }

  updateProfile();
});
</script>
</body>
</html>`);
});

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('user-data', (data) => {
    users[socket.id] = {
      id: data.id,
      username: data.username,
      referralCode: data.referralCode,
      coins: 0,
      isPremium: false
    };
  });

  socket.on('referral-signup', ({ refCode, userId }) => {
    for (let [id, user] of Object.entries(users)) {
      if (user.referralCode === refCode && id !== socket.id) {
        user.coins += 50;
        if (users[socket.id]) users[socket.id].coins += 10;
        console.log('✅ Referral! +50 coins to ' + user.username);
        break;
      }
    }
  });

  socket.on('find-stranger', () => {
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.pop();
      const room = 'room-' + socket.id + '-' + partner.id;
      socket.join(room);
      partner.join(room);
      io.to(room).emit('matched', { room, initiator: socket.id });
    } else {
      waitingUsers.push(socket);
    }
  });

  socket.on('send-message', ({ room, message }) => {
    socket.to(room).emit('receive-message', { message });
  });

  socket.on('webrtc-offer', ({ room, offer }) => {
    socket.to(room).emit('webrtc-offer', { offer });
  });

  socket.on('webrtc-answer', ({ room, answer }) => {
    socket.to(room).emit('webrtc-answer', { answer });
  });

  socket.on('webrtc-ice', ({ room, candidate }) => {
    socket.to(room).emit('webrtc-ice', { candidate });
  });

  socket.on('disconnect', () => {
    waitingUsers = waitingUsers.filter(s => s.id !== socket.id);
    socket.broadcast.emit('stranger-disconnected');
  });
});

http.listen(3000, () => {
  console.log('🚀 ZapMeet running on http://localhost:3000');
});