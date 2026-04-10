export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">via1-app</h1>
      <p className="text-lg text-gray-600 mb-8">
        Organisation der Hausgemeinschaft
      </p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Anmelden
        </a>
      </div>
    </main>
  );
}
