import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Camera, Upload, Download, X, ZoomIn, ChevronLeft,
  ChevronRight, User
} from "lucide-react";
import { format } from "date-fns";
import { useTripStore } from "../store/tripStore";
import { tripService } from "../services/tripService";

export default function PhotoGallery({ tripId, trip }) {
  const { currentTrip, fetchTrip } = useTripStore();
  const photos = currentTrip?.photos || [];

  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [error, setError] = useState("");

  // ── Upload ──────────────────────────────────────────────
  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length) return;
      setUploading(true);
      setError("");

      for (const file of acceptedFiles) {
        try {
          const formData = new FormData();
          formData.append("photo", file);

          await tripService.uploadPhoto(tripId, formData);
        } catch (err) {
          const msg =
            err.response?.data?.message || err.message || "Upload failed";
          setError(msg);
          console.error("Upload error:", err.response?.data || err.message);
        }
      }

      await fetchTrip(tripId);
      setUploading(false);
    },
    [tripId, fetchTrip]
  );

  const onDropRejected = useCallback((fileRejections) => {
    if (!fileRejections?.length) return;

    const first = fileRejections[0];
    const message = first.errors?.[0]?.message || "File rejected";
    setError(message);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/gif": [".gif"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
      "image/avif": [".avif"],
    },
    multiple: true,
    maxSize: 5 * 1024 * 1024,
    noClick: true,
  });

  // ── Download ─────────────────────────────────────────────
  const handleDownload = async (photo, e) => {
    e?.stopPropagation();
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voyago-photo-${photo._id || Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(photo.url, "_blank");
    }
  };

  // ── Lightbox helpers ──────────────────────────────────────
  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () =>
    setLightboxIndex((i) => (i - 1 + photos.length) % photos.length);
  const nextPhoto = () =>
    setLightboxIndex((i) => (i + 1) % photos.length);
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeLightbox();
  };

  // Get uploader name from trip members list
  const getUploaderName = (uploadedBy) => {
    if (!uploadedBy) return "Member";
    const id = (uploadedBy._id || uploadedBy)?.toString();
    const member = trip?.members?.find(
      (m) => (m.user?._id || m.user)?.toString() === id
    );
    return member?.user?.name || "Member";
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div
      {...getRootProps()}
      tabIndex={-1}
      className={`outline-none transition-all ${
        isDragActive
          ? "ring-2 ring-primary-400 ring-offset-2 rounded-2xl"
          : ""
      }`}
    >
      <input {...getInputProps()} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="section-title">Trip Photos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {photos.length} photo{photos.length !== 1 ? "s" : ""} · shared
            with all members
          </p>
        </div>
        <button
          onClick={open}
          disabled={uploading}
          className="btn-primary text-sm"
        >
          <Upload size={15} />
          {uploading ? "Uploading…" : "Upload Photos"}
        </button>
      </div>

      {/* Drag-over hint */}
      {isDragActive && (
        <div className="card mb-5 p-6 text-center border-2 border-dashed border-primary-400 dark:border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 animate-fade-in">
          <Camera size={32} className="mx-auto mb-2 text-primary-400" />
          <p className="font-semibold text-primary-600 dark:text-primary-400">
            Drop photos here to upload
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          ⚠ {error}
          <button onClick={() => setError("")} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="mb-5 card p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-[3px] border-primary-500/20 border-t-primary-500 rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Uploading to Cloudinary…
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
              Please wait
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {photos.length === 0 && !uploading ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-surface-850 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="font-bold text-gray-500 dark:text-gray-400 mb-1">
            No photos yet
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-600 mb-5">
            Upload photos from your trip to share with everyone
          </p>
          <button onClick={open} className="btn-primary text-sm mx-auto">
            <Camera size={14} /> Upload First Photo
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-3">
            Or drag & drop photos anywhere on this page
          </p>
        </div>
      ) : (
        /* Masonry grid */
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo._id || index}
              photo={photo}
              index={index}
              uploaderName={getUploaderName(photo.uploadedBy)}
              onOpen={() => openLightbox(index)}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <Lightbox
          photo={photos[lightboxIndex]}
          index={lightboxIndex}
          total={photos.length}
          uploaderName={getUploaderName(photos[lightboxIndex].uploadedBy)}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
          onDownload={handleDownload}
          onBackdropClick={handleBackdropClick}
        />
      )}
    </div>
  );
}

/* ─── Photo Card ─── */
function PhotoCard({ photo, index, uploaderName, onOpen, onDownload }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative group cursor-pointer break-inside-avoid mb-3 rounded-xl overflow-hidden bg-gray-100 dark:bg-surface-850"
      onClick={onOpen}
    >
      {!loaded && <div className="aspect-square skeleton rounded-xl" />}
      <img
        src={photo.url}
        alt={`Trip photo ${index + 1}`}
        className={`w-full object-cover rounded-xl transition-all duration-300 group-hover:scale-[1.02] ${
          loaded ? "opacity-100" : "opacity-0 absolute inset-0"
        }`}
        onLoad={() => setLoaded(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-xl">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <User size={10} className="text-white" />
              </div>
              <span className="text-white text-xs font-medium truncate max-w-[80px]">
                {uploaderName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                <ZoomIn size={13} />
              </div>
              <button
                onClick={(e) => onDownload(photo, e)}
                className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <Download size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Lightbox ─── */
function Lightbox({
  photo, index, total, uploaderName,
  onClose, onPrev, onNext, onDownload, onBackdropClick,
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onBackdropClick}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors z-10"
      >
        <X size={18} />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full">
        {index + 1} / {total}
      </div>

      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <img
        src={photo.url}
        alt={`Trip photo ${index + 1}`}
        className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-colors z-10"
        >
          <ChevronRight size={22} />
        </button>
      )}

      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-white text-sm">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
            {uploaderName?.[0]?.toUpperCase()}
          </div>
          <span className="font-medium">{uploaderName}</span>
          {photo.uploadedAt && (
            <span className="text-white/60 text-xs">
              · {format(new Date(photo.uploadedAt), "MMM d, yyyy")}
            </span>
          )}
        </div>
        <div className="w-px h-4 bg-white/20" />
        <button
          onClick={(e) => onDownload(photo, e)}
          className="flex items-center gap-1.5 text-white text-sm font-medium hover:text-white/80 transition-colors"
        >
          <Download size={15} /> Download
        </button>
      </div>
    </div>
  );
}