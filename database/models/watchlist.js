const mongoose = require('mongoose');
mongoose.promise = Promise;
const Schema = mongoose.Schema;

const WatchlistSchema = new Schema({
  userId : {type: Schema.Types.ObjectId, ref : 'User'},
  showId : {type: Schema.Types.ObjectId, ref : 'Show'},
  status : {type: String},
  episodesWatched : {type: Number}
});

const watchlist = mongoose.model('Watchlist', WatchlistSchema);
module.exports = watchlist;
