import { useMemo, useState } from 'react';
import { Sparkles, Mail, Lock, Loader2, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';

type StrengthLevel = {
  score: number;
  label: string;
  color: string;
  barColor: string;
  tips: string[];
};

function evaluatePassword(password: string): StrengthLevel {
  let score = 0;
  const tips: string[] = [];
  if (password.length >= 8) score += 1;
  else tips.push('Use at least 8 characters');
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  else tips.push('Mix upper and lower case');
  if (/\d/.test(password)) score += 1;
  else tips.push('Add a number');
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else tips.push('Add a symbol');

  const common = ['password', '123456', 'qwerty', 'abc123', 'letmein', 'admin', 'welcome', '111111'];
  if (common.some((c) => password.toLowerCase().includes(c))) {
    score = Math.min(score, 1);
    tips.unshift('Avoid common words like "password" or "123456"');
  }

  if (score >= 4) return { score, label: 'Strong', color: 'text-emerald-400', barColor: 'bg-emerald-500', tips: [] };
  if (score >= 3) return { score, label: 'Good', color: 'text-cyan-400', barColor: 'bg-cyan-500', tips };
  if (score >= 2) return { score, label: 'Fair', color: 'text-amber-400', barColor: 'bg-amber-500', tips };
  if (score > 0) return { score, label: 'Weak', color: 'text-red-400', barColor: 'bg-red-500', tips };
  return { score: 0, label: '', color: 'text-slate-500', barColor: 'bg-slate-700', tips };
}

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => evaluatePassword(password), [password]);
  const canSubmit =
    email.length > 0 &&
    password.length > 0 &&
    (mode === 'signin' || strength.score >= 3);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-7 h-7 text-slate-900" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">AppForge</h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
              />
            </div>

            {mode === 'signup' && password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strength.score ? strength.barColor : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] font-medium ${strength.color} w-12 text-right`}>
                    {strength.label}
                  </span>
                </div>
                {strength.tips.length > 0 && (
                  <ul className="space-y-0.5">
                    {strength.tips.slice(0, 3).map((tip) => (
                      <li key={tip} className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                )}
                {strength.score >= 4 && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <Check className="w-3 h-3" />
                    Looks good — use this password
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === 'signin' ? 'Sign in' : 'Create account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {mode === 'signup' && !canSubmit && password.length > 0 && (
            <p className="text-[10px] text-slate-500 text-center">
              Make your password reach “Good” strength to continue.
            </p>
          )}
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
            }}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
