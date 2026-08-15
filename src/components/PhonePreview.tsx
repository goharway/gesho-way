import { useEffect, useState, useRef } from 'react';
import {
  ChevronLeft,
  Search,
  Plus,
  Bell,
  Heart,
  MessageCircle,
  Share,
  Home,
  User,
  Grid,
  Settings as SettingsIcon,
  AlertCircle,
  Lock,
  Play,
  Image as ImageIcon,
  TrendingUp,
  Check,
  Sun,
  Moon,
  X,
  GripVertical,
} from 'lucide-react';
import type { AppRegion, ColorScheme, DevicePreset, ScreenSpec, ScreenElement, ThemeMode } from '@/types/builder';

interface PhonePreviewProps {
  regions: AppRegion[];
  colorScheme: ColorScheme;
  appName: string;
  device: DevicePreset;
  themeMode: ThemeMode;
  onRegionClick: (region: AppRegion) => void;
  onReorder?: (reordered: AppRegion[]) => void;
  onDeleteScreen?: (regionId: string) => void;
}

export default function PhonePreview({
  regions,
  colorScheme,
  appName,
  device,
  themeMode,
  onRegionClick,
  onReorder,
  onDeleteScreen,
}: PhonePreviewProps) {
  const completeRegions = regions.filter((r) => r.status === 'complete' || r.status === 'building');
  const [activeIdx, setActiveIdx] = useState(0);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (activeIdx > 0 && activeIdx >= completeRegions.length) {
      setActiveIdx(0);
    }
  }, [completeRegions.length, activeIdx]);

  if (completeRegions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">Waiting for screens...</p>
        </div>
      </div>
    );
  }

  const safeIdx = Math.min(activeIdx, completeRegions.length - 1);
  const region = completeRegions[safeIdx];

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (!onReorder) return;
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    if (!onReorder || draggedIdx === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    if (!onReorder || draggedIdx === null) return;
    e.preventDefault();
    if (draggedIdx === idx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const reordered = [...completeRegions];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(idx, 0, moved);
    onReorder(reordered);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
    dragCounter.current = 0;
  };

  const handleDeleteClick = (e: React.MouseEvent, regionId: string) => {
    e.stopPropagation();
    setConfirmDelete(regionId);
  };

  const confirmDeleteScreen = () => {
    if (confirmDelete && onDeleteScreen) {
      onDeleteScreen(confirmDelete);
    }
    setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col items-center h-full p-4 overflow-hidden">
      {/* Screen tabs — draggable + deletable */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap justify-center max-w-[320px]">
        {completeRegions.map((r, i) => {
          const isDragged = draggedIdx === i;
          const isDragOver = dragOverIdx === i && draggedIdx !== i;
          return (
            <div
              key={r.id}
              draggable={!!onReorder}
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              onClick={() => setActiveIdx(i)}
              className={`group relative flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all cursor-pointer select-none ${
                i === safeIdx
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
              } ${isDragged ? 'opacity-40 scale-95' : ''} ${isDragOver ? 'ring-2 ring-emerald-400/50' : ''} ${
                onReorder ? 'hover:ring-1 hover:ring-slate-600' : ''
              }`}
            >
              {onReorder && (
                <GripVertical className="w-2.5 h-2.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              <span className="truncate max-w-[80px]">{r.region_name}</span>
              {onDeleteScreen && (
                <button
                  onClick={(e) => handleDeleteClick(e, r.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                  title="Delete screen"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <PhoneFrame device={device}>
        <ScreenRenderer
          spec={region.spec}
          colorScheme={colorScheme}
          appName={appName}
          themeMode={themeMode}
          isIncomplete={region.status === 'building'}
          onIncompleteClick={() => onRegionClick(region)}
        />
      </PhoneFrame>

      <p className="text-xs text-slate-500 mt-3 text-center max-w-[240px] truncate">
        {region.description}
      </p>

      {onReorder && completeRegions.length > 1 && (
        <p className="text-[10px] text-slate-600 mt-1">Drag tabs to reorder screens</p>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-4.5 h-4.5 text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Delete screen?</h3>
            </div>
            <p className="text-xs text-slate-400">
              This will permanently remove the screen from your app. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg py-2.5 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteScreen}
                className="flex-1 rounded-lg py-2.5 bg-red-500/90 text-white text-xs font-semibold hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhoneFrame({ device, children }: { device: DevicePreset; children: React.ReactNode }) {
  const borderW = device.type === 'ipad' ? 'border-[8px]' : 'border-[10px]';
  const radiusClass = device.type === 'ipad' ? 'rounded-[2rem]' : 'rounded-[2.5rem]';

  return (
    <div className={`relative bg-black shadow-2xl shadow-black/50 ${borderW} border-slate-800 ${radiusClass}`} style={{ width: device.width, height: device.height }}>
      {device.notchStyle === 'dynamic-island' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-2xl z-20" />
      )}
      {device.notchStyle === 'punch-hole' && (
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full z-20" />
      )}
      <div className={`w-full h-full ${device.type === 'ipad' ? 'rounded-[1.5rem]' : 'rounded-[1.75rem]'} overflow-hidden relative bg-white`}>
        {children}
      </div>
    </div>
  );
}

function ScreenRenderer({
  spec,
  colorScheme,
  appName,
  themeMode,
  isIncomplete,
  onIncompleteClick,
}: {
  spec: ScreenSpec;
  colorScheme: ColorScheme;
  appName: string;
  themeMode: ThemeMode;
  isIncomplete: boolean;
  onIncompleteClick: () => void;
}) {
  return (
    <div
      className="flex flex-col h-full text-sm"
      style={{ backgroundColor: colorScheme.background, color: colorScheme.text }}
    >
      <StatusBar colorScheme={colorScheme} themeMode={themeMode} />
      <ScreenHeader label={spec.name} colorScheme={colorScheme} />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
        {spec.elements.map((el, idx) => (
          <ElementRenderer
            key={idx}
            element={el}
            colorScheme={colorScheme}
            appName={appName}
          />
        ))}
        {isIncomplete && (
          <IncompleteBanner onClick={onIncompleteClick} />
        )}
      </div>
      {hasTabBar(spec) && <TabBar colorScheme={colorScheme} />}
    </div>
  );
}

function StatusBar({ colorScheme, themeMode }: { colorScheme: ColorScheme; themeMode: ThemeMode }) {
  return (
    <div
      className="flex items-center justify-between px-5 pt-2 pb-1 text-[10px] font-semibold"
      style={{ color: colorScheme.text }}
    >
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        {themeMode === 'dark' ? <Moon className="w-2.5 h-2.5" /> : <Sun className="w-2.5 h-2.5" />}
        <span className="w-3 h-2 rounded-[2px] border" style={{ borderColor: colorScheme.text }} />
        <span>100%</span>
      </div>
    </div>
  );
}

function ScreenHeader({ label, colorScheme }: { label: string; colorScheme: ColorScheme }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <button className="p-0.5" style={{ color: colorScheme.primary }}>
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-bold" style={{ color: colorScheme.text }}>
        {label}
      </h1>
    </div>
  );
}

function ElementRenderer({
  element,
  colorScheme,
  appName,
}: {
  element: ScreenElement;
  colorScheme: ColorScheme;
  appName: string;
}) {
  switch (element.kind) {
    case 'header':
      return (
        <h2 className="text-xl font-bold" style={{ color: colorScheme.text }}>
          {element.label}
        </h2>
      );
    case 'text':
      return (
        <p className="text-sm" style={{ color: colorScheme.text }}>
          {element.label}
        </p>
      );
    case 'input':
      return (
        <div
          className="rounded-xl px-3 py-2.5 text-sm border"
          style={{
            backgroundColor: colorScheme.surface,
            borderColor: colorScheme.secondary + '40',
            color: colorScheme.text,
          }}
        >
          <span className="opacity-50">{element.placeholder}</span>
        </div>
      );
    case 'button': {
      const isPrimary = element.variant !== 'secondary' && element.variant !== 'ghost';
      return (
        <button
          className="w-full rounded-xl py-3 text-sm font-semibold text-center transition-transform active:scale-95"
          style={{
            backgroundColor: isPrimary ? colorScheme.primary : 'transparent',
            color: isPrimary ? '#ffffff' : colorScheme.primary,
            border: isPrimary ? 'none' : `1px solid ${colorScheme.primary}40`,
          }}
        >
          {element.label}
        </button>
      );
    }
    case 'list':
      return (
        <div className="space-y-1.5">
          {element.items?.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
              style={{ backgroundColor: colorScheme.surface, color: colorScheme.text }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: colorScheme.accent }}
              />
              {item}
            </div>
          ))}
        </div>
      );
    case 'card':
      return (
        <div
          className="rounded-xl p-3 space-y-1 shadow-sm"
          style={{ backgroundColor: colorScheme.surface, color: colorScheme.text }}
        >
          {element.label && <p className="font-semibold text-sm">{element.label}</p>}
          {element.value && <p className="text-xs opacity-60">{element.value}</p>}
          {element.items && (
            <div className="flex items-end gap-1 h-12 pt-2">
              {element.items.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${30 + ((i * 37) % 50)}%`,
                    backgroundColor: colorScheme.primary,
                    opacity: 0.3 + (i / element.items!.length) * 0.7,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      );
    case 'image':
      return (
        <div
          className="rounded-xl h-28 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${colorScheme.primary}30, ${colorScheme.secondary}30)` }}
        >
          <ImageIcon className="w-8 h-8" style={{ color: colorScheme.primary }} />
        </div>
      );
    case 'stat':
      return (
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: colorScheme.surface, color: colorScheme.text }}
        >
          <p className="text-xs opacity-60">{element.label}</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: colorScheme.primary }}>
            {element.value}
          </p>
        </div>
      );
    case 'avatar':
      return (
        <div
          className="flex items-center gap-3 rounded-xl p-2.5"
          style={{ backgroundColor: colorScheme.surface, color: colorScheme.text }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: colorScheme.secondary }}
          >
            {element.label?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <span className="text-xs flex-1 truncate">{element.label}</span>
        </div>
      );
    case 'tabbar':
      return null;
    default:
      return null;
  }
}

function hasTabBar(spec: ScreenSpec): boolean {
  return spec.elements.some((e) => e.kind === 'tabbar');
}

function TabBar({ colorScheme }: { colorScheme: ColorScheme }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    { icon: <Home className="w-5 h-5" />, label: 'Home' },
    { icon: <Search className="w-5 h-5" />, label: 'Search' },
    { icon: <Plus className="w-5 h-5" />, label: 'Add' },
    { icon: <Bell className="w-5 h-5" />, label: 'Alerts' },
    { icon: <User className="w-5 h-5" />, label: 'Profile' },
  ];

  return (
    <div
      className="flex items-center justify-around py-2 border-t"
      style={{ backgroundColor: colorScheme.surface, borderColor: colorScheme.secondary + '20' }}
    >
      {tabs.map((tab, i) => (
        <button
          key={i}
          onClick={() => setActiveTab(i)}
          className="flex flex-col items-center gap-0.5 transition-colors"
          style={{ color: i === activeTab ? colorScheme.primary : colorScheme.text + '60' }}
        >
          {tab.icon}
          <span className="text-[8px]">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function IncompleteBanner({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border-2 border-dashed border-amber-400/60 bg-amber-400/10 py-3 px-3 flex items-center gap-2 text-amber-700 hover:bg-amber-400/20 transition-colors pulse-incomplete"
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="text-xs font-semibold text-left">
        This region is incomplete — tap to continue building
      </span>
    </button>
  );
}
