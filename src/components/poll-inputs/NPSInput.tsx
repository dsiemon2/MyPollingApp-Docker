interface NPSInputProps {
  selectedScore: number | null;
  onSelect: (score: number) => void;
  disabled?: boolean;
  votedScore?: number | null;
  config?: {
    lowLabel?: string;
    highLabel?: string;
  };
}

export default function NPSInput({
  selectedScore,
  onSelect,
  disabled = false,
  votedScore,
  config = {}
}: NPSInputProps) {
  const {
    lowLabel = 'Not at all likely',
    highLabel = 'Extremely likely'
  } = config;

  const scores = Array.from({ length: 11 }, (_, i) => i);

  const getScoreColor = (score: number): string => {
    if (score <= 6) return 'red'; // Detractors
    if (score <= 8) return 'yellow'; // Passives
    return 'green'; // Promoters
  };

  const colorClasses: Record<string, { selected: string; hover: string }> = {
    red: {
      selected: 'border-red-500 bg-red-500 text-white',
      hover: 'hover:border-red-300'
    },
    yellow: {
      selected: 'border-yellow-500 bg-yellow-500 text-white',
      hover: 'hover:border-yellow-300'
    },
    green: {
      selected: 'border-green-500 bg-green-500 text-white',
      hover: 'hover:border-green-300'
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-1">
        {scores.map((score) => {
          const isSelected = selectedScore === score;
          const color = getScoreColor(score);
          const classes = colorClasses[color];

          return (
            <button
              key={score}
              onClick={() => !disabled && onSelect(score)}
              disabled={disabled}
              className={`w-10 h-10 rounded-lg border-2 font-medium transition-all ${
                isSelected
                  ? classes.selected
                  : disabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : `border-gray-200 ${classes.hover}`
              }`}
            >
              {score}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-sm text-gray-500 px-2">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>

      <div className="flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500"></span>
          Detractors (0-6)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500"></span>
          Passives (7-8)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500"></span>
          Promoters (9-10)
        </span>
      </div>

      {votedScore !== null && votedScore !== undefined && (
        <div className="text-center text-sm text-purple-600">
          Your score: {votedScore}
        </div>
      )}
    </div>
  );
}
