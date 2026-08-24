import { useMemo, useState, useEffect } from 'react';
import {
  Code2,
  Copy,
  Check,
  FileJson,
  FileType2,
  Hash,
  Braces,
  ChevronRight,
  ChevronDown,
  Smartphone,
  Tablet,
  Monitor,
  Layers,
} from 'lucide-react';
import type { AppRegion, ScreenSpec, ColorScheme } from '@/types/builder';

export type CodeFormat = 'json' | 'jsx' | 'spec';

interface CodeViewerProps {
  region: AppRegion | null;
  colorScheme: ColorScheme;
  appName: string;
}

const FORMAT_TABS: { id: CodeFormat; label: string; icon: React.ReactNode }[] = [
  { id: 'json', label: 'JSON', icon: <FileJson className="w-3.5 h-3.5" /> },
  { id: 'jsx', label: 'JSX', icon: <Code2 className="w-3.5 h-3.5" /> },
  { id: 'spec', label: 'Spec', icon: <FileType2 className="w-3.5 h-3.5" /> },
];

export default function CodeViewer({ region, colorScheme, appName }: CodeViewerProps) {
  const [format, setFormat] = useState<CodeFormat>('json');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ root: true });

  useEffect(() => {
    setCopied(false);
  }, [format, region?.id]);

  const code = useMemo(() => {
    if (!region) return '// No region selected';
    if (format === 'json') return JSON.stringify(region.spec, null, 2);
    if (format === 'spec') return renderSpecSummary(region.spec, region, appName);
    return renderJSX(region.spec, colorScheme);
  }, [region, format, colorScheme, appName]);

  const lineCount = useMemo(() => code.split('\n').length, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be blocked; ignore silently
    }
  };

  if (!region) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Code2 className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">Select a screen to inspect its code</p>
          <p className="text-xs text-slate-600 mt-1">JSON · JSX · Spec view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2 min-w-0">
          <Braces className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-mono text-slate-300 truncate">{region.region_name}</span>
          <span className="hidden md:inline text-[10px] text-slate-600 truncate">— {region.region_type}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-600">
            <Hash className="w-3 h-3" />
            {lineCount} lines
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden xs:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Format tabs */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-800 bg-slate-950/40">
        {FORMAT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFormat(tab.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
              format === tab.id
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-600 hidden lg:flex items-center gap-1">
          <Layers className="w-3 h-3" />
          {region.status === 'complete' ? 'Compiled' : 'Pending'}
        </span>
      </div>

      {/* Code body — responsive: scrollable, wraps on small screens */}
      <div className="flex-1 overflow-auto scrollbar-thin bg-[#0b1120]">
        {format === 'spec' ? (
          <SpecTreeView spec={region.spec} expanded={expanded} setExpanded={setExpanded} />
        ) : (
          <CodeBlock code={code} format={format} />
        )}
      </div>

      {/* Footer — device hint */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-800 bg-slate-900/60 text-[10px] text-slate-600">
        <span className="flex items-center gap-1.5">
          <Smartphone className="w-3 h-3 lg:hidden" />
          <Tablet className="w-3 h-3 hidden lg:block xl:hidden" />
          <Monitor className="w-3 h-3 hidden xl:block" />
          <span className="capitalize">
            <span className="lg:hidden">mobile</span>
            <span className="hidden lg:inline xl:hidden">tablet</span>
            <span className="hidden xl:inline">desktop</span> view
          </span>
        </span>
        <span className="font-mono">{region.spec.elements.length} elements</span>
      </div>
    </div>
  );
}

/* ---------- Code block with line numbers + lightweight syntax highlight ---------- */

function CodeBlock({ code, format }: { code: string; format: CodeFormat }) {
  const lines = code.split('\n');
  return (
    <pre className="text-[11px] sm:text-xs leading-relaxed font-mono">
      <code className="block">
        {lines.map((line, i) => (
          <div key={i} className="flex hover:bg-slate-800/30">
            <span className="select-none text-slate-700 text-right pr-3 pl-3 w-10 sm:w-12 shrink-0 border-r border-slate-800/60">
              {i + 1}
            </span>
            <span
              className="pl-3 pr-4 whitespace-pre-wrap break-words flex-1"
              dangerouslySetInnerHTML={{ __html: highlight(line, format) }}
            />
          </div>
        ))}
      </code>
    </pre>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlight(line: string, format: CodeFormat): string {
  const esc = escapeHtml(line);
  if (format === 'json') {
    return esc
      .replace(/(&quot;[^&]*&quot;)(\s*:)/g, '<span style="color:#7dd3fc">$1</span>$2')
      .replace(/:\s*(&quot;[^&]*&quot;)/g, ': <span style="color:#86efac">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span style="color:#fbbf24">$1</span>')
      .replace(/(\b\d+(?:\.\d+)?\b)/g, '<span style="color:#fb923c">$1</span>');
  }
  // jsx
  return esc
    .replace(/(&lt;\/?)([A-Za-z][\w.]*)/g, '$1<span style="color:#f87171">$2</span>')
    .replace(/([A-Za-z-]+)=(&quot;[^&]*&quot;)/g, '<span style="color:#7dd3fc">$1</span>=<span style="color:#86efac">$2</span>')
    .replace(/(\{[^}]*\})/g, '<span style="color:#fbbf24">$1</span>');
}

/* ---------- Spec tree view (collapsible) ---------- */

function SpecTreeView({
  spec,
  expanded,
  setExpanded,
}: {
  spec: ScreenSpec;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="p-3 text-xs font-mono space-y-1">
      <SpecRow
        label="name"
        value={spec.name}
        type="string"
        depth={0}
        expanded={expanded}
        toggle={toggle}
        nodeKey="name"
      />
      <SpecRow
        label="regionType"
        value={spec.regionType}
        type="string"
        depth={0}
        expanded={expanded}
        toggle={toggle}
        nodeKey="regionType"
      />
      <SpecRow
        label="description"
        value={spec.description}
        type="string"
        depth={0}
        expanded={expanded}
        toggle={toggle}
        nodeKey="description"
      />
      <div>
        <SpecToggle
          label="elements"
          count={spec.elements.length}
          depth={0}
          isOpen={!!expanded.elements}
          onToggle={() => toggle('elements')}
        />
        {expanded.elements !== false &&
          spec.elements.map((el, i) => (
            <div key={i} className="pl-4 border-l border-slate-800/50 ml-2 mt-1">
              <SpecToggle
                label={`[${i}] ${el.kind}`}
                depth={1}
                isOpen={!!expanded[`el-${i}`]}
                onToggle={() => toggle(`el-${i}`)}
              />
              {expanded[`el-${i}`] && (
                <div className="pl-3 space-y-0.5 mt-1">
                  {el.label && <SpecLeaf label="label" value={el.label} depth={2} />}
                  {el.value && <SpecLeaf label="value" value={el.value} depth={2} />}
                  {el.placeholder && <SpecLeaf label="placeholder" value={el.placeholder} depth={2} />}
                  {el.variant && <SpecLeaf label="variant" value={el.variant} depth={2} />}
                  {el.items && (
                    <div className="pl-3">
                      <span className="text-slate-500">items: [</span>
                      {el.items.map((it, j) => (
                        <div key={j} className="pl-3 text-emerald-300/80">
                          {j}: <span className="text-emerald-300">{it}</span>
                        </div>
                      ))}
                      <span className="text-slate-500">]</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

function SpecRow({
  label,
  value,
  depth,
}: {
  label: string;
  value: string;
  type: string;
  depth: number;
  expanded: Record<string, boolean>;
  toggle: (key: string) => void;
  nodeKey: string;
}) {
  return (
    <div className="flex items-center gap-2" style={{ paddingLeft: depth * 16 }}>
      <span className="text-sky-300">{label}:</span>
      <span className="text-emerald-300">{value}</span>
    </div>
  );
}

function SpecLeaf({ label, value, depth }: { label: string; value: string; depth: number }) {
  return (
    <div className="flex items-center gap-2" style={{ paddingLeft: depth * 12 }}>
      <span className="text-sky-300">{label}:</span>
      <span className="text-emerald-300">{value}</span>
    </div>
  );
}

function SpecToggle({
  label,
  count,
  depth,
  isOpen,
  onToggle,
}: {
  label: string;
  count?: number;
  depth: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 hover:bg-slate-800/40 rounded px-1 py-0.5 w-full text-left"
      style={{ paddingLeft: depth * 12 }}
    >
      {isOpen ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
      <span className="text-slate-300">{label}</span>
      {count !== undefined && <span className="text-slate-600">({count})</span>}
    </button>
  );
}

/* ---------- Generators ---------- */

function renderSpecSummary(spec: ScreenSpec, region: AppRegion, appName: string): string {
  const lines: string[] = [
    `SCREEN SPEC — ${spec.name}`,
    `${'='.repeat(40)}`,
    `App:           ${appName}`,
    `Region type:   ${region.region_type}`,
    `Status:        ${region.status}`,
    `Elements:      ${spec.elements.length}`,
    `Description:   ${spec.description}`,
    '',
    'ELEMENTS BREAKDOWN',
    `${'-'.repeat(40)}`,
  ];
  spec.elements.forEach((el, i) => {
    lines.push(`[${i}] ${el.kind}${el.label ? ` — "${el.label}"` : ''}${el.variant ? ` (${el.variant})` : ''}`);
    if (el.items) lines.push(`    items: [${el.items.length}] ${el.items.slice(0, 4).join(', ')}${el.items.length > 4 ? '...' : ''}`);
    if (el.placeholder) lines.push(`    placeholder: "${el.placeholder}"`);
    if (el.value) lines.push(`    value: "${el.value}"`);
  });
  return lines.join('\n');
}

function renderJSX(spec: ScreenSpec, scheme: ColorScheme): string {
  const componentName = spec.name.replace(/[^a-zA-Z0-9]/g, '') || 'Screen';
  const lines: string[] = [
    `import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';`,
    '',
    `export default function ${componentName}() {`,
    `  return (`,
    `    <ScrollView style={{ backgroundColor: '${scheme.background}' }}>`,
  ];
  const q = (s?: string) => JSON.stringify(s ?? '');
  spec.elements.forEach((el) => {
    switch (el.kind) {
      case 'header':
        lines.push(`      <Text style={styles.header}>{${q(el.label)}}</Text>`);
        break;
      case 'text':
        lines.push(`      <Text style={styles.body}>{${q(el.label)}}</Text>`);
        break;
      case 'button':
        lines.push(`      <TouchableOpacity style={styles.btn}>`);
        lines.push(`        <Text style={styles.btnText}>{${q(el.label)}}</Text>`);
        lines.push(`      </TouchableOpacity>`);
        break;
      case 'input':
        lines.push(`      <TextInput placeholder={${q(el.placeholder)}} style={styles.input} />`);
        break;
      case 'card':
        lines.push(`      <View style={styles.card}>`);
        if (el.label) lines.push(`        <Text style={styles.cardTitle}>{${q(el.label)}}</Text>`);
        if (el.value) lines.push(`        <Text style={styles.cardValue}>{${q(el.value)}}</Text>`);
        lines.push(`      </View>`);
        break;
      case 'list':
        el.items?.forEach((item) => {
          lines.push(`      <View style={styles.listItem}>`);
          lines.push(`        <Text>{${q(item)}}</Text>`);
          lines.push(`      </View>`);
        });
        break;
      case 'stat':
        lines.push(`      <View style={styles.stat}>`);
        lines.push(`        <Text style={styles.statLabel}>{${q(el.label)}}</Text>`);
        lines.push(`        <Text style={styles.statValue}>{${q(el.value)}}</Text>`);
        lines.push(`      </View>`);
        break;
      case 'avatar':
        lines.push(`      <View style={styles.avatarRow}>`);
        lines.push(`        <View style={styles.avatar}><Text>{${q(el.label?.charAt(0))}}</Text></View>`);
        lines.push(`        <Text>{${q(el.label)}}</Text>`);
        lines.push(`      </View>`);
        break;
      case 'image':
        lines.push(`      <Image source={{ uri: ${q(el.label)} }} style={styles.image} />`);
        break;
      case 'tabbar':
        lines.push(`      <TabBar />`);
        break;
    }
  });
  lines.push(`    </ScrollView>`);
  lines.push(`  );`);
  lines.push(`}`);
  return lines.join('\n');
}
