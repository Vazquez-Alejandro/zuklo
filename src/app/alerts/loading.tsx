export default function AlertsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 rounded bg-slate-700/50 animate-pulse" />
          <div className="h-4 w-72 rounded bg-slate-700/50 animate-pulse mt-2" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-slate-700/50 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-2">
                <div className="h-5 w-36 rounded bg-slate-700/50 animate-pulse" />
                <div className="h-3 w-24 rounded bg-slate-700/50 animate-pulse" />
              </div>
              <div className="h-6 w-16 rounded-full bg-slate-700/50 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-slate-700/50 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-slate-700/50 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-slate-700/50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
