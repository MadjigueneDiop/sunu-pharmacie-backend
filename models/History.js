import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  details: String,
}, { timestamps: true });

export default mongoose.model("History", historySchema);