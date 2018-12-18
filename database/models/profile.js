const mongoose = require('mongoose');
mongoose.promise = Promise;
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
  userId : {type: Schema.Types.ObjectId, ref : 'User'},
  name : {type : String},
  profilePic : {type: String},
  bio : {type: String}
});

const profile = mongoose.model('Profile', ProfileSchema);
module.exports = profile;
