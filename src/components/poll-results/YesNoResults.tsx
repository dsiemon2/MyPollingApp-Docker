interface YesNoResultsProps {
  yesNoResults?: {
    yes: number;
    no: number;
    neutral?: number;
  };
  totalVotes?: number;
  config?: {
    allowNeutral?: boolean;
  };
}

export default function YesNoResults({
  yesNoResults,
  totalVotes = 0,
  config = {}
}: YesNoResultsProps) {
  const { allowNeutral = true } = config;
  const results = yesNoResults || { yes: 0, no: 0, neutral: 0 };
  const total = results.yes + results.no + (results.neutral || 0);

  if (total === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No votes yet. Be the first to vote!
      </div>
    );
  }

  const yesPercent = (results.yes / total) * 100;
  const noPercent = (results.no / total) * 100;
  const neutralPercent = ((results.neutral || 0) / total) * 100;

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-6 text-center">Results</h3>

      {/* Visual bar */}
      <div className="mb-6">
        <div className="flex h-12 rounded-lg overflow-hidden">
          {yesPercent > 0 && (
            <div
              className="bg-green-500 flex items-center justify-center text-white font-medium transition-all"
              style={{ width: `${yesPercent}%` }}
            >
              {yesPercent >= 15 && `${Math.round(yesPercent)}%`}
            </div>
          )}
          {allowNeutral && neutralPercent > 0 && (
            <div
              className="bg-gray-400 flex items-center justify-center text-white font-medium transition-all"
              style={{ width: `${neutralPercent}%` }}
            >
              {neutralPercent >= 15 && `${Math.round(neutralPercent)}%`}
            </div>
          )}
          {noPercent > 0 && (
            <div
              className="bg-red-500 flex items-center justify-center text-white font-medium transition-all"
              style={{ width: `${noPercent}%` }}
            >
              {noPercent >= 15 && `${Math.round(noPercent)}%`}
            </div>
          )}
        </div>
      </div>

      {/* Individual results */}
      <div className={`grid ${allowNeutral ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
          <div className="text-3xl mb-1">👍</div>
          <div className="text-2xl font-bold text-green-600">{results.yes}</div>
          <div className="text-sm text-green-700 font-medium">Yes</div>
          <div className="text-xs text-green-500 mt-1">{Math.round(yesPercent)}%</div>
        </div>

        {allowNeutral && (
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-3xl mb-1">🤷</div>
            <div className="text-2xl font-bold text-gray-600">{results.neutral || 0}</div>
            <div className="text-sm text-gray-700 font-medium">Maybe</div>
            <div className="text-xs text-gray-500 mt-1">{Math.round(neutralPercent)}%</div>
          </div>
        )}

        <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
          <div className="text-3xl mb-1">👎</div>
          <div className="text-2xl font-bold text-red-600">{results.no}</div>
          <div className="text-sm text-red-700 font-medium">No</div>
          <div className="text-xs text-red-500 mt-1">{Math.round(noPercent)}%</div>
        </div>
      </div>

      {/* Total votes */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
        Total votes: {total}
      </div>
    </div>
  );
}
