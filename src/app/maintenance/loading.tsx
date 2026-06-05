export default function MaintenanceLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded bg-slate-700/50 animate-pulse" />
          <div className="h-4 w-72 rounded bg-slate-700/50 animate-pulse mt-2" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-slate-700/50 animate-pulse" />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700">
        <div className="h-3 w-24 rounded bg-slate-700/50 animate-pulse mb-2" />
        <div className="h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="h-5 w-24 rounded bg-slate-700/50 animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-700/30 rounded-xl p-3">
              <div className="h-3 w-20 rounded bg-slate-700/50 animate-pulse" />
              <div className="h-5 w-24 rounded bg-slate-700/50 animate-pulse mt-1" />
              <div className="h-3 w-16 rounded bg-slate-700/50 animate-pulse mt-0.5" />
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="h-3 w-28 rounded bg-slate-700/50 animate-pulse mb-2" />
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-32 rounded-full bg-slate-700/50 animate-pulse" />
            <div className="h-6 w-28 rounded-full bg-slate-700/50 animate-pulse" />
            <div className="h-6 w-36 rounded-full bg-slate-700/50 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-slate-700/50 animate-pulse" />
                <div>
                  <div className="h-4 w-28 rounded bg-slate-700/50 animate-pulse" />
                  <div className="h-3 w-40 rounded bg-slate-700/50 animate-pulse mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-20 rounded-full bg-slate-700/50 animate-pulse" />
                <div className="h-4 w-4 rounded bg-slate-700/50 animate-pulse" />
              </div>
            </div>
            <div className="h-4 w-3/4 rounded bg-slate-700/50 animate-pulse mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-4 w-24 rounded bg-slate-700/50 animate-pulse" />
                <div className="h-4 w-36 rounded bg-slate-700/50 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
