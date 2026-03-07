import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "smart-trip-planner",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 800, crop: "limit", quality: "auto" }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const chatStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "smart-trip-planner/chat",
    resource_type: "auto",
  },
});

const isAllowedChatFile = (mimetype = "") => {
  if (mimetype.startsWith("image/")) return true;
  if (mimetype.startsWith("video/")) return true;
  if (mimetype.startsWith("audio/")) return true;

  const allowed = [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-rar-compressed",
    "text/csv",
  ];

  return allowed.includes(mimetype);
};

const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (isAllowedChatFile(file?.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Unsupported file type"));
  },
});

export { cloudinary, upload, chatUpload };
