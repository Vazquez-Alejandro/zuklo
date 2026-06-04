export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-700/50 ${className}`}
      aria-hidden
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 rounded bg-slate-700/50 animate-pulse ${
            i === lines - 1 ? "w-2/3" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-700/50 bg-slate-800 p-6 space-y-4 animate-pulse ${className}`}
      aria-hidden
    >
      <div className="h-5 w-1/3 rounded bg-slate-700/50" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-slate-700/50" />
        <div className="h-4 w-5/6 rounded bg-slate-700/50" />
        <div className="h-4 w-2/3 rounded bg-slate-700/50" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-full bg-slate-700/50 shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
