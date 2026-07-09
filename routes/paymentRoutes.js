import express from "express";

import {
 getPayments,
 updatePaymentStatus
} from "../controllers/orderController.js";

import {protect} from "../middleware/auth.js";


const router = express.Router();



router.get(
 "/",
 protect,
 getPayments
);



router.put(
 "/:id",
 protect,
 updatePaymentStatus
);



export default router;