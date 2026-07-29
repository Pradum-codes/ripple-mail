import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routePaths } from '@/router/routePaths';
import ComposeHeader from '../ComposeHeader';
import SenderSection from '../SenderSection';
import SubjectSection from '../SubjectSection';
import BodySection from '../BodySection';
import RecipientsSection from '../RecipientsSection';
import ScheduleSection from '../ScheduleSection';

export interface ComposeFormValues {
  senderId: string;
  subject: string;
  startTime: string;
  delaySeconds: string;
  hourlyLimit: string;
}

function ComposeForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState<ComposeFormValues>({
    senderId: '',
    subject: '',
    startTime: '',
    delaySeconds: '00',
    hourlyLimit: '00',
  });

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <ComposeHeader
        onBack={() => navigate(routePaths.dashboard)}
        onAttachmentClick={() => undefined}
        onScheduleClick={() => undefined}
        onSendLaterClick={() => undefined}
      />

      <div className="rounded-[28px] bg-white px-4 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 md:px-6">
        <div className="space-y-6">
          <SenderSection
            senderId={values.senderId}
            onSenderIdChange={(senderId) => setValues((current) => ({ ...current, senderId }))}
          />
          <RecipientsSection />
          <SubjectSection
            subject={values.subject}
            onSubjectChange={(subject) => setValues((current) => ({ ...current, subject }))}
          />
          <ScheduleSection
            startTime={values.startTime}
            onStartTimeChange={(startTime) => setValues((current) => ({ ...current, startTime }))}
            delaySeconds={values.delaySeconds}
            onDelaySecondsChange={(delaySeconds) => setValues((current) => ({ ...current, delaySeconds }))}
            hourlyLimit={values.hourlyLimit}
            onHourlyLimitChange={(hourlyLimit) => setValues((current) => ({ ...current, hourlyLimit }))}
          />
          <BodySection />
        </div>
      </div>
    </form>
  );
}

export default ComposeForm;
