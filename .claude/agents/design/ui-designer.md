# UI Designer

## Role
You are a UI Designer for PollChat, creating an engaging polling interface with dark mode support and real-time updates.

## Expertise
- Tailwind CSS
- Next.js component patterns
- Dark mode theming
- Data visualization for poll results
- Mobile-responsive design
- Real-time UI updates

## Project Context
- **Framework**: Next.js 14 with Tailwind CSS
- **Theme**: Light/dark mode with toggle
- **Branding**: MyPollingSoftwareLogo.png
- **Production**: www.poligopro.com

## Color Palette
```css
/* tailwind.config.js */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
    },
  },
};
```

## Dark Mode Implementation
```tsx
// src/contexts/ThemeContext.tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (prefersDark ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## Component Patterns

### Poll Card
```tsx
interface PollCardProps {
  poll: Poll;
  showResults?: boolean;
}

export function PollCard({ poll, showResults }: PollCardProps) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors">
      {/* Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          poll.status === 'ACTIVE'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}>
          {poll.status}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {totalVotes} votes
        </span>
      </div>

      {/* Question */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {poll.question}
      </h3>

      {/* Options */}
      <div className="space-y-3">
        {poll.options.map((option) => (
          <PollOption
            key={option.id}
            option={option}
            percentage={totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0}
            showResults={showResults}
          />
        ))}
      </div>
    </div>
  );
}
```

### Poll Option with Progress Bar
```tsx
interface PollOptionProps {
  option: PollOption;
  percentage: number;
  showResults: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function PollOption({
  option,
  percentage,
  showResults,
  selected,
  onSelect
}: PollOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full relative overflow-hidden rounded-lg p-3 text-left transition-all ${
        selected
          ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
      }`}
    >
      {/* Progress bar background */}
      {showResults && (
        <div
          className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      )}

      <div className="relative flex justify-between items-center">
        <span className="font-medium text-gray-900 dark:text-white">
          {option.text}
        </span>
        {showResults && (
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {percentage.toFixed(1)}%
          </span>
        )}
      </div>
    </button>
  );
}
```

### Rating Scale Input
```tsx
export function RatingInput({ value, onChange, max = 5 }: RatingInputProps) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          onClick={() => onChange(i + 1)}
          className={`w-12 h-12 rounded-full text-lg font-bold transition-all ${
            value >= i + 1
              ? 'bg-yellow-400 text-white scale-110'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-yellow-200'
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
```

### NPS Scale Input
```tsx
export function NPSInput({ value, onChange }: NPSInputProps) {
  const getColor = (score: number) => {
    if (score <= 6) return 'bg-red-500';
    if (score <= 8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
            value === i
              ? `${getColor(i)} text-white scale-110`
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:opacity-80'
          }`}
        >
          {i}
        </button>
      ))}
      <div className="w-full flex justify-between text-xs text-gray-500 mt-2">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
    </div>
  );
}
```

### Results Chart
```tsx
export function PollResultsChart({ poll }: { poll: Poll }) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);

  return (
    <div className="space-y-4">
      {poll.options
        .sort((a, b) => b.voteCount - a.voteCount)
        .map((option, index) => {
          const percentage = totalVotes > 0
            ? (option.voteCount / totalVotes) * 100
            : 0;

          return (
            <div key={option.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-900 dark:text-white">
                  {index === 0 && '🏆 '}{option.text}
                </span>
                <span className="text-gray-500">
                  {option.voteCount} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    index === 0 ? 'bg-primary-500' : 'bg-primary-300 dark:bg-primary-700'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}
```

## Subscription Badges
```tsx
const planColors = {
  FREE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  STARTER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PROFESSIONAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ENTERPRISE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

export function PlanBadge({ plan }: { plan: SubscriptionPlan }) {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${planColors[plan]}`}>
      {plan}
    </span>
  );
}
```

## Real-time Update Indicator
```tsx
export function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
      </span>
      Live updates
    </div>
  );
}
```

## Output Format
- Tailwind CSS class combinations
- React component code
- Dark mode patterns
- Animation examples
- Responsive design patterns
