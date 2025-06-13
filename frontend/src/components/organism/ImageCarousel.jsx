import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import beach from "../../assets/beach.png"; // Import beach image

export const ImageCarousel = ({ images, placeName, swiperRef }) => {
  const handleImageError = (e) => {
    // Jika gambar gagal dimuat, ganti dengan beach.png
    if (e.target.src !== beach) {
      e.target.src = beach;
    }
  };

  return (
    <div className="w-full h-[450px] md:h-[550px] rounded-xl mb-4 overflow-hidden relative z-10">
      <Swiper
        ref={swiperRef}
        modules={[Navigation, Pagination, Autoplay]}
        slidesPerView={1}
        spaceBetween={0}
        navigation
        pagination={{ clickable: true }}
        loop={images.length > 1}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        style={{
          '--swiper-navigation-color': '#fff',
          '--swiper-pagination-color': '#fff',
          '--swiper-pagination-bullet-inactive-color': 'rgba(255,255,255,0.5)',
          '--swiper-navigation-size': '30px',
        }}
        className="w-full h-full"
      >
        {images.map((url, index) => (
          <SwiperSlide key={index}>
            <img
              src={url || beach} // Gunakan beach sebagai fallback jika url kosong
              alt={`${placeName} - Image ${index + 1}`}
              className="w-full h-full object-cover rounded-xl"
              onError={handleImageError}
              onLoad={(e) => {
                // Optional: Log ketika gambar berhasil dimuat
                console.log(`Image loaded successfully: ${e.target.src}`);
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};