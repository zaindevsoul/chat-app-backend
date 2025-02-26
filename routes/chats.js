const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Chat = require("../models/Chat");
const logger = require("../logger");

router.post("/chats/sendMessage", async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    if (!senderId || !receiverId || !message) {
      console.log("senderId, receiverId and message are required");
      return res.json({
        status: 400,
        message: "senderId, receiverId and message are required",
      });
    }
    const senderExists = await User.exists({ _id: senderId });
    const receiverExists = await User.exists({ _id: receiverId });

    if (!senderExists || !receiverExists) {
      return res
        .status(404)
        .json({ success: false, error: "Sender or receiver not found" });
    }

    const newMessage = new Chat({
      sender: senderId,
      receiver: receiverId,
      text: message,
    });

    await newMessage.save();
    logger.info(newMessage);
    res.json({ status: 200, success: true, data: newMessage });
  } catch (error) {
    logger.error(error);
    res.json({ status: 500, success: false, error: "Internal Server Error" });
  }
});

router.get("/chats/getMessages", async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;
    console.log(req.query);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 100000;

    const messages = await Chat.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    })
      .populate([
        { path: "sender", model: "User" },
        { path: "receiver", model: "User" },
      ])
      // .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({ status: 200, success: true, data: messages });
  } catch (error) {
    console.log(error);
    res.json({ status: 500, success: false, error: "Internal Server Error" });
  }
});
router.delete("/chats/deleteMessage", async (req, res) => {
  try {
    const { senderId, messageId } = req.query;

    const message = await Chat.findOneAndDelete({
      _id: messageId,
      sender: senderId,
    });

    res.json({
      status: 200,
      success: true,
      message: "Message deleted successfully",
      data: message,
    });
  } catch (error) {
    console.log(error);
    res.json({ status: 500, success: false, error: "Internal Server Error" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.id);

    const conversations = await Chat.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", userId] },
              then: "$receiver",
              else: "$sender",
            },
          },
          lastMessage: { $first: "$text" },
          timestamp: { $first: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          username: "$user.username",
          lastMessage: 1,
          timestamp: 1,
        },
      },
    ]);
    console.log("userId:", userId);
    console.log("Aggregation Result:", conversations);

    res.json({ status: 200, success: true, data: conversations });
  } catch (error) {
    console.log(error);
    res.json({ status: 500, success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
