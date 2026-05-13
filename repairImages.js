import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import cloudinary from "./config/cloudinary.js";
import axios from "axios";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB connecté");

const products = await Product.find();

for (const p of products) {
  if (!p.image) continue;

  // déjà migré
  if (p.imageSource === "cloudinary") {
    console.log("SKIP (déjà migré):", p.name);
    continue;
  }

  try {
    console.log("Migration:", p.name);

    // 1. sauvegarde ancien lien
    const oldImage = p.image;

    // 2. download image
    const response = await axios.get(oldImage, {
      responseType: "arraybuffer",
      timeout: 7000,
    });

    const buffer = Buffer.from(response.data, "binary");

    // 3. upload cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "sunupharmacie",
            resource_type: "image",
          },
          (err, res) => {
            if (err) reject(err);
            else resolve(res);
          }
        )
        .end(buffer);
    });

    // 4. update product SANS perdre ancien image
    await Product.updateOne(
      { _id: p._id },
      {
        $set: {
          imageOld: oldImage,
          imageCloudinary: result.secure_url,
          image: result.secure_url,
          imageSource: "cloudinary",
        },
      }
    );

    console.log("✔ Migré:", p.name);
  } catch (err) {
    console.log("❌ SKIP:", p.name);
  }
}

console.log("🎯 MIGRATION TERMINÉE");
process.exit();