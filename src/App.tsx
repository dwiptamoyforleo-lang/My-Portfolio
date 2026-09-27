import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  finishRedirectAuthentication,
  logout,
  signInWithApple,
  signInWithGoogle,
  subscribeToAuthState,
} from './auth';
import { firebaseConfigReady, getFirebaseSetupMessage } from './firebase';

function AuthScreen({
  busy,
  error,
  onGoogle,
  onApple,
}: {
  busy: boolean;
  error: string;
  onGoogle: () => void;
  onApple: () => void;
}) {
  return (
    <main className="auth-screen" aria-labelledby="auth-title">
      <section className="auth-card">
        <div className="auth-brand">My Portfolio</div>
        <h1 id="auth-title">Welcome</h1>
        <p className="auth-copy">Sign in to continue.</p>

        <div className="auth-actions">
          <button
            className="auth-button"
            type="button"
            onClick={onGoogle}
            disabled={busy}
          >
            <span className="provider-mark google-mark" aria-hidden="true">
              G
            </span>
            <span>Continue with Google</span>
          </button>

          <button
            className="auth-button"
            type="button"
            onClick={onApple}
            disabled={busy}
          >
            <span className="provider-mark apple-mark" aria-hidden="true">
              Apple
            </span>
            <span>Continue with Apple</span>
          </button>
        </div>

        {busy && <p className="auth-status">Opening secure sign-in…</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}

        {!firebaseConfigReady && (
          <p className="auth-setup" role="status">{getFirebaseSetupMessage()}</p>
        )}
      </section>
    </main>
  );
}

function ProtectedApp({ user }: { user: User }) {
  return (
    <main className="protected-screen">
      <div className="protected-content">
        <p className="eyebrow">Authenticated</p>
        <h1>Welcome back.</h1>
        <p className="protected-copy">
          You are signed in as <strong>{user.email ?? user.displayName ?? 'your account'}</strong>.
        </p>
        <button className="sign-out-button" type="button" onClick={() => void logout()}>
          Sign out
        </button>
      </div>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    void finishRedirectAuthentication().catch((redirectError) => {
      if (!mounted) return;
      const code = (redirectError as { code?: string })?.code;
      if (code !== 'auth/popup-closed-by-user') {
        setError('Sign-in could not be completed. Please try again.');
      }
    });

    const unsubscribe = subscribeToAuthState(
      (nextUser) => {
        if (!mounted) return;
        setUser(nextUser);
        setAuthLoading(false);
      },
      () => {
        if (!mounted) return;
        setAuthLoading(false);
        setError('We could not verify your sign-in session. Please try again.');
      },
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const runSignIn = async (provider: 'google' | 'apple') => {
    setBusy(true);
    setError('');

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
    } catch (signInError) {
      const code = (signInError as { code?: string })?.code;

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        setError('Sign-in was cancelled.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError('That email is already connected to a different sign-in method.');
      } else {
        setError('Sign-in could not be completed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return (
      <main className="auth-loading" aria-label="Checking authentication">
        <div className="loading-indicator" />
      </main>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        busy={busy}
        error={error}
        onGoogle={() => void runSignIn('google')}
        onApple={() => void runSignIn('apple')}
      />
    );
  }

  return <ProtectedApp user={user} />;
}
