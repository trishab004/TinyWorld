const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    read: { type: Boolean, default: false } // <--- ADD THIS LINE
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);