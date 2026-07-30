import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignApi, normalizeApiError } from '@/api';
import { routePaths } from '@/router/routePaths';
import useRecipientUpload from '@/hooks/useRecipientUpload';
import {
  buildCreateCampaignRequest,
  getComposeCampaignSubmissionError,
  initialComposeCampaignValues,
  validateComposeCampaignForm,
  type ComposeCampaignFieldErrors,
  type ComposeCampaignFormValues,
} from '@/utils/composeCampaign';
import ComposeHeader from '../ComposeHeader';
import SenderSection from '../SenderSection';
import SubjectSection from '../SubjectSection';
import BodySection from '../BodySection';
import RecipientsSection from '../RecipientsSection';
import ScheduleSection from '../ScheduleSection';
import ComposeActions from '../ComposeActions';

export type ComposeFormValues = ComposeCampaignFormValues;

function ComposeForm() {
  const navigate = useNavigate();
  const recipientUpload = useRecipientUpload();
  const [values, setValues] = useState<ComposeCampaignFormValues>(initialComposeCampaignValues);
  const [fieldErrors, setFieldErrors] = useState<ComposeCampaignFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recipientUpload.validRecipients.length === 0) {
      return;
    }

    setSubmitError(null);
    setFieldErrors((currentErrors) => {
      if (!currentErrors.recipients) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors.recipients;
      return nextErrors;
    });
  }, [recipientUpload.validRecipients]);

  function updateField<K extends keyof ComposeCampaignFormValues>(
    field: K,
    value: ComposeCampaignFormValues[K],
  ) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setSubmitError(null);
    setFieldErrors((currentErrors) => {
      if (!(field in currentErrors)) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field as keyof ComposeCampaignFieldErrors];
      return nextErrors;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmitError(null);

    const validationResult = validateComposeCampaignForm(
      values,
      recipientUpload.validRecipients,
    );

    if (!validationResult.isValid) {
      setFieldErrors(validationResult.fieldErrors);
      setSubmitError('Please review the highlighted fields and try again.');
      return;
    }

    const request = buildCreateCampaignRequest(values, recipientUpload.validRecipients);

    setIsSubmitting(true);

    try {
      const response = await campaignApi.createCampaign(request);

      setFieldErrors({});
      recipientUpload.removeFile();
      setValues(initialComposeCampaignValues);

      navigate(routePaths.scheduled, {
        replace: true,
        state: {
          message: `Campaign scheduled successfully. ${response.jobsCreated} email jobs created.`,
        },
      });
    } catch (caughtError) {
      const submissionError = getComposeCampaignSubmissionError(normalizeApiError(caughtError));

      setFieldErrors(submissionError.fieldErrors);
      setSubmitError(submissionError.formError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit}
    >
      <ComposeHeader
        onBack={() => navigate(routePaths.dashboard)}
        onAttachmentClick={() => undefined}
        onScheduleClick={() => undefined}
        onSendLaterClick={() => undefined}
      />

      {submitError ? (
        <section
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700"
        >
          <p className="font-medium">Unable to schedule campaign.</p>
          <p className="mt-1 text-sm">{submitError}</p>
        </section>
      ) : null}

      <div className="rounded-[28px] bg-white px-4 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 md:px-6">
        <div className="space-y-6">
          <SenderSection
            senderId={values.senderId}
            onSenderIdChange={(senderId) => updateField('senderId', senderId)}
            disabled={isSubmitting}
            error={fieldErrors.senderId}
          />
          <RecipientsSection
            {...recipientUpload}
            disabled={isSubmitting}
            recipientsError={fieldErrors.recipients}
          />
          <SubjectSection
            subject={values.subject}
            onSubjectChange={(subject) => updateField('subject', subject)}
            disabled={isSubmitting}
            error={fieldErrors.subject}
          />
          <ScheduleSection
            startTime={values.startTime}
            onStartTimeChange={(startTime) => updateField('startTime', startTime)}
            delaySeconds={values.delaySeconds}
            onDelaySecondsChange={(delaySeconds) => updateField('delaySeconds', delaySeconds)}
            hourlyLimit={values.hourlyLimit}
            onHourlyLimitChange={(hourlyLimit) => updateField('hourlyLimit', hourlyLimit)}
            errors={{
              startTime: fieldErrors.startTime,
              delaySeconds: fieldErrors.delaySeconds,
              hourlyLimit: fieldErrors.hourlyLimit,
            }}
            disabled={isSubmitting}
          />
          <BodySection
            body={values.body}
            onBodyChange={(body) => updateField('body', body)}
            error={fieldErrors.body}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <ComposeActions
        onCancel={() => navigate(routePaths.dashboard)}
        scheduleDisabled={isSubmitting}
        loading={isSubmitting}
      />
    </form>
  );
}

export default ComposeForm;
