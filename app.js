const port = 3000;
const express = require('express');
const path = require('path')
const hb  = require('express-handlebars');
const app = express();

const db = require('./database');
const Follower = require('./database/models/follower');
const Post = require('./database/models/post');
const Profile = require('./database/models/profile');
const Review = require('./database/models/review');
const Show = require('./database/models/show');
const User = require('./database/models/user');
const Watchlist = require('./database/models/watchlist');

app.engine('handlebars', hb({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, '/public'))); // Used to access css file(s)

// Routing
// Landing page
app.get('/', (req, res) => {
  res.render('login'); // Renders login.handlebars
});

// Create Profile Page
app.get('/create_profile', (req, res) => {
  if(!app.get('userId')) {
    res.redirect('/');
    return;
  }
  res.render('create_profile');
});

app.get('/profile', (req, res) => {
  if (app.get('userId')){
    res.redirect('/profile/' + app.get('userId'));
  }
  else {
    res.redirect('/');
  }
});
// Go to logged in user's profile page
app.get('/profile/:id', (req, res) => {
  if(!app.get('userId')) {
    res.redirect('/');
    return;
  }
  const userId = app.get('userId');
  if (req.params.id == undefined) {
    app.set('profileid', userId);
  }
  else{
    app.set('profileid', req.params.id);
  }
  const profileId = app.get('profileid');
  var res_bod = {};
  Profile.findOne({userId:profileId}).populate("userId").exec((err, result)=>{
    if (err || !result) {
      console.log(err);
      res.redirect("/");
      return;
    }
    res_bod["data"] = result; 
    Follower.find({followingUserId:profileId}).populate("userId").exec((followerErr, followerResults) => {
      if (followerErr) {
        console.log(followerErr);
        return;
      }
      res_bod["followers"] = followerResults;
      Post.find({userId:profileId}, (postErr, postResults)=>{
        if (postErr) {
          console.log(postErr);
          return;
        }
        res_bod["comments"] = postResults;
        console.log(res_bod);
        res.render("profile", {res_bod});
      });
    });
  }); 
});

app.get('/watchlist', (req, res) => {
  if(!app.get('userId')) {
    res.redirect('/');
    return;
  }
  Watchlist.find({userId:app.get("userId")}).populate("showId").exec((err, results) => {
    if (err) {
      console.log(err);
      return;
    }
    const renderData = {tv:{dropped:[],watching:[],completed:[]}, movie:{dropped:[],watching:[],completed:[]}};
    for(const result of results) {
      const pointer = renderData[result.showId.type.toLowerCase()][result.status.toLowerCase()];
      const row = {};
      row.showId = result.showId._id;
      row.title = result.showId.title;
      row.episodeswatched = result.episodesWatched;
      pointer.push(row);
    }
    console.log(renderData.tv.watching[2]);
    res.render("watchlist", {renderData});
  });
});

app.get('/users', (req, res) => {
  if(!app.get('userId')) {
    res.redirect('/');
    return;
  }
  let renderData = {};
  Follower.find({userId:app.get("userId")}).populate("followingUserId").exec((err, results) => {
    if (err) {
      console.log(err);
      return;
    }
    const followerIds = [];
    const rows = [];
    for (const result of results) {
      followerIds.push(result.followingUserId._id);
      const row = {};
      row.id = result.followingUserId._id;
      row.username = result.followingUserId.username;
      row.email = result.followingUserId.email;
      row.isadmin = result.followingUserId.isAdmin;
      rows.push(row);
    }
    followerIds.push(app.get("userId"));
    renderData.following = rows;
    User.find({_id:{$nin:followerIds}}, (userErr, userResults) => {
      if (userErr) {
        return;
      }
      const userRows = [];
      for (const userResult of userResults) {
        const userRow = {}; 
        userRow.id = userResult._id;
        userRow.username = userResult.username;
        userRow.email = userResult.email;
        userRow.isadmin = userResult.isAdmin;
        userRows.push(userRow);
      }
      renderData.notfollowing = userRows;
      res.render("users", {renderData})
    });
  });
});

app.get('/reviews', (req, res) => {
  Review.find({}).populate("userId", "username").populate("showId",
      "title").sort({timestamp:-1}).exec((err, reviewResults) => {
    if (err) {
      console.log(err);
      return;
    }
    const data = [];
    for(const reviewResult of reviewResults) {
      const row = {};
      row.showId = reviewResult.showId._id;
      row.userId = reviewResult.userId._id;
      row.title = reviewResult.showId.title;
      row.username = reviewResult.userId.username;
      row.rating = reviewResult.rating;
      row.review = reviewResult.review;
      row.timestamp = reviewResult.timestamp;
      data.push(row);
    }
    const results = {};
    results.rows = data;
    console.log(results);
    res.render("reviews", {results});
  });
});

app.get('/list/shows', (req, res) => {
  Show.find({type:"Tv"}, (err, movies) => {
    if (err) {
      console.log(err);
      return;
    }
    const results = {};
    results.rows = movies;
    res.render("titles", {results});
  });
});

app.get('/list/movies', (req, res) => {
  Show.find({type:"Movie"}, (err, movies) => {
    if (err) {
      console.log(err);
      return;
    }
    const results = {};
    results.rows = movies;
    res.render("titles", {results});
  });
});

app.get('/title/:id', (req, res) => {
  const id = req.params.id;
  var data = {};
  app.set('showId', id);
  Show.findOne({_id:id}, (err, result) => {
    if (err || !result) {
      console.log(err);
      return;
    }
    data = result;
    Watchlist.findOne({userId:app.get("userId"), showId:result._id}, "status episodesWatched", (watchErr, watchResult) => {
      if (watchErr) {
        console.log(watchErr);
        return;
      }
      if (watchResult) {
        data.episodeswatched = watchResult.episodesWatched;
        data.status = watchResult.status;
      }
      res.render("show_page", data); 
    });
  });
});

app.get('/create_review', (req, res) => {
  if(!app.get('userId')) {
    res.redirect('/');
    return;
  }
  const showId = app.get('showId');
  Show.findOne({_id:showId}, (err, result) => {
    if (err || !result) {
      console.log(err);
      return;
    }
    res.render("create_review", result);
  });
});

//Create Home Page
app.get('/home', (req, res) => {
  if(!app.get('userId')) {
    res.redirect('/');
    return;
  }
  const userId = app.get('userId');
  var res_bod = {};
  User.findOne({_id:userId}, (err, result) => {
    if (err || !result) {
      console.log("Not logged in");
      console.log(err);
      return;
    }
    res_bod["username"] = result.username; 
    res_bod["theemail"] = result.email; 
    Show.find({}, (showErr, showResults) => {
      if(showErr || !showResults) {
        console.log("Failed to acquire shows");
        console.log(showErr);
        return;
      }
      console.log(showResults);
      console.log(showResults.length);
      randnum = Math.floor(Math.random() * showResults.length);
      if (showResults.length === 0) {
        res.render("home", res_bod);
        return;
      }
      res_bod["showid"] = showResults[randnum]._id;
      res_bod["randomshowtitle"] = showResults[randnum].title;
      res_bod["genre"] = showResults[randnum].genre;
      res_bod["episodes"] = showResults[randnum].episodes;
      res_bod["summary"] = showResults[randnum].summary;
      res.render("home", res_bod);
    });
  });
});

app.post('/postcomment', (req, res) => {
  const userid = app.get('userId');
  const comtext = req.body.commenttext;
  const imglink = req.body.imagelink;
  Post.create({userId:userid, text:comtext, attachedImage:imglink}, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    res.redirect("/profile");
  });
});

app.post('/delete_follower', (req, res) => {
  const userid = app.get('userId');
  const followinguserid = req.body.followinguserid;
  Follower.deleteOne({userId:userid, followingUserId:followinguserid}, (err) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Removed follower");
    res.redirect("/users");
  });
});

app.post('/add_follower', (req, res) => {
  const userid = app.get('userId');
  const followinguserid = req.body.followinguserid;
  Follower.create({userId:userid, followingUserId:followinguserid}, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Added follower");
    res.redirect("/users");
  });
});

app.post('/create_review', (req, res) => {
  const userId = app.get('userId');
  const showId = app.get('showId');
  const rating = req.body.rating;
  const review = req.body.review;
  const timestamp = new Date().toISOString();
  Review.create({userId:userId, showId:showId, rating:rating, review:review}, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Added review");
    res.redirect("/title/" + showId);
  });
});

app.post('/add_to_watchlist', (req, res) => {
  const userId = app.get('userId');
  const showId = app.get('showId');
  var status = "watching"
  var episodes = 1;
  Watchlist.create({userId:userId, showId:showId, status:status, episodesWatched:episodes}, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Added to watchlist");
    res.redirect("/title/" + showId);
  });
});

function updateWatchlist(status, episodes, res) {
  const userId = app.get('userId');
  const showId = app.get('showId');
  Watchlist.updateOne({userId:userId, showId:showId}, {status:status, episodes:episodes}, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    res.redirect("/title/" + showId);
  });
}

app.post('/update_watchlist', (req, res) => {
  var status = req.body.status;
  if (status == 'completed') {
    Show.findOne({_id:app.get("showId")}, "episodes", (err, result) => {
      if (err || !result) {
        console.log(err);
        return;
      }
      updateWatchlist(status, result.episodes, res);
    });
  } else {
    updateWatchlist(status, req.body.episode, res);
  }
});


// Saves userId and admin status after "logging in"
app.post('/login_user', (req, res) => {
  const username = req.body.username1;
  const email = req.body.email1;
  User.findOne({username:username, email:email}, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    if (!result) {
      console.log("Invalid username or email");
      res.redirect('/');
      return;
    }
    console.log('Logged in: ' + username);
    console.log('User id: ' + result._id);
    console.log('Admin User: ' + result.isAdmin);
    app.set('userId', result._id); // Allows the app to remember the user's id
    app.set('isAdmin', result.isAdmin); // Remembers the user's admin status
    res.redirect('/home');
  });
});

// Inserts new user to database. Prompts user to create a new profile
app.post('/create_user', (req, res) => {
  const username = req.body.username2;
  const email = req.body.email2;
  const isAdmin = req.body.isAdmin || 'false';
  User.create({username:username, email:email, isAdmin:isAdmin.toLowerCase()}, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log("User created");
    app.set('userId', result._id); // Remembers the user's id
    res.redirect('/create_profile'); // Sends the new user to create their profile.
  });
});

// Creates a new profile for user
app.post('/create_profile', (req, res) => {
  const userId = app.get('userId'); // Returns the saved user id
  const name = req.body.name;
  const profilePic = req.body.profilePic;
  const bio = req.body.bio;
  Profile.create({userId:userId, name:name, profilePic:profilePic, bio:bio}, (err, result) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Profile created");
    res.redirect('/'); // Redirects to home page
  });
});

app.listen(port);
