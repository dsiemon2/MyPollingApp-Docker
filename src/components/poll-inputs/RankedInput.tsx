interface Option {
  id: string;
  label: string;
}

interface RankedInputProps {
  options: Option[];
  rankings: Record<number, string>; // { 1: optionId, 2: optionId, ... }
  onRankingChange: (rankings: Record<number, string>) => void;
  disabled?: boolean;
  votedRankings?: Record<number, string>;
  config?: {
    maxRankings?: number;
    pointSystem?: number[];
  };
}

export default function RankedInput({
  options,
  rankings,
  onRankingChange,
  disabled = false,
  votedRankings,
  config = {}
}: RankedInputProps) {
  const { maxRankings = 3, pointSystem = [3, 2, 1] } = config;

  const rankLabels = ['1st', '2nd', '3rd', '4th', '5th'];

  const handleRankChange = (rank: number, optionId: string) => {
    if (disabled) return;

    const newRankings = { ...rankings };

    // Remove this option from any existing rank
    Object.keys(newRankings).forEach(key => {
      if (newRankings[Number(key)] === optionId) {
        delete newRankings[Number(key)];
      }
    });

    // Set the new rank
    if (optionId) {
      newRankings[rank] = optionId;
    } else {
      delete newRankings[rank];
    }

    onRankingChange(newRankings);
  };

  const getAvailableOptions = (currentRank: number) => {
    const usedOptionIds = Object.entries(rankings)
      .filter(([rank]) => Number(rank) !== currentRank)
      .map(([, optionId]) => optionId);

    return options.filter(opt => !usedOptionIds.includes(opt.id));
  };

  const ranks = Array.from({ length: Math.min(maxRankings, options.length) }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Select your top {maxRankings} choices in order of preference
      </p>

      {ranks.map((rank, index) => {
        const points = pointSystem[index] || 1;
        const selectedOptionId = rankings[rank];
        const availableOptions = getAvailableOptions(rank);

        return (
          <div key={rank} className="flex items-center gap-3">
            <div className="w-20 flex items-center gap-2">
              <span className="font-medium text-gray-700">{rankLabels[index] || `${rank}th`}</span>
              <span className="text-xs text-gray-400">({points} pts)</span>
            </div>
            <select
              value={selectedOptionId || ''}
              onChange={(e) => handleRankChange(rank, e.target.value)}
              disabled={disabled}
              className={`flex-1 border rounded-lg px-3 py-2 ${
                disabled ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
            >
              <option value="">Select an option...</option>
              {selectedOptionId && (
                <option value={selectedOptionId}>
                  {options.find(o => o.id === selectedOptionId)?.label}
                </option>
              )}
              {availableOptions
                .filter(opt => opt.id !== selectedOptionId)
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
            </select>
          </div>
        );
      })}

      {votedRankings && Object.keys(votedRankings).length > 0 && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-700 font-medium mb-2">Your rankings:</p>
          {Object.entries(votedRankings).map(([rank, optionId]) => {
            const option = options.find(o => o.id === optionId);
            return (
              <p key={rank} className="text-sm text-purple-600">
                {rankLabels[Number(rank) - 1]}: {option?.label}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
