// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import {
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const slides = [
  { src: "/img1.jpg", alt: "Slide 1" },
  { src: "/img2.jpg", alt: "Slide 2" },
  { src: "/img3.jpg", alt: "Slide 3" },
  { src: "/img4.jpg", alt: "Slide 4" },
  { src: "/img5.webp", alt: "Slide 5" },
];

const SLIDE_INTERVAL = 5000; // 5 seconds
const API_BASE = "http://localhost:3001";

const Home = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Live stats state
  const [stats, setStats] = useState({ pending: 0, closed: 0, total: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  // Auto-play slider
  useEffect(() => {
    const id = setInterval(
      () => setCurrentIndex((prev) => (prev + 1) % slides.length),
      SLIDE_INTERVAL
    );
    return () => clearInterval(id);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index) => setCurrentIndex(index);

  // Fetch live statistics + latest complaints
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/summary`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load statistics");
        }
        const data = await res.json();
        setStats(data.counts || { pending: 0, closed: 0, total: 0 });
        setRecentComplaints(data.recentComplaints || []);
      } catch (err) {
        setStatsError(err.message || "Could not load statistics");
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      {/* HERO SECTION: LEFT TEXT + RIGHT SLIDESHOW */}
      <section className="flex flex-col md:flex-row w-full h-[400px] md:h-[705px]">
        {/* LEFT SIDE TEXT & BUTTONS */}
        <div className="flex flex-col justify-center px-6 text-center w-full md:w-[40%]">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-600 mb-6 md:mb-10 mt-6 md:mt-0">
            Welcome to FixMyCity
          </h1>

          <div>
            <h3 className="text-lg sm:text-xl mb-5 font-semibold">
              Report an Issue
            </h3>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300">
                    CITIZEN
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300">
                    DEPARTMENTAL
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300">
                    ADMIN
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
          <SignedIn>
            <div className="flex ml-10 gap-15 mt-4 justify-center md:justify-start">
              <Link to="/creg">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300">
                  Register Complaint
                </button>
              </Link>
              <Link to="/Track">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300">
                  Track Complaint
                </button>
              </Link>
            </div>
          </SignedIn>
        </div>

        {/* RIGHT SIDE: CUSTOM SLIDESHOW (fills area, no black bars) */}
        <div className="relative w-full md:flex-1 h-full">
          <div className="relative w-full h-full overflow-hidden">
            <img
              src={slides[currentIndex].src}
              alt={slides[currentIndex].alt}
              className="w-full h-full object-cover transition-all duration-700 ease-in-out"
            />
          </div>

          {/* Indicators */}
          <div className="absolute z-30 flex -translate-x-1/2 bottom-3 md:bottom-5 left-1/2 space-x-2 md:space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${
                  index === currentIndex ? "bg-white" : "bg-gray-400/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Previous */}
          <button
            type="button"
            className="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-2 md:px-4 cursor-pointer group"
            onClick={goToPrev}
          >
            <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/30">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-white"
                viewBox="0 0 24 24"
              >
                <path
                  d="m15 19-7-7 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </span>
          </button>

          {/* Next */}
          <button
            type="button"
            className="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-2 md:px-4 cursor-pointer group"
            onClick={goToNext}
          >
            <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/30">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-white"
                viewBox="0 0 24 24"
              >
                <path
                  d="m9 5 7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* CARDS */}
      <div className="w-full flex flex-wrap justify-center gap-2 mt-30">
        <div className="bg-[#B8D0EC] block max-w-sm p-6 mx-auto border border-default rounded-xl shadow-xs">
          <a href="#">
            <img
              className="rounded-2xl"
              src="https://www.hiveage.com/assets/posts/1613/vistaprint-business-cards.jpg"
              alt=""
            />
          </a>
          <a href="#">
            <h5 className="mt-6 mb-2 text-2xl font-semibold tracking-tight text-heading">
              Streamlining your design process today.
            </h5>
          </a>
          <p className="mb-6 text-body">
            In today’s fast-paced digital landscape, fostering seamless
            collaboration among Developers and IT Operations.
          </p>
          <a
            href="#"
            className="hover:bg-blue-400 inline-flex items-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none"
          >
            Read more
            <svg
              className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 12H5m14 0-4 4m4-4-4-4"
              />
            </svg>
          </a>
        </div>

        <div className="bg-[#B8D0EC] block max-w-[24rem] p-6 mx-auto border border-default rounded-xl shadow-xs">
          <a href="#">
            <img
              className="rounded-2xl"
              src="https://www.hiveage.com/assets/posts/1613/vistaprint-business-cards.jpg"
              alt=""
            />
          </a>
          <a href="#">
            <h5 className="mt-6 mb-2 text-2xl font-semibold tracking-tight text-heading">
              Streamlining your design process today.
            </h5>
          </a>
          <p className="mb-6 text-body">
            In today’s fast-paced digital landscape, fostering seamless
            collaboration among Developers and IT Operations.
          </p>
          <a
            href="#"
            className="hover:bg-blue-400 inline-flex items-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none"
          >
            Read more
            <svg
              className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 12H5m14 0-4 4m4-4-4-4"
              />
            </svg>
          </a>
        </div>

        <div className="bg-[#B8D0EC] block max-w-sm p-6 mx-auto border border-default rounded-xl shadow-xs">
          <a href="#">
            <img
              className="rounded-2xl"
              src="https://www.hiveage.com/assets/posts/1613/vistaprint-business-cards.jpg"
              alt=""
            />
          </a>
          <a href="#">
            <h5 className="mt-6 mb-2 text-2xl font-semibold tracking-tight text-heading">
              Streamlining your design process today.
            </h5>
          </a>
          <p className="mb-6 text-body">
            In today’s fast-paced digital landscape, fostering seamless
            collaboration among Developers and IT Operations.
          </p>
          <a
            href="#"
            className="hover:bg-blue-400 inline-flex items-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none"
          >
            Read more
            <svg
              className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 12H5m14 0-4 4m4-4-4-4"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* STATISTICS Section (LIVE) */}
      <div className="mx-auto mt-[-2rem] w-full py-16">
        <h1 className="text-3xl font-semibold text-center mb-10">
          STATISTICS
        </h1>

        <div className="max-w-6xl mx-auto bg-slate-900 text-white border border-slate-700 rounded-2xl p-8 shadow-xl space-y-8">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-5 py-4 flex flex-col items-center">
              <p className="text-sm uppercase tracking-[0.15em] text-amber-300">
                Pending Complaints
              </p>
              <p className="mt-2 text-3xl md:text-4xl font-extrabold text-amber-400">
                {statsLoading
                  ? "--"
                  : statsError
                  ? "--"
                  : stats.pending}
              </p>
              <p className="mt-1 text-xs text-slate-300 text-center">
                Waiting for action
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-5 py-4 flex flex-col items-center">
              <p className="text-sm uppercase tracking-[0.15em] text-emerald-300">
                Resolved Complaints
              </p>
              <p className="mt-2 text-3xl md:text-4xl font-extrabold text-emerald-400">
                {statsLoading
                  ? "--"
                  : statsError
                  ? "--"
                  : stats.closed}
              </p>
              <p className="mt-1 text-xs text-slate-300 text-center">
                Successfully closed
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-5 py-4 flex flex-col items-center">
              <p className="text-sm uppercase tracking-[0.15em] text-sky-300">
                Total Complaints
              </p>
              <p className="mt-2 text-3xl md:text-4xl font-extrabold text-sky-400">
                {statsLoading
                  ? "--"
                  : statsError
                  ? "--"
                  : stats.total}
              </p>
              <p className="mt-1 text-xs text-slate-300 text-center">
                Reported through FixMyCity
              </p>
            </div>
          </div>

          {/* Latest complaints list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl md:text-2xl font-semibold">
                Latest Complaints
              </h2>
              {statsError && (
                <span className="text-xs text-red-300">{statsError}</span>
              )}
            </div>

            {statsLoading ? (
              <p className="text-sm text-slate-300">
                Loading latest complaints...
              </p>
            ) : recentComplaints.length === 0 ? (
              <p className="text-sm text-slate-300">
                No complaints have been submitted yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentComplaints.map((c) => (
                  <div
                    key={c._id}
                    className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs uppercase tracking-widest text-slate-400">
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          c.status === "closed"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                            : c.status === "in_progress"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                            : "bg-red-500/20 text-red-300 border border-red-400/40"
                        }`}
                      >
                        {c.status ? c.status.replace("_", " ") : "pending"}
                      </span>
                    </div>

                    <h4 className="text-sm md:text-base font-semibold text-white line-clamp-2">
                      {c.title}
                    </h4>

                    <p className="text-xs text-slate-300 line-clamp-2">
                      {c.description}
                    </p>

                    <div className="flex justify-between items-center mt-1 text-xs text-slate-400">
                      <span>
                        Type:{" "}
                        <span className="text-sky-300">
                          {c.complaintType}
                        </span>
                      </span>
                      <span>
                        Area:{" "}
                        <span className="text-slate-200">
                          {c.address?.slice(0, 20) || "-"}
                          {c.address && c.address.length > 20 ? "..." : ""}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Contact Us
              </h2>
              <p className="text-lg">
                Email:
                <span className="text-blue-400 font-medium ml-1">
                  fixmycity@gmail.com
                </span>
              </p>

              <p className="text-gray-400 mt-4 leading-relaxed">
                A platform where citizens can report issues, track progress, and
                help improve their city's infrastructure & environment.
              </p>

              <div className="mt-6 space-y-2">
                <a href="#" className="text-sm hover:text-blue-400 transition">
                  Terms of Use
                </a>
                <br />
                <a href="#" className="text-sm hover:text-blue-400 transition">
                  Privacy Policy
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Our Partners
              </h2>

              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_of_India_logo.svg/1920px-Government_of_India_logo.svg.png"
                alt="Government of India"
                className="h-15 w-auto filter brightness-0 invert"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Digital_India_logo.svg/1200px-Digital_India_logo.svg.png"
                alt="Digital India"
                className="h-18"
              />
              <img src="/imgop.png" alt="Digital India" className="h-10" />
            </div>

            <div className="flex flex-col items-center md:items-start">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Follow Us
              </h2>

              <div className="flex gap-5">
                <a href="#" className="hover:text-pink-400 transition">
                  <FaInstagram size={32} />
                </a>
                <a href="#" className="hover:text-blue-500 transition">
                  <FaFacebookF size={32} />
                </a>
                <a href="#" className="hover:text-gray-400 transition">
                  <FaTwitter size={32} />
                </a>
                <a href="#" className="hover:text-blue-300 transition">
                  <FaLinkedinIn size={32} />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-10 pt-4 text-center">
            <p className="text-sm text-gray-500">
              © 2025 FixMyCity • All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;