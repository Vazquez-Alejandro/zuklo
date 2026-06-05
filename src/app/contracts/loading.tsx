export default function ContractsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 rounded bg-slate-700/50 animate-pulse" />
          <div className="h-4 w-56 rounded bg-slate-700/50 animate-pulse mt-2" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-slate-700/50 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700"
          >
            <div className="h-3 w-24 rounded bg-slate-700/50 animate-pulse" />
            <div className="h-7 w-20 rounded bg-slate-700/50 animate-pulse mt-1" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-5 w-48 rounded bg-slate-700/50 animate-pulse" />
                  <div className="h-5 w-20 rounded-full bg-slate-700/50 animate-pulse" />
                </div>
                <div className="h-4 w-36 rounded bg-slate-700/50 animate-pulse" />
                <div className="flex items-center gap-4 mt-2">
                  <div className="h-4 w-28 rounded bg-slate-700/50 animate-pulse" />
                  <div className="h-4 w-40 rounded bg-slate-700/50 animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-4 rounded bg-slate-700/50 animate-pulse flex-shrink-0 ml-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
