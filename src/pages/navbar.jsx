// src/pages/Navbar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  useUser,
} from "@clerk/clerk-react";
import NotificationBell from "./notificationbell.jsx"

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const role = user?.publicMetadata?.role || "citizen";
  const roleLabel =
    role === "admin" ? "Admin" : role === "officer" ? "Officer" : "Citizen";

  const closeMenu = () => setOpen(false);

  return (
    <>
      {/* Dark/Navy navbar */}
      <nav className="w-full sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo */}
          <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
            <div className="bg-slate-100 rounded-xl px-3 py-1.5 shadow-md shadow-sky-900/20 hover:bg-white transition-colors">
              <img
                src="/logo_final.png"
                alt="FixMyCity logo"
                className="h-9 w-auto"
              />
            </div>
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden lg:flex items-center gap-8 font-medium text-sm text-slate-300">
            <li className="group">
              <Link to="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-0.5 bg-sky-500 rounded"></span>
            </li>

            {/* Track visible to everyone */}
            <li className="group">
              <Link to="/track" className="hover:text-white transition-colors">
                Track
              </Link>
              <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-0.5 bg-sky-500 rounded"></span>
            </li>

            {/* Explore removed from navbar (moved to Home) */}

            <li className="group cursor-pointer hover:text-white transition-colors">
              Services
              <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-0.5 bg-sky-500 rounded"></span>
            </li>
            <li className="group cursor-pointer hover:text-white transition-colors">
              Contact us
              <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-0.5 bg-sky-500 rounded"></span>
            </li>

            {/* Role-based links */}
            {role === "admin" && (
              <li className="group">
                <Link to="/admin" className="hover:text-sky-400 transition-colors">
                  Admin
                </Link>
                <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-0.5 bg-sky-500 rounded"></span>
              </li>
            )}
            {role === "officer" && (
              <li className="group">
                <Link
                  to="/officer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Officer
                </Link>
                <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-0.5 bg-emerald-500 rounded"></span>
              </li>
            )}

            {/* Auth controls */}
            <SignedOut>
              <li>
                <SignInButton mode="modal">
                  <button className="rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wider border border-slate-600 text-sky-400 bg-slate-900/50 hover:bg-sky-600 hover:border-sky-500 hover:text-white transition-all duration-300 shadow-sm">
                    Login
                  </button>
                </SignInButton>
              </li>
            </SignedOut>

            <SignedIn>
              {/* Bell on desktop */}
              <li>
                <NotificationBell />
              </li>

              <li className="flex flex-col items-end leading-none mr-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Role
                </span>
                <span className="text-xs text-sky-400 font-bold capitalize">
                  {roleLabel}
                </span>
              </li>
              <li className="flex items-center">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox:
                        "w-9 h-9 border-2 border-slate-700 hover:border-sky-500 transition-colors",
                    },
                  }}
                />
              </li>
            </SignedIn>
          </ul>

          {/* Right controls on mobile: Bell + Hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <SignedIn>
              {/* Bell near the hamburger on mobile */}
              <NotificationBell />
            </SignedIn>

            {/* Mobile Hamburger */}
            <button
              className="flex flex-col justify-center items-center h-10 w-10 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:border-sky-500 hover:text-sky-400 transition-all"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation menu"
            >
              {open ? (
                <span className="text-2xl leading-none">&times;</span>
              ) : (
                <div className="space-y-1.5">
                  <span className="block w-5 h-0.5 bg-current rounded-full"></span>
                  <span className="block w-5 h-0.5 bg-current rounded-full"></span>
                  <span className="block w-5 h-0.5 bg-current rounded-full"></span>
                </div>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 shadow-2xl">
          <ul className="flex flex-col items-center gap-5 py-6 font-medium text-base text-slate-200">
            <li>
              <Link to="/" onClick={closeMenu} className="hover:text-sky-400">
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/track"
                onClick={closeMenu}
                className="hover:text-sky-400"
              >
                Track
              </Link>
            </li>

            {/* Explore removed from navbar (moved to Home) */}

            <li onClick={closeMenu} className="cursor-pointer hover:text-sky-400">
              Services
            </li>
            <li onClick={closeMenu} className="cursor-pointer hover:text-sky-400">
              Contact us
            </li>

            {role === "admin" && (
              <li>
                <Link
                  to="/admin"
                  onClick={closeMenu}
                  className="hover:text-sky-400"
                >
                  Admin
                </Link>
              </li>
            )}
            {role === "officer" && (
              <li>
                <Link
                  to="/officer"
                  onClick={closeMenu}
                  className="hover:text-emerald-400"
                >
                  Officer
                </Link>
              </li>
            )}

            <SignedOut>
              <li>
                <SignInButton mode="modal">
                  <button
                    onClick={closeMenu}
                    className="rounded-full px-8 py-2.5 text-sm font-bold border border-sky-500 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white transition-all"
                  >
                    LOGIN
                  </button>
                </SignInButton>
              </li>
              <li>
                <Link
                  to="/sign-up"
                  onClick={closeMenu}
                  className="text-sm font-semibold text-slate-400 hover:text-white"
                >
                  Create an account
                </Link>
              </li>
            </SignedOut>

            <SignedIn>
              {/* Removed bell from inside the mobile menu to avoid duplication,
                  it now sits next to the hamburger in the header */}
              <div className="flex items-center gap-3 mt-2 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest">
                    Signed in as
                  </span>
                  <span className="block text-sm text-sky-400 font-bold capitalize">
                    {roleLabel}
                  </span>
                </div>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 border border-slate-600",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </ul>
        </div>
      )}
    </>
  );
};

export default Navbar;