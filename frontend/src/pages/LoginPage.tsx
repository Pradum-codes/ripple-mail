import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '@/api/auth';
import { useAuth } from '@/auth';
import { routePaths } from '@/router/routePaths';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <section className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-stone-500">
            ReachInbox
          </p>
          <h1 className="text-3xl font-semibold text-stone-900">Sign in</h1>
          <p className="text-sm leading-6 text-stone-600">
            Continue with your Google account to access campaigns, senders, and scheduling.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (!credentialResponse.credential || isSubmitting) {
                return;
              }

              try {
                setIsSubmitting(true);
                setErrorMessage(null);

                const response = await googleLogin(credentialResponse.credential);
                login(response);
                navigate(routePaths.dashboard, { replace: true });
              } catch (error) {
                setErrorMessage(
                  error instanceof Error ? error.message : 'Google sign-in failed. Please try again.',
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
            onError={() => {
              setErrorMessage('Google sign-in was cancelled or could not be completed.');
            }}
          />
        </div>

        {isSubmitting ? (
          <p className="mt-4 text-center text-sm text-stone-500">Signing you in...</p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default LoginPage;
