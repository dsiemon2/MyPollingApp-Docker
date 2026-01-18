interface NPSResultsProps {
  npsScore?: number;
  detractorCount?: number;
  passiveCount?: number;
  promoterCount?: number;
  averageRating?: number;
  ratingCount?: number;
}

export default function NPSResults({
  npsScore,
  detractorCount = 0,
  passiveCount = 0,
  promoterCount = 0,
  averageRating,
  ratingCount = 0
}: NPSResultsProps) {
  const totalResponses = detractorCount + passiveCount + promoterCount;

  if (totalResponses === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No responses yet. Be the first to respond!
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 50) return 'text-green-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Great';
    if (score >= 30) return 'Good';
    if (score >= 0) return 'Needs Improvement';
    return 'Critical';
  };

  const detractorPercent = (detractorCount / totalResponses) * 100;
  const passivePercent = (passiveCount / totalResponses) * 100;
  const promoterPercent = (promoterCount / totalResponses) * 100;

  return (
    <div className="bg-white rounded-lg p-6">
      {/* NPS Score Display */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Net Promoter Score</h3>
        <div className={`text-6xl font-bold ${getScoreColor(npsScore || 0)}`}>
          {npsScore || 0}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {getScoreLabel(npsScore || 0)}
        </div>
      </div>

      {/* NPS Scale Visualization */}
      <div className="mb-6">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {detractorPercent > 0 && (
            <div
              className="bg-red-400 flex items-center justify-center text-white text-xs font-medium transition-all"
              style={{ width: `${detractorPercent}%` }}
            >
              {detractorPercent >= 10 && `${Math.round(detractorPercent)}%`}
            </div>
          )}
          {passivePercent > 0 && (
            <div
              className="bg-yellow-400 flex items-center justify-center text-gray-700 text-xs font-medium transition-all"
              style={{ width: `${passivePercent}%` }}
            >
              {passivePercent >= 10 && `${Math.round(passivePercent)}%`}
            </div>
          )}
          {promoterPercent > 0 && (
            <div
              className="bg-green-400 flex items-center justify-center text-white text-xs font-medium transition-all"
              style={{ width: `${promoterPercent}%` }}
            >
              {promoterPercent >= 10 && `${Math.round(promoterPercent)}%`}
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{detractorCount}</div>
          <div className="text-sm text-red-700 font-medium">Detractors</div>
          <div className="text-xs text-red-500 mt-1">0-6 rating</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{passiveCount}</div>
          <div className="text-sm text-yellow-700 font-medium">Passives</div>
          <div className="text-xs text-yellow-500 mt-1">7-8 rating</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{promoterCount}</div>
          <div className="text-sm text-green-700 font-medium">Promoters</div>
          <div className="text-xs text-green-500 mt-1">9-10 rating</div>
        </div>
      </div>

      {/* Average and Total */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-500">
        <div>
          Average Score: <span className="font-semibold text-gray-700">{(averageRating || 0).toFixed(1)}</span>
        </div>
        <div>
          Total Responses: <span className="font-semibold text-gray-700">{totalResponses}</span>
        </div>
      </div>

      {/* NPS Formula Explanation */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
        NPS = % Promoters - % Detractors = {Math.round(promoterPercent)}% - {Math.round(detractorPercent)}% = {npsScore}
      </div>
    </div>
  );
}
