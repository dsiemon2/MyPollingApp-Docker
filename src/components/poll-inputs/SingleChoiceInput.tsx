interface Option {
  id: string;
  label: string;
}

interface SingleChoiceInputProps {
  options: Option[];
  selectedOption: string | null;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
  votedOptionId?: string | null;
}

export default function SingleChoiceInput({
  options,
  selectedOption,
  onSelect,
  disabled = false,
  votedOptionId
}: SingleChoiceInputProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => !disabled && onSelect(option.id)}
          disabled={disabled}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
            selectedOption === option.id
              ? 'border-purple-600 bg-purple-50'
              : disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            selectedOption === option.id ? 'border-purple-600' : 'border-gray-300'
          }`}>
            {selectedOption === option.id && (
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            )}
          </div>
          <span className="flex-1">{option.label}</span>
          {votedOptionId === option.id && (
            <span className="text-xs text-purple-600 font-medium">Your vote</span>
          )}
        </button>
      ))}
    </div>
  );
}
