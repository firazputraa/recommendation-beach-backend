import React, { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#F2F9FF] text-sky-800 px-6 py-4 shadow-md ">
      <div className="container mx-auto flex items-center justify-around">

        {/* Logo */}
        <div className="text-2xl font-bold">
            <h1 className="text-3xl font-bold text-sky-800"><span className='italic text-sky-500'>biru</span>Laut</h1>
        </div>

        {/* Hamburger (mobile only) */}
        <div className="lg:hidden">
          <button onClick={toggleMenu} className="focus:outline-none">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Links (desktop) */}
        {/* <ul className="hidden lg:flex space-x-6">
          <li><a href="" className="relative inline-block text-blue-600 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[1.5px] after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full"></a></li>
          <li><a href="" className="relative inline-block text-blue-600 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[1.5px] after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full">Detail</a></li>
          <li><a href="" className="relative inline-block text-blue-600 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[1.5px] after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full">Destination</a></li>
        </ul> */}

        {/* Auth Buttons (desktop) */}
        <div className="hidden lg:flex space-x-4">
          <button className="text-sky-200 bg-sky-800 px-4 py-1 rounded hover:bg-sky-200 hover:text-sky-800 transition">SignIn</button>
          <button className="border border-white px-4 py-1 rounded hover:bg-white hover:text-blue-600 transition">SignUp</button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden mt-4 space-y-2 text-center">
          {/* <a href="/" className="block hover:text-sky-500">Home</a>
          <a href="/about" className="block hover:text-sky-500">Detail</a>
          <a href="/destination" className="block hover:text-sky-500">Destination</a> */}
          <button 
            className="block w-full text-sky-200 bg-sky-800 hover:text-sky-800 hover:bg-sky-200 p-1 rounded-xl"
          >
            SignIn
          </button>
          <button 
            className="block w-full border border-white px-4 py-2 rounded hover:bg-sky-300 hover:text-blue-600 transition"
          >
            SignUp
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
