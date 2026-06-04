export default function BillingLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-slate-700/50 animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 rounded bg-slate-700/50 animate-pulse" />
            <div className="h-3 w-full rounded-full bg-slate-700/50 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
