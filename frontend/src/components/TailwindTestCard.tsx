function TailwindTestCard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tailwind is working</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This centered card confirms the Tailwind Vite integration, global reset, and utility classes.
        </p>
        <button
          type="button"
          className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Demo Button
        </button>
      </section>
    </div>
  );
}

export default TailwindTestCard;
