import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2, Rocket, CheckCircle2, Command as CommandIcon, Eye, Code2, Columns2, Zap, Download, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { downloadProjectZip } from '@/lib/download';
import {
  parsePrompt,
  STAGE_DEFINITIONS,
  STAGE_PRODUCERS,
  stageLogs,
  platformLabel,
  getDevicePreset,
  applyDarkMode,
  generateProjectFiles,
} from '@/lib/appEngine';
import type {
  AppRegion,
  AppSpec,
  BuildStage,
  ColorScheme,
  DeviceType,
  Platform,
  Project,
  ProjectFile,
  ScreenElement,
  StageType,
  ThemeMode,
} from '@/types/builder';
import PromptScreen from '@/components/PromptScreen';
import BuildStages from '@/components/BuildStages';
import PhonePreview from '@/components/PhonePreview';
import RegionModal from '@/components/RegionModal';
import Header from '@/components/Header';
import DeviceSwitcher from '@/components/DeviceSwitcher';
import ThemeEditor from '@/components/ThemeEditor';
import ProjectsDashboard from '@/components/ProjectsDashboard';
import CommandPalette, { type Command } from '@/components/CommandPalette';
import CodeViewer from '@/components/CodeViewer';
import LiveGenerator from '@/components/LiveGenerator';
import AuthScreen from '@/components/AuthScreen';
import InstructionBar, { type AIInstruction } from '@/components/InstructionBar';

type View = 'prompt' | 'builder' | 'dashboard';
type InspectorMode = 'preview' | 'code' | 'split' | 'live';

const DEFAULT_COLOR_SCHEME: ColorScheme = {
  primary: '#0f766e',
  secondary: '#14b8a6',
  accent: '#f59e0b',
  background: '#f0fdfa',
  surface: '#ffffff',
  text: '#042f2e',
};

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [view, setView] = useState<View>('prompt');
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<BuildStage[]>([]);
  const [regions, setRegions] = useState<AppRegion[]>([]);
  const [activeLog, setActiveLog] = useState('');
  const [modalRegion, setModalRegion] = useState<AppRegion | null>(null);
  const [recentProjectName, setRecentProjectName] = useState<string>();
  const [downloading, setDownloading] = useState(false);
  const buildTimer = useRef<ReturnType<typeof setTimeout>>();

  const [deviceType, setDeviceType] = useState<DeviceType>('iphone');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [customColors, setCustomColors] = useState<ColorScheme | null>(null);
  const [themeEditorOpen, setThemeEditorOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('live');
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [instructions, setInstructions] = useState<AIInstruction[]>([]);

  const device = getDevicePreset(deviceType);

  const baseColorScheme = project?.config?.colorScheme ?? DEFAULT_COLOR_SCHEME;
  const colorScheme = customColors ?? baseColorScheme;
  const activeColorScheme = themeMode === 'dark' ? applyDarkMode(colorScheme) : colorScheme;

  const handleStart = useCallback(async (prompt: string, platform: Platform) => {
    const spec = parsePrompt(prompt);

    const { data: proj, error: projErr } = await supabase
      .from('projects')
      .insert({
        name: spec.appName,
        prompt,
        platform,
        app_type: spec.appType,
        status: 'building',
        config: { colorScheme: spec.colorScheme },
      })
      .select()
      .single();

    if (projErr || !proj) {
      throw new Error(projErr?.message ?? 'Failed to create project');
    }
    const projectRow = proj as unknown as Project;
    setProject(projectRow);
    setRecentProjectName(projectRow.name);
    setCustomColors(null);
    setThemeMode('light');
    setView('builder');

    const stageRows = STAGE_DEFINITIONS.map((s, i) => ({
      project_id: projectRow.id,
      stage_name: s.name,
      stage_type: s.type,
      status: 'pending',
      logs: '',
      sort_order: i,
    }));
    const { data: insertedStages, error: stageErr } = await supabase
      .from('build_stages')
      .insert(stageRows)
      .select();
    if (stageErr || !insertedStages) {
      await supabase.from('projects').delete().eq('id', projectRow.id);
      throw new Error(stageErr?.message ?? 'Failed to create build stages');
    }
    setStages(insertedStages as unknown as BuildStage[]);

    const regionRows = spec.screens.map((screen, i) => ({
      project_id: projectRow.id,
      region_name: screen.name,
      region_type: screen.regionType,
      status: screen.intentionallyIncomplete ? 'incomplete' : 'complete',
      spec: screen,
      description: screen.description,
      sort_order: i,
    }));
    const { data: insertedRegions, error: regionErr } = await supabase
      .from('app_regions')
      .insert(regionRows)
      .select();
    if (regionErr || !insertedRegions) {
      await supabase.from('projects').delete().eq('id', projectRow.id);
      throw new Error(regionErr?.message ?? 'Failed to create app regions');
    }
    setRegions(insertedRegions as unknown as AppRegion[]);

    setProjectFiles([]);
    runBuildPipeline(projectRow.id, spec);
  }, []);

  const runBuildPipeline = useCallback((projectId: string, spec: AppSpec) => {
    const stageDefs = STAGE_DEFINITIONS;
    let stageIdx = 0;
    const abort = new AbortController();

    const persistStage = async (stageType: string, status: string, logs?: string) => {
      const update: Record<string, string> = { status };
      if (logs !== undefined) update.logs = logs;
      const { error } = await supabase
        .from('build_stages')
        .update(update)
        .eq('project_id', projectId)
        .eq('stage_type', stageType);
      if (error) {
        console.warn(`[pipeline] failed to persist stage ${stageType}:`, error.message);
      }
    };

    const runNextStage = () => {
      if (abort.signal.aborted) return;
      if (stageIdx >= stageDefs.length) {
        supabase.from('projects').update({ status: 'completed' }).eq('id', projectId)
          .then(({ error }) => {
            if (error) console.warn('[pipeline] failed to mark project complete:', error.message);
          });
        setActiveLog('Build complete. Your app is ready to explore.');
        return;
      }
      const def = stageDefs[stageIdx];
      const logs = stageLogs(def.type, spec.appType);
      const produced = STAGE_PRODUCERS[def.type](spec);
      let logIdx = 0;

      setStages((prev) =>
        prev.map((s) =>
          s.stage_type === def.type ? { ...s, status: 'in_progress' } : s,
        ),
      );
      persistStage(def.type, 'in_progress');

      const streamLog = () => {
        if (abort.signal.aborted) return;
        if (logIdx < logs.length) {
          setActiveLog(logs[logIdx]);
          logIdx++;
          buildTimer.current = setTimeout(streamLog, 700);
        } else {
          setStages((prev) =>
            prev.map((s) =>
              s.stage_type === def.type ? { ...s, status: 'completed', logs: logs.join('\n'), artifactCount: produced.length } : s,
            ),
          );
          persistStage(def.type, 'completed', logs.join('\n'));

          setProjectFiles((prev) => {
            const existing = new Set(prev.map((f) => f.path));
            const additions = produced.filter((f) => !existing.has(f.path));
            return [...prev, ...additions];
          });

          stageIdx++;
          buildTimer.current = setTimeout(runNextStage, 350);
        }
      };
      streamLog();
    };

    runNextStage();
    return () => abort.abort();
  }, []);

  const handleRegionClick = (region: AppRegion) => {
    setModalRegion(region);
  };

  const handleCompleteRegion = async (regionId: string) => {
    const { error } = await supabase.from('app_regions').update({ status: 'complete' }).eq('id', regionId);
    if (error) {
      console.warn('[region] failed to mark complete:', error.message);
      return;
    }
    setRegions((prev) =>
      prev.map((r) => (r.id === regionId ? { ...r, status: 'complete' } : r)),
    );
    setModalRegion(null);
  };

  const handleNew = () => {
    if (buildTimer.current) clearTimeout(buildTimer.current);
    setProject(null);
    setStages([]);
    setRegions([]);
    setActiveLog('');
    setCustomColors(null);
    setThemeMode('light');
    setProjectFiles([]);
    setInspectorMode('live');
    setView('prompt');
  };

  const handleSignOut = async () => {
    if (buildTimer.current) clearTimeout(buildTimer.current);
    await signOut();
  };

  const handleOpenProject = async (proj: Project) => {
    setProject(proj);
    setCustomColors(null);
    setView('builder');

    const { data: stageData } = await supabase
      .from('build_stages')
      .select('*')
      .eq('project_id', proj.id)
      .order('sort_order', { ascending: true });
    setStages((stageData ?? []) as unknown as BuildStage[]);

    const { data: regionData } = await supabase
      .from('app_regions')
      .select('*')
      .eq('project_id', proj.id)
      .order('sort_order', { ascending: true });
    const regionsData = (regionData ?? []) as unknown as AppRegion[];
    setRegions(regionsData);

    const spec = parsePrompt(proj.prompt);
    spec.appName = proj.name;
    spec.appType = proj.app_type;
    spec.colorScheme = proj.config?.colorScheme ?? DEFAULT_COLOR_SCHEME;
    spec.screens = regionsData.map((r) => r.spec);
    setProjectFiles(generateProjectFiles(spec));
    setInspectorMode('preview');

    setActiveLog('');
  };

  useEffect(() => {
    return () => {
      if (buildTimer.current) clearTimeout(buildTimer.current);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleInstruction = (text: string) => {
    const id = crypto.randomUUID();
    setInstructions((prev) => [...prev, { id, text, status: 'processing' }]);

    const lower = text.toLowerCase();
    let response = 'Done.';
    let delay = 900;

    const persistRegion = async (reg: AppRegion) => {
      if (!project) return;
      const { error } = await supabase.from('app_regions').insert({
        project_id: project.id,
        region_name: reg.region_name,
        region_type: reg.region_type,
        status: reg.status,
        spec: reg.spec,
        description: reg.description,
        sort_order: reg.sort_order,
      });
      if (error) console.warn('[instruction] failed to persist region:', error.message);
    };

    const newRegion = (name: string, desc: string, elements: ScreenElement[]): AppRegion => ({
      id: crypto.randomUUID(),
      project_id: project?.id ?? '',
      region_name: name,
      region_type: 'detail',
      status: 'complete',
      spec: { id: name.toLowerCase().replace(/\s/g, '-'), name, regionType: 'detail', description: desc, elements },
      description: desc,
      sort_order: regions.length,
    });

    const persistColors = async (colors: ColorScheme) => {
      if (!project) return;
      const { error } = await supabase
        .from('projects')
        .update({ config: { ...project.config, colorScheme: colors } })
        .eq('id', project.id);
      if (error) console.warn('[instruction] failed to persist colors:', error.message);
    };

    if (/(add|create).*(screen|page|tab)/.test(lower)) {
      const screenName = (text.match(/['"]([^'"]+)['"]/) || [])[1] || 'New Screen';
      const reg = newRegion(screenName, `Added via AI instruction: ${text}`, [
        { kind: 'header', label: screenName },
        { kind: 'text', label: 'This screen was generated from your request.' },
        { kind: 'button', label: 'Get Started' },
      ]);
      setRegions((prev) => [...prev, reg]);
      persistRegion(reg);
      response = `Added "${screenName}" screen to your app.`;
      delay = 1200;
    } else if (/(dark|night)/.test(lower)) {
      setThemeMode('dark');
      response = 'Switched to dark mode.';
      delay = 500;
    } else if (/(light|day)/.test(lower)) {
      setThemeMode('light');
      response = 'Switched to light mode.';
      delay = 500;
    } else if (/(blue|ocean)/.test(lower)) {
      const colors = { ...colorScheme, primary: '#3b82f6', secondary: '#60a5fa', accent: '#93c5fd' };
      setCustomColors(colors);
      persistColors(colors);
      response = 'Applied a blue color scheme.';
      delay = 600;
    } else if (/(green|emerald|nature)/.test(lower)) {
      const colors = { ...colorScheme, primary: '#10b981', secondary: '#34d399', accent: '#6ee7b7' };
      setCustomColors(colors);
      persistColors(colors);
      response = 'Applied a green color scheme.';
      delay = 600;
    } else if (/(red|warm|sunset)/.test(lower)) {
      const colors = { ...colorScheme, primary: '#ef4444', secondary: '#f87171', accent: '#fca5a5' };
      setCustomColors(colors);
      persistColors(colors);
      response = 'Applied a red color scheme.';
      delay = 600;
    } else if (/(orange|amber)/.test(lower)) {
      const colors = { ...colorScheme, primary: '#f59e0b', secondary: '#fbbf24', accent: '#fcd34d' };
      setCustomColors(colors);
      persistColors(colors);
      response = 'Applied an orange color scheme.';
      delay = 600;
    } else if (/(login|auth|sign.?in|account)/.test(lower)) {
      const reg = newRegion('Login', 'User login screen added by AI', [
        { kind: 'header', label: 'Welcome back' },
        { kind: 'input', placeholder: 'Email' },
        { kind: 'input', placeholder: 'Password' },
        { kind: 'button', label: 'Sign In' },
        { kind: 'text', label: 'Forgot password?' },
      ]);
      setRegions((prev) => [...prev, reg]);
      persistRegion(reg);
      response = 'Added a login screen with email and password fields.';
      delay = 1200;
    } else if (/(notification|alert|bell)/.test(lower)) {
      const reg = newRegion('Notifications', 'Notifications screen added by AI', [
        { kind: 'header', label: 'Notifications' },
        { kind: 'list', items: ['New message from Sarah', 'Your order shipped', 'Weekly summary ready'] },
      ]);
      setRegions((prev) => [...prev, reg]);
      persistRegion(reg);
      response = 'Added a notifications screen.';
      delay = 1200;
    } else if (/(setting|profile|account)/.test(lower)) {
      const reg = newRegion('Settings', 'Settings screen added by AI', [
        { kind: 'header', label: 'Settings' },
        { kind: 'list', items: ['Account', 'Notifications', 'Privacy', 'Theme', 'About'] },
      ]);
      setRegions((prev) => [...prev, reg]);
      persistRegion(reg);
      response = 'Added a settings screen.';
      delay = 1200;
    } else if (/(home|dashboard|main)/.test(lower)) {
      const reg = newRegion('Home', 'Home screen added by AI', [
        { kind: 'header', label: 'Home' },
        { kind: 'card', label: 'Welcome', value: 'Lets get started' },
        { kind: 'button', label: 'Explore' },
      ]);
      setRegions((prev) => [...prev, reg]);
      persistRegion(reg);
      response = 'Added a home screen.';
      delay = 1200;
    } else {
      response = `I noted your request: "${text}". You can also try: add a screen, change to blue, add login, switch to dark.`;
      delay = 700;
    }

    setTimeout(() => {
      setInstructions((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'done', response } : i)));
    }, delay);
  };

  const handleDownload = async () => {
    if (!project || projectFiles.length === 0) return;
    setDownloading(true);
    try {
      await downloadProjectZip(projectFiles, project.name);
    } catch (err) {
      console.warn('[download] failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const isBuilding = stages.some((s) => s.status === 'in_progress' || s.status === 'pending');
  const buildComplete = stages.length > 0 && stages.every((s) => s.status === 'completed');
  const incompleteRegions = regions.filter((r) => r.status === 'incomplete');
  const completeRegions = regions.filter((r) => r.status === 'complete' || r.status === 'building');
  const activeRegion = completeRegions[0] ?? regions[0] ?? null;

  const commands: Command[] = [
    { id: 'new', label: 'New App', icon: <Sparkles className="w-4 h-4" />, action: handleNew },
    { id: 'projects', label: 'View All Projects', icon: <CommandIcon className="w-4 h-4" />, action: () => setView('dashboard') },
    { id: 'theme', label: 'Open Theme Editor', action: () => setThemeEditorOpen(true) },
    { id: 'device-iphone', label: 'Switch to iPhone', action: () => setDeviceType('iphone') },
    { id: 'device-android', label: 'Switch to Android', action: () => setDeviceType('android') },
    { id: 'device-ipad', label: 'Switch to iPad', action: () => setDeviceType('ipad') },
    { id: 'mode-light', label: 'Light Mode', action: () => setThemeMode('light') },
    { id: 'mode-dark', label: 'Dark Mode', action: () => setThemeMode('dark') },
    { id: 'mode-live', label: 'Live Generator View', action: () => setInspectorMode('live') },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (view === 'prompt') {
    return (
      <>
        <PromptScreen onStart={handleStart} recentProjectName={recentProjectName} />
        <CommandPalette open={commandOpen} commands={commands} onClose={() => setCommandOpen(false)} />
      </>
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header
          projectName={project?.name}
          appType={project?.app_type}
          onNew={handleNew}
          onHome={handleNew}
          onProjects={() => setView('dashboard')}
          onTheme={() => setThemeEditorOpen(true)}
          onCommand={() => setCommandOpen(true)}
          onSignOut={handleSignOut}
        />

        <ProjectsDashboard onNew={handleNew} onOpen={handleOpenProject} />
        <CommandPalette open={commandOpen} commands={commands} onClose={() => setCommandOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        projectName={project?.name}
        appType={project?.app_type}
        onNew={handleNew}
        onHome={handleNew}
        onProjects={() => setView('dashboard')}
        onTheme={() => setThemeEditorOpen(true)}
        onCommand={() => setCommandOpen(true)}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Build stages */}
        <div className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/50 flex flex-col max-h-[50vh] lg:max-h-none">
          <BuildStages stages={stages} activeLog={activeLog} />
        </div>

        {/* Center: Preview + Code inspector (responsive: stacked on mobile, side-by-side on desktop) */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 min-h-[400px] relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 w-full h-full flex flex-col">
            {/* Controls bar: device switcher + dark toggle + inspector mode */}
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800/60 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <DeviceSwitcher active={deviceType} onChange={setDeviceType} />
                <button
                  onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
                  title="Toggle dark/light"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {themeMode === 'light' ? 'Dark' : 'Light'}
                </button>
              </div>
              <InspectorModeToggle mode={inspectorMode} onChange={setInspectorMode} />
            </div>

            {/* Content area: preview, code, split, or live generator */}
            <div className={`flex-1 flex ${inspectorMode === 'split' ? 'flex-col xl:flex-row' : 'flex-col'} overflow-hidden`}>
              {inspectorMode === 'live' ? (
                <div className="flex-1 bg-slate-950">
                  <LiveGenerator files={projectFiles} isBuilding={isBuilding} onDownload={handleDownload} canDownload={buildComplete && !downloading} downloading={downloading} />
                </div>
              ) : (
                <>
                  {(inspectorMode === 'preview' || inspectorMode === 'split') && (
                <div className={`flex items-center justify-center overflow-auto scrollbar-thin p-4 ${inspectorMode === 'split' ? 'flex-1 xl:flex-1 max-h-[45vh] xl:max-h-none border-b xl:border-b-0 xl:border-r border-slate-800' : 'flex-1'}`}>
                  <PhonePreview
                    regions={regions}
                    colorScheme={activeColorScheme}
                    appName={project?.name ?? 'My App'}
                    device={device}
                    themeMode={themeMode}
                    onRegionClick={handleRegionClick}
                  />
                </div>
              )}
              {(inspectorMode === 'code' || inspectorMode === 'split') && (
                <div className={`${inspectorMode === 'split' ? 'flex-1 min-h-[35vh] xl:min-h-0' : 'flex-1'} bg-slate-950`}
                >
                  <CodeViewer
                    region={activeRegion}
                    colorScheme={activeColorScheme}
                    appName={project?.name ?? 'My App'}
                  />
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status panel */}
        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/50 p-4 max-h-[40vh] lg:max-h-none overflow-y-auto scrollbar-thin">
          <BuildStatusPanel
            isBuilding={isBuilding}
            buildComplete={buildComplete}
            incompleteCount={incompleteRegions.length}
            platform={project?.platform as Platform}
            appName={project?.name ?? ''}
            onDownload={handleDownload}
            downloading={downloading}
          />
        </div>
      </div>

      <RegionModal
        region={modalRegion}
        onClose={() => setModalRegion(null)}
        onComplete={handleCompleteRegion}
      />

      <ThemeEditor
        open={themeEditorOpen}
        colorScheme={colorScheme}
        themeMode={themeMode}
        onClose={() => setThemeEditorOpen(false)}
        onChange={setCustomColors}
        onModeChange={setThemeMode}
        onReset={() => setCustomColors(null)}
      />

      <InstructionBar onSend={handleInstruction} instructions={instructions} disabled={isBuilding} />

      <CommandPalette open={commandOpen} commands={commands} onClose={() => setCommandOpen(false)} />
    </div>
  );
}

function BuildStatusPanel({
  isBuilding,
  buildComplete,
  incompleteCount,
  platform,
  appName,
  onDownload,
  downloading,
}: {
  isBuilding: boolean;
  buildComplete: boolean;
  incompleteCount: number;
  platform: Platform;
  appName: string;
  onDownload: () => void;
  downloading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Status</h3>
        {isBuilding ? (
          <div className="flex items-center gap-2 text-sm text-cyan-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Building...
          </div>
        ) : buildComplete ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            Build complete
          </div>
        ) : (
          <div className="text-sm text-slate-500">Idle</div>
        )}
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">App name</span>
          <span className="text-slate-300 font-medium">{appName}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Platform</span>
          <span className="text-slate-300 font-medium">{platformLabel(platform)}</span>
        </div>
      </div>

      {buildComplete && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-slate-200">Ready to deploy</h4>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Your app has been built successfully. Download the project files to run locally, or tap incomplete regions to finish them.
          </p>
          {incompleteCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              {incompleteCount} region{incompleteCount > 1 ? 's' : ''} need completion
            </div>
          )}
          <button
            onClick={onDownload}
            disabled={downloading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100 mb-2"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download project ZIP
          </button>
          <button
            className="w-full rounded-lg py-2.5 bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
            disabled={incompleteCount > 0}
          >
            {incompleteCount > 0 ? 'Complete all regions first' : 'Deploy to store'}
          </button>
        </div>
      )}

      <div className="text-xs text-slate-600 text-center pt-2">
        {incompleteCount > 0
          ? 'Tap highlighted regions in the preview to complete them'
          : 'All regions complete'}
      </div>
    </div>
  );
}

function InspectorModeToggle({
  mode,
  onChange,
}: {
  mode: InspectorMode;
  onChange: (m: InspectorMode) => void;
}) {
  const tabs: { id: InspectorMode; label: string; icon: React.ReactNode }[] = [
    { id: 'live', label: 'Live', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'preview', label: 'Preview', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'code', label: 'Code', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'split', label: 'Split', icon: <Columns2 className="w-3.5 h-3.5" /> },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-800 bg-slate-900/60 p-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === t.id ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {t.icon}
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
