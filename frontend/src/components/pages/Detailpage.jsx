import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import cleaned_data from '../../data/cleaned_data.json';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Navigation, Pagination } from 'swiper/modules';
    

const DetailPage = () => {
    const swiperRef = useRef(null);
    const recommendationSwiperRef = useRef(null);
    const { placeId } = useParams();
    const place = cleaned_data.find(p => p.place_id === placeId);
    const recommendedPlaces = cleaned_data.filter(p => p.place_id !== placeId).slice(0, 10); 
    const [newFeedback, setNewFeedback] = useState({
        rating: 0,
        comment: '',
        });
    const handleStarClick = (rating) => {
        setNewFeedback({
            ...newFeedback,
            rating,
        });
    };
    
    useEffect(() => {
        window.scrollTo(0, 0); 
    }, [placeId]);
    
    if (!place) {
        return <div>Tempat wisata tidak ditemukan.</div>;
    }

    const [feedbacks, setFeedbacks] = useState([
        {
            name: 'Dimas',
            rating: 4,
            comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        },
        {
            name: 'Dimas',
            rating: 4,
            comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        },
        {
            name: 'Dimas',
            rating: 4,
            comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        },
        {
            name: 'Dimas',
            rating: 4,
            comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        },
        {
            name: 'Dimas',
            rating: 4,
            comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        },
    ]);


    return (
    <div className="p-6 bg-gradient-to-b from-[#dcefff] to-white max-screen mx-auto">
    <>
        {/* Tentang Pantainya */}
        <section className="max-w-6xl mx-auto p-6 bg-white rounded-md shadow-md mt-8">
            <img
                src={place.featured_image}
                alt={place.name}
                className="w-full h-96 object-cover rounded-xl mb-4"
            />
                <h1 className="text-4xl font-bold text-gray-800">{place.name}</h1>
                <p className="text-lg text-gray-600 mt-2">{place.description}</p>
                <p className="text-sm text-gray-500 mt-2">Rating: {place.rating}</p>
            <div className="max-w-6xl mx-auto p-6 bg-white rounded-md shadow-md mt-8">
            <h2 className="text-3xl font-bold mb-4 text-center">Lokasi</h2>
            <div className="mb-4">
            <iframe 
                width="100%" 
                height="450" 
                style={{ border: 0 }} 
                loading="lazy" 
                allowFullScreen
                src={`https://www.google.com/maps/embed/v1/place?q=${encodeURIComponent(place.address)}&key=YOUR_GOOGLE_MAPS_API_KEY`}>
            </iframe>
            </div>
            </div>
                <p className="text-sm text-gray-500">Alamat: {place.address}</p>
        </section>

        <section className="max-w-6xl mx-auto py-10 px-20 bg-white mt-10 px-100 rounded-md shadow-md">
            <h1 className="text-4xl font-bold mt-10 text-center">Our Customer Feedback</h1>
            <p className="font-normal mt-3 *:mb-8 text-center text-gray-600">Don’t take our word for it. Trust our customers</p>

        <Swiper
            loop={true}
            modules={[Navigation, Pagination]}
            slidesPerView={3} 
            spaceBetween={20} 
            navigation
            pagination={{ clickable: true }}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            className="mySwiper cursor-pointer"
        >
        {feedbacks.map((feedback, index) => (
        <SwiperSlide key={index}>
            <div className="bg-white border p-6 rounded-md shadow-md mb-6">
            <div className="font-semibold text-lg text-gray-800">{feedback.name}</div>
            <div className="flex items-center text-yellow-600 mt-2">
                {Array.from({ length: 5 }, (_, i) => (
                <span
                   key={i}
                   className={`text-2xl ${feedback.rating >= i + 1 ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                    ★
                </span>
                ))}
            </div>
              <p className="mt-2 text-gray-600">{feedback.comment}</p>
            </div>
        </SwiperSlide>
        ))}
        </Swiper>
        <div className="flex justify-center mt-8 space-x-4">
            <button 
            onClick={() => swiperRef.current?.slidePrev()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                &lt; Previous
            </button>
            <button 
            onClick={() => swiperRef.current?.slideNext()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                Next &gt;
            </button>
        </div>
        </section>

        {/* Feedback Form */}
        <section className="max-w-6xl mx-auto px-20 py-5 bg-white rounded-md shadow-md mt-8 mb-8">
            <h1 className="text-4xl font-bold mt-10 text-center">Have you ever visited there?</h1>
            <p className="font-normal mt-5 mb-10 text-center text-gray-600">Give your assessment here</p>
            <form
                onSubmit={(e) => {
                e.preventDefault();
                if (newFeedback.name && newFeedback.comment && newFeedback.rating) {
                    setFeedbacks([
                        ...feedbacks,
                       { ...newFeedback, rating: Number(newFeedback.rating) },
                        ]);
                        setNewFeedback({ name: '', rating: 0, comment: '' });
                        }
                    }}
                >
            <div className="flex items-center space-x-2">
            {Array.from({ length: 5 }, (_, index) => (
                <span
                    key={index}
                    className={`text-4xl cursor-pointer ${
                    newFeedback.rating > index ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                    onClick={() => handleStarClick(index + 1)}
                    >
                    ★
                </span>
            ))}
            </div>
            <div className="my-4">
                <textarea
                    id="comment"
                    placeholder="Write your comment here..."
                    value={newFeedback.comment}
                    onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows="4"
                    required
                />
            </div>
     
            <div className="flex justify-end">
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md mb-5 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                Submit Feedback
                </button>
            </div>
        </form>
        </section>
        <section className="max-w-6xl mx-auto py-10 px-20  mt-10">
            <h1 className="text-4xl font-bold mt-10 text-center">Recommendation</h1>
            <p className="font-normal mt-5 mb-10 text-center text-gray-600">You might also like this place</p>

            {/* Swiper untuk Rekomendasi */}
        <Swiper
                loop={true}
                modules={[Navigation, Pagination]}
                slidesPerView={3} 
                spaceBetween={20}
                navigation={true} 
                pagination={{ clickable: true }}
                onSwiper={(swiper) => (recommendationSwiperRef.current = swiper)} 
                className="mySwiper cursor-pointer"
                >
            {recommendedPlaces.map((recPlace) => ( 
        <SwiperSlide key={recPlace.place_id}>
            <div
                className="bg-white rounded-2xl  shadow-md p-4 flex flex-col transition-transform hover:scale-[1.02] hover:shadow-lg h-full min-h-[600px]"
            >
            <img
                src={recPlace.featured_image}
                alt={recPlace.name}
                onError={(e) => (e.target.src = '/fallback-image.jpg')}
                className="w-full h-48 object-cover mb-3 rounded-xl"
            />
            <h2 className="text-lg font-semibold text-gray-800 mb-1">{recPlace.name}</h2>
                <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                    {recPlace.description && recPlace.description !== '-'
                    ? recPlace.description
                    : 'Belum ada deskripsi tersedia untuk tempat ini.'}
                </p>

                <p className="text-sm text-yellow-600 mb-2">
                    ⭐ {recPlace.rating} ({recPlace.reviews.toLocaleString()} ulasan)
                </p>

            <div className="flex flex-wrap gap-2 mb-3">
                {recPlace.review_keywords && recPlace.review_keywords.split(', ').map((keyword, index) => (
                    <span
                        key={index}
                        className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
                    >
                        #{keyword}
                    </span>
                ))}
            </div>

            <p className="text-sm text-gray-500 mb-2">
                <strong>Alamat:</strong> {recPlace.address}
            </p>

            <div className="mt-auto flex justify-between items-center">
            <a
                href={recPlace.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
            >
                Lihat di Google Maps
            </a>
            <Link
                to={`/detail/${recPlace.place_id}`}
                className="bg-blue-500 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-600 transition"
            >
                Detail
            </Link>
            </div>
        </div>
        </SwiperSlide> ))}
        </Swiper>
            {/* Tombol Kustom untuk Swiper Rekomendasi */}
                <div className="flex justify-center mt-8 space-x-4">
                <button
                    onClick={() => recommendationSwiperRef.current?.slidePrev()} // Gunakan recommendationSwiperRef
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    &lt; Previous
                </button>
                <button
                    onClick={() => recommendationSwiperRef.current?.slideNext()} // Gunakan recommendationSwiperRef
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    Next &gt;
                </button>
                </div>
            </section>
            </>
        </div>
    );
};
export default DetailPage;
