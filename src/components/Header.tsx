import { Sparkles, Plus, Home, FolderKanban, Palette, Command as CommandIcon, LogOut } from 'lucide-react';

interface HeaderProps {
  projectName?: string;
  appType?: string;
  onNew: () => void;
  onHome: () => void;
  onProjects: () => void;
  onTheme: () => void;
  onCommand: () => void;
  onSignOut: () => void;
}

export default function Header({ projectName, appType, onNew, onHome, onProjects, onTheme, onCommand, onSignOut }: HeaderProps) {
  return (
    <header className="workspace-header flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white z-10">
      <div className="flex items-center gap-3">
        <button onClick={onHome} className="flex items-center gap-3 group">
          <div className="workspace-brand-mark flex items-center justify-center transition-transform group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-slate-800">AppForge</span>
            {projectName && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-sm text-slate-500">{projectName}</span>
                {appType && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 capitalize">
                    {appType}
                  </span>
                )}
              </>
            )}
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onCommand}
          title="Command palette (⌘K)"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <CommandIcon className="w-3.5 h-3.5" />
          <kbd className="text-[10px] text-slate-400">⌘K</kbd>
        </button>

        <button
          onClick={onProjects}
          title="Projects"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <button
          onClick={onTheme}
          title="Theme editor"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Theme</span>
        </button>

        <button
          onClick={onHome}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Home</span>
        </button>

        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#615cf6] text-white hover:bg-[#514ce5] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New app
        </button>

        <button
          onClick={onSignOut}
          title="Sign out"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
