
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const register = require('./controllers/register');
const signin = require('./controllers/signin');
const signout = require('./controllers/signout');
const auth = require('./controllers/authorization');

const userSchema = new mongoose.Schema({ email: String, hash: String })
const User = mongoose.model("User", userSchema);

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(morgan("Combined"));

mongoose.connect('mongodb://mongodb:27017');

app.post('/signin', (req, res) => { signin.handleSignIn(req, res, User, bcrypt); })
app.post('/register', (req, res) => { register.handleRegister(req, res, User, bcrypt); })
app.get('/placeholder/:id', auth.isAuthenticated, (req, res) => { return res.json("Logged in and session authenticated")})
app.post('/signout', (req, res) => { signout.handleSignOut(req, res) })

app.listen(3000, (req, res) => {
  console.log("Server running on port 3000");
})
