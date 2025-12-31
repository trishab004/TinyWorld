require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Add a secret key for your tokens (in real apps, put this in .env)
const JWT_SECRET = process.env.JWT_SECRET;


require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // Needed for Socket.io
const { Server } = require('socket.io');

const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app); // Wrap express in HTTP server

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Setup (The "Real-time" part)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Your Vite Frontend Port
        methods: ["GET", "POST"]
    }
});

// key = userId, value = socketId
const onlineUsers = new Map();

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error(err));
// --- API ROUTES ---

// 1. Register User (Secure Version)
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: "Username already taken" });

        // HASH THE PASSWORD
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with the HASHED password
        const user = await User.create({
            username,
            password: hashedPassword
        });

        // Create a Token (Auto-login after register)
        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ user, token });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Login User (Secure Version)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).json({ error: "User not found" });
    }

    // COMPARE PASSWORDS
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate Token
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    // Send back user info AND the token
    res.json({ user, token });
});

// 3. Get All Users (for the dashboard list)
app.get('/users', async (req, res) => {
    const users = await User.find({}, 'username _id'); // Don't send passwords
    res.json(users);
});

// 4. Get Chat History
app.get('/messages/:userId1/:userId2', async (req, res) => {
    const { userId1, userId2 } = req.params;
    const messages = await Message.find({
        $or: [
            { sender: userId1, recipient: userId2 },
            { sender: userId2, recipient: userId1 }
        ]
    }).sort({ createdAt: 1 }); // Oldest first
    res.json(messages);
});

// 5. Get Unread Message Counts (grouped by sender)
app.get('/unread/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // MongoDB Magic: Group messages by sender and count them
        const unreadStats = await Message.aggregate([
            {
                $match: {
                    recipient: new mongoose.Types.ObjectId(userId),
                    read: false
                }
            },
            {
                $group: {
                    _id: '$sender', // Group by the person who sent it
                    count: { $sum: 1 }
                }
            }
        ]);

        // Transform into an easy object: { "senderId1": 5, "senderId2": 1 }
        const counts = {};
        unreadStats.forEach(item => {
            counts[item._id] = item.count;
        });

        res.json(counts);
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // When a user logs in (joins their room), mark them as Online
    socket.on('join_room', (userId) => {
        socket.join(userId);

        // Store them in our Map
        onlineUsers.set(userId, socket.id);

        // Tell EVERYONE the new list of online users
        io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // Handle sending messages (No change here, but keep it!)
    socket.on('send_message', async (data) => {
        const newMessage = await Message.create(data);
        io.to(data.recipient).emit('receive_message', newMessage);
        io.to(data.sender).emit('receive_message', newMessage);
    });
    // ... inside io.on('connection') ...

    // 1. Listen for typing event
    socket.on('typing', (data) => {
        // data = { sender, recipient }
        // Tell the recipient that the sender is typing
        io.to(data.recipient).emit('display_typing', { sender: data.sender });
    });

    // 2. Listen for stop typing event
    socket.on('stop_typing', (data) => {
        io.to(data.recipient).emit('hide_typing', { sender: data.sender });
    });

    // ...
    // When they disconnect, remove them
    socket.on('disconnect', () => {
        // Find which user this socket belonged to
        let disconnectedUserId;
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
                break;
            }
        }

        if (disconnectedUserId) {
            onlineUsers.delete(disconnectedUserId);
            // Broadcast the new list to everyone else
            io.emit('online_users', Array.from(onlineUsers.keys()));
        }

        console.log('User disconnected');
    });

    // ... existing socket events ...

    // MARK READ EVENT
    socket.on('mark_read', async (data) => {
        // data = { senderId, recipientId }
        // senderId is the person who SENT the messages (the other guy)
        // recipientId is ME (the one reading them)

        // 1. Update DB: Mark all messages from 'sender' to 'me' as read
        await Message.updateMany(
            { sender: data.senderId, recipient: data.recipientId, read: false },
            { $set: { read: true } }
        );

        // 2. Notify the SENDER that their messages were read
        // We send this event to the person who wrote the messages
        io.to(data.senderId).emit('messages_read_update', {
            readerId: data.recipientId // Who read them
        });
    });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));