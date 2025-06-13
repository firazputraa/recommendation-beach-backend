// DetailTemplate.jsx

import { useNavigate } from 'react-router-dom';
import { StarRating } from '../atoms/StarRating';
import { Button } from '../atoms/Button';
import { toast } from 'react-hot-toast'; // Menggunakan react-hot-toast
import { ImageCarousel } from '../organism/ImageCarousel';
import { PlaceMap } from '../organism/PlaceMap';
import { ReviewsSection } from '../organism/ReviewSection';
import { ReviewForm } from "../layouts/ReviewForm";
import { RecommendationSlider } from '../organism/RecomendationSlider';

export const DetailTemplate = ({
  place,
  finalMainImages,
  coordinates,
  recommendedPlaces,
  isLoggedIn,
  user,
  newFeedback,
  setNewFeedback,
  handleStarClick,
  handleSubmitReview,
  feedbacks,
  swiperRef,
  openDropdownId,
  setOpenDropdownId,
  handleEditClick,
  handleDeleteClick,
  handleDeleteConfirm, // Tambahkan ini
  handleUpdateReview, // --- Tambahkan prop ini ---
  editModalOpen,
  setEditModalOpen,
  deleteModalOpen,
  setDeleteModalOpen,
  selectedReview,
  setSelectedReview,
  setFeedbacks, // Tetap ada, tapi logic update pindah ke handleUpdateReview
}) => {
  const navigate = useNavigate();

  return (
    <div className="p-6 shadow-md max-w-4xl mx-auto bg-gradient-to-b from-[#dcefff] to-white">
      <Button
        onClick={() => navigate(-1)}
        className="mb-4 bg-transparent text-sky-800 text-xl font-semibold hover:bg-sky-950 hover:text-sky-300 border border-sky-800 w-full"
      >
        Back
      </Button>

      <ImageCarousel images={finalMainImages} placeName={place.place_name} swiperRef={swiperRef} />

      <section className="max-w-6xl mx-auto p-6 bg-white rounded-md shadow-md mt-4">
        <h1 className="text-4xl font-bold text-gray-800">{place.place_name}</h1>
        <p className="text-lg text-gray-600 mt-2">{place.description}</p>
        <div className="flex items-center mt-2">
          <span className="text-yellow-500 text-xl">⭐ {place.rating}</span>
          <span className="text-gray-500 ml-2">({place.reviews} reviews)</span>
        </div>
        <div className="mt-8">
          <h2 className="text-3xl font-bold mb-4 text-center">Location</h2>
          <PlaceMap coordinates={coordinates} place={place} />
        </div>
      </section>

      <ReviewsSection
        feedbacks={feedbacks}
        isLoggedIn={isLoggedIn}
        user={user}
        openDropdownId={openDropdownId}
        setOpenDropdownId={setOpenDropdownId}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        swiperRef={swiperRef}
      />

      <section className="max-w-6xl mx-auto px-6 py-8 bg-white rounded-md shadow-md mt-8 mb-8">
        <h1 className="text-4xl font-bold text-center">Please Leave Your Review</h1>
        <p className="font-normal mt-5 mb-10 text-center text-gray-600">Share your experience visiting this place</p>
        <ReviewForm
          isLoggedIn={isLoggedIn}
          newFeedback={newFeedback}
          setNewFeedback={setNewFeedback}
          onSubmit={handleSubmitReview}
          onStarClick={handleStarClick}
        />
      </section>

      <RecommendationSlider recommendedPlaces={recommendedPlaces} />

      {/* Edit Modal */}
      {editModalOpen && selectedReview && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="bg-white p-6 rounded shadow-md w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Edit Review</h2>

            <textarea
              className="w-full border p-2 rounded mb-4"
              value={selectedReview.comment}
              onChange={(e) =>
                setSelectedReview({ ...selectedReview, comment: e.target.value })
              }
            />

            <StarRating
              rating={selectedReview.rating}
              onChange={(newRating) => setSelectedReview({ ...selectedReview, rating: newRating })}
            />

            <div className="flex justify-end gap-3 mt-4">
              <Button onClick={() => setEditModalOpen(false)} className="text-gray-600">
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateReview(selectedReview.id, selectedReview.comment, selectedReview.rating)} // --- Panggil fungsi dari prop ---
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedReview && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="bg-white p-6 rounded shadow-md w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Delete Review</h2>
            <p>
              Are you sure you want to delete this review by <b>{selectedReview.name}</b>?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={() => setDeleteModalOpen(false)} className="text-gray-600">
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm} // Panggil fungsi dari prop
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};