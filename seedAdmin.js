import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.log("❌ MONGO_URI introuvable dans .env");
  process.exit(1);
}

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const adminEmail = "admin@gmail.com";
    const adminPassword = "admin123";

    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
      console.log("⚠️ Admin déjà existant");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      prenom: "Admin",
      nom: "System",
      email: adminEmail,
      password: hashedPassword,
      role: "admin"
    });

    console.log("✅ Admin créé avec succès !");
    process.exit();

  } catch (error) {
    console.log("❌ Erreur:", error.message);
    process.exit(1);
  }
};

createAdmin();