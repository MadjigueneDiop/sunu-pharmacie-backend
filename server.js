import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import { connectDB } from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";

dotenv.config(); 

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/livreur", deliveryRoutes);

app.get("/", (req, res) => {
  res.json({
    message: " API SUNU PHARMACIE en ligne",
    status: "OK",
  });
});
console.log("RESEND KEY =", process.env.RESEND_API_KEY);
console.log(" SERVER STARTING...");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur backend  http://localhost:${PORT}`);
});