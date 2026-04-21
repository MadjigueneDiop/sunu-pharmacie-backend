import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";

import path from "path";



const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/suppliers", supplierRoutes);
app.listen(5000, () => {
  console.log("Serveur backend 🚀 http://localhost:5000");
});