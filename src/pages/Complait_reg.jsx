// src/pages/ComplaintForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";
import { API_URL } from "../api";
import "react-toastify/dist/ReactToastify.css";

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_COUNT = 5;
const DRAFT_KEY = "fmc_complaint_draft_v1";

const initialForm = {
  title: "",
  address: "",
  complaintType: "sanitation",
  description: "",
  dateOfProblem: "",
  additionalInfo: "",
  name: "",
  phone: "",
};

const TEMPLATES = [
  {
    key: "garbage",
    label: "Garbage Overflow",
    type: "garbage",
    title: "Garbage overflow at street corner",
    desc:
      "Garbage bin overflowing for the last 2 days causing smell and litter. Please arrange immediate pickup and cleaning.",
  },
  {
    key: "street_light",
    label: "Street Light Not Working",
    type: "street_lights",
    title: "Street light not working on my lane",
    desc:
      "The street light near house no. X is not working since last night, causing safety concerns. Please repair at the earliest.",
  },
  {
    key: "road",
    label: "Pothole / Road Damage",
    type: "local_road_problem",
    title: "Large pothole creating traffic hazard",
    desc:
      "A large pothole has formed on the main road causing vehicle damage and traffic slowdown. Needs urgent repair.",
  },
  {
    key: "water",
    label: "Water Leakage",
    type: "other",
    title: "Underground water leakage on street",
    desc:
      "Continuous water leakage near the junction is wasting potable water and damaging the road. Please inspect.",
  },
];

/* NEW: helper to create a notification for the current user */
async function createNotification({ token, code, id, title, type, createdAt }) {
  const payload = {
    type: "complaint_created",
    title: "Complaint submitted",
    message: `Your complaint ${code ? `#${code} ` : ""}has been registered${title ? `: ${title}` : ""}.`,
    code,
    complaintId: id,
    link: code ? `/t/${encodeURIComponent(code)}` : null,
    meta: { complaintType: type, createdAt },
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Preferred endpoint
  let res = await fetch(`${API_URL}/api/me/notifications`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  // Fallback if the first isn’t supported
  if (!res.ok) {
    res = await fetch(`${API_URL}/api/notifications`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  }

  return res.ok;
}

const ComplaintForm = () => {
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // object URLs for preview
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null); // { code, link }
  const [latLng, setLatLng] = useState({ lat: null, lng: null });

  const dropRef = useRef(null);
  const { getToken, isSignedIn } = useAuth();

  // Restore draft
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (saved && typeof saved === "object") {
        if (saved.form) setForm({ ...initialForm, ...saved.form });
        if (saved.latLng) setLatLng(saved.latLng);
      }
    } catch {}
  }, []);

  // Autosave draft
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ form, latLng })
        );
      } catch {}
    }, 500);
    return () => clearTimeout(id);
  }, [form, latLng]);

  // Preview object URLs
  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm(initialForm);
    setLatLng({ lat: null, lng: null });
    setImages([]);
    setTicketInfo(null);
    toast.info("Draft cleared", { theme: "dark" });
  };

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const applyTemplate = (t) => {
    setForm((prev) => ({
      ...prev,
      complaintType: t.type,
      title: t.title,
      description: t.desc,
    }));
    toast.info(`Template applied: ${t.label}`, { theme: "dark" });
  };

  const addFiles = (files) => {
    const selected = Array.from(files || []);
    const valid = [];
    let rejected = 0;
    for (const file of selected) {
      if (!file.type.startsWith("image/")) continue; // ignore non-images
      if (file.size > MAX_IMAGE_SIZE_BYTES) rejected++;
      else valid.push(file);
    }
    if (rejected > 0)
      toast.error(`${rejected} file(s) too large. Max ${MAX_IMAGE_SIZE_MB} MB each.`, { theme: "dark" });

    const merged = [...images, ...valid];
    if (merged.length > MAX_IMAGE_COUNT) {
      toast.warn(`Only ${MAX_IMAGE_COUNT} images allowed`, { theme: "dark" });
    }
    setImages(merged.slice(0, MAX_IMAGE_COUNT));
  };

  const handleFileChange = (e) => addFiles(e.target.files);

  // Drag & drop
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDrop = (e) => {
      prevent(e);
      if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
    };

    ["dragenter", "dragover", "dragleave", "drop"].forEach((ev) =>
      el.addEventListener(ev, prevent)
    );
    el.addEventListener("drop", onDrop);

    return () => {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((ev) =>
        el.removeEventListener(ev, prevent)
      );
      el.removeEventListener("drop", onDrop);
    };
  }, [images]);

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported by your browser.", { theme: "dark" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatLng({ lat, lng });

        // Reverse geocode to fill address (best-effort)
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
          const res = await fetch(url, { headers: { "Accept-Language": "en-IN" } });
          if (res.ok) {
            const data = await res.json();
            const addr = data?.display_name || "";
            if (addr && !form.address) {
              setForm((p) => ({ ...p, address: addr }));
            }
          }
        } catch {}
        toast.success("Location captured", { theme: "dark" });
      },
      (err) => {
        toast.error(err?.message || "Unable to get location", { theme: "dark" });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Basic validation: no future date, phone pattern if provided
  const today = new Date().toISOString().split("T")[0];
  const isFutureDate = form.dateOfProblem && form.dateOfProblem > today;
  const phoneValid =
    !form.phone || /^[+]?[\d\s\-()]{7,15}$/.test(form.phone.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast.error("Please sign in before submitting a complaint.", { theme: "dark" });
      return;
    }
    if (isFutureDate) {
      toast.error("Date of Problem cannot be in the future.", { theme: "dark" });
      return;
    }
    if (!phoneValid) {
      toast.error("Please enter a valid contact number.", { theme: "dark" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Unable to get authentication token.");

      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (latLng.lat != null && latLng.lng != null) {
        data.append("lat", String(latLng.lat));
        data.append("lng", String(latLng.lng));
      }
      images.forEach((file) => data.append("images", file));

      const res = await fetch(`${API_URL}/api/complaints`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to submit complaint");
      }
      const payload = await res.json();

      const code =
        payload?.complaint?.ticket ||
        payload?.complaint?.complaintNumber ||
        payload?.complaint?.publicToken ||
        payload?.ticket ||
        payload?.complaintNumber ||
        payload?.publicToken;

      const link = code ? `${window.location.origin}/t/${encodeURIComponent(code)}` : null;

      toast.success("Complaint submitted successfully!", { theme: "dark" });
      if (code) setTicketInfo({ code, link });

      // NEW: create a notification for the current user (non-blocking, no change to existing flow)
      const complaintObj = payload?.complaint || payload || {};
      createNotification({
        token,
        code,
        id: complaintObj._id,
        title: complaintObj.title,
        type: complaintObj.complaintType,
        createdAt: complaintObj.createdAt,
      }).catch(() => {});

      // Reset
      setForm(initialForm);
      setLatLng({ lat: null, lng: null });
      setImages([]);
      localStorage.removeItem(DRAFT_KEY);
      e.target.reset();
    } catch (err) {
      toast.error(err.message || "Something went wrong", { theme: "dark" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all";
  const labelClass = "block text-sm font-semibold text-slate-300 mb-2";

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header + quick actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
              Register a Complaint
            </h1>
            <p className="text-slate-400 mt-1">
              Fill the details to report an issue in your area.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={useMyLocation}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-600 text-sky-400 bg-slate-900/50 hover:bg-slate-800"
            >
              Use My Location
            </button>
            <button
              type="button"
              onClick={clearDraft}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-600 text-slate-300 bg-slate-900/50 hover:bg-slate-800"
            >
              Clear Draft
            </button>
          </div>
        </div>

        {/* Ticket info */}
        {ticketInfo && (
          <div className="mb-6 bg-slate-900 border border-sky-800 rounded-xl p-4 text-slate-200">
            <p className="text-sm">Your complaint number:</p>
            <p className="text-xl font-bold text-sky-400">{ticketInfo.code}</p>
            {ticketInfo.link && (
              <div className="mt-2 flex items-center gap-3">
                <a
                  href={ticketInfo.link}
                  className="text-sky-400 underline hover:text-sky-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open public tracking link
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(ticketInfo.link);
                    toast.success("Link copied to clipboard", { theme: "dark" });
                  }}
                  className="px-3 py-1 rounded bg-sky-600 text-white text-xs hover:bg-sky-500"
                >
                  Copy link
                </button>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-10">
          {/* Templates */}
          <div className="mb-6">
            <p className="text-slate-300 text-sm font-semibold mb-2">Common Templates</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="px-3 py-1.5 rounded-full text-xs bg-slate-800 border border-slate-700 text-slate-200 hover:border-sky-500 hover:text-sky-300"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass} htmlFor="name">Your Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">Contact Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 9876543210"
                />
                {!phoneValid && (
                  <p className="text-xs text-red-400 mt-1">Please enter a valid number</p>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className={labelClass} htmlFor="title">Complaint Title</label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                className={inputClass}
                placeholder="Short title (e.g., Overflowing garbage near park)"
                required
              />
            </div>

            {/* Address */}
            <div>
              <label className={labelClass} htmlFor="address">Address / Location</label>
              <textarea
                id="address"
                name="address"
                rows="2"
                value={form.address}
                onChange={handleChange}
                className={inputClass}
                placeholder="Exact address or landmark of the problem"
                required
              />
              {latLng.lat != null && latLng.lng != null && (
                <p className="mt-1 text-xs text-slate-500">
                  Lat: {latLng.lat.toFixed(5)} • Lng: {latLng.lng.toFixed(5)}
                </p>
              )}
            </div>

            {/* Type + Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass} htmlFor="complaintType">
                  Type of Complaint
                </label>
                <div className="relative">
                  <select
                    id="complaintType"
                    name="complaintType"
                    value={form.complaintType}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none`}
                    required
                  >
                    <option value="sanitation">Sanitation</option>
                    <option value="local_road_problem">Local Road Problem</option>
                    <option value="garbage">Garbage</option>
                    <option value="parking">Illegal Parking</option>
                    <option value="illegal_construction">Illegal Construction</option>
                    <option value="street_lights">Street Lights</option>
                    <option value="health_and_hygiene">Health and Hygiene</option>
                    <option value="other">Others</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="dateOfProblem">
                  Date of Problem
                </label>
                <input
                  id="dateOfProblem"
                  name="dateOfProblem"
                  type="date"
                  value={form.dateOfProblem}
                  onChange={handleChange}
                  className={`${inputClass} [color-scheme:dark]`}
                  max={today}
                  required
                />
                {isFutureDate && (
                  <p className="text-xs text-red-400 mt-1">Date cannot be in the future</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClass} htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={form.description}
                onChange={handleChange}
                className={inputClass}
                placeholder="Describe the issue in detail..."
                required
              />
            </div>

            {/* Additional Info */}
            <div>
              <label className={labelClass} htmlFor="additionalInfo">
                Other Relevant Information <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                rows="2"
                value={form.additionalInfo}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g., nearby landmarks, ward number, recurring issue, etc."
              />
            </div>

            {/* Uploads */}
            <div
              ref={dropRef}
              className="p-5 border border-dashed border-slate-700 rounded-xl bg-slate-950/50"
            >
              <label className="block text-sm font-medium text-slate-300 mb-3" htmlFor="images">
                Upload Evidence Photos
                <span className="block text-xs text-slate-500 font-normal mt-1">
                  (Drag & drop, up to {MAX_IMAGE_COUNT} images, max {MAX_IMAGE_SIZE_MB} MB each)
                </span>
              </label>
              <input
                id="images"
                name="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-400
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-slate-800 file:text-sky-400
                  hover:file:bg-slate-700 hover:file:text-sky-300
                  transition-all cursor-pointer"
              />
              {images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={previews[idx]}
                        alt="preview"
                        className="w-20 h-20 object-cover rounded border border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-sky-900/30 hover:from-sky-500 hover:to-cyan-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isSubmitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer theme="dark" />
    </div>
  );
};

export default ComplaintForm;