const express = require('express');
const router = express.Router();
const passport = require('passport');

//Models
let User = require('./models/UserSchema');
