interface Option {
  id: string;
  label: string;
}

interface MultipleChoiceInputProps {
  options: Option[];
  selectedOptions: string[];
  onSelect: (optionIds: string[]) => void;
  disabled?: boolean;
  votedOptionIds?: string[];
  maxSelections?: number | null;
}

export default function MultipleChoiceInput({
  options,
  selectedOptions,
  onSelect,
  disabled = false,
  votedOptionIds = [],
  maxSelections = null
}: MultipleChoiceInputProps) {
  const handleToggle = (optionId: string) => {
    if (disabled) return;

    if (selectedOptions.includes(optionId)) {
      onSelect(selectedOptions.filter(id => id !== optionId));
    } else {
      if (maxSelections && selectedOptions.length >= maxSelections) {
        return;
      }
      onSelect([...selectedOptions, optionId]);
    }
  };

  return (
    <div className="space-y-3">
      {maxSelections && (
        <p className="text-sm text-gray-500 mb-2">
          Select up to {maxSelections} option{maxSelections > 1 ? 's' : ''}
        </p>
      )}
      {options.map((option) => {
        const isSelected = selectedOptions.includes(option.id);
        const isVoted = votedOptionIds.includes(option.id);

        return (
          <button
            key={option.id}
            onClick={() => handleToggle(option.id)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
              isSelected
                ? 'border-green-700 bg-green-50'
                : disabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              isSelected ? 'border-green-700 bg-green-700' : 'border-gray-300'
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="flex-1">{option.label}</span>
            {isVoted && (
              <span className="text-xs text-green-700 font-medium">Your vote</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
