const mongoose = require('mongoose');
mongoose.promise = Promise;
const Schema = mongoose.Schema;

const FollowerSchema = new Schema({
  userId : {type: Schema.Types.ObjectId, ref : 'User'},
  followingUserId : {type: Schema.Types.ObjectId, ref : 'User'},
});

const follower = mongoose.model('Follower', FollowerSchema);
module.exports = follower;
