// App-weiter Suspense-Fallback waehrend Server-Components rendern.
// Wichtig damit Tab-Wechsel sofort Feedback zeigt statt auf der alten
// Seite eingefroren zu bleiben.
export default function RootLoading() {
  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pt-14">
      <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-white/10" />
      <div className="mt-6 space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-white/5" />
        <div className="h-24 animate-pulse rounded-xl bg-white/5" />
        <div className="h-24 animate-pulse rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
