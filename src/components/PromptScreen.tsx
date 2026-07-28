import { useMemo, useState } from 'react';
import {
  Smartphone,
  Apple,
  Bot,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
  Wand2,
  Layers,
  Palette,
  Rocket,
  Zap,
  ChevronRight,
} from 'lucide-react';
import type { Platform } from '@/types/builder';

interface PromptScreenProps {
  onStart: (prompt: string, platform: Platform) => Promise<void>;
  recentProjectName?: string;
}

type Step = 0 | 1 | 2 | 3;

const CATEGORIES = [
  { id: 'fitness', label: 'Fitness', icon: '🏃', prompt: 'A fitness tracking app with workout logs, calorie counting, and progress charts' },
  { id: 'ecommerce', label: 'E-commerce', icon: '🛍️', prompt: 'An e-commerce store for handmade products with product catalog, cart, and Stripe checkout' },
  { id: 'social', label: 'Social', icon: '💬', prompt: 'A social app with user profiles, posts, comments, and real-time feed' },
  { id: 'productivity', label: 'Productivity', icon: '✅', prompt: 'A task manager app with categories, reminders, drag-and-drop, and dark mode' },
  { id: 'food', label: 'Food & Recipes', icon: '🍳', prompt: 'A recipe app with search, cooking timers, saved favorites, and meal planning' },
  { id: 'finance', label: 'Finance', icon: '💰', prompt: 'A budget tracker with expense categories, charts, and recurring transactions' },
  { id: 'travel', label: 'Travel', icon: '✈️', prompt: 'A travel planner with trip itineraries, map integration, and booking' },
  { id: 'education', label: 'Education', icon: '📚', prompt: 'A learning app with courses, quizzes, progress tracking, and certificates' },
];

const FEATURE_OPTIONS = [
  'User accounts', 'Dark mode', 'Push notifications', 'Offline support',
  'Maps & location', 'Chat / messaging', 'Photo uploads', 'Search',
  'Payments (Stripe)', 'Data charts', 'Calendar', 'Admin dashboard',
];

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'ios', label: 'iOS', icon: <Apple className="w-5 h-5" />, desc: 'iPhone & iPad' },
  { id: 'android', label: 'Android', icon: <Smartphone className="w-5 h-5" />, desc: 'All Android devices' },
  { id: 'both', label: 'Both', icon: <Bot className="w-5 h-5" />, desc: 'iOS + Android' },
];

export default function PromptScreen({ onStart, recentProjectName }: PromptScreenProps) {
  const [step, setStep] = useState<Step>(0);
  const [category, setCategory] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [platform, setPlatform] = useState<Platform>('both');
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const composedPrompt = useMemo(() => {
    const base = category ? CATEGORIES.find((c) => c.id === category)?.prompt : '';
    const featStr = features.length > 0 ? ` with ${features.join(', ')}` : '';
    const custom = customPrompt.trim();
    return [base, featStr, custom && `— ${custom}`].filter(Boolean).join(' ') || custom;
  }, [category, features, customPrompt]);

  const canAdvance = step === 0 ? !!category : step === 1 ? true : step === 2 ? composedPrompt.trim().length >= 5 : true;
  const canStart = composedPrompt.trim().length >= 5;

  const handleStart = async () => {
    setBuilding(true);
    setError(null);
    try {
      await onStart(composedPrompt.trim(), platform);
    } catch (err) {
      setBuilding(false);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const next = () => setStep((s) => Math.min(3, s + 1) as Step);
  const back = () => setStep((s) => Math.max(0, s - 1) as Step);

  const toggleFeature = (f: string) =>
    setFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AppForge</h1>
            <p className="text-xs text-slate-400">AI Mobile App Builder</p>
          </div>
        </div>

        {/* Hero — instant value headline */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-center max-w-2xl mb-3 tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Describe your app.
          <br />
          Watch it build itself.
        </h2>
        <p className="text-slate-400 text-center max-w-lg mb-8 text-base">
          Three quick steps. Your mobile app assembled live — screen by screen, with real-time build logs.
        </p>

        {/* Progress steps indicator */}
        <div className="flex items-center gap-1.5 mb-8">
          {['Category', 'Features', 'Describe', 'Platform'].map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  i === step
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : i < step
                      ? 'text-emerald-400'
                      : 'text-slate-600'
                }`}
              >
                {i < step ? <Check className="w-3 h-3" /> : <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${i === step ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>{i + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 3 && <ChevronRight className="w-3 h-3 text-slate-700" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="w-full max-w-2xl min-h-[260px] flex flex-col">
          <div key={step} className="animate-step-in flex-1">
            {step === 0 && (
              <StepCategory category={category} onSelect={(id) => { setCategory(id); }} />
            )}
            {step === 1 && (
              <StepFeatures selected={features} onToggle={toggleFeature} />
            )}
            {step === 2 && (
              <StepDescribe
                prompt={customPrompt}
                setPrompt={setCustomPrompt}
                composedPreview={composedPrompt}
                category={category}
                features={features}
              />
            )}
            {step === 3 && (
              <StepPlatform platform={platform} setPlatform={setPlatform} composedPrompt={composedPrompt} />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={back}
                  disabled={building}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {error && (
                <span className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </span>
              )}

              {step < 3 ? (
                <button
                  onClick={next}
                  disabled={!canAdvance || building}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-semibold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={!canStart || building}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-semibold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
                >
                  {building ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Building...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      Build my app
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Live prompt preview + recent */}
          {(step >= 2 || recentProjectName) && (
            <div className="mt-5 flex flex-col items-center gap-2">
              {step >= 2 && composedPrompt && (
                <div className="w-full rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-500 max-h-16 overflow-y-auto scrollbar-thin">
                  <span className="text-slate-600">Preview: </span>
                  {composedPrompt}
                </div>
              )}
              {recentProjectName && (
                <span className="text-xs text-slate-600">
                  Recent: <span className="text-emerald-400 font-medium">{recentProjectName}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 1: Category ---------- */
function StepCategory({ category, onSelect }: { category: string | null; onSelect: (id: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-200">What kind of app are you building?</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group rounded-xl border p-3.5 text-left transition-all duration-200 ${
              category === c.id
                ? 'border-emerald-500/60 bg-emerald-500/10 scale-[1.03]'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
            }`}
          >
            <div className="text-2xl mb-1.5">{c.icon}</div>
            <div className={`text-xs font-semibold ${category === c.id ? 'text-emerald-300' : 'text-slate-300'}`}>
              {c.label}
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-600 mt-3 flex items-center gap-1.5">
        <Zap className="w-3 h-3" />
        Pick a starting point — you'll refine it next.
      </p>
    </div>
  );
}

/* ---------- Step 2: Features ---------- */
function StepFeatures({ selected, onToggle }: { selected: string[]; onToggle: (f: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Layers className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-200">What features do you need?</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">Tap to add — this shapes the screens and code we generate.</p>
      <div className="flex flex-wrap gap-2">
        {FEATURE_OPTIONS.map((f) => {
          const active = selected.includes(f);
          return (
            <button
              key={f}
              onClick={() => onToggle(f)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                active
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                  : 'border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {active && <Check className="w-3 h-3" />}
              {f}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-600 mt-4">
        {selected.length === 0 ? 'No features selected — you can skip this step.' : `${selected.length} feature${selected.length > 1 ? 's' : ''} selected.`}
      </p>
    </div>
  );
}

/* ---------- Step 3: Describe ---------- */
function StepDescribe({
  prompt,
  setPrompt,
  composedPreview,
  category,
  features,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  composedPreview: string;
  category: string | null;
  features: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-200">Anything else we should know?</h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">Optional — add details that make your app unique.</p>

      {category && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 mb-3 text-xs text-slate-400 flex items-center gap-2">
          <span className="text-2xl">{CATEGORIES.find((c) => c.id === category)?.icon}</span>
          <span>{CATEGORIES.find((c) => c.id === category)?.label}</span>
          {features.length > 0 && <span className="text-slate-600">· {features.length} features</span>}
        </div>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. Focus on female runners. Use warm, motivational colors. Include a social leaderboard..."
        className="w-full h-24 bg-transparent rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-slate-100 placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition scrollbar-thin"
      />
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 mt-3 text-xs text-slate-500 max-h-14 overflow-y-auto scrollbar-thin">
        <span className="text-slate-600">Final prompt: </span>
        {composedPreview || 'Type above to compose your prompt...'}
      </div>
    </div>
  );
}

/* ---------- Step 4: Platform ---------- */
function StepPlatform({
  platform,
  setPlatform,
  composedPrompt,
}: {
  platform: Platform;
  setPlatform: (p: Platform) => void;
  composedPrompt: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Smartphone className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-200">Which platform are you targeting?</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">We'll generate the right project files for your choice.</p>

      <div className="grid grid-cols-3 gap-3">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlatform(p.id)}
            className={`rounded-xl border p-4 text-center transition-all duration-200 ${
              platform === p.id
                ? 'border-emerald-500/60 bg-emerald-500/10 scale-[1.03]'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
            }`}
          >
            <div className={`flex justify-center mb-2 ${platform === p.id ? 'text-emerald-400' : 'text-slate-400'}`}>
              {p.icon}
            </div>
            <div className={`text-sm font-semibold ${platform === p.id ? 'text-emerald-300' : 'text-slate-300'}`}>{p.label}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 mt-4 text-xs text-slate-400 flex items-center gap-2">
        <Palette className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Your app will be built with colors, navigation, and screens matching your prompt.</span>
      </div>

      <p className="text-[10px] text-slate-600 mt-3 truncate">
        Prompt: {composedPrompt.slice(0, 120)}{composedPrompt.length > 120 ? '...' : ''}
      </p>
    </div>
  );
}
