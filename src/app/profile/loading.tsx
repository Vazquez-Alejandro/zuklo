export default function ProfileLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="h-8 w-40 rounded bg-slate-700/50 animate-pulse" />
        <div className="h-4 w-64 rounded bg-slate-700/50 animate-pulse mt-2" />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-700/50 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-slate-700/50 animate-pulse" />
              <div className="h-3 w-48 rounded bg-slate-700/50 animate-pulse" />
            </div>
          </div>
          <div className="h-7 w-24 rounded-full bg-slate-700/50 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-700/30 rounded-xl p-3">
            <div className="h-3 w-20 rounded bg-slate-700/50 animate-pulse" />
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-slate-700/50 rounded-full animate-pulse" />
              <div className="h-3 w-8 rounded bg-slate-700/50 animate-pulse" />
            </div>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-3">
            <div className="h-3 w-24 rounded bg-slate-700/50 animate-pulse" />
            <div className="h-4 w-28 rounded bg-slate-700/50 animate-pulse mt-1" />
          </div>
          <div className="bg-slate-700/30 rounded-xl p-3">
            <div className="h-3 w-16 rounded bg-slate-700/50 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-700/50 animate-pulse mt-1" />
          </div>
          <div className="bg-slate-700/30 rounded-xl p-3">
            <div className="h-3 w-28 rounded bg-slate-700/50 animate-pulse" />
            <div className="h-4 w-24 rounded bg-slate-700/50 animate-pulse mt-1" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="h-5 w-32 rounded bg-slate-700/50 animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-24 rounded bg-slate-700/50 animate-pulse mb-1.5" />
              <div className="h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="h-5 w-32 rounded bg-slate-700/50 animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-28 rounded bg-slate-700/50 animate-pulse mb-1.5" />
              <div className="h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="h-5 w-24 rounded bg-slate-700/50 animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-28 rounded bg-slate-700/50 animate-pulse mb-1.5" />
              <div className="h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="h-5 w-28 rounded bg-slate-700/50 animate-pulse mb-4" />
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-9 rounded-full bg-slate-700/50 animate-pulse" />
            <div className="h-4 w-32 rounded bg-slate-700/50 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-20 rounded bg-slate-700/50 animate-pulse mb-1.5" />
                <div className="h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <div className="h-10 w-24 rounded-xl bg-slate-700/50 animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-slate-700/50 animate-pulse" />
      </div>
    </div>
  );
}
