interface TextResponse {
  text: string;
  createdAt: string;
}

interface TextResultsProps {
  textResponses?: TextResponse[];
  totalVotes?: number;
}

export default function TextResults({
  textResponses = [],
  totalVotes = 0
}: TextResultsProps) {
  if (textResponses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No responses yet. Be the first to respond!
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Responses</h3>
        <span className="text-sm text-gray-500">
          {totalVotes} {totalVotes === 1 ? 'response' : 'responses'}
          {totalVotes > textResponses.length && ` (showing ${textResponses.length})`}
        </span>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {textResponses.map((response, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 rounded-lg border border-gray-100"
          >
            <p className="text-gray-700 whitespace-pre-wrap">{response.text}</p>
            <div className="mt-2 text-xs text-gray-400">
              {formatDate(response.createdAt)}
            </div>
          </div>
        ))}
      </div>

      {totalVotes > textResponses.length && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing most recent {textResponses.length} of {totalVotes} responses
        </div>
      )}
    </div>
  );
}
