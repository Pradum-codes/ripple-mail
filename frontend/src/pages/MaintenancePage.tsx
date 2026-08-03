function MaintenancePage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <img
          src="/ripple-mail-logo.svg"
          alt="Ripple Mail"
          className="mx-auto h-12 w-auto"
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
          Temporary Maintenance
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">
          Ripple Mail is currently unavailable.
        </h1>
        <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">
          We&apos;re performing a short maintenance update. Please check back in a
          little while.
        </p>
      </div>
    </section>
  );
}

export default MaintenancePage;
