const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // In a real app, encrypt this!
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);