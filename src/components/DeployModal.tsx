import { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  Loader2,
  CheckCircle2,
  X,
  Copy,
  Check,
  ExternalLink,
  Upload,
  Package,
  ShieldCheck,
  Globe,
} from 'lucide-react';

interface DeployModalProps {
  open: boolean;
  onClose: () => void;
  appName: string;
  projectId: string;
  platform: string;
}

const DEPLOY_STEPS = [
  { label: 'Bundling production assets', icon: Package },
  { label: 'Uploading to build server', icon: Upload },
  { label: 'Running security checks', icon: ShieldCheck },
  { label: 'Generating preview link', icon: Globe },
];

export default function DeployModal({ open, onClose, appName, projectId, platform }: DeployModalProps) {
  const [deploying, setDeploying] = useState(false);
  const [done, setDone] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/preview/${projectId}`;

  const reset = useCallback(() => {
    setDeploying(false);
    setDone(false);
    setCurrentStep(-1);
    setCopied(false);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const startDeploy = () => {
    setDeploying(true);
    setDone(false);
    setCurrentStep(0);
  };

  useEffect(() => {
    if (!deploying || done) return;
    if (currentStep >= DEPLOY_STEPS.length) {
      setDeploying(false);
      setDone(true);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStep((s) => s + 1);
    }, 1100);
    return () => clearTimeout(timer);
  }, [deploying, currentStep, done]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked */
    }
  };

  if (!open) return null;

  const platformLabel = platform === 'ios' ? 'iOS App Store' : platform === 'android' ? 'Google Play' : 'iOS + Android';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-slate-900" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Deploy {appName}</h2>
              <p className="text-xs text-slate-500">{platformLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {!deploying && !done && (
            <>
              <p className="text-sm text-slate-400">
                Your app is ready to deploy. This will bundle your project, run security checks, and generate a shareable preview link.
              </p>
              <div className="space-y-2">
                {DEPLOY_STEPS.map((step) => (
                  <div key={step.label} className="flex items-center gap-2.5 text-xs text-slate-500">
                    <step.icon className="w-4 h-4 text-slate-600" />
                    {step.label}
                  </div>
                ))}
              </div>
              <button
                onClick={startDeploy}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
              >
                <Rocket className="w-4 h-4" />
                Start deployment
              </button>
            </>
          )}

          {deploying && (
            <div className="space-y-3">
              {DEPLOY_STEPS.map((step, i) => {
                const isComplete = i < currentStep;
                const isActive = i === currentStep;
                const isPending = i > currentStep;
                return (
                  <div
                    key={step.label}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all ${
                      isActive ? 'bg-slate-800/60' : ''
                    }`}
                  >
                    <div className="shrink-0">
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <step.icon className="w-4 h-4 text-slate-700" />
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors ${
                        isComplete ? 'text-slate-300' : isActive ? 'text-slate-100' : 'text-slate-600'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isActive && (
                      <div className="flex-1 h-0.5 rounded-full bg-slate-800 overflow-hidden ml-2">
                        <div className="h-full shimmer-bar rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {done && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3 animate-node-pop">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">Deployment successful!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your app has been bundled and is ready to share.
                </p>
              </div>

              {/* Shareable link */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Globe className="w-3.5 h-3.5" />
                  Preview link
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-300 truncate focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open preview
                </a>
              </div>

              <button
                onClick={onClose}
                className="w-full rounded-xl py-2.5 bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
