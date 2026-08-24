import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Smartphone,
  Apple,
  Bot,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Clock,
  ArrowRight,
  RotateCcw,
  Pencil,
  Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { platformLabel } from '@/lib/appEngine';
import type { Platform, Project } from '@/types/builder';

interface ProjectsDashboardProps {
  onNew: () => void;
  onOpen: (project: Project) => void;
}

interface ProjectWithStats extends Project {
  region_count?: number;
  stage_count?: number;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  ios: <Apple className="w-4 h-4" />,
  android: <Smartphone className="w-4 h-4" />,
  both: <Bot className="w-4 h-4" />,
};

export default function ProjectsDashboard({ onNew, onOpen }: ProjectsDashboardProps) {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'building' | 'completed'>('all');
  const [renaming, setRenaming] = useState<ProjectWithStats | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchErr } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchErr || !data) {
      setError(fetchErr?.message ?? 'Could not load projects. Please try again.');
      setLoading(false);
      return;
    }

    const projectRows = data as unknown as Project[];
    if (projectRows.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const projectIds = projectRows.map((p) => p.id);
    const [{ count: regionCount }, { count: stageCount }] = await Promise.all([
      supabase.from('app_regions').select('*', { count: 'exact', head: true }).in('project_id', projectIds),
      supabase.from('build_stages').select('*', { count: 'exact', head: true }).in('project_id', projectIds),
    ]);

    const enriched = projectRows.map((p) => ({
      ...p,
      region_count: regionCount ?? 0,
      stage_count: stageCount ?? 0,
    }));

    setProjects(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error: delErr } = await supabase.from('projects').delete().eq('id', id);
    if (delErr) {
      setError(`Could not delete "${name}": ${delErr.message}`);
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const startRename = (project: ProjectWithStats) => {
    setRenaming(project);
    setRenameValue(project.name);
  };

  const cancelRename = () => {
    setRenaming(null);
    setRenameValue('');
    setSavingRename(false);
  };

  const confirmRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    setSavingRename(true);
    const { error: renameErr } = await supabase
      .from('projects')
      .update({ name: renameValue.trim() })
      .eq('id', renaming.id);
    setSavingRename(false);
    if (renameErr) {
      setError(`Could not rename project: ${renameErr.message}`);
      return;
    }
    setProjects((prev) =>
      prev.map((p) => (p.id === renaming.id ? { ...p, name: renameValue.trim() } : p)),
    );
    cancelRename();
  };

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.prompt.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
            <p className="text-sm text-slate-500 mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-semibold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New App
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
            />
          </div>
          <div className="inline-flex items-center gap-0.5 rounded-xl border border-slate-800 bg-slate-900/60 p-0.5">
            {(['all', 'building', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                  filter === f ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-sm text-red-400 mb-1">Something went wrong</p>
            <p className="text-xs text-slate-500 mb-4">{error}</p>
            <button
              onClick={fetchProjects}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center mx-auto mb-5 ring-1 ring-slate-800">
              <Plus className="w-9 h-9 text-emerald-400/60" />
            </div>
            <h3 className="text-base font-semibold text-slate-300 mb-1">
              {search || filter !== 'all' ? 'No projects match your filters' : 'No projects yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Create your first app to get started — it only takes a minute.'}
            </p>
            {!search && filter === 'all' && (
              <button
                onClick={onNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-semibold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Create your first app
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => onOpen(p)}
                onDelete={() => handleDelete(p.id, p.name)}
                onRename={() => startRename(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Rename modal */}
      {renaming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up"
          onClick={cancelRename}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Rename project</h3>
            </div>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') cancelRename();
              }}
              autoFocus
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Project name"
            />
            <div className="flex gap-2">
              <button
                onClick={cancelRename}
                className="flex-1 rounded-lg py-2.5 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                disabled={!renameValue.trim() || savingRename}
                className="flex-1 rounded-lg py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                {savingRename ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onDelete,
  onRename,
}: {
  project: ProjectWithStats;
  onOpen: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const timeAgo = getTimeAgo(project.created_at);

  return (
    <div
      className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition-all cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
            {PLATFORM_ICONS[project.platform] ?? <Smartphone className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 truncate max-w-[150px]">{project.name}</h3>
            <p className="text-xs text-slate-500">{platformLabel(project.platform as Platform)}</p>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <p className="text-xs text-slate-500 line-clamp-2 mb-4 min-h-[2rem]">
        {project.prompt}
      </p>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
          <span>{project.region_count ?? 0} screens</span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
      </div>

      {/* Action buttons — rename + delete */}
      <div className="absolute top-3 right-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="p-1.5 rounded-lg text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
          title="Rename project"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
        title="Delete project"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (status === 'building') {
    return (
      <span className="flex items-center gap-1 text-xs text-cyan-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-red-400">
      <AlertCircle className="w-3.5 h-3.5" />
    </span>
  );
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
