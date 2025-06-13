import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import defaultAvatar from '../../assets/profile1.jpg';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef(null);
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const handleSignOutClick = () => {
    setShowLogoutConfirm(true);
    setIsOpen(false);
  };
  const proceedLogout = () => {
    logout();
    navigate('/');
    setShowLogoutConfirm(false);
  };
  const cancelLogout = () => setShowLogoutConfirm(false);
  const profileImage = user?.profilePic || defaultAvatar;

  // Fungsi untuk mengecek apakah path aktif
  const isActiveRoute = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    if (path !== '/' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  // Fungsi untuk mendapatkan class link berdasarkan status aktif
  const getLinkClass = (path, baseClass = "transition-colors duration-300") => {
    if (isActiveRoute(path)) {
      return `${baseClass} text-sky-600 border-b-2 border-sky-600 pb-1 font-semibold`;
    }
    return `${baseClass} hover:text-sky-500 border-b-2 border-transparent pb-1`;
  };

  // Fungsi untuk class mobile link
  const getMobileLinkClass = (path) => {
    if (isActiveRoute(path)) {
      return "w-full text-center font-semibold text-sky-600 bg-sky-50 py-2 rounded-lg transition-colors duration-300";
    }
    return "w-full text-center hover:text-sky-500 transition-colors duration-300 py-2";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#dcefff] shadow-md">
      <nav role="navigation" className="text-sky-800 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo Kiri */}
          <Link to="/" className="text-2xl font-bold">
            <h1 className="text-3xl font-bold text-sky-800">
              <span className="italic text-sky-500">biru</span>Laut
            </h1>
          </Link>

          {/* Navigasi Tengah */}
          <div className="hidden lg:flex space-x-6 mx-auto">
            <Link 
              to="/" 
              className={getLinkClass('/')}
            >
              Home
            </Link>
            <Link 
              to="/search" 
              className={getLinkClass('/search')}
            >
              Search
            </Link>
            <Link 
              to="/about" 
              className={getLinkClass('/about')}
            >
              About
            </Link>
          </div>

          {/* Auth Button Kanan */}
          <div className="hidden lg:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  className={`border border-sky-800 px-4 py-1 rounded transition-colors duration-300 ${
                    isActiveRoute('/profile') 
                      ? 'bg-sky-800 text-white' 
                      : 'text-sky-800 hover:bg-sky-800 hover:text-white'
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOutClick}
                  className="border border-sky-800 text-sky-800 px-4 py-1 rounded hover:bg-sky-800 hover:text-white transition-colors duration-300"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="text-sky-200 bg-sky-800 px-4 py-1 rounded hover:bg-sky-200 hover:text-sky-800 transition-colors duration-300">SignIn</Link>
                <Link to="/signup" className="border border-sky-800 text-sky-800 px-4 py-1 rounded hover:bg-sky-800 hover:text-sky-200 transition-colors duration-300">SignUp</Link>
              </>
            )}
          </div>

          {/* Hamburger Mobile */}
          <div className="lg:hidden">
            <button onClick={toggleMenu} className="focus:outline-none" aria-label='Toggle Menu'>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {isOpen && (
          <div
            ref={menuRef}
            className="lg:hidden mt-4 flex flex-col items-center gap-2 transition-all duration-300 ease-in-out"
          >
            <Link 
              to="/" 
              className={getMobileLinkClass('/')}
            >
              Home
            </Link>
            <Link 
              to="/search" 
              className={getMobileLinkClass('/search')}
            >
              Search
            </Link>
            <Link 
              to="/about" 
              className={getMobileLinkClass('/about')}
            >
              About
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  className={`w-full text-center border border-sky-800 px-4 py-2 rounded-xl transition-colors duration-300 ${
                    isActiveRoute('/profile') 
                      ? 'bg-sky-800 text-white' 
                      : 'text-sky-800 hover:bg-sky-800 hover:text-white'
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOutClick}
                  className="w-full text-center border border-sky-800 text-sky-800 px-4 py-2 hover:bg-sky-800 hover:text-white rounded-xl transition-colors duration-300"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="w-full text-center text-sky-200 bg-sky-800 hover:text-sky-800 hover:bg-sky-200 px-4 py-2 rounded-xl transition-colors duration-300">SignIn</Link>
                <Link to="/signup" className="w-full text-center border border-sky-800 px-4 py-2 hover:bg-sky-800 hover:text-white rounded-xl transition-colors duration-300">SignUp</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Modal Konfirmasi Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirm Logout</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                onClick={proceedLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-300"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;