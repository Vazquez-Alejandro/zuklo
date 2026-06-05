export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-48 rounded bg-slate-700/50 animate-pulse" />
        <div className="h-4 w-64 rounded bg-slate-700/50 animate-pulse mt-2" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 rounded bg-slate-700/50 animate-pulse" />
              <div className="h-3 w-20 rounded bg-slate-700/50 animate-pulse" />
            </div>
            <div className="h-8 w-12 rounded bg-slate-700/50 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-36 rounded-xl bg-slate-700/50 animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-slate-700/50 animate-pulse" />
        <div className="h-10 w-44 rounded-xl bg-slate-700/50 animate-pulse" />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="h-5 w-32 rounded bg-slate-700/50 animate-pulse mb-4" />
        <div className="flex gap-3">
          <div className="flex-1 h-11 rounded-xl bg-slate-700/50 animate-pulse" />
          <div className="h-11 w-28 rounded-xl bg-slate-700/50 animate-pulse" />
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-44 rounded bg-slate-700/50 animate-pulse" />
          <div className="h-9 w-20 rounded-xl bg-slate-700/50 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-700/50 animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-slate-700/50 animate-pulse" />
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="h-5 w-24 rounded bg-slate-700/50 animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl bg-slate-700/50 animate-pulse"
            />
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-40 rounded bg-slate-700/50 animate-pulse" />
          <div className="h-4 w-20 rounded bg-slate-700/50 animate-pulse" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3">
                  <div className="h-3 w-16 rounded bg-slate-700/50 animate-pulse" />
                </th>
                <th className="text-left py-3">
                  <div className="h-3 w-14 rounded bg-slate-700/50 animate-pulse" />
                </th>
                <th className="text-left py-3">
                  <div className="h-3 w-16 rounded bg-slate-700/50 animate-pulse" />
                </th>
                <th className="text-left py-3">
                  <div className="h-3 w-12 rounded bg-slate-700/50 animate-pulse" />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-700/50 last:border-0"
                >
                  <td className="py-3">
                    <div className="h-4 w-32 rounded bg-slate-700/50 animate-pulse" />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-slate-700/50 animate-pulse" />
                      <div className="h-4 w-16 rounded bg-slate-700/50 animate-pulse" />
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="h-4 w-20 rounded bg-slate-700/50 animate-pulse" />
                  </td>
                  <td className="py-3">
                    <div className="h-4 w-16 rounded bg-slate-700/50 animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
