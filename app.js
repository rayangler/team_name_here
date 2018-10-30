const port = 3000;
const express = require('express');
const path = require('path')
const hb  = require('express-handlebars');
const { Client } = require('pg');
const app = express();

app.engine('handlebars', hb({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, '/public'))); // Used to access css file(s)

// Sample connection string from docs: 'postgresql://dbuser:secretpassword@database.server.com:3211/mydb'
// dbuser == tnh_superuser
// secretpassword == password
// database.server.com:3211 == localhost
// mydb == tnh_db
const connectionString = 'postgresql://tnh_superuser:password@localhost/tnh_db'
const client = new Client({
  connectionString: connectionString,
});

client.connect((err) => {
  if (err) {
    console.log('Connection error', err.stack);
  } else {
    console.log('Connected to database');
  }
});

// Create tables
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  isAdmin BOOLEAN
);`
// Made pics TEXT for now because I wasn't sure how we wanted to store them. Figured we could just store their URLs.
const createProfilesTable = `
CREATE TABLE IF NOT EXISTS profiles(
  userId INTEGER REFERENCES users(id),
  name VARCHAR(255),
  profilePic TEXT,
  bio TEXT
);`
const createShowsTable = `
CREATE TABLE IF NOT EXISTS shows(
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  genre VARCHAR(255),
  studio VARCHAR(255),
  synopsis TEXT,
  episodes INTEGER,
  year INTEGER,
  runtime INTEGER,
  type VARCHAR(255)
);`
const createShowsWatchlistTable = `
CREATE TABLE IF NOT EXISTS shows_watchlist(
  userId INTEGER REFERENCES users(id),
  showId INTEGER REFERENCES shows(id),
  status VARCHAR(255),
  episodesWatched INTEGER
);`
const createShowsReviewsTable = `
CREATE TABLE IF NOT EXISTS shows_reviews(
  userId INTEGER REFERENCES users(id),
  showId INTEGER REFERENCES shows(id),
  rating INTEGER CHECK (rating > 0 AND rating <= 10),
  review TEXT,
  timestamp TIMESTAMPTZ
);`
const createFollowersTable = `
CREATE TABLE IF NOT EXISTS followers(
  userId INTEGER REFERENCES users(id),
  followingUserId INTEGER REFERENCES users(id) CHECK (followingUserId != userId)
);`
const createUserPostsTable = `
CREATE TABLE IF NOT EXISTS user_posts(
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(id),
  text TEXT,
  attachedImage TEXT
);`
const createPostCommentsTable = `
CREATE TABLE IF NOT EXISTS post_comments(
  userId INTEGER REFERENCES users(id),
  postId INTEGER REFERENCES user_posts(id),
  text TEXT,
  attachedImage TEXT
);`

// Creation queries
const queryCreateUser = 'INSERT INTO users(username, email, isAdmin) VALUES($1, $2, $3) RETURNING id';
const queryCreateProfile = 'INSERT INTO profiles(userId, name, profilePic, bio) VALUES($1, $2, $3, $4)';
const queryCreateShow = 'INSERT INTO shows(title, genre, studio, synopsis, episodes, year, runtime, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
const queryCreateReview = 'INSERT INTO shows_reviews(userId, showId, rating, review, timestamp) VALUES ($1, $2, $3, $4, $5)';

// Search queries
const queryLoginUser = 'SELECT id, isAdmin FROM users WHERE username=$1 AND email=$2'
const queryUserData = 'SELECT username, email FROM users WHERE id = $1'
const queryAllShows = 'SELECT * FROM Shows'
const queryLatestReviews = `
SELECT showId, userId, title, username, rating, review, timestamp FROM shows_reviews
JOIN users ON users.id = shows_reviews.userId
JOIN shows ON shows.id = shows_reviews.showId
ORDER BY timestamp DESC;
`

// Create tables
client.query(createUsersTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createProfilesTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createShowsTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createShowsWatchlistTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createShowsReviewsTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createFollowersTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createUserPostsTable, (err, res) => {
  if (err) console.log(err.stack);
});
client.query(createPostCommentsTable, (err, res) => {
  if (err) console.log(err.stack);
});

// Routing
// Landing page
app.get('/', (req, res) => {
  res.render('login'); // Renders login.handlebars
});

// Create Profile Page
app.get('/create_profile', (req, res) => {
  res.render('create_profile');
});

// Go to logged in user's profile page
app.get('/profile', (req, res) => {
  res.render('home');
});

app.get('/test', (req, res) => {
  res.render('test');
});

app.get('/reviews', (req, res) => {
  client.query(queryLatestReviews, (errors, results) => {
    if (errors) console.log(errors.stack);
    else {
      console.log(results);
      res.render('reviews', {results});
    }
  });
});

//Create Home Page
app.get('/home', (req, res) => {
  const userId = app.get('userId');
  var res_bod = {};
  client.query(queryUserData, [userId], (errors, results) => {
  if (errors) {
      console.log('Not Logged In');
      console.log(errors.stack);
    } else {
      res_bod["username"] = results.rows[0].username;
      res_bod["theemail"] = results.rows[0].email;
   }
  })
  client.query(queryAllShows, (errors, results) => {
  if (errors) {
      console.log('Failed to acquire shows');
      console.log(errors.stack);
    } else {
      console.log(results.rows.length);
      randnum = Math.floor(Math.random() * results.rows.length);
      res_bod["showid"] = results.rows[randnum].id;
      res_bod["randomshowtitle"] = results.rows[randnum].title;
      res_bod["genre"] = results.rows[randnum].genre;
      res_bod["episodes"] = results.rows[randnum].episodes;
      res_bod["summary"] = results.rows[randnum].summary;
   }
  res.render('home', res_bod);
  })
});

app.post('/test_sending_data', (req, res) => {
  app.set('testVariable', req.body.testVariable);
  res.redirect('/reviews');
});

app.post('/test_create_review', (req, res) => {
  const userId = req.body.userId;
  const showId = req.body.showId;
  const rating = req.body.rating;
  const review = req.body.review;
  const timestamp = new Date().toISOString();
  client.query(queryCreateReview, [userId, showId, rating, review, timestamp], (errors, results) => {
    if (errors) {
      console.log(errors.stack);
    } else {
      console.log('Added review');
      res.redirect('/test');
    }
  });
});


// Saves userId and admin status after "logging in"
app.post('/login_user', (req, res) => {
  const username = req.body.username1;
  const email = req.body.email1;
  client.query(queryLoginUser, [username, email], (errors, results) => {
    if (errors) {
      console.log('Error logging in');
      console.log(errors.stack);
    } 
    else if (results.rows.length == 0){
      console.log('Invalid UserName or email');
      res.redirect('/');
    }else {
      var userId = results.rows[0].id;
      var isAdmin = results.rows[0].isadmin;
      console.log('Logged in: ' + username);
      console.log('User id: ' + userId);
      console.log('Admin User: ' + isAdmin);
      app.set('userId', userId); // Allows the app to remember the user's id
      app.set('isAdmin', isAdmin); // Remembers the user's admin status
      res.redirect('/home');
    }
  });
});

// Inserts new user to database. Prompts user to create a new profile
app.post('/create_user', (req, res) => {
  const username = req.body.username2;
  const email = req.body.email2;
  const isAdmin = req.body.isAdmin;
  client.query(queryCreateUser, [username, email, isAdmin], (errors, results) => {
    if (errors) {
      console.log('Error creating user');
    } else {
      console.log('User created')
      app.set('userId', results.rows[0].id); // Remembers the user's id
      res.redirect('/create_profile'); // Sends the new user to create their profile.
    }
  });
});

// Creates a new profile for user
app.post('/create_profile', (req, res) => {
  const userId = app.get('userId'); // Returns the saved user id
  const name = req.body.name;
  const profilePic = req.body.profilePic;
  const bio = req.body.bio;
  client.query(queryCreateProfile, [userId, name, profilePic, bio], (errors, results) => {
    if (errors) {
      console.log('Error creating profile');
    } else {
      console.log('Profile created')
      res.redirect('/'); // Redirects to home page
    }
  });
});

app.listen(port);
