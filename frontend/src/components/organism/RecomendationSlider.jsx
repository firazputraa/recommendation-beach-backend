// RecomendationSlider.jsx

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Pagination, Navigation } from "swiper/modules";
import { Link } from "react-router-dom";
import { StarRating } from "../atoms/StarRating";
import defaultImage from "../../assets/beach.png"; // Pastikan path ini benar

export const RecommendationSlider = ({ recommendedPlaces }) => {
  // Pastikan recommendedPlaces adalah array dan tidak kosong
  if (!recommendedPlaces || recommendedPlaces.length === 0) {
    return null; // Atau tampilkan pesan "No recommendations"
  }

  const handleImageError = (e) => {
    e.target.src = defaultImage;
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-md mt-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Recommended For You
      </h2>
      <Swiper
        slidesPerView={1}
        spaceBetween={10}
        navigation={true}
        pagination={{
          clickable: true,
        }}
        breakpoints={{
          640: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 30,
          },
        }}
        modules={[Pagination, Navigation]}
        className="mySwiper"
      >
        {recommendedPlaces.map((recPlace) => (
          <SwiperSlide key={recPlace.placeId}>
            <Link to={`/detail/${recPlace.placeId}`} className="block">
              <div className="bg-sky-100 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                <img
                  src={
                    Array.isArray(recPlace.featured_image) && recPlace.featured_image.length > 0
                      ? recPlace.featured_image[0]
                      : defaultImage
                  }
                  alt={recPlace.place_name}
                  className="w-full h-48 object-cover"
                  onError={handleImageError}
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">
                    {recPlace.place_name}
                  </h3>
                  <div className="flex items-center mb-2">
                    <StarRating rating={recPlace.rating} />
                    <span className="text-gray-600 text-sm ml-2">
                      ({recPlace.reviews} reviews)
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3 flex-grow">
                    {recPlace.description}
                  </p>
                  {/* Bagian ini yang direvisi untuk review_keywords */}
                  {Array.isArray(recPlace.review_keywords) && recPlace.review_keywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {recPlace.review_keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="bg-sky-200 text-sky-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};