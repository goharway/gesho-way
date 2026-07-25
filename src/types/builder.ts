export type Platform = 'ios' | 'android' | 'both';
export type ProjectStatus = 'building' | 'completed' | 'failed';
export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type RegionStatus = 'complete' | 'incomplete' | 'building';
export type ThemeMode = 'light' | 'dark';
export type DeviceType = 'iphone' | 'android' | 'ipad';

export interface DevicePreset {
  type: DeviceType;
  label: string;
  width: number;
  height: number;
  borderRadius: number;
  notchStyle: 'dynamic-island' | 'notch' | 'punch-hole' | 'none';
}

export interface ColorSchemeOverride extends Partial<ColorScheme> {
  mode?: ThemeMode;
}

export interface ProjectFile {
  path: string;
  name: string;
  ext: string;
  type: 'code' | 'config' | 'asset' | 'doc' | 'directory';
  content: string;
  language: 'tsx' | 'ts' | 'json' | 'css' | 'md' | 'image' | 'text';
  lines: number;
}

export type StageType =
  | 'analysis'
  | 'scaffold'
  | 'design'
  | 'screens'
  | 'database'
  | 'logic'
  | 'testing'
  | 'deploy';

export type RegionType =
  | 'screen'
  | 'component'
  | 'navigation'
  | 'data'
  | 'auth'
  | 'settings';

export interface AppSpec {
  appName: string;
  appType: string;
  features: string[];
  screens: ScreenSpec[];
  colorScheme: ColorScheme;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface ScreenSpec {
  name: string;
  regionType: RegionType;
  elements: ScreenElement[];
  description: string;
  intentionallyIncomplete?: boolean;
}

export interface ScreenElement {
  kind: 'header' | 'text' | 'list' | 'button' | 'input' | 'image' | 'card' | 'tabbar' | 'stat' | 'avatar';
  label?: string;
  value?: string;
  items?: string[];
  placeholder?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export interface BuildStage {
  id: string;
  project_id: string;
  stage_name: string;
  stage_type: string;
  status: string;
  logs: string;
  sort_order: number;
  created_at: string;
}

export interface AppRegion {
  id: string;
  project_id: string;
  region_name: string;
  region_type: string;
  status: string;
  spec: ScreenSpec;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  prompt: string;
  platform: string;
  app_type: string;
  status: string;
  config: { colorScheme?: ColorScheme };
  created_at: string;
  updated_at: string;
}
