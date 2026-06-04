export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-700/50 animate-pulse" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-slate-700/50 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-slate-700/50 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
