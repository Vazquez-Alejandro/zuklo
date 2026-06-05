export default function BillingLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="h-8 w-40 rounded bg-slate-700/50 animate-pulse" />
        <div className="h-4 w-56 rounded bg-slate-700/50 animate-pulse mt-2" />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-slate-700/50 animate-pulse" />
            <div className="h-6 w-28 rounded bg-slate-700/50 animate-pulse" />
            <div className="h-5 w-32 rounded bg-slate-700/50 animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-44 rounded-xl bg-slate-700/50 animate-pulse" />
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-slate-700">
          <div className="h-3 w-36 rounded bg-slate-700/50 animate-pulse mb-3" />
          <div className="flex flex-wrap gap-2">
            <div className="h-7 w-36 rounded-full bg-slate-700/50 animate-pulse" />
            <div className="h-7 w-32 rounded-full bg-slate-700/50 animate-pulse" />
            <div className="h-7 w-28 rounded-full bg-slate-700/50 animate-pulse" />
          </div>
        </div>
      </div>

      <div>
        <div className="h-5 w-32 rounded bg-slate-700/50 animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700"
            >
              <div className="h-4 w-32 rounded bg-slate-700/50 animate-pulse" />
              <div className="h-7 w-10 rounded bg-slate-700/50 animate-pulse mt-1" />
              <div className="h-3 w-16 rounded bg-slate-700/50 animate-pulse mt-1" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="h-5 w-44 rounded bg-slate-700/50 animate-pulse mb-4" />
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700"
            >
              <div className="h-4 w-20 rounded-full bg-slate-700/50 animate-pulse mb-4" />
              <div className="h-5 w-24 rounded bg-slate-700/50 animate-pulse" />
              <div className="h-7 w-32 rounded bg-slate-700/50 animate-pulse mt-2" />
              <div className="h-4 w-40 rounded bg-slate-700/50 animate-pulse mt-2" />
              <div className="space-y-2.5 mt-5">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-slate-700/50 animate-pulse shrink-0" />
                    <div className="h-3.5 flex-1 rounded bg-slate-700/50 animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="mt-6 h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
