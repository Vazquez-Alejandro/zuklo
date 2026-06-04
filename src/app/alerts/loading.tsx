export default function AlertsLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-700/50 animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-8 w-32 rounded bg-slate-700/50 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-slate-700/50 animate-pulse" />
        ))}
        <div className="h-10 w-full rounded-lg bg-slate-700/50 animate-pulse" />
      </div>
    </div>
  );
}
