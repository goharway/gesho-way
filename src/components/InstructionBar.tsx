import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Brain } from 'lucide-react';

export interface AIInstruction {
  id: string;
  text: string;
  status: 'processing' | 'done';
  response?: string;
}

interface InstructionBarProps {
  onSend: (text: string) => void;
  instructions: AIInstruction[];
  disabled?: boolean;
}

const SUGGESTIONS = [
  'Add a settings screen',
  'Change the color scheme to blue',
  'Add user login',
  'Add a notifications page',
];

export default function InstructionBar({ onSend, instructions, disabled }: InstructionBarProps) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [instructions]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <div className="workspace-composer border-t border-slate-200 bg-white">
      {/* Instruction history */}
      {instructions.length > 0 && (
        <div
          ref={scrollRef}
          className="max-h-40 overflow-y-auto scrollbar-thin px-4 py-2 space-y-1.5"
        >
          {instructions.map((instr) => (
            <div key={instr.id} className="animate-fade-in-up">
              <div className="flex items-start gap-2">
                <Sparkles className="w-3 h-3 text-[#615cf6] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600">{instr.text}</p>
                  {instr.status === 'processing' ? (
                    <p className="text-[10px] text-blue-500 flex items-center gap-1 mt-0.5">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Processing...
                    </p>
                  ) : instr.response ? (
                    <p className="text-[10px] text-emerald-600 mt-0.5">{instr.response}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestion chips when focused and empty */}
      {focused && !text && instructions.length === 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 animate-fade-in-up">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setText(s)}
              className="text-[10px] px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <Brain className="w-4 h-4 text-[#615cf6]" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium hidden sm:inline">Ask AI</span>
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={disabled}
            placeholder="Type a command — e.g. 'add a profile screen' or 'make it dark blue'..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-10 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#615cf6]/20 focus:border-[#615cf6]/40 transition disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-[#615cf6] hover:bg-[#615cf6]/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
