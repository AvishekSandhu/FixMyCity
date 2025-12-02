import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";

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
        { position: "top-right" }
      );
    }

    if (validFiles.length > MAX_IMAGE_COUNT) {
      toast.error(`You can upload up to ${MAX_IMAGE_COUNT} images.`, {
        position: "top-right",
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

      const res = await fetch("http://localhost:3001/api/complaints", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // important
        },
        body: data,
        // credentials: "include", // optional now; token is enough
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to submit complaint");
      }

      toast.success("Complaint submitted successfully!", {
        position: "top-right",
      });

      setForm(initialForm);
      setImages([]);
      e.target.reset(); // clear file input
    } catch (err) {
      toast.error(err.message || "Something went wrong", {
        position: "top-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">
        Complaint Registration Form
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name of Complainant */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Your Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-black-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your full name"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="phone">
            Contact Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-black-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 9876543210"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">
            Name of Complaint
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            className="w-full border border-black-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Short title (e.g., Overflowing garbage near park)"
            required
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="address">
            Address / Location
          </label>
          <textarea
            id="address"
            name="address"
            rows="2"
            value={form.address}
            onChange={handleChange}
            className="w-full border border-black-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Exact address or landmark of the problem"
            required
          />
        </div>

        {/* Type of Complaint */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="complaintType"
          >
            Type of Complaint
          </label>
          <select
            id="complaintType"
            name="complaintType"
            value={form.complaintType}
            onChange={handleChange}
            className="w-full border border-black-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="sanitation">Sanitation</option>
            <option value="local_road_problem">Local Road Problem</option>
            <option value="garbage">Garbage</option>
            <option value="parking">Illegal Parking</option>
            <option value="illegal_construction">Illegal construction</option>
            <option value="street_lights">Street Lights</option>
            <option value="health_and_hygiene">Health and hygiene</option>
            <option value="other">Others</option>
          </select>
        </div>

        {/* Date of Problem */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="dateOfProblem"
          >
            Date of Problem
          </label>
          <input
            id="dateOfProblem"
            name="dateOfProblem"
            type="date"
            value={form.dateOfProblem}
            onChange={handleChange}
            className="w-full border border-black-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={form.description}
            onChange={handleChange}
            className="w-full border border-black-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the issue in detail"
            required
          />
        </div>

        {/* Additional Info */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="additionalInfo"
          >
            Any Other Relevant Information (optional)
          </label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            rows="3"
            value={form.additionalInfo}
            onChange={handleChange}
            className="w-full border border-black-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., nearby landmarks, ward number, recurring issue, etc."
          />
        </div>

        {/* Images Upload */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="images">
            Upload Images (optional, up to {MAX_IMAGE_COUNT} images, max{" "}
            {MAX_IMAGE_SIZE_MB} MB each)
          </label>
          <input
            id="images"
            name="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-black-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {images.length > 0 && (
            <p className="mt-1 text-xs text-black-500">
              {images.length} file(s) selected
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit Complaint"}
          </button>
        </div>
      </form>

      <ToastContainer />
    </div>
  );
};

export default ComplaintForm;