import express from "express";
import {
  getDeliveries,
  createDelivery,
  updateDelivery
} from "../controllers/deliveryController.js";

const router = express.Router();

router.get("/", getDeliveries);
router.post("/", createDelivery);
router.put("/:id", updateDelivery);

export default router;