export default function SettingsLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <div className="h-8 w-40 rounded bg-slate-700/50 animate-pulse" />
        <div className="h-4 w-60 rounded bg-slate-700/50 animate-pulse mt-2" />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="h-5 w-48 rounded bg-slate-700/50 animate-pulse mb-5" />
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-700/50 animate-pulse shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-slate-700/50 animate-pulse" />
              <div className="h-3 w-48 rounded bg-slate-700/50 animate-pulse" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div>
              <div className="h-3 w-12 rounded bg-slate-700/50 animate-pulse mb-1.5" />
              <div className="h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
            </div>
            <div>
              <div className="h-3 w-16 rounded bg-slate-700/50 animate-pulse mb-1.5" />
              <div className="h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="h-5 w-40 rounded bg-slate-700/50 animate-pulse mb-5" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-36 rounded bg-slate-700/50 animate-pulse mb-1.5" />
              <div className="h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
            </div>
          ))}
          <div className="h-10 w-40 rounded-xl bg-slate-700/50 animate-pulse" />
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="h-5 w-52 rounded bg-slate-700/50 animate-pulse mb-5" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0"
            >
              <div className="space-y-1">
                <div className="h-4 w-40 rounded bg-slate-700/50 animate-pulse" />
                <div className="h-3 w-56 rounded bg-slate-700/50 animate-pulse" />
              </div>
              <div className="h-6 w-11 rounded-full bg-slate-700/50 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="h-5 w-24 rounded bg-slate-700/50 animate-pulse mb-2" />
        <div className="h-3 w-60 rounded bg-slate-700/50 animate-pulse mb-4" />
        <div className="h-10 w-36 rounded-xl bg-slate-700/50 animate-pulse" />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20">
        <div className="h-5 w-36 rounded bg-slate-700/50 animate-pulse mb-2" />
        <div className="h-3 w-72 rounded bg-slate-700/50 animate-pulse mb-4" />
        <div className="h-10 w-32 rounded-xl bg-slate-700/50 animate-pulse" />
      </div>
    </div>
  );
}
