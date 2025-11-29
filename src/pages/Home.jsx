import React from "react";
import {
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";

const Home = () => {
  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen px-6 text-center">
        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-bold text-blue-600 mb-10 lg:mt-[-10rem]">
          Welcome to FixMyCity
        </h1>

        {/* Buttons Section */}
        <div>
          <h3 className="text-lg sm:text-xl mb-5 font-semibold">
            Report an Issue
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300">
              CITIZEN
            </button>

            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300">
              DEPARTMENTAL
            </button>

            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-300">
              ADMIN
            </button>
          </div>
        </div>
      </div>

     {/* STATISTICS Section */}
<div className="mx-auto mt-[-20rem] w-full py-16">
  <h1 className="text-3xl font-semibold text-center mb-10">
    STATISTICS
  </h1>

  <div className="max-w-5xl mx-auto bg-[#B8D0EC] border border-blue-300 rounded-2xl p-8 shadow">
    
    {/* Labels */}
    <div className="flex justify-between text-gray-800 font-semibold mb-6">
      <p className="text-xl">Pending Complaints</p>
      <p className="text-xl">Resolved Complaints</p>
      <p className="text-xl">Total Complaints</p>
    </div>

    {/* Numbers */}
    <div className="flex justify-between text-gray-700 text-lg font-medium mb-10">
      <p>01</p>
      <p>02</p>
      <p>03</p>
    </div>

    {/* Card 1 */}
    <div className="bg-[#192338] p-4 rounded-xl shadow flex justify-between">
      <div>
        <span className="bg-yellow-400 text-black -ml-30 text-xs px-2 py-1 rounded-lg font-medium">
          In Progress
        </span>

        <span className="ml-2 text-sm text-gray-400">Sanitation</span>

        <h3 className="text-white font-semibold text-md mt-2">
          Overflowing garbage near central market
        </h3>
        <p className="text-gray-400  -ml-50 text-sm">Ward 5</p>
      </div>

      <p className="text-sm text-gray-400">2 hrs</p>
    </div>

  </div>
</div>

      {/* footer section */}

      <footer className="w-full bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
            {/* Contact Section */}
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

              {/* Legal Links */}
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

            {/* Partners Section */}
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
                alt="Digital india"
                className="h-18"
              />
              <img src="imgop.png" alt="Digital india" className="h-10" />
            </div>

            {/* Social Icons */}
            <div className="flex flex-col items-center md:items-start">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Follow Us
              </h2>

              <div className="flex gap-5">
                {/* Instagram */}
                <a href="#" className="hover:text-pink-400 transition">
                  <FaInstagram size={32} />
                </a>

                {/* Facebook */}
                <a href="#" className="hover:text-blue-500 transition">
                  <FaFacebookF size={32} />
                </a>

                {/* Twitter */}
                <a href="#" className="hover:text-gray-400 transition">
                  <FaTwitter size={32} />
                </a>

                {/* LinkedIn */}
                <a href="#" className="hover:text-blue-300 transition">
                  <FaLinkedinIn size={32} />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
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
