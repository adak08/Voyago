import { useState, useRef, useEffect } from "react";
import { Camera, X } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";

export default function ProfileCard({ open, setOpen }) {
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [preview, setPreview] = useState(user?.avatar || "");
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setPreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const res = await authService.updateProfile({ name, avatar });
    updateUser(res.user);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="absolute right-0 top-full mt-3 z-50">
      <div
        ref={ref}
        className="relative w-80 bg-gradient-to-b from-[#0f172a] to-[#020617] border border-slate-800 rounded-2xl shadow-2xl p-6"
      >
        {/* Close Button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-slate-400 hover:text-white transition"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <h3 className="text-white font-semibold text-lg mb-5">Edit Profile</h3>

        {/* Avatar */}
        <div className="flex justify-center mb-5">
          <label className="relative group cursor-pointer">
            <img
              src={
                preview ||
                `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`
              }
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-700"
            />

            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Camera size={18} className="text-white" />
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />
          </label>
        </div>

        {/* Username */}
        <input
          className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          placeholder="Username"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium hover:opacity-90 transition"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
