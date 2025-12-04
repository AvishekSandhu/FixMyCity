// src/pages/ComplaintForm.jsx
import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";
import { API_URL } from "../api"; // ✅ Using shared API config for deployment
import "react-toastify/dist/ReactToastify.css";

const MAX_IMAGE_SIZE_MB = 5; // max size per image
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_COUNT = 5; // max number of images

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

const ComplaintForm = () => {
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getToken, isSignedIn } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    let rejectedCount = 0;

    for (const file of selectedFiles) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        rejectedCount++;
      } else {
        validFiles.push(file);
      }
    }

    if (rejectedCount > 0) {
      toast.error(
        `${rejectedCount} file(s) were too large. Max size is ${MAX_IMAGE_SIZE_MB} MB per image.`,
        { position: "top-right", theme: "dark" }
      );
    }

    if (validFiles.length > MAX_IMAGE_COUNT) {
      toast.error(`You can upload up to ${MAX_IMAGE_COUNT} images.`, {
        position: "top-right",
        theme: "dark",
      });
      setImages(validFiles.slice(0, MAX_IMAGE_COUNT));
    } else {
      setImages(validFiles);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast.error("Please sign in before submitting a complaint.", {
        position: "top-right",
        theme: "dark",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get Clerk session token for backend
      const token = await getToken();

      if (!token) {
        throw new Error("Unable to get authentication token.");
      }

      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value);
      });
      images.forEach((file) => data.append("images", file));

      // ✅ Use API_URL here instead of localhost
      const res = await fetch(`${API_URL}/api/complaints`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to submit complaint");
      }

      toast.success("Complaint submitted successfully!", {
        position: "top-right",
        theme: "dark",
      });

      setForm(initialForm);
      setImages([]);
      e.target.reset(); // clear file input
    } catch (err) {
      toast.error(err.message || "Something went wrong", {
        position: "top-right",
        theme: "dark",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common input class style
  const inputClass = "w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all";
  const labelClass = "block text-sm font-semibold text-slate-300 mb-2";

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 mb-3">
            Register a Complaint
          </h1>
          <p className="text-slate-400">
            Fill in the details below to report an issue in your area.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className={labelClass} htmlFor="name">
                  Your Name
                </label>
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

              {/* Phone */}
              <div>
                <label className={labelClass} htmlFor="phone">
                  Contact Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>

            {/* Section 2: Complaint Details */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className={labelClass} htmlFor="title">
                  Complaint Title
                </label>
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
                <label className={labelClass} htmlFor="address">
                  Address / Location
                </label>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type of Complaint */}
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
                    {/* Custom chevron for dark mode */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Date of Problem */}
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
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelClass} htmlFor="description">
                  Description
                </label>
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
            </div>

            {/* Section 3: Uploads */}
            <div className="p-5 border border-dashed border-slate-700 rounded-xl bg-slate-950/50">
              <label className="block text-sm font-medium text-slate-300 mb-3" htmlFor="images">
                Upload Evidence Photos
                <span className="block text-xs text-slate-500 font-normal mt-1">
                  (Max {MAX_IMAGE_COUNT} images, up to {MAX_IMAGE_SIZE_MB} MB each)
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
                <div className="mt-3 flex gap-2 flex-wrap">
                  {images.map((img, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-900/30 text-sky-300 border border-sky-800">
                      {img.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-sky-900/30 hover:from-sky-500 hover:to-cyan-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit Complaint"
                )}
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
