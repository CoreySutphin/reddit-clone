const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');

const port = process.env.port || 3000;

const app = express();

app.set("view engine", "pug");
app.set('views', path.join(__dirname, '/public/views'));

app.use(express.static(__dirname + '/public')) // Include CSS values
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Replace with your db username and password
mongoose.connect('mongodb://<dbuser>:<dbpassword>@ds129831.mlab.com:29831/reddit-clone-cs', { useNewUrlParser: true },
 function(err) {
  if (err) throw err;
  console.log("Successfully connected to MongoDB");
});

let User = require('./models/UserSchema')

app.get('/', (req, res) => {
  res.render("subreddit");
});

// Route for serving a specific subreddit
app.get('/r/:subreddit', (req, res) => {
  let subreddit = req.params.subreddit;
  res.send(subreddit);
});

// Route for serving the user registration page
app.get('/register', (req,res) => {
  res.render('user-registration');
});

app.listen(port, () => console.log(`Listening on port ${port}`));
