import { useState } from 'react';

interface RatingInputProps {
  selectedRating: number | null;
  onSelect: (rating: number) => void;
  disabled?: boolean;
  votedRating?: number | null;
  config?: {
    minValue?: number;
    maxValue?: number;
    style?: 'stars' | 'numbers' | 'emoji';
    lowLabel?: string;
    highLabel?: string;
    showLabels?: boolean;
  };
}

export default function RatingInput({
  selectedRating,
  onSelect,
  disabled = false,
  votedRating,
  config = {}
}: RatingInputProps) {
  const {
    minValue = 1,
    maxValue = 5,
    style = 'stars',
    lowLabel = 'Poor',
    highLabel = 'Excellent',
    showLabels = true
  } = config;

  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const ratings = Array.from(
    { length: maxValue - minValue + 1 },
    (_, i) => minValue + i
  );

  const emojiMap: Record<number, string> = {
    1: '😞',
    2: '😕',
    3: '😐',
    4: '🙂',
    5: '😊'
  };

  const renderStar = (rating: number) => {
    const displayRating = hoverRating ?? selectedRating ?? 0;
    const isFilled = rating <= displayRating;

    return (
      <button
        key={rating}
        onClick={() => !disabled && onSelect(rating)}
        onMouseEnter={() => !disabled && setHoverRating(rating)}
        onMouseLeave={() => setHoverRating(null)}
        disabled={disabled}
        className={`text-4xl transition-all ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
        }`}
      >
        {isFilled ? '⭐' : '☆'}
      </button>
    );
  };

  const renderNumber = (rating: number) => {
    const isSelected = selectedRating === rating;

    return (
      <button
        key={rating}
        onClick={() => !disabled && onSelect(rating)}
        disabled={disabled}
        className={`w-12 h-12 rounded-lg border-2 font-bold transition-all ${
          isSelected
            ? 'border-green-700 bg-green-700 text-white'
            : disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-200 hover:border-green-300'
        }`}
      >
        {rating}
      </button>
    );
  };

  const renderEmoji = (rating: number) => {
    const isSelected = selectedRating === rating;
    const emoji = emojiMap[rating] || '😐';

    return (
      <button
        key={rating}
        onClick={() => !disabled && onSelect(rating)}
        disabled={disabled}
        className={`text-4xl p-2 rounded-lg border-2 transition-all ${
          isSelected
            ? 'border-green-700 bg-green-50'
            : disabled
            ? 'border-transparent cursor-not-allowed opacity-50'
            : 'border-transparent hover:border-green-200'
        }`}
      >
        {emoji}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className={`flex justify-center gap-2 ${style === 'stars' ? 'gap-1' : 'gap-3'}`}>
        {ratings.map((rating) => {
          switch (style) {
            case 'stars':
              return renderStar(rating);
            case 'emoji':
              return renderEmoji(rating);
            case 'numbers':
            default:
              return renderNumber(rating);
          }
        })}
      </div>

      {showLabels && (
        <div className="flex justify-between text-sm text-gray-500">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}

      {votedRating && (
        <div className="text-center text-sm text-green-700">
          You rated: {votedRating} / {maxValue}
        </div>
      )}
    </div>
  );
}
