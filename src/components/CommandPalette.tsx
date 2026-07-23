import { useState, useEffect, useRef } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  commands: Command[];
  onClose: () => void;
}

export default function CommandPalette({ open, commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[selectedIdx];
      if (cmd) {
        cmd.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
          />
          <kbd className="text-[10px] text-slate-600 border border-slate-800 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto scrollbar-thin p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-600">No commands found</div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIdx(i)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  i === selectedIdx ? 'bg-slate-800 text-slate-100' : 'text-slate-400'
                }`}
              >
                {cmd.icon && <span className="text-slate-500">{cmd.icon}</span>}
                <span className="flex-1 text-left">{cmd.label}</span>
                    {cmd.shortcut && (
                  <span className="text-xs text-slate-600">{cmd.shortcut}</span>
                )}
                {i === selectedIdx && <CornerDownLeft className="w-3.5 h-3.5 text-slate-600" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
