export default function ProfileLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-slate-700/50 animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-slate-700/50 animate-pulse" />
          <div className="h-4 w-56 rounded bg-slate-700/50 animate-pulse" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded bg-slate-700/50 animate-pulse" />
            <div className="h-10 w-full rounded-lg bg-slate-700/50 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-10 w-32 rounded-lg bg-slate-700/50 animate-pulse" />
    </div>
  );
}
