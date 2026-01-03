// src/Chat.jsx
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

function Chat({ currentUser, selectedUser, socket, onlineUsers }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    const [isTyping, setIsTyping] = useState(false);

    // Use a Ref to auto-scroll to the bottom of the chat
    const scrollRef = useRef();

    // 1. Fetch Chat History & Mark as Read
    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedUser) return;
            try {
                const res = await axios.get(`https://tinyworld.onrender.com/messages/${currentUser._id}/${selectedUser._id}`);
                setMessages(res.data);

                // Tell server: I am reading messages sent BY selectedUser TO me
                socket.emit('mark_read', {
                    senderId: selectedUser._id,
                    recipientId: currentUser._id
                });

            } catch (err) {
                console.error(err);
            }
        };
        fetchMessages();
    }, [selectedUser, currentUser, socket]);

    // 3. Scroll to bottom whenever messages change
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Listen for typing events
    useEffect(() => {
        const handleTyping = (data) => {
            // Only show typing if the person typing is the one we are currently chatting with
            if (data.sender === selectedUser._id) {
                setIsTyping(true);
            }
        };

        const handleStopTyping = (data) => {
            if (data.sender === selectedUser._id) {
                setIsTyping(false);
            }
        };

        socket.on('display_typing', handleTyping);
        socket.on('hide_typing', handleStopTyping);

        return () => {
            socket.off('display_typing', handleTyping);
            socket.off('hide_typing', handleStopTyping);
        };
    }, [socket, selectedUser]);

    // Listener: When MY messages are read by the other person
    useEffect(() => {
        const handleReadUpdate = (data) => {
            // If the person currently chatting with me read my messages
            if (data.readerId === selectedUser._id) {
                setMessages(prev => prev.map(msg => {
                    // If I sent it, mark it as read locally
                    if (msg.sender === currentUser._id) {
                        return { ...msg, read: true };
                    }
                    return msg;
                }));
            }
        };

        socket.on('messages_read_update', handleReadUpdate);

        // Also: If I receive a new message while looking at this window, mark it read immediately
        const handleReceiveMessage = (data) => {
            if (
                (data.sender === selectedUser._id && data.recipient === currentUser._id) ||
                (data.sender === currentUser._id && data.recipient === selectedUser._id)
            ) {
                setMessages((prev) => [...prev, data]);

                // If the message is from THEM and I am looking at it, mark read instantly
                if (data.sender === selectedUser._id) {
                    socket.emit('mark_read', {
                        senderId: selectedUser._id,
                        recipientId: currentUser._id
                    });
                }
            }
        };

        // Note: We are replacing the old 'receive_message' listener here to include the "mark read" logic
        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('messages_read_update', handleReadUpdate);
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, selectedUser, currentUser]);

    // 4. Send Message Function
    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        const messageData = {
            sender: currentUser._id,
            recipient: selectedUser._id,
            content: newMessage
        };

        // Emit to Socket (Server will save to DB and send back)
        socket.emit('send_message', messageData);
        setNewMessage("");
    };

    // Helper to handle input changes and typing status
    const handleInput = (e) => {
        setNewMessage(e.target.value);

        if (!socket) return;

        // Emit 'typing' event
        socket.emit('typing', {
            sender: currentUser._id,
            recipient: selectedUser._id
        });

        // Debounce: If user stops typing for 2 seconds, emit 'stop_typing'
        // We use a timeout to detect "stopping"
        if (window.typingTimeout) clearTimeout(window.typingTimeout);

        window.typingTimeout = setTimeout(() => {
            socket.emit('stop_typing', {
                sender: currentUser._id,
                recipient: selectedUser._id
            });
        }, 2000); // 2 seconds delay
    };

    return (
        <div className="chat-window">
            <div className="header">
                <img
                    src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${selectedUser.username}`}
                    alt="avatar"
                    className="avatar-header"
                />
                <div className="header-info">
                    <span className="header-name">{selectedUser.username}</span>

                    {/* If typing, show that. If not, show Online/Offline status */}
                    {isTyping ? (
                        <span className="header-status" style={{ color: '#764ba2', fontStyle: 'italic', transition: 'all 0.3s' }}>
                            Typing...
                        </span>
                    ) : (
                        // This is your existing Online/Offline logic
                        onlineUsers.includes(selectedUser._id) ? (
                            <span className="header-status" style={{ color: '#4caf50' }}>Online</span>
                        ) : (
                            <span className="header-status" style={{ color: '#999' }}>Offline</span>
                        )
                    )}
                </div>
            </div>



            <div className="messages-body">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.sender === currentUser._id ? 'sent' : 'received'}`}
                    >
                        <div className="message-content">
                            {msg.content}
                        </div>

                        <div className="message-meta" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '5px' }}>
                            <span className="message-time">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {/* Only show ticks for MY messages */}
                            {msg.sender === currentUser._id && (
                                <span className="ticks" style={{ color: msg.read ? '#4caf50' : '#888', fontSize: '0.8rem' }}>
                                    {msg.read ? '✔✔' : '✔'}
                                </span>
                            )}
                        </div>

                    </div>
                ))}
                {/* Invisible div to scroll to */}
                <div ref={scrollRef} />
            </div>

            <div className="chat-footer">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleInput}  // <--- Use the new handler here
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}

export default Chat;
