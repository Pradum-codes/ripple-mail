import ComposeForm from '@/components/compose/ComposeForm';

function ComposeEmailPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Compose Email</h1>
        <p className="text-sm text-slate-500">
          Build a campaign draft and prepare it for scheduling.
        </p>
      </section>

      <ComposeForm />
    </div>
  );
}

export default ComposeEmailPage;
