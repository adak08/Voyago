export const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

export const errorHandler = (err, req, res, next) => {
  const safeMessage =
    err?.message ||
    err?.error?.message ||
    (typeof err === "string" ? err : "Internal Server Error");

  console.error("Error:", safeMessage);

  let statusCode = err?.statusCode || 500;
  let message = safeMessage;

  // Mongoose validation error
  if (err?.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  // Mongoose duplicate key
  if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose cast error (invalid ID)
  if (err?.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Multer upload errors
  if (err?.name === "MulterError") {
    statusCode = 400;

    if (err?.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Maximum size is 20MB";
    } else {
      message = err.message || "Upload failed";
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};