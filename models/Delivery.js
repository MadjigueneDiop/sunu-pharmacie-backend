import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
  orderId: String,
  client: String,
  livreur: String,
  status: {
    type: String,
    default: "en attente"
  }
}, { timestamps: true });

export default mongoose.model("Delivery", deliverySchema);