const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const port = process.env.port || 3000;

const app = express();

app.set("view engine", "pug");

// Replace with your db username and password
mongoose.connect('mongodb://<dbuser>:<dbpassword>@ds129831.mlab.com:29831/reddit-clone-cs', { useNewUrlParser: true },
 function(err) {
  if (err) throw err;
  console.log("Successfully connected to MongoDB");
});

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/', (req, res) => {
  res.render("subreddit");
});

app.listen(port, () => console.log(`Listening on port ${port}`));
