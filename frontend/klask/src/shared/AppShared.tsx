import React from 'react';
import { getModeHref, type KlaskMode } from './navigation';

export function ModeSwitchButtons({ rightMode, rightLabel, showKlask = true }: { rightMode: KlaskMode; rightLabel: string; showKlask?: boolean }) {
  const pathname = window.location.pathname;
  return (
    <>
      {showKlask && <a className="switch-app-btn switch-app-btn-top-left" href={getModeHref(pathname, 'klask')}>Klask</a>}
      <a className="switch-app-btn switch-app-btn-top-right" href={getModeHref(pathname, rightMode)}>{rightLabel}</a>
    </>
  );
}

export function LoadingScreen({ skipAnimation = false, onSkip }: { skipAnimation?: boolean; onSkip?: () => void }) {
  return (
    <div id="loadingScreen" className={`loading-screen${skipAnimation ? ' fade-out' : ''}`} onClick={onSkip}>
      <div className="klask-board">
        <div className="goal-hole goal-left" />
        <div className="goal-hole goal-right" />
        <div className="piece piece-1" />
        <div className="piece piece-2" />
        <div className="ball" />
      </div>
      <div className="loading-text">Loading...</div>
    </div>
  );
}

export function LoginScreen({ title, onLogin }: { title: string; onLogin: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try { await onLogin(username, password); } catch (err) { setError(err instanceof Error ? err.message : 'Login failed. Please try again.'); }
  }
  return (
    <div id="loginScreen" className="login-screen">
      <div className="login-box">
        <h1>{title}</h1>
        <form onSubmit={submit}>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required autoComplete="username" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required autoComplete="current-password" />
          <button type="submit">Login</button>
          <div className="login-error">{error}</div>
        </form>
      </div>
    </div>
  );
}

export function AppShell({ rightMode, rightLabel, showModeSwitch = true, saving, error, onDismissError, children }: React.PropsWithChildren<{ rightMode: KlaskMode; rightLabel: string; showModeSwitch?: boolean; saving?: boolean; error?: string | null; onDismissError?: () => void }>) {
  return (
    <div className="app-container">
      {showModeSwitch && <ModeSwitchButtons rightMode={rightMode} rightLabel={rightLabel} />}
      {saving && <div className="saving-indicator">Saving...</div>}
      {error && <div className="error-banner">{error}<button className="btn-dismiss" onClick={onDismissError}>x</button></div>}
      {children}
    </div>
  );
}
