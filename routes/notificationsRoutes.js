import express from "express";
import {
  getMyNotifications,
  markAsRead,
} from "../controllers/NotificationUserController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.put("/:id/read", protect, markAsRead);

export default router;