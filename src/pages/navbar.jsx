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

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const role = user?.publicMetadata?.role || "citizen"; // default role
  const roleLabel =
    role === "admin" ? "Admin" : role === "officer" ? "Officer" : "Citizen";

  const closeMenu = () => setOpen(false);

  return (
    <>
      <nav className="w-full flex items-center justify-between px-6 py-4 shadow-md">
        {/* Logo */}
        <Link to="/" onClick={closeMenu}>
          <img className="w-32 rounded-xl" src="logo_final.png" alt="logo" />
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex items-center gap-8 font-semibold text-lg">
          <li>
            <Link to="/" className="hover:text-blue-500 cursor-pointer">
              Home
            </Link>
          </li>
          <li className="hover:text-blue-500 cursor-pointer">Services</li>
          <li className="hover:text-blue-500 cursor-pointer">Contact us</li>

          {/* Admin link only if role === "admin" */}
          {role === "admin" && (
            <li>
              <Link
                to="/admin"
                className="hover:text-blue-500 cursor-pointer"
              >
                Admin
              </Link>
            </li>
          )}

          {/* Officer dashboard link when role === "officer" */}
          {role === "officer" && (
            <li>
              <Link
                to="/officer"
                className="hover:text-blue-500 cursor-pointer"
              >
                Officer
              </Link>
            </li>
          )}

          {/* When logged OUT: Login */}
          <SignedOut>
            <li>
              <SignInButton mode="modal">
                <button className="hover:text-blue-500 cursor-pointer">
                  Login
                </button>
              </SignInButton>
            </li>
          </SignedOut>

          {/* When logged IN: role label + user avatar */}
          <SignedIn>
            <li className="text-sm text-gray-600">Role: {roleLabel}</li>
            <li>
              <UserButton afterSignOutUrl="/" />
            </li>
          </SignedIn>
        </ul>

        {/* Mobile Hamburger */}
        <button className="lg:hidden text-3xl" onClick={() => setOpen(!open)}>
          ☰
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <ul className="lg:hidden flex flex-col items-center gap-4 py-4 font-semibold text-lg bg-white shadow-md">
          <li>
            <Link
              to="/"
              className="hover:text-blue-500 cursor-pointer"
              onClick={closeMenu}
            >
              Home
            </Link>
          </li>
          <li
            className="hover:text-blue-500 cursor-pointer"
            onClick={closeMenu}
          >
            Services
          </li>
          <li
            className="hover:text-blue-500 cursor-pointer"
            onClick={closeMenu}
          >
            Contact us
          </li>

          {/* Admin link for mobile */}
          {role === "admin" && (
            <li>
              <Link
                to="/admin"
                className="hover:text-blue-500 cursor-pointer"
                onClick={closeMenu}
              >
                Admin
              </Link>
            </li>
          )}

          {/* Officer link for mobile */}
          {role === "officer" && (
            <li>
              <Link
                to="/officer"
                className="hover:text-blue-500 cursor-pointer"
                onClick={closeMenu}
              >
                Officer
              </Link>
            </li>
          )}

          <SignedOut>
            <li>
              <SignInButton mode="modal">
                <button
                  className="hover:text-blue-500 cursor-pointer"
                  onClick={closeMenu}
                >
                  Login
                </button>
              </SignInButton>
            </li>
            <li>
              <Link
                to="/sign-up"
                className="hover:text-blue-500 cursor-pointer"
                onClick={closeMenu}
              >
                Sign up
              </Link>
            </li>
          </SignedOut>

          <SignedIn>
            <li className="text-sm text-gray-600">Role: {roleLabel}</li>
            <li>
              <UserButton afterSignOutUrl="/" />
            </li>
          </SignedIn>
        </ul>
      )}
    </>
  );
};

export default Navbar;