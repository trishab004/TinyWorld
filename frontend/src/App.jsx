import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Chat from './Chat';
import './App.css';

// Initialize Socket
// const socket = io.connect("http://localhost:5000");

const socket = io.connect("https://tinyworld.onrender.com");

function App() {
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});

  // --- LOGIC (Same as before) ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLoginMode ? '/login' : '/register';
    try {
      const res = await axios.post(`https://tinyworld.onrender.com${endpoint}`, { username, password });
      localStorage.setItem('tinyUser', JSON.stringify(res.data.user));
      localStorage.setItem('tinyToken', res.data.token);
      setUser(res.data.user);
      socket.emit('join_room', res.data.user._id);
      fetchUsersList(res.data.user._id);
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Something went wrong"));
    }
  };

  const fetchUsersList = async (currentUserId) => {
    try {
      const res = await axios.get('https://tinyworld.onrender.com/users');
      const others = res.data.filter(u => u._id !== currentUserId);
      setUsersList(others);
      const unreadRes = await axios.get(`https://tinyworld.onrender.com/unread/${currentUserId}`);
      setUnreadCounts(unreadRes.data);
    } catch (err) { console.error(err); }
  };

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Toggle Theme Class on Body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const savedUser = localStorage.getItem('tinyUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      socket.emit('join_room', parsedUser._id);
      fetchUsersList(parsedUser._id);
    }
  }, []);

  useEffect(() => {
    socket.on('online_users', (userIds) => setOnlineUsers(userIds));
    return () => socket.off('online_users');
  }, []);

  useEffect(() => {
    const handleGlobalMessage = (data) => {
      if (data.sender !== user._id) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        audio.play().catch(e => console.log("Audio error:", e));
        if (selectedUser?._id !== data.sender) {
          setUnreadCounts(prev => ({ ...prev, [data.sender]: (prev[data.sender] || 0) + 1 }));
        }
      }
    };
    socket.on('receive_message', handleGlobalMessage);
    return () => socket.off('receive_message', handleGlobalMessage);
  }, [socket, user, selectedUser]);


  // --- VIEW 1: AUTH ---
  if (!user) {
    return (
      <div className="auth-container">
        {/* Floating Gaming Assets (Background) */}
        <div className="floating-layer">
          <span className="float-item i1">🎮</span>
          <span className="float-item i2">👾</span>
          <span className="float-item i3">🚀</span>
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Felix" className="float-item i4" alt="" />
          <img src="https://api.dicebear.com/7.x/fun-emoji/svg?seed=Wow" className="float-item i5" alt="" />
        </div>

        <div className="glass-card">
          <h1>TinyWorld</h1>
          <p className="subtitle">Enter the realm.</p>
          <form onSubmit={handleAuth}>
            <div className="input-group">
              <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="input-group">
              <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="glow-btn">
              {isLoginMode ? "Login" : "Register"}
            </button>
          </form>
          <p className="switch-auth" onClick={() => setIsLoginMode(!isLoginMode)}>
            {isLoginMode ? "Create an account" : "Login to account"}
          </p>
        </div>
      </div>
    );
  }

  // --- VIEW 2: DASHBOARD ---
  return (
    <div className="main-layout">
      {/* Floating Background Layer */}
      <div className="floating-layer">
        <span className="float-item i1">💎</span>
        <span className="float-item i2">👻</span>
        <span className="float-item i3">🕹️</span>
        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Robot" className="float-item i4" alt="" />
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Cool" className="float-item i5" alt="" />
      </div>

      <div className="glass-dashboard">
        {/* Sidebar */}
        <div className="sidebar">
          <h3>TinyWorld</h3>
          <div className="users-scroller">
            {usersList.map((u) => (
              <div
                key={u._id}
                className={`user-item ${selectedUser?._id === u._id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedUser(u);
                  setUnreadCounts(prev => ({ ...prev, [u._id]: 0 }));
                }}
              >
                <div className="avatar-wrapper">
                  <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`} alt="avatar" />
                  {onlineUsers.includes(u._id) && <span className="online-dot"></span>}
                </div>

                <div className="user-info">
                  <span className="username">{u.username}</span>
                  {onlineUsers.includes(u._id) ?
                    <span className="status-text">Online</span> :
                    <span className="status-text off">Offline</span>
                  }
                </div>

                {unreadCounts[u._id] > 0 && (
                  <span className="unread-badge">{unreadCounts[u._id]}</span>
                )}
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            {/* Theme Toggle Button */}
            <button
              className="theme-btn"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Toggle Theme"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            {/* Logout Button */}
            <button className="logout-btn" onClick={() => {
              localStorage.removeItem('tinyUser');
              localStorage.removeItem('tinyToken');
              setUser(null);
              window.location.reload();
            }}>
              Logout
            </button>
          </div>

        </div>


        {/* Chat Area */}
        <div className="chat-area">
          {/* 🎮 NEW: Floating Background specifically for Chat */}
          <div className="floating-layer chat-bg">
            <span className="float-item i1">☁️</span>
            <span className="float-item i2">🎈</span>
            <span className="float-item i3">✨</span>
            <img src="https://api.dicebear.com/7.x/fun-emoji/svg?seed=Love" className="float-item i4" alt="" />
          </div>

          {selectedUser ? (
            <Chat
              currentUser={user}
              selectedUser={selectedUser}
              socket={socket}
              onlineUsers={onlineUsers}
            />
          ) : (
            <div className="empty-state">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} className="hero-avatar" alt="me" />
              <h2>Welcome, {user.username}</h2>
              <p>Select a friend from the sidebar to start chatting.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
