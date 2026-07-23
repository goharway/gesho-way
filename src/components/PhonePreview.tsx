import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import type { AppRegion, ColorScheme, DevicePreset, ScreenSpec, ScreenElement, ThemeMode } from '@/types/builder';

interface PhonePreviewProps {
  regions: AppRegion[];
  colorScheme: ColorScheme;
  appName: string;
  device: DevicePreset;
  themeMode: ThemeMode;
  onRegionClick: (region: AppRegion) => void;
}

export default function PhonePreview({ regions, colorScheme, appName, device, themeMode, onRegionClick }: PhonePreviewProps) {
  const completeRegions = regions.filter((r) => r.status === 'complete' || r.status === 'building');
  const [activeIdx, setActiveIdx] = useState(0);

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

  return (
    <div className="flex flex-col items-center h-full p-4 overflow-hidden">
      <div className="flex items-center gap-1.5 mb-3 flex-wrap justify-center max-w-[300px]">
        {completeRegions.map((r, i) => (
          <button
            key={r.id}
            onClick={() => setActiveIdx(i)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              i === safeIdx
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {r.region_name}
          </button>
        ))}
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
