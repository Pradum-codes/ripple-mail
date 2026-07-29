import ComposePanel from '../ComposePanel';

function AdvancedOptionsSection() {
  return (
    <ComposePanel
      title="Advanced Options"
      description="Reserved for future campaign controls."
    >
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm leading-6 text-slate-500">
          Additional scheduling options will be available here.
        </p>
      </div>
    </ComposePanel>
  );
}

export default AdvancedOptionsSection;
