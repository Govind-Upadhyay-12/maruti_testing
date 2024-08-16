const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  mspin: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  data: {
    type: [String],
    required: false 
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
