const mongoose = require('mongoose');
mongoose.promise = Promise;
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  userId : {type: Schema.Types.ObjectId, ref : 'User'},
  showId : {type: Schema.Types.ObjectId, ref : 'Show'},
  rating : {type : Number},
  review : {type : String},
  timestamp : {type : Date, default: Date.now},
});

const review = mongoose.model('Review', ReviewSchema);
module.exports = review;
