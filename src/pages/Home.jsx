// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import {
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaArrowRight,
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
const API_BASE = "https://fixmycity-qi5p.onrender.com";

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
        comsole.log("Fetched stats:", data);
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
    <div className="bg-slate-950 min-h-screen">
      {/* HERO SECTION: LEFT TEXT + RIGHT SLIDESHOW */}
      <section className="flex flex-col md:flex-row w-full md:h-[705px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        {/* LEFT SIDE TEXT & BUTTONS */}
        <div className="flex flex-col justify-center w-full md:w-[40%] px-6 md:px-10 lg:px-16 text-center md:text-left pb-10 md:pb-0 pt-10 md:pt-0">
          <span className="text-sky-400 font-bold tracking-widest text-xs uppercase mb-3">
            Citizen Services Portal
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent mb-4 md:mb-6">
            Welcome to FixMyCity
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mb-6 max-w-xl mx-auto md:mx-0 leading-relaxed">
            Empowering citizens to build a better tomorrow. Report infrastructure
            issues, track real-time progress, and collaborate with authorities
            to improve our city's environment.
          </p>

          <div className="mt-2">
            <h3 className="text-lg sm:text-xl mb-4 font-semibold text-white">
              Get Started as:
            </h3>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-sky-600 text-white px-6 py-3 rounded-xl text-base font-semibold shadow-lg shadow-sky-900/50 hover:bg-sky-500 hover:-translate-y-0.5 transition-all duration-300">
                    CITIZEN
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-slate-800 border border-slate-700 text-slate-200 px-6 py-3 rounded-xl text-base font-semibold hover:bg-slate-700 hover:text-white hover:-translate-y-0.5 transition-all duration-300">
                    DEPARTMENTAL
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-transparent border border-slate-600 text-slate-400 px-6 py-3 rounded-xl text-base font-semibold hover:border-sky-500 hover:text-sky-400 transition-all duration-300">
                    ADMIN
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>

          {/* Explore Map button (visible to everyone) */}
          <div className="mt-4 flex justify-center md:justify-start">
            <Link to="/explore">
              <button className="bg-sky-600 text-white px-6 py-3 rounded-xl text-base font-semibold hover:bg-sky-500 transition-all duration-300">
                Explore Map
              </button>
            </Link>
          </div>

          <SignedIn>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/creg">
                <button className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-8 py-3 rounded-xl text-lg font-bold shadow-lg shadow-emerald-900/50 hover:from-emerald-500 hover:to-teal-400 hover:shadow-emerald-500/20 transition-all duration-300">
                  Register Complaint
                </button>
              </Link>
              <Link to="/Track">
                <button className="flex items-center justify-center gap-2 bg-slate-800 text-slate-200 px-8 py-3 rounded-xl text-lg font-semibold hover:bg-slate-700 transition-all duration-300">
                  Track Complaint
                  <FaArrowRight size={14} />
                </button>
              </Link>
            </div>
          </SignedIn>
        </div>

        {/* RIGHT SIDE: CUSTOM SLIDESHOW */}
        <div className="relative w-full md:flex-1 h-64 sm:h-80 md:h-full mt-6 md:mt-0">
          <div className="relative w-full h-full overflow-hidden md:rounded-bl-[4rem] shadow-2xl shadow-black/80 border-b-4 border-l-4 border-slate-800/50">
            <img
              src={slides[currentIndex].src}
              alt={slides[currentIndex].alt}
              className="w-full h-full object-cover transition-all duration-1000 ease-in-out transform scale-105"
            />
            {/* Gradient Overlay on Image */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
          </div>

          {/* Indicators */}
          <div className="absolute z-30 flex -translate-x-1/2 bottom-4 md:bottom-8 left-1/2 space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-sky-500 w-6 md:w-8"
                    : "bg-white/40 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="w-full py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We bridge the gap between citizens and the administration with a transparent, efficient, and easy-to-use platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden hover:border-sky-600 hover:shadow-sky-900/20 transition-all duration-300 flex flex-col">
              <div className="h-56 overflow-hidden relative">
                <img
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1740&auto=format&fit=crop"
                  alt="Citizen reporting issue on phone"
                />
                <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors"></div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h5 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-sky-400 transition-colors">
                  1. Report Instantly
                </h5>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">
                  Spot a pothole, broken streetlight, or garbage pile? Snap a photo, add details, and report it directly to the concerned department in seconds.
                </p>
                <a href="#" className="inline-flex items-center text-sky-500 font-semibold text-sm hover:text-sky-300 transition-colors">
                  Learn more <FaArrowRight className="ml-2" size={12} />
                </a>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden hover:border-sky-600 hover:shadow-sky-900/20 transition-all duration-300 flex flex-col">
              <div className="h-56 overflow-hidden relative">
                <img
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1740&auto=format&fit=crop"
                  alt="Tracking dashboard analytics"
                />
                <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors"></div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h5 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-sky-400 transition-colors">
                  2. Track Progress
                </h5>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">
                  Don't stay in the dark. Watch your complaint status move from "Pending" to "Resolved" with real-time updates and official remarks.
                </p>
                <a href="#" className="inline-flex items-center text-sky-500 font-semibold text-sm hover:text-sky-300 transition-colors">
                  Learn more <FaArrowRight className="ml-2" size={12} />
                </a>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden hover:border-sky-600 hover:shadow-sky-900/20 transition-all duration-300 flex flex-col">
              <div className="h-56 overflow-hidden relative">
                <img
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?q=80&w=1740&auto=format&fit=crop"
                  alt="Clean city infrastructure"
                />
                <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors"></div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h5 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-sky-400 transition-colors">
                  3. Improve Our City
                </h5>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">
                  Your data helps authorities prioritize repairs and plan long-term improvements, making the city cleaner, safer, and smarter for everyone.
                </p>
                <a href="#" className="inline-flex items-center text-sky-500 font-semibold text-sm hover:text-sky-300 transition-colors">
                  Learn more <FaArrowRight className="ml-2" size={12} />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* STATISTICS Section (LIVE) */}
      <section className="w-full bg-slate-900 border-y border-slate-800 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-slate-100 mb-12">
            Live City Impact
          </h1>

          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-10">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center hover:border-amber-500/50 transition-colors">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold">
                  Pending
                </p>
                <p className="mt-3 text-4xl md:text-5xl font-extrabold text-white">
                  {statsLoading ? "--" : statsError ? "--" : stats.pending}
                </p>
                <p className="mt-2 text-sm text-slate-400 text-center">
                  Issues waiting for action
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center hover:border-emerald-500/50 transition-colors">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-bold">
                  Resolved
                </p>
                <p className="mt-3 text-4xl md:text-5xl font-extrabold text-white">
                  {statsLoading ? "--" : statsError ? "--" : stats.closed}
                </p>
                <p className="mt-2 text-sm text-slate-400 text-center">
                  Issues successfully fixed
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center hover:border-sky-500/50 transition-colors">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-400 font-bold">
                  Total
                </p>
                <p className="mt-3 text-4xl md:text-5xl font-extrabold text-white">
                  {statsLoading ? "--" : statsError ? "--" : stats.total}
                </p>
                <p className="mt-2 text-sm text-slate-400 text-center">
                  Community reports filed
                </p>
              </div>
            </div>

            {/* Latest complaints list */}
            <div>
              <div id="recent" className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <h2 className="text-xl md:text-2xl font-bold text-slate-200">
                  Recent Activity
                </h2>
                {statsError && (
                  <span className="text-xs text-red-400">{statsError}</span>
                )}
              </div>

              {statsLoading ? (
                <p className="text-sm text-slate-400 animate-pulse">
                  Fetching latest data...
                </p>
              ) : recentComplaints.length === 0 ? (
                <p className="text-sm text-slate-400 italic">
                  No complaints have been submitted recently.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentComplaints.map((c) => (
                    <div
                      key={c._id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                          {new Date(c.createdAt).toLocaleDateString()} • {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <span
                          className={`text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider ${
                            c.status === "closed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : c.status === "in_progress"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {c.status ? c.status.replace("_", " ") : "pending"}
                        </span>
                      </div>

                      <h4 className="text-base font-semibold text-slate-100 line-clamp-1 group-hover:text-sky-400 transition-colors">
                        {c.title}
                      </h4>

                      <p className="text-sm text-slate-400 line-clamp-2 mt-1 mb-3">
                        {c.description}
                      </p>

                      <div className="flex flex-wrap justify-between items-center text-xs pt-3 border-t border-slate-800">
                        <span className="text-slate-500">
                          Type: <span className="text-slate-300">{c.complaintType}</span>
                        </span>
                        <span className="text-slate-500">
                          Loc: <span className="text-slate-300">{c.address?.slice(0, 15)}{c.address?.length > 15 ? '...' : ''}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-slate-950 text-slate-400 pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            {/* Column 1 */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">
                Contact Support
              </h2>
              <p className="text-base mb-4">
                Need help or have suggestions? Reach out to our support team.
              </p>
              <p className="text-lg font-medium text-white">
                <span className="text-sky-500 mr-2">✉</span>
                fixmycity@gmail.com
              </p>

              <div className="mt-6 space-y-2 text-sm">
                <a href="#" className="block hover:text-sky-400 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="block hover:text-sky-400 transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-bold text-white mb-6">
                Trusted Partners
              </h2>

              <div className="flex flex-col gap-6 items-center opacity-80 hover:opacity-100 transition-opacity">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_of_India_logo.svg/1920px-Government_of_India_logo.svg.png"
                  alt="Government of India"
                  className="h-12 w-auto filter brightness-0 invert"
                />
                <div className="flex gap-4 items-center">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Digital_India_logo.svg/1200px-Digital_India_logo.svg.png"
                    alt="Digital India"
                    className="h-8"
                  />
                  <img src="/imgop.png" alt="Local Partner" className="h-8" />
                </div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col items-center md:items-start">
              <h2 className="text-xl font-bold text-white mb-6">
                Connect With Us
              </h2>

              <div className="flex gap-4">
                <a href="#" className="bg-slate-900 p-3 rounded-full hover:bg-pink-600 hover:text-white transition-all duration-300">
                  <FaInstagram size={20} />
                </a>
                <a href="#" className="bg-slate-900 p-3 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300">
                  <FaFacebookF size={20} />
                </a>
                <a href="#" className="bg-slate-900 p-3 rounded-full hover:bg-sky-500 hover:text-white transition-all duration-300">
                  <FaTwitter size={20} />
                </a>
                <a href="#" className="bg-slate-900 p-3 rounded-full hover:bg-blue-700 hover:text-white transition-all duration-300">
                  <FaLinkedinIn size={20} />
                </a>
              </div>
              <p className="mt-6 text-sm text-slate-600">
                Follow our social channels for daily updates on city improvements and announcements.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-900 mt-12 pt-8 text-center">
            <p className="text-sm text-slate-600">
              © 2025 FixMyCity • Building better cities together.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;