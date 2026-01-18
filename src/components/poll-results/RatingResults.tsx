interface RatingResultsProps {
  averageRating?: number;
  ratingCount?: number;
  config?: {
    maxRating?: number;
    style?: 'stars' | 'numbers' | 'emoji';
  };
}

export default function RatingResults({
  averageRating,
  ratingCount = 0,
  config = {}
}: RatingResultsProps) {
  const { maxRating = 5, style = 'stars' } = config;

  if (ratingCount === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No ratings yet. Be the first to rate!
      </div>
    );
  }

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(averageRating || 0);
    const hasHalfStar = (averageRating || 0) - fullStars >= 0.5;

    for (let i = 1; i <= maxRating; i++) {
      if (i <= fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400 text-4xl">★</span>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <span key={i} className="text-4xl relative">
            <span className="text-gray-300">★</span>
            <span className="absolute left-0 top-0 text-yellow-400 overflow-hidden" style={{ width: '50%' }}>★</span>
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-gray-300 text-4xl">★</span>
        );
      }
    }
    return stars;
  };

  const renderNumbers = () => {
    const numbers = [];
    for (let i = 1; i <= maxRating; i++) {
      const isActive = i <= Math.round(averageRating || 0);
      numbers.push(
        <span
          key={i}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
            isActive ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {i}
        </span>
      );
    }
    return numbers;
  };

  const renderEmoji = () => {
    const emojis = ['😢', '😕', '😐', '🙂', '😄'];
    const index = Math.min(Math.round(averageRating || 0) - 1, 4);
    return <span className="text-6xl">{emojis[Math.max(0, index)]}</span>;
  };

  return (
    <div className="bg-white rounded-lg p-6 text-center">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Average Rating</h3>

      <div className="flex justify-center items-center gap-1 mb-4">
        {style === 'stars' && renderStars()}
        {style === 'numbers' && renderNumbers()}
        {style === 'emoji' && renderEmoji()}
      </div>

      <div className="text-3xl font-bold text-purple-600 mb-2">
        {(averageRating || 0).toFixed(1)} / {maxRating}
      </div>

      <div className="text-sm text-gray-500">
        Based on {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
      </div>

      {/* Rating distribution bar */}
      <div className="mt-6 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-purple-400 to-purple-600 h-full transition-all duration-500"
          style={{ width: `${((averageRating || 0) / maxRating) * 100}%` }}
        />
      </div>
    </div>
  );
}
