// Wird waehrend Server-Rendering aller "Meine WG"-Subseiten als
// Suspense-Fallback angezeigt — so sieht der User sofort Feedback statt
// einer eingefrorenen alten Seite.
export default function WgSlugLoading() {
  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24">
      <div className="pt-14">
        <div className="mb-4 h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-white/15" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/10" />
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-white/5" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 animate-pulse rounded-xl bg-white/5" />
          <div className="h-32 animate-pulse rounded-xl bg-white/5" />
        </div>
        <div className="h-20 animate-pulse rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
