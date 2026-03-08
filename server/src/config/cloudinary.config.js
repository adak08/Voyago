
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure Cloudinary credentials are loaded even when server starts from workspace root.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Trip photo upload (used for cover/trip photos) ───────────────────────────
const tripPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "smart-trip-planner/trips",
    resource_type: "image",
    // Do NOT use allowed_formats here — it can silently drop files.
    // We handle format validation via fileFilter below.
    transformation: [
      { width: 1200, height: 900, crop: "limit", quality: "auto:good" },
    ],
  },
});

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/avif",
];

const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported image type: ${file.mimetype}. Use JPG, PNG, WEBP, GIF, HEIC, HEIF or AVIF.`), false);
  }
};

export const upload = multer({
  storage: tripPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFileFilter,
});

// Dedicated trip upload middleware that keeps file in memory and lets
// controller upload it to Cloudinary. This is more resilient across envs.
export const tripUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFileFilter,
});

// ─── Chat media upload ────────────────────────────────────────────────────────
const ALLOWED_CHAT_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/ogg",
  "audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/webm",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-rar-compressed",
];

const chatFileFilter = (req, file, cb) => {
  if (ALLOWED_CHAT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

export const chatUpload = multer({
  storage: multer.memoryStorage(), // kept in memory, uploaded manually in controller
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: chatFileFilter,
});

export { cloudinary };