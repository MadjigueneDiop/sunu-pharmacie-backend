import mongoose from "mongoose";

const emailSchema = new mongoose.Schema({
  user: String,
  email: String,
  subject: String,
  status: {
    type: String,
    default: "pending", 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Email", emailSchema);