const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const User = require("./models/userModel");
const routes = require("./routes/route.js");
const rateLimit = require("express-rate-limit");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const app = express();

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

// Initialize Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 100 requests per windowMs
});

// Apply limiter to all requests
app.use(limiter);

mongoose.connect(MONGO_URI).then(() => {
  console.log("Connected to the Database successfully");
});

app.use(bodyParser.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  if (req.headers["x-access-token"]) {
    const accessToken = req.headers["x-access-token"];
    const { userId, exp } = await jwt.verify(
      accessToken,
      process.env.JWT_SECRET
    );
    // Check if token has expired
    if (exp < Date.now().valueOf() / 1000) {
      return res.status(401).json({
        error: "JWT token has expired, please login to obtain a new one",
      });
    }
    res.locals.loggedInUser = await User.findById(userId);
    next();
  } else {
    next();
  }
});

app.use("/", routes);
app.listen(PORT, () => {
  console.log("Server is listening on Port:", PORT);
});
