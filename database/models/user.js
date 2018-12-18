const mongoose = require('mongoose');
mongoose.promise = Promise;
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username : {type: String, unique: true},
  email : {type: String, unique: true},
  isAdmin : {type: Boolean}
});

const user = mongoose.model('User', UserSchema);
module.exports = user;
