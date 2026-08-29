const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Please add a message'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);
