import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { login, register, AuthUser } from '../api';

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      const user =
        mode === 'login'
          ? await login(identifier.trim(), password)
          : await register(username.trim(), email.trim(), password);
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsBusy(false);
    }
  };

  // __PART2__

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4 antialiased selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">HabitPulse</h1>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl shadow-2xl p-7">
          <div className="flex rounded-xl bg-slate-800/70 p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  mode === m
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'login' ? (
              <div>
                <label htmlFor="auth-identifier" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username or Email
                </label>
                <input
                  id="auth-identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="you@example.com"
                />
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="auth-username" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Username
                  </label>
                  <input
                    id="auth-username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                    placeholder="yourname"
                  />
                </div>
                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="••••••••"
              />
              {mode === 'register' && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  At least 8 characters, not too common or all-numeric.
                </p>
              )}
            </div>

            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="w-full min-h-[46px] py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Your habits, prizes, and tickets are private to your account.
        </p>
      </div>
    </div>
  );
};

