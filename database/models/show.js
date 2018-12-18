const mongoose = require('mongoose');
mongoose.promise = Promise;
const Schema = mongoose.Schema;

const ShowSchema = new Schema({
  title : {type: String},
  genre : {type: String},
  studio : {type: String},
  synopsis : {type: String},
  episodes : {type: Number},
  year : {type: Number},
  runtime : {type: Number},
  type : {type: String}
});

const show = mongoose.model('Show', ShowSchema);
module.exports = show;
