import { useEffect, useRef, useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode2,
  FileCog,
  FileJson,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Terminal,
  FilePlus2,
  Sparkles,
  Download,
} from 'lucide-react';
import { type ProjectFile } from '@/lib/appEngine';

interface LiveGeneratorProps {
  files: ProjectFile[];
  isBuilding: boolean;
  onDownload?: () => void;
  canDownload?: boolean;
  downloading?: boolean;
}

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children: FileNode[];
  file?: ProjectFile;
}

export default function LiveGenerator({ files, isBuilding, onDownload, canDownload, downloading }: LiveGeneratorProps) {
  const tree = buildFileTree(files);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['src', 'src/screens', 'src/components']));
  const [activePath, setActivePath] = useState<string | null>(null);
  const [revealedFiles, setRevealedFiles] = useState<Set<string>>(new Set());
  const [typedLines, setTypedLines] = useState<Record<string, number>>({});
  const [activeLog, setActiveLog] = useState('');
  const logQueue = useRef<string[]>([]);
  const logTimer = useRef<ReturnType<typeof setInterval>>();
  const fileQueue = useRef<string[]>([]);
  const fileTimer = useRef<ReturnType<typeof setInterval>>();

  // Reset when files list changes (new build)
  useEffect(() => {
    setRevealedFiles(new Set());
    setTypedLines({});
    setActivePath(null);
    fileQueue.current = files.filter((f) => f.type !== 'directory').map((f) => f.path);
  }, [files]);

  // Reveal files one by one
  useEffect(() => {
    if (!isBuilding) {
      // When build done, reveal all instantly and show full content
      setRevealedFiles(new Set(files.map((f) => f.path)));
      const allTyped: Record<string, number> = {};
      files.forEach((f) => { allTyped[f.path] = f.lines; });
      setTypedLines(allTyped);
      setActivePath(null);
      setActiveLog('All files generated successfully.');
      return;
    }

    if (fileQueue.current.length === 0) return;
    const interval = setInterval(() => {
      const next = fileQueue.current.shift();
      if (!next) return;
      const file = files.find((f) => f.path === next);
      if (!file) return;
      setRevealedFiles((prev) => new Set(prev).add(next));
      setActivePath(next);
      // Auto-expand parent dirs
      const parts = next.split('/');
      parts.pop();
      const dir = parts.join('/');
      if (dir) {
        setExpandedPaths((prev) => new Set(prev).add(dir));
      }
      setActiveLog(`Creating ${file.name}...`);
    }, 600);
    fileTimer.current = interval;
    return () => clearInterval(interval);
  }, [isBuilding, files]);

  // Type out the active file's content line by line
  useEffect(() => {
    if (!activePath || !isBuilding) return;
    const file = files.find((f) => f.path === activePath);
    if (!file || file.type === 'directory' || file.type === 'asset') {
      setTypedLines((prev) => ({ ...prev, [activePath]: file?.lines ?? 0 }));
      return;
    }
    const totalLines = file.lines;
    let current = 0;
    setTypedLines((prev) => ({ ...prev, [activePath]: 0 }));
    const typer = setInterval(() => {
      current += Math.max(1, Math.floor(totalLines / 12));
      if (current >= totalLines) {
        current = totalLines;
        clearInterval(typer);
      }
      setTypedLines((prev) => ({ ...prev, [activePath]: current }));
    }, 80);
    return () => clearInterval(typer);
  }, [activePath, isBuilding, files]);

  // Stream build log lines
  useEffect(() => {
    if (!isBuilding) return;
    const interval = setInterval(() => {
      if (logQueue.current.length > 0) {
        setActiveLog(logQueue.current.shift()!);
      }
    }, 400);
    logTimer.current = interval;
    return () => clearInterval(interval);
  }, [isBuilding]);

  return (
    <div className="flex flex-col h-full bg-[#0b1120]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-slate-200">Live Generator</h3>
          {isBuilding ? (
            <span className="flex items-center gap-1 text-[10px] text-cyan-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              generating
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              ready
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-600 font-mono">
          {revealedFiles.size}/{files.filter((f) => f.type !== 'directory').length} files
        </span>
        {onDownload && (
          <button
            onClick={onDownload}
            disabled={!canDownload || downloading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            Download ZIP
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* File tree */}
        <div className="md:w-56 lg:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60 overflow-y-auto scrollbar-thin max-h-[35vh] md:max-h-none">
          <div className="p-2">
            {tree.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                expandedPaths={expandedPaths}
                onToggle={(p) =>
                  setExpandedPaths((prev) => {
                    const next = new Set(prev);
                    if (next.has(p)) next.delete(p);
                    else next.add(p);
                    return next;
                  })
                }
                activePath={activePath}
                onSelect={(p) => {
                  const f = files.find((x) => x.path === p);
                  if (f && f.type !== 'directory') setActivePath(p);
                }}
                revealedFiles={revealedFiles}
              />
            ))}
          </div>
        </div>

        {/* Code pane */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-[200px]">
          <CodePane
            file={activePath ? files.find((f) => f.path === activePath) ?? null : null}
            typedLines={activePath ? typedLines[activePath] ?? 0 : 0}
            isBuilding={isBuilding}
          />
        </div>
      </div>

      {/* Footer log strip */}
      <div className="border-t border-slate-800 bg-black/40 px-3 py-2 font-mono text-[11px] h-8 flex items-center gap-2">
        <span className="text-emerald-400">$</span>
        <span className="text-slate-400 truncate">{activeLog || 'Idle'}</span>
        {isBuilding && <span className="text-cyan-400 cursor-blink" />}
      </div>
    </div>
  );
}

/* ---------- File tree ---------- */

function buildFileTree(files: ProjectFile[]): FileNode[] {
  const root: FileNode[] = [];
  const dirMap = new Map<string, FileNode>();

  for (const file of files) {
    const parts = file.path.split('/');
    let currentPath = '';
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (isLast) {
        if (file.type === 'directory') {
          if (!dirMap.has(currentPath)) {
            const node: FileNode = { name: part, path: currentPath, isDir: true, children: [] };
            dirMap.set(currentPath, node);
            currentLevel.push(node);
          }
        } else {
          currentLevel.push({ name: part, path: currentPath, isDir: false, children: [], file });
        }
      } else {
        let dir = dirMap.get(currentPath);
        if (!dir) {
          dir = { name: part, path: currentPath, isDir: true, children: [] };
          dirMap.set(currentPath, dir);
          currentLevel.push(dir);
        }
        currentLevel = dir.children;
      }
    }
  }

  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(root);
  return root;
}

function TreeNode({
  node,
  depth,
  expandedPaths,
  onToggle,
  activePath,
  onSelect,
  revealedFiles,
}: {
  node: FileNode;
  depth: number;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  activePath: string | null;
  onSelect: (path: string) => void;
  revealedFiles: Set<string>;
}) {
  const isOpen = expandedPaths.has(node.path);
  const isRevealed = node.isDir || revealedFiles.has(node.path);
  if (!isRevealed) return null;

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => onToggle(node.path)}
          className="flex items-center gap-1.5 w-full text-left py-1 px-1.5 rounded hover:bg-slate-800/50 transition-colors"
          style={{ paddingLeft: depth * 12 + 4 }}
        >
          {isOpen ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
          {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /> : <Folder className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="text-xs text-slate-300">{node.name}</span>
        </button>
        {isOpen && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                activePath={activePath}
                onSelect={onSelect}
                revealedFiles={revealedFiles}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activePath === node.path;
  const icon = getFileIcon(node.file);

  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`flex items-center gap-1.5 w-full text-left py-1 px-1.5 rounded transition-colors ${
        isActive ? 'bg-slate-800 text-slate-100' : 'hover:bg-slate-800/40 text-slate-400'
      }`}
      style={{ paddingLeft: depth * 12 + 20 }}
    >
      {icon}
      <span className="text-xs truncate">{node.name}</span>
      {isActive && <Sparkles className="w-3 h-3 text-emerald-400 ml-auto shrink-0" />}
    </button>
  );
}

function getFileIcon(file?: ProjectFile): React.ReactNode {
  if (!file) return <FileText className="w-3.5 h-3.5 text-slate-500" />;
  switch (file.language) {
    case 'tsx':
    case 'ts':
      return <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />;
    case 'json':
      return <FileJson className="w-3.5 h-3.5 text-amber-400" />;
    case 'md':
      return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    case 'css':
      return <FileCode2 className="w-3.5 h-3.5 text-sky-400" />;
    case 'sql':
      return <FileCog className="w-3.5 h-3.5 text-violet-400" />;
    case 'image':
      return <ImageIcon className="w-3.5 h-3.5 text-pink-400" />;
    default:
      return <FileCog className="w-3.5 h-3.5 text-slate-500" />;
  }
}

/* ---------- Code pane with typing effect ---------- */

function CodePane({
  file,
  typedLines,
  isBuilding,
}: {
  file: ProjectFile | null;
  typedLines: number;
  isBuilding: boolean;
}) {
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FilePlus2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-xs text-slate-600">Select a file to view its source</p>
        </div>
      </div>
    );
  }

  if (file.language === 'image') {
    const color = file.content.split(':')[1] ?? '#0f766e';
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <div
            className="w-32 h-32 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg"
            style={{ backgroundColor: color }}
          >
            <ImageIcon className="w-10 h-10 text-white/60" />
          </div>
          <p className="text-xs text-slate-500 font-mono">{file.name}</p>
          <p className="text-[10px] text-slate-600 mt-1">Generated asset placeholder</p>
        </div>
      </div>
    );
  }

  const allLines = file.content.split('\n');
  const visibleCount = isBuilding ? Math.min(typedLines, allLines.length) : allLines.length;

  return (
    <div className="h-full overflow-auto scrollbar-thin bg-[#0b1120]">
      <div className="sticky top-0 flex items-center gap-2 px-3 py-2 border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-sm z-10">
        {getFileIcon(file)}
        <span className="text-xs font-mono text-slate-300 truncate">{file.path}</span>
        <span className="ml-auto text-[10px] text-slate-600">{visibleCount}/{allLines.length}</span>
      </div>
      <pre className="text-[11px] sm:text-xs leading-relaxed font-mono p-3">
        <code>
          {allLines.slice(0, visibleCount).map((line: string, i: number) => (
            <div key={i} className="flex hover:bg-slate-800/30">
              <span className="select-none text-slate-700 text-right pr-3 w-10 shrink-0">{i + 1}</span>
              <span
                className="pl-2 whitespace-pre-wrap break-words flex-1"
                dangerouslySetInnerHTML={{ __html: highlight(line, file.language) }}
              />
            </div>
          ))}
          {isBuilding && visibleCount < allLines.length && (
            <div className="flex">
              <span className="select-none text-slate-700 text-right pr-3 w-10 shrink-0">{visibleCount + 1}</span>
              <span className="pl-2 text-cyan-400 cursor-blink" />
            </div>
          )}
        </code>
      </pre>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(line: string, lang: string): string {
  const esc = escapeHtml(line);
  if (lang === 'json') {
    return esc
      .replace(/(&quot;[^&]*&quot;)(\s*:)/g, '<span style="color:#7dd3fc">$1</span>$2')
      .replace(/:\s*(&quot;[^&]*&quot;)/g, ': <span style="color:#86efac">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span style="color:#fbbf24">$1</span>')
      .replace(/(\b\d+(?:\.\d+)?\b)/g, '<span style="color:#fb923c">$1</span>');
  }
  if (lang === 'tsx' || lang === 'ts') {
    return esc
      .replace(/(\/\/.*$)/g, '<span style="color:#475569">$1</span>')
      .replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;)/g, '<span style="color:#86efac">$1</span>')
      .replace(/\b(import|export|from|default|const|let|return|function|if|else|new|type|interface)\b/g, '<span style="color:#c084fc">$1</span>')
      .replace(/(&lt;\/?)([A-Za-z][\w.]*)/g, '$1<span style="color:#f87171">$2</span>')
      .replace(/([A-Za-z-]+)=/g, '<span style="color:#7dd3fc">$1</span>=')
      .replace(/(\{[^}]*\})/g, '<span style="color:#fbbf24">$1</span>');
  }
  if (lang === 'sql') {
    return esc
      .replace(/(--.*$)/g, '<span style="color:#475569">$1</span>')
      .replace(/('([^']|'')*')/g, '<span style="color:#86efac">$1</span>')
      .replace(/\b(CREATE|TABLE|ALTER|ENABLE|ROW|LEVEL|SECURITY|POLICY|SELECT|INSERT|UPDATE|DELETE|FOR|TO|USING|WITH|CHECK|PRIMARY|KEY|DEFAULT|NOT|NULL|REFERENCES|uuid|text|int|boolean|timestamptz|date|numeric|jsonb|now|gen_random_uuid|auth\.uid|authenticated|on)\b/gi, '<span style="color:#c084fc">$1</span>');
  }
  return esc;
}
