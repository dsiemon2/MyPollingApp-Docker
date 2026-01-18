interface OpenTextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  votedValue?: string | null;
  config?: {
    multiline?: boolean;
    maxLength?: number;
    placeholder?: string;
    required?: boolean;
  };
}

export default function OpenTextInput({
  value,
  onChange,
  disabled = false,
  votedValue,
  config = {}
}: OpenTextInputProps) {
  const {
    multiline = true,
    maxLength = 500,
    placeholder = 'Enter your response...',
    required = true
  } = config;

  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.8;
  const isOverLimit = charCount > maxLength;

  if (votedValue) {
    return (
      <div className="space-y-2">
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700 font-medium mb-2">Your response:</p>
          <p className="text-gray-700 whitespace-pre-wrap">{votedValue}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => !disabled && onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          rows={4}
          className={`w-full border rounded-lg px-4 py-3 resize-none ${
            disabled ? 'bg-gray-50 cursor-not-allowed' : ''
          } ${isOverLimit ? 'border-red-500' : 'border-gray-200'}`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => !disabled && onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`w-full border rounded-lg px-4 py-3 ${
            disabled ? 'bg-gray-50 cursor-not-allowed' : ''
          } ${isOverLimit ? 'border-red-500' : 'border-gray-200'}`}
        />
      )}
      <div className={`text-sm text-right ${
        isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-gray-400'
      }`}>
        {charCount} / {maxLength}
      </div>
    </div>
  );
}
