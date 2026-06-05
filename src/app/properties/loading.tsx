export default function PropertiesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="h-8 w-48 rounded bg-slate-700/50 animate-pulse" />
          <div className="h-4 w-56 rounded bg-slate-700/50 animate-pulse mt-2" />
        </div>
        <div className="h-7 w-36 rounded-full bg-slate-700/50 animate-pulse self-start sm:self-auto" />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-slate-700 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <div className="h-11 w-full rounded-xl bg-slate-700/50 animate-pulse" />
        </div>
        <div>
          <div className="h-3 w-14 rounded bg-slate-700/50 animate-pulse mb-1.5" />
          <div className="h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
        </div>
        <div>
          <div className="h-3 w-14 rounded bg-slate-700/50 animate-pulse mb-1.5" />
          <div className="h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
        </div>
        <div>
          <div className="h-3 w-28 rounded bg-slate-700/50 animate-pulse mb-1.5" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 rounded-xl bg-slate-700/50 animate-pulse" />
            <div className="h-10 flex-1 rounded-xl bg-slate-700/50 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="h-3 w-28 rounded bg-slate-700/50 animate-pulse mb-1.5" />
          <div className="h-10 w-full rounded-xl bg-slate-700/50 animate-pulse" />
        </div>
        <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
          <div className="h-10 w-36 rounded-xl bg-slate-700/50 animate-pulse" />
          <div className="h-10 w-32 rounded-xl bg-slate-700/50 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden"
          >
            <div className="h-48 bg-slate-700/50 animate-pulse relative">
              <div className="absolute top-3 right-3 h-6 w-20 rounded-full bg-slate-700/50 animate-pulse" />
            </div>
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 rounded bg-slate-700/50 animate-pulse" />
              <div className="h-6 w-1/3 rounded bg-slate-700/50 animate-pulse" />
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded bg-slate-700/50 animate-pulse" />
                <div className="h-3.5 w-2/3 rounded bg-slate-700/50 animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3.5 w-8 rounded bg-slate-700/50 animate-pulse" />
                <div className="h-3.5 w-8 rounded bg-slate-700/50 animate-pulse" />
                <div className="h-3.5 w-14 rounded bg-slate-700/50 animate-pulse" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                <div className="h-3 w-20 rounded bg-slate-700/50 animate-pulse" />
                <div className="h-3 w-24 rounded bg-slate-700/50 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
