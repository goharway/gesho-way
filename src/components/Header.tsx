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
    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm z-10">
      <div className="flex items-center gap-3">
        <button onClick={onHome} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center transition-transform group-hover:scale-110">
            <Sparkles className="w-4 h-4 text-slate-900" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-slate-100">AppForge</span>
            {projectName && (
              <>
                <span className="text-slate-700">/</span>
                <span className="text-sm text-slate-400">{projectName}</span>
                {appType && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
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
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <CommandIcon className="w-3.5 h-3.5" />
          <kbd className="text-[10px] text-slate-600">⌘K</kbd>
        </button>

        <button
          onClick={onProjects}
          title="Projects"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Projects</span>
        </button>

        <button
          onClick={onTheme}
          title="Theme editor"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Theme</span>
        </button>

        <button
          onClick={onHome}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Home</span>
        </button>

        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New app
        </button>

        <button
          onClick={onSignOut}
          title="Sign out"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
