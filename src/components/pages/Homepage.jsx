import React from 'react';
import Navbar from '../layouts/Navbar';
import hero from '../../assets/hero.png';

const Homepage = () => {
    return (
        <>
        <section className='relative h-screen'>
            <Navbar/>
            <img 
                src={hero} 
                alt="heroImage" 
                className="absolute inset-0 w-full h-full object-cover brightness-75"
            />
            <div className="relative z-10 flex items-center justify-center h-full text-white text-center px-4">
                <div className='max-w-2xl'>
                    <h1 className="text-5xl font-bold mb-4">Find your dream beach</h1>
                    <h2 className="text-xl mb-6">A Hidden Paradise for Your Perfect Vacation</h2>
                    <p className="">Enjoy the stunning natural beauty, soft white sand, and the calming sound of the waves. Dream Beach is the ideal destination to relax, adventure, and create unforgettable memories with family or loved ones.</p>
                    <div className="flex justify-center mt-10">
  <div className="relative w-full max-w-md">
    <input
      type="text"
      placeholder="Cari destinasi impianmu..."
      className="w-full px-5 py-3 pr-12 text-black rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
    />
    <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-600 text-white px-4 py-2 rounded-full hover:bg-sky-700 transition">
      Cari
    </button>
  </div>
</div>
                </div>
            </div>
        </section>
        </>
    );
};

export default Homepage;