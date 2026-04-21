import express from "express";
import Email from "../models/Email.js";

const router = express.Router();

// GET ALL EMAILS (ADMIN)
router.get("/", async (req, res) => {
  try {
    const emails = await Email.find().sort({ createdAt: -1 });
    res.json(emails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;