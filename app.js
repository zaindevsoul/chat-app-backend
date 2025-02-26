const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const chatRoutes = require("./routes/chats");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const port = process.env.PORT;

mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.use(bodyParser.json());

const User = require("./models/User");

User.countDocuments({})
  .then((count) => {
    if (count < 4) {
      const user1 = new User({ username: "user1", phone: "03112345678" });
      const user2 = new User({ username: "user2", phone: "03018765432" });
      const user3 = new User({ username: "user3", phone: "03029765564" });
      const user4 = new User({ username: "user4", phone: "03108765378" });

      return Promise.all([
        user1.save(),
        user2.save(),
        user3.save(),
        user4.save(),
      ]);
    }
  })
  .then(() => {
    console.log("Users saved successfully");
  })
  .catch((err) => {
    console.log("Error saving users:", err);
  });

app.use("/api", chatRoutes);

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}/api/chats`);
});
