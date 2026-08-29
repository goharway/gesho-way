import { Smartphone, Tablet, MonitorSmartphone } from 'lucide-react';
import type { DeviceType } from '@/types/builder';
import { DEVICE_PRESETS } from '@/lib/appEngine';

interface DeviceSwitcherProps {
  active: DeviceType;
  onChange: (type: DeviceType) => void;
}

const ICONS: Record<DeviceType, React.ReactNode> = {
  iphone: <Smartphone className="w-4 h-4" />,
  android: <MonitorSmartphone className="w-4 h-4" />,
  ipad: <Tablet className="w-4 h-4" />,
};

export default function DeviceSwitcher({ active, onChange }: DeviceSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
      {DEVICE_PRESETS.map((d) => (
        <button
          key={d.type}
          onClick={() => onChange(d.type)}
          title={d.label}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            active === d.type
              ? 'bg-slate-100 text-slate-800'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {ICONS[d.type]}
          <span className="hidden sm:inline">{d.label.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  );
}
