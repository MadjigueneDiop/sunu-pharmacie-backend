import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Product from "./models/Product.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log("✅ MongoDB connecté");

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const BASE_URL = "https://sunu-pharmacie-backend-6.onrender.com";

const buildImageUrl = (img) => {
  if (!img) return null;

  if (img.startsWith("http")) return img;

  const filename = img.replace("uploads/", "").replace("\\", "/");

  const localFile = path.join(UPLOADS_DIR, filename);

  if (fs.existsSync(localFile)) {
    return `${BASE_URL}/uploads/${filename}`;
  }

  return `${BASE_URL}/uploads/${filename}`;
};

const run = async () => {
  try {
    const products = await Product.find();

    let updated = 0;

    for (const p of products) {
      if (!p.image) continue;

      const newUrl = buildImageUrl(p.image);

      if (newUrl && newUrl !== p.image) {
        await Product.updateOne(
          { _id: p._id },
          { $set: { image: newUrl } }
        );

        updated++;
      }
    }

    console.log(`🎯 TERMINÉ : ${updated} images corrigées`);
    process.exit();

  } catch (err) {
    console.log("❌ ERREUR:", err);
    process.exit(1);
  }
};

run();