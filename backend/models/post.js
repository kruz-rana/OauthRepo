const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    userId: String,
    title: String,
    content: String,
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema)