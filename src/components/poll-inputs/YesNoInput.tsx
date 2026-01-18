interface YesNoInputProps {
  selectedValue: string | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
  votedValue?: string | null;
  config?: {
    yesLabel?: string;
    noLabel?: string;
    allowNeutral?: boolean;
    neutralLabel?: string;
  };
}

export default function YesNoInput({
  selectedValue,
  onSelect,
  disabled = false,
  votedValue,
  config = {}
}: YesNoInputProps) {
  const {
    yesLabel = 'Yes',
    noLabel = 'No',
    allowNeutral = false,
    neutralLabel = 'Maybe'
  } = config;

  const options = [
    { value: 'yes', label: yesLabel, color: 'green', icon: '👍' },
    { value: 'no', label: noLabel, color: 'red', icon: '👎' },
    ...(allowNeutral ? [{ value: 'neutral', label: neutralLabel, color: 'gray', icon: '🤔' }] : [])
  ];

  const colorClasses: Record<string, string> = {
    green: 'border-green-500 bg-green-50 text-green-700',
    red: 'border-red-500 bg-red-50 text-red-700',
    gray: 'border-gray-400 bg-gray-50 text-gray-700'
  };

  return (
    <div className={`grid gap-4 ${allowNeutral ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        const isVoted = votedValue === option.value;

        return (
          <button
            key={option.value}
            onClick={() => !disabled && onSelect(option.value)}
            disabled={disabled}
            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              isSelected
                ? colorClasses[option.color]
                : disabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-4xl">{option.icon}</span>
            <span className="font-medium text-lg">{option.label}</span>
            {isVoted && (
              <span className="text-xs font-medium">Your vote</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
