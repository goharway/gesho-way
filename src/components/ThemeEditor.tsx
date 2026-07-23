import { useState } from 'react';
import { X, Palette, Sun, Moon, RotateCcw, Check } from 'lucide-react';
import type { ColorScheme, ThemeMode } from '@/types/builder';

interface ThemeEditorProps {
  open: boolean;
  colorScheme: ColorScheme;
  themeMode: ThemeMode;
  onClose: () => void;
  onChange: (scheme: ColorScheme) => void;
  onModeChange: (mode: ThemeMode) => void;
  onReset: () => void;
}

const COLOR_FIELDS: { key: keyof ColorScheme; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
];

const PRESETS: { name: string; scheme: ColorScheme }[] = [
  {
    name: 'Emerald',
    scheme: { primary: '#0f766e', secondary: '#14b8a6', accent: '#f59e0b', background: '#f0fdfa', surface: '#ffffff', text: '#042f2e' },
  },
  {
    name: 'Ocean',
    scheme: { primary: '#2563eb', secondary: '#3b82f6', accent: '#06b6d4', background: '#f0f9ff', surface: '#ffffff', text: '#0c4a6e' },
  },
  {
    name: 'Sunset',
    scheme: { primary: '#e11d48', secondary: '#f43f5e', accent: '#fb923c', background: '#fff1f2', surface: '#ffffff', text: '#4c0519' },
  },
  {
    name: 'Forest',
    scheme: { primary: '#15803d', secondary: '#22c55e', accent: '#eab308', background: '#f0fdf4', surface: '#ffffff', text: '#14532d' },
  },
  {
    name: 'Slate',
    scheme: { primary: '#475569', secondary: '#64748b', accent: '#0ea5e9', background: '#f8fafc', surface: '#ffffff', text: '#0f172a' },
  },
  {
    name: 'Rose',
    scheme: { primary: '#be185d', secondary: '#ec4899', accent: '#8b5cf6', background: '#fdf2f8', surface: '#ffffff', text: '#500724' },
  },
];

export default function ThemeEditor({
  open,
  colorScheme,
  themeMode,
  onClose,
  onChange,
  onModeChange,
  onReset,
}: ThemeEditorProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  if (!open) return null;

  const handlePreset = (name: string, scheme: ColorScheme) => {
    setActivePreset(name);
    onChange(scheme);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 overflow-y-auto scrollbar-thin animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Theme Editor</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Appearance</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onModeChange('light')}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  themeMode === 'light'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-slate-100'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => onModeChange('dark')}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  themeMode === 'dark'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-slate-100'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
          </section>

          <section>
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Presets</h4>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => handlePreset(p.name, p.scheme)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all ${
                    activePreset === p.name
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex gap-1">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.scheme.primary }} />
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.scheme.secondary }} />
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.scheme.accent }} />
                  </div>
                  <span className="text-[10px] text-slate-400">{p.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Custom Colors</h4>
            <div className="space-y-2.5">
              {COLOR_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-slate-300">{f.label}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">{colorScheme[f.key]}</span>
                    <input
                      type="color"
                      value={colorScheme[f.key]}
                      onChange={(e) => {
                        setActivePreset(null);
                        onChange({ ...colorScheme, [f.key]: e.target.value });
                      }}
                      className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button
            onClick={() => {
              onReset();
              setActivePreset(null);
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}
