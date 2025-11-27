import React, { useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="w-full flex items-center justify-between px-6 py-4 shadow-md">
        
        {/* Logo */}
        <img
          className="w-32 rounded-xl"
          src="logo_final.png"
          alt="logo"
        />

        {/* Desktop Menu */}
        <ul className="hidden lg:flex items-center gap-8 font-semibold text-lg">
          <li className="hover:text-blue-500 cursor-pointer">Home</li>
          <li className="hover:text-blue-500 cursor-pointer">Services</li>
          <li className="hover:text-blue-500 cursor-pointer">Contact us</li>
          <li className="hover:text-blue-500 cursor-pointer">Login</li>
        </ul>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden text-3xl"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <ul className="lg:hidden flex flex-col items-center gap-4 py-4 font-semibold text-lg bg-white shadow-md">
          <li className="hover:text-blue-500 cursor-pointer">Home</li>
          <li className="hover:text-blue-500 cursor-pointer">Services</li>
          <li className="hover:text-blue-500 cursor-pointer">Contact us</li>
          <li className="hover:text-blue-500 cursor-pointer">Login</li>
        </ul>
      )}
    </>
  );
};

export default Navbar;
