import React from 'react'

const Navbar = () => {
  return (
    <>
    <div className="main flex items-center justify-between">
    <img className="w-50 rounded-xl mt-[2rem] ml-[7rem]" src="logo_final.png" alt="logo" />
   <ul className=" flex items-center gap-6 mt-[2rem] mr-[3rem] font-semibold text-lg">
  <li className="hover:text-blue-500 cursor-pointer">Home</li>
  <li className="hover:text-blue-500 cursor-pointer">Services</li>
  <li className="hover:text-blue-500 cursor-pointer">Contact us</li>
  <li className="hover:text-blue-500 cursor-pointer">Login</li>
</ul>
</div>
   </>

  )
}

export default Navbar