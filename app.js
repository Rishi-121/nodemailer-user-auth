require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { mailService } = require("./nodemailer");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((conn) => console.log(`MongoDB connected: ${conn.connection.host}`))
  .catch((err) => console.error(`Error: ${err.message}`));

const app = express();

app.use(express.static(path.join(__dirname) + "/public"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// User schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    default: "",
  },
});

// User model
const User = mongoose.model("User", userSchema);

// Index page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Get the user data
app.post("/users/signup", async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      return res.send("<p>Duplicate data</p>");
    }

    const token = uuidv4();
    const newUser = new User({ firstName, lastName, email, token });

    // Mail service
    await mailService(newUser);

    newUser.save();

    return res.send("<p>Please check mail</p>");
  } catch (err) {
    return res.send("<p>Unable to sign up</p>");
  }
});

// Verify user
app.get("/users/verify", async (req, res) => {
  try {
    const { email, token } = req.query;

    const user = await User.findOne({ email, token });

    if (!user) {
      return res.send("<p>You haven't registered yet</p>");
    }

    res.cookie("jwt", jwt.sign({ id: user._id }, process.env.JWT_SECRET), {
      expire: new Date() + 9999,
      httpOnly: true,
    });
    
    res.redirect("/users/message");
  } catch (err) {
    return res.send("<p>Unable to verify</p>");
  }
});

// Protected route
app.get(
  "/users/message",
  // Auth middleware
  async (req, res, next) => {
    try {
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      next();
    } catch (err) {
      return res.send("<p>Unauthorized access</p>");
    }
  },
  (req, res) => {
    // res.clearCookie("jwt");
    return res.send("<p>Hey! coder ???????????</p>");
  }
);
 
app.listen(
  process.env.PORT,
  console.log(`Server running on port ${process.env.PORT}`)
);
