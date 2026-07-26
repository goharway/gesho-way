import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Brain,
  Layout,
  Palette,
  Smartphone,
  Database,
  Code2,
  TestTube,
  Rocket,
  Check,
  Loader2,
  AlertCircle,
  Terminal,
  Zap,
  GitBranch,
} from 'lucide-react';
import type { StageType, BuildStage } from '@/types/builder';

const STAGE_ICONS: Record<StageType, React.ReactNode> = {
  analysis: <Brain className="w-4 h-4" />,
  scaffold: <Layout className="w-4 h-4" />,
  design: <Palette className="w-4 h-4" />,
  screens: <Smartphone className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
  logic: <Code2 className="w-4 h-4" />,
  testing: <TestTube className="w-4 h-4" />,
  deploy: <Rocket className="w-4 h-4" />,
};

interface BuildStagesProps {
  stages: BuildStage[];
  activeLog: string;
}

export default function BuildStages({ stages, activeLog }: BuildStagesProps) {
  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const inProgressIdx = stages.findIndex((s) => s.status === 'in_progress');
  const allDone = stages.length > 0 && completedCount === stages.length;
  const progress = stages.length > 0 ? (completedCount / stages.length) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${allDone ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
          <h2 className="text-sm font-semibold text-slate-200">Build Pipeline</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GitBranch className="w-3 h-3 text-slate-600" />
          <span className="text-xs text-slate-500 font-mono">
            {completedCount}/{stages.length}
          </span>
        </div>
      </div>

      {/* Progress rail */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
            {allDone ? 'Deployment ready' : inProgressIdx >= 0 ? 'Compiling' : 'Queued'}
          </span>
          <span className="text-[10px] font-mono text-slate-500">{Math.round(progress)}%</span>
        </div>
        <div className="relative h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
          {!allDone && progress > 0 && (
            <div
              className="absolute inset-y-0 shimmer-bar"
              style={{ left: `${Math.max(0, progress - 8)}%`, width: '16%' }}
            />
          )}
        </div>
      </div>

      {/* Pipeline stages — vertical connector line */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-2">
        <div className="relative">
          {/* Animated connector */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-800" />
          <div
            className="absolute left-[15px] top-2 w-px bg-gradient-to-b from-cyan-400 to-emerald-400 transition-all duration-700 ease-out"
            style={{
              height: `${progress}%`,
              transformOrigin: 'top',
            }}
          />

          <div className="space-y-1">
            {stages.map((stage, idx) => (
              <StageNode
                key={stage.id}
                stage={stage}
                index={idx}
                isActive={stage.status === 'in_progress'}
                isLast={idx === stages.length - 1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Terminal log */}
      <div className="border-t border-slate-800 bg-black/50 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Terminal className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">Console</span>
        </div>
        <div className="rounded-lg bg-black/40 border border-slate-800/80 p-2.5 font-mono text-[11px] h-24 overflow-y-auto scrollbar-thin">
          {activeLog ? (
            <span key={activeLog} className="text-emerald-400 animate-log-stream inline-block cursor-blink">
              {activeLog}
            </span>
          ) : (
            <span className="text-slate-600">Waiting for output...</span>
          )}
        </div>
      </div>
    </div>
  );
}

function StageNode({ stage, index, isActive, isLast }: { stage: BuildStage; index: number; isActive: boolean; isLast: boolean }) {
  const icon = STAGE_ICONS[stage.stage_type as StageType] ?? <Search className="w-4 h-4" />;
  const isCompleted = stage.status === 'completed';
  const isPending = stage.status === 'pending';
  const isFailed = stage.status === 'failed';

  return (
    <div
      className="relative flex items-center gap-3 pl-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 55}ms`, opacity: 0 }}
    >
      {/* Node circle on the connector line */}
      <div className="relative z-10 shrink-0" style={{ width: 32, height: 32 }}>
        <div
          className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isCompleted
              ? 'bg-emerald-500/20 border border-emerald-500/60'
              : isActive
                ? 'bg-cyan-500/20 border border-cyan-400 animate-active-glow'
                : isFailed
                  ? 'bg-red-500/20 border border-red-500/60'
                  : 'bg-slate-900 border border-slate-700'
          }`}
        >
          {isActive && <span className="absolute inset-0 rounded-full ring-pulse" />}
          {isCompleted ? (
            <Check className="w-4 h-4 text-emerald-400 animate-node-pop" />
          ) : isActive ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : isFailed ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <span className={isPending ? 'text-slate-600' : 'text-slate-400'}>{icon}</span>
          )}
        </div>
      </div>

      {/* Stage label + sub-status */}
      <div className={`flex-1 min-w-0 py-2 transition-all duration-300 ${isPending ? 'opacity-40' : isCompleted ? 'opacity-80' : 'opacity-100'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-200 truncate font-medium">{stage.stage_name}</span>
          {isActive && (
            <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-cyan-400 shrink-0">
              <Zap className="w-2.5 h-2.5" />
              running
            </span>
          )}
          {isCompleted && (stage.artifactCount ?? 0) > 0 && (
            <span className="text-[9px] font-mono text-emerald-500/70 shrink-0">
              +{stage.artifactCount}
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-600 mt-0.5 truncate">
          {isCompleted ? `${stage.artifactCount ?? 0} file${(stage.artifactCount ?? 0) === 1 ? '' : 's'} produced` : isActive ? (stage.logs?.split('\n')[0] || 'Processing...') : isFailed ? 'Failed' : 'Pending'}
        </div>
      </div>

      {/* Right edge status bar */}
      <div className="shrink-0 w-1 h-8 rounded-full overflow-hidden bg-slate-800/60">
        {isCompleted ? (
          <div className="w-full h-full bg-emerald-400 transition-all duration-500" />
        ) : isActive ? (
          <div className="w-full h-full shimmer-bar" />
        ) : null}
      </div>
    </div>
  );
}
