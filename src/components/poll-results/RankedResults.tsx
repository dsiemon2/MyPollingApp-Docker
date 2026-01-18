interface RankedOption {
  id: string;
  label: string;
  text?: string;
  points: number;
  votes?: number;
}

interface RankedResultsProps {
  options: RankedOption[];
  totalVotes?: number;
  config?: {
    pointSystem?: number[];
  };
}

export default function RankedResults({
  options,
  totalVotes = 0,
  config = {}
}: RankedResultsProps) {
  const { pointSystem = [3, 2, 1] } = config;

  if (options.length === 0 || totalVotes === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No rankings yet. Be the first to rank!
      </div>
    );
  }

  // Sort by points descending
  const sortedOptions = [...options].sort((a, b) => (b.points || 0) - (a.points || 0));
  const maxPoints = sortedOptions[0]?.points || 1;

  const getMedalEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-50 border-yellow-300';
      case 1: return 'bg-gray-50 border-gray-300';
      case 2: return 'bg-orange-50 border-orange-300';
      default: return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
        Rankings by Points
      </h3>

      {/* Point system legend */}
      <div className="flex justify-center gap-4 mb-6 text-sm text-gray-500">
        {pointSystem.map((points, index) => (
          <span key={index} className="flex items-center gap-1">
            <span className="font-medium">{['1st', '2nd', '3rd', '4th', '5th'][index]}:</span>
            <span className="text-purple-600">{points} pts</span>
          </span>
        ))}
      </div>

      {/* Rankings list */}
      <div className="space-y-3">
        {sortedOptions.map((option, index) => {
          const percentOfMax = maxPoints > 0 ? (option.points / maxPoints) * 100 : 0;

          return (
            <div
              key={option.id}
              className={`relative border rounded-lg p-4 ${getMedalColor(index)} transition-all`}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="text-2xl w-10 text-center">
                  {getMedalEmoji(index)}
                </div>

                {/* Option details */}
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {option.label || option.text}
                  </div>

                  {/* Points bar */}
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        index === 0 ? 'bg-yellow-400' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-400' :
                        'bg-purple-400'
                      }`}
                      style={{ width: `${percentOfMax}%` }}
                    />
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className="text-xl font-bold text-purple-600">
                    {option.points}
                  </div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total voters */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
        Based on rankings from {totalVotes} {totalVotes === 1 ? 'voter' : 'voters'}
      </div>
    </div>
  );
}
