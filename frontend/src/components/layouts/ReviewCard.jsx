// ReviewCard.jsx

import { StarRating } from '../atoms/StarRating';
import { Button } from '../atoms/Button';

export const ReviewCard = ({ feedback, isOwner, onEdit, onDelete, isOpen, onToggleDropdown }) => {
  // Fungsi helper untuk mendapatkan warna sentimen
  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      case 'neutral':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fungsi helper untuk mendapatkan ikon sentimen
  const getSentimentEmoji = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😠';
      case 'neutral':
        return '😐';
      default:
        return '';
    }
  };

  const sentimentClass = getSentimentColor(feedback.sentiment);
  const sentimentEmoji = getSentimentEmoji(feedback.sentiment);

  return (
    <div className="bg-white border p-6 rounded-md shadow-lg h-[220px] flex flex-col justify-between relative">
      {isOwner && (
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onToggleDropdown} className="text-gray-500 hover:text-gray-800 text-xl font-bold">&#x22EF;</button>
          {isOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-10">
              <Button onClick={onEdit} className="block w-full text-left text-sm text-gray-700 hover:bg-gray-100">Edit</Button>
              <Button onClick={onDelete} className="block w-full text-left text-sm text-red-600 hover:bg-gray-100">Delete</Button>
            </div>
          )}
        </div>
      )}
      <div>
        <div className="font-semibold text-lg text-gray-800">{feedback.name}</div>
        <div className="mt-2 mb-2">
          <StarRating rating={feedback.rating} />
        </div>
        <p className="text-gray-600 line-clamp-4">{feedback.comment}</p>
      </div>

      {/* --- Bagian Baru untuk Menampilkan Sentimen --- */}
      {feedback.sentiment && (
        <div className="mt-4 flex items-center justify-end">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sentimentClass}`}>
            {sentimentEmoji} {feedback.sentiment}
          </span>
        </div>
      )}
    </div>
  );
};