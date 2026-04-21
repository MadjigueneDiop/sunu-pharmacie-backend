import express from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  updateUserRole
} from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/", getUsers);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.put("/:id/role", updateUserRole);


export default router;