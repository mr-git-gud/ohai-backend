require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const formData = require("express-form-data");

const register = require("./controllers/register");
const signin = require("./controllers/signin");
const signout = require("./controllers/signout");
const auth = require("./controllers/authorization");
const townsquare = require("./controllers/townsquare");
const sockets = require("./controllers/sockets");
const autoMod = require("./controllers/autoMod");
const uploadImage = require("./controllers/uploadImage");

const userSchema = new mongoose.Schema({ email: String, hash: String });
const User = mongoose.model("User", userSchema);

const TsqPostSchema = new mongoose.Schema({
  user: String,
  message: String,
  src: String,
  sid: String,
  time: Date,
  rgb: String,
  from: String,
  to: String
});
const TsqPost = mongoose.model("TsqPost", TsqPostSchema);

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(bodyParser.json());
app.use(cors());

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

app.use(formData.parse());

mongoose.connect(process.env.MONGODB_CLUSTER, { useNewUrlParser: true });

app.get("/", (req, res) => {
  res.send("This is the API for PingIM");
});

app.post("/signin", (req, res) => {
  signin.handleSignIn(req, res, User, bcrypt);
});
app.post("/register", (req, res) => {
  register.handleRegister(req, res, User, bcrypt);
});
app.get("/townsquare/:id", auth.isAuthenticated, (req, res) => {
  townsquare.getUserDetails(req, res, User);
});

app.post("/image-upload", (req, res) => {
  uploadImage.handleUploadImage(req, res, cloudinary);
});

app.post("/image-scan", (req, res) => {
  autoMod.handleApiCall(req, res);
});

app.post("/signout", (req, res) => {
  signout.handleSignOut(req, res);
});

io.on("connection", socket => {
  socket.on("add-user", username => {
    sockets.handleNewUser(username, io, socket);
  });

  socket.on("send-private-message", pvtMsg => {
    sockets.handleSendReceivePvtMsg(pvtMsg, io, socket, TsqPost);
  });

  socket.on("typing", user => {
    io.emit("user-typing", user);
  });

  socket.on("stopped-typing", user => {
    io.emit("user-stopped-typing", user);
  });

  socket.on("post-message", msg => {
    sockets.handleSendReceiveMsgPost(msg, io, TsqPost);
  });

  socket.on("post-image", imgpost => {
    sockets.handleSendReceiveImgPost(imgpost, io, TsqPost);
  });

  socket.on("sign-out", () => {
    socket.disconnect();
  });

  socket.on("disconnect", () => {
    sockets.handleDisconnect(io);
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

http.listen(port, () => {
  console.log("listening on *:3000");
});
