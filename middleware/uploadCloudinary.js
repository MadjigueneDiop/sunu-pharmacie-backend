import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";


const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sunu-pharmacie",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "jfif"],
  },
});

const upload = multer({ storage });

export default upload;