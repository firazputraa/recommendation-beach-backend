import React from 'react';
import about from '../../assets/about.png'
import consisten from '../../assets/consisten.png'
import check1 from '../../assets/checkpoint1.1.jpg'
import check2 from '../../assets/checkpoint1.2.jpg'
import check3 from "../../assets/checkpoint2.1.jpg"
import { Link, useNavigate } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">

      {/* Main Content */}
      <main className="max-w-screen-lg mx-auto px-6 md:px-8 pt-5">
        
        {/* About Us Section */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            
            {/* Left Column - Navigation & Text */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-12 text-sky-800">
                About us.
              </h1>
              {/* Description Text */}
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p>
                  Indonesia has thousands of beautiful beaches scattered throughout the archipelago, but finding beaches that match tourists' personal preferences often becomes a significant challenge. 
                  This project helps tourists explore hidden gems through review analysis and personalized filtering — not just based on general trends.
                </p>
                
                <p>
                  This recommendation system is developed using a machine learning approach with TensorFlow architecture, 
                  processing tourist review data to extract important tags such as beauty, tranquility, and crowding levels. 
                  By considering parameters like ratings, popularity, and other beach metadata, this system provides relevant 
                  and personal recommendations, helping each user find beach destinations that best match their preferences.
                </p>
              </div>
            </div>
            
            {/* Right Column - Team Image */}
            <div className="relative">
              <div className="bg-gray-200 aspect-[4/3] rounded-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <div className="text-center">
                    <img src={about} alt="about" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Quote */}
            <div className="relative">
              <div className="text-6xl font-serif text-sky-300 absolute -top-4 -left-4">"</div>
              <blockquote className="text-2xl md:text-3xl lg:text-4xl font-serif italic leading-tight ml-8">
                Consistency is key. Daily progress in data analysis, even if small, will lead to significant recommendation system improvements over time.
              </blockquote>
              <div className="text-6xl font-serif text-sky-300 absolute -bottom-8 right-0">"</div>
              <cite className="block mt-8 text-sm text-sky-500 not-italic">
                <span className='italic'>biru</span>Laut, Development Team
              </cite>
            </div>
            
            {/* Person Image */}
            <div className="relative">
              <div className="bg-gray-200 aspect-square rounded-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <img src={consisten} alt="consisten" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Team Section */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            
            {/* Team Photos */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-200 aspect-[3/4] rounded-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <img src={check1} alt="" />
                  </div>
                </div>
                <div className="bg-gray-200 aspect-[3/4] rounded-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <img src={check2} alt="" />
                  </div>
                </div>
              </div>
              <div className="aspect-[3/2] rounded-lg overflow-hidden">
                <div className="w-full h-auto bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <img src={check3} alt="" className='object-cover'/>
                </div>
              </div>
            </div>
            
            {/* Team Content */}
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl text-sky-800 uppercase mb-12">
                Our team.
              </h2>
              
              <div className="space-y-6 text-gray-600 leading-relaxed mb-12">
                <p>
                  This project is developed through a systematic design thinking approach, starting from in-depth identification 
                  of tourist needs, mapping appropriate technological solutions, to developing prototypes that can be tested 
                  and iterated. Each stage is designed to ensure the resulting system is truly relevant to user needs.
                </p>
                
                <p>
                  Our team consists of experts in machine learning, data science, and user experience design who are committed 
                  to creating innovative solutions in Indonesia's tourism industry. By combining TensorFlow technology with 
                  deep understanding of tourist behavior, we present a recommendation system that is not only accurate, 
                  but also easy to use.
                </p>
              </div>
              
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <div className="text-3xl md:text-4xl font-black mb-2 text-sky-800">1000+</div>
                  <div className="text-sm text-gray-500 leading-tight">
                    beach destinations<br />
                    analyzed
                  </div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-black mb-2 text-sky-800">50K+</div>
                  <div className="text-sm text-gray-500 leading-tight">
                    tourist reviews<br />
                    processed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;