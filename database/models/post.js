const mongoose = require('mongoose');
mongoose.promise = Promise;
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  userId : {type: Schema.Types.ObjectId, ref : 'User'},
  text : {type : String},
  attachedImage : {type : String}
});

const post = mongoose.model('Post', PostSchema);
module.exports = post;
