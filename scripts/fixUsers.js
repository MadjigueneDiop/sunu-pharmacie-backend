import mongoose from "mongoose";
import User from "../models/User.js";

await mongoose.connect("mongodb://localhost:27017/sunupharmacie");

// 🔥 VALIDER ANCIENS FOURNISSEURS + PHARMACIENS
await User.updateMany(
  { role: { $in: ["pharmacien", "fournisseur"] } },
  { $set: { isVerified: true } }
);

console.log("Migration terminée ✔");
process.exit();