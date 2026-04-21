import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Dashboard admin
router.get(
  "/dashboard",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Dashboard Admin OK 👑" });
  }
);

export default router;