export default function SettingsLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-28 rounded bg-slate-700/50 animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-slate-700/50 animate-pulse" />
        </div>
      ))}
      <div className="h-10 w-32 rounded-lg bg-slate-700/50 animate-pulse" />
    </div>
  );
}
