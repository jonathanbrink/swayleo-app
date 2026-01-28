import { formatLimit, isUnlimited } from '../../types/billing';

interface UsageBarProps {
  label: string;
  current: number;
  limit: number;
  showWarning?: boolean;
}

export function UsageBar({ label, current, limit, showWarning = true }: UsageBarProps) {
  const unlimited = isUnlimited(limit);
  const percentage = unlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !unlimited && percentage >= 80;
  const isAtLimit = !unlimited && current >= limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className={`font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-slate-800'}`}>
          {current.toLocaleString()} / {formatLimit(limit)}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isAtLimit
              ? 'bg-red-500'
              : isNearLimit
              ? 'bg-amber-500'
              : 'bg-sway-500'
          }`}
          style={{ width: unlimited ? '0%' : `${percentage}%` }}
        />
      </div>
      {showWarning && isNearLimit && !isAtLimit && (
        <p className="text-xs text-amber-600">
          You're approaching your limit. Consider upgrading.
        </p>
      )}
      {showWarning && isAtLimit && (
        <p className="text-xs text-red-600">
          You've reached your limit. Upgrade to continue.
        </p>
      )}
    </div>
  );
}
