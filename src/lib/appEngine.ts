import type {
  AppSpec,
  ColorScheme,
  DevicePreset,
  DeviceType,
  Platform,
  ProjectFile,
  ScreenSpec,
  StageType,
  ThemeMode,
} from '@/types/builder';

export type { ProjectFile };

interface ParsedPrompt {
  appName: string;
  appType: string;
  features: string[];
  keyword: string;
}

const KEYWORDS: Record<string, string> = {
  todo: 'todo',
  task: 'todo',
  'task manager': 'todo',
  'to-do': 'todo',
  shop: 'ecommerce',
  store: 'ecommerce',
  ecommerce: 'ecommerce',
  'e-commerce': 'ecommerce',
  chat: 'chat',
  messaging: 'chat',
  messenger: 'chat',
  social: 'social',
  fitness: 'fitness',
  workout: 'fitness',
  exercise: 'fitness',
  recipe: 'recipe',
  cooking: 'recipe',
  food: 'recipe',
  notes: 'notes',
  note: 'notes',
  budget: 'finance',
  finance: 'finance',
  money: 'finance',
  expense: 'finance',
  weather: 'weather',
  news: 'news',
  blog: 'news',
  music: 'music',
  podcast: 'music',
  game: 'game',
  booking: 'booking',
  appointment: 'booking',
  calendar: 'booking',
  learning: 'education',
  education: 'education',
  course: 'education',
  habit: 'habit',
  tracker: 'tracker',
  'habit tracker': 'habit',
};

const APP_TYPE_LABELS: Record<string, string> = {
  todo: 'Task Manager',
  ecommerce: 'E-Commerce Store',
  chat: 'Chat App',
  social: 'Social Network',
  fitness: 'Fitness Tracker',
  recipe: 'Recipe App',
  notes: 'Notes App',
  finance: 'Budget Tracker',
  weather: 'Weather App',
  news: 'News Reader',
  music: 'Music Player',
  game: 'Game App',
  booking: 'Booking App',
  education: 'Learning Platform',
  habit: 'Habit Tracker',
  tracker: 'Tracker App',
  general: 'General App',
};

const COLOR_SCHEMES: Record<string, ColorScheme> = {
  todo: { primary: '#2563eb', secondary: '#0ea5e9', accent: '#f59e0b', background: '#f8fafc', surface: '#ffffff', text: '#0f172a' },
  ecommerce: { primary: '#ea580c', secondary: '#f59e0b', accent: '#dc2626', background: '#fff7ed', surface: '#ffffff', text: '#1c1917' },
  chat: { primary: '#059669', secondary: '#10b981', accent: '#6366f1', background: '#f0fdf4', surface: '#ffffff', text: '#064e3b' },
  social: { primary: '#db2777', secondary: '#f43f5e', accent: '#8b5cf6', background: '#fdf2f8', surface: '#ffffff', text: '#500724' },
  fitness: { primary: '#dc2626', secondary: '#f97316', accent: '#16a34a', background: '#fef2f2', surface: '#ffffff', text: '#450a0a' },
  recipe: { primary: '#d97706', secondary: '#f59e0b', accent: '#84cc16', background: '#fffbeb', surface: '#ffffff', text: '#451a03' },
  notes: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#ec4899', background: '#faf5ff', surface: '#ffffff', text: '#2e1065' },
  finance: { primary: '#16a34a', secondary: '#22c55e', accent: '#0ea5e9', background: '#f0fdf4', surface: '#ffffff', text: '#052e16' },
  weather: { primary: '#0284c7', secondary: '#38bdf8', accent: '#fbbf24', background: '#f0f9ff', surface: '#ffffff', text: '#082f49' },
  news: { primary: '#1e293b', secondary: '#475569', accent: '#dc2626', background: '#f1f5f9', surface: '#ffffff', text: '#020617' },
  music: { primary: '#9333ea', secondary: '#a855f7', accent: '#f43f5e', background: '#faf5ff', surface: '#ffffff', text: '#3b0764' },
  game: { primary: '#7c2d12', secondary: '#dc2626', accent: '#facc15', background: '#1c1917', surface: '#292524', text: '#fafaf9' },
  booking: { primary: '#0891b2', secondary: '#06b6d4', accent: '#f59e0b', background: '#ecfeff', surface: '#ffffff', text: '#083344' },
  education: { primary: '#1d4ed8', secondary: '#2563eb', accent: '#f59e0b', background: '#eff6ff', surface: '#ffffff', text: '#172554' },
  habit: { primary: '#059669', secondary: '#10b981', accent: '#f59e0b', background: '#ecfdf5', surface: '#ffffff', text: '#022c22' },
  tracker: { primary: '#4f46e5', secondary: '#6366f1', accent: '#f59e0b', background: '#eef2ff', surface: '#ffffff', text: '#1e1b4b' },
  general: { primary: '#0f766e', secondary: '#14b8a6', accent: '#f59e0b', background: '#f0fdfa', surface: '#ffffff', text: '#042f2e' },
};

function detectKeyword(prompt: string): string {
  const lower = prompt.toLowerCase();
  for (const [kw, type] of Object.entries(KEYWORDS)) {
    if (lower.includes(kw)) return type;
  }
  return 'general';
}

function extractAppName(prompt: string, fallbackType: string): string {
  const patterns = [
    /(?:called|named|app(?:'s|s)? name(?: is|:)?|name(?:d|:))\s+["'"]?([A-Za-z0-9\s]{2,20})["'"]?/i,
    /["'"]([A-Za-z0-9\s]{2,20})["'"]\s+app/i,
  ];
  for (const p of patterns) {
    const m = prompt.match(p);
    if (m) return m[1].trim();
  }
  return APP_TYPE_LABELS[fallbackType] ?? 'My App';
}

function detectFeatures(prompt: string, type: string): string[] {
  const features = new Set<string>([
    'User authentication',
    'Push notifications',
    'Offline support',
  ]);
  const lower = prompt.toLowerCase();
  if (lower.match(/login|signup|sign\s?up|auth|account|user/)) features.add('User authentication');
  if (lower.match(/notif|alert|reminder/)) features.add('Push notifications');
  if (lower.match(/offline/)) features.add('Offline support');
  if (lower.match(/dark\s?mode|theme/)) features.add('Dark mode');
  if (lower.match(/search/)) features.add('Search');
  if (lower.match(/map|location|geo/)) features.add('Maps & location');
  if (lower.match(/payment|stripe|checkout|pay/)) features.add('In-app payments');
  if (lower.match(/camera|photo|upload/)) features.add('Camera & uploads');
  if (lower.match(/share|social/)) features.add('Social sharing');
  if (lower.match(/chart|graph|stat|analytic/)) features.add('Charts & analytics');
  if (lower.match(/chat|message/)) features.add('Real-time chat');
  if (type === 'ecommerce') features.add('Shopping cart');
  if (type === 'fitness') features.add('Activity tracking');
  if (type === 'finance') features.add('Expense categorization');
  return Array.from(features);
}

function buildScreens(type: string, features: string[]): ScreenSpec[] {
  const hasAuth = features.includes('User authentication');
  const base: ScreenSpec[] = [];

  if (hasAuth) {
    base.push({
      name: 'Login',
      regionType: 'auth',
      description: 'Email/password sign-in screen with social login buttons.',
      elements: [
        { kind: 'header', label: 'Welcome back' },
        { kind: 'input', placeholder: 'Email address' },
        { kind: 'input', placeholder: 'Password' },
        { kind: 'button', label: 'Sign in', variant: 'primary' },
        { kind: 'button', label: 'Continue with Google', variant: 'secondary' },
        { kind: 'text', label: "Don't have an account? Sign up" },
      ],
    });
  }

  const homeScreens = SCREEN_TEMPLATES[type] ?? SCREEN_TEMPLATES.general;
  for (const s of homeScreens) base.push(s);

  if (features.includes('Charts & analytics')) {
    base.push({
      name: 'Analytics',
      regionType: 'data',
      description: 'Stats cards with a simple bar chart visualization.',
      intentionallyIncomplete: true,
      elements: [
        { kind: 'header', label: 'Analytics' },
        { kind: 'stat', label: 'Total', value: '1,284' },
        { kind: 'stat', label: 'This week', value: '+12%' },
        { kind: 'card', label: 'Weekly activity', items: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      ],
    });
  }

  if (features.includes('In-app payments')) {
    base.push({
      name: 'Checkout',
      regionType: 'data',
      description: 'Payment summary with Stripe checkout button.',
      intentionallyIncomplete: true,
      elements: [
        { kind: 'header', label: 'Checkout' },
        { kind: 'card', label: 'Order total', value: '$49.00' },
        { kind: 'button', label: 'Pay with Stripe', variant: 'primary' },
      ],
    });
  }

  base.push({
    name: 'Settings',
    regionType: 'settings',
    description: 'App settings: profile, notifications, theme, logout.',
    elements: [
      { kind: 'header', label: 'Settings' },
      { kind: 'avatar', label: 'User name' },
      { kind: 'list', items: ['Notifications', 'Dark mode', 'Privacy', 'About'] },
    ],
  });

  return base;
}

const SCREEN_TEMPLATES: Record<string, ScreenSpec[]> = {
  todo: [
    {
      name: 'Task List',
      regionType: 'screen',
      description: 'Main task list with add button and checkable items.',
      elements: [
        { kind: 'header', label: 'My Tasks' },
        { kind: 'stat', label: 'Pending', value: '4' },
        { kind: 'list', items: ['Buy groceries', 'Call mom', 'Finish report', 'Workout'] },
        { kind: 'button', label: '+ Add task', variant: 'primary' },
        { kind: 'tabbar' },
      ],
    },
    {
      name: 'Add Task',
      regionType: 'screen',
      description: 'Form to create a new task with title, category, and due date.',
      intentionallyIncomplete: true,
      elements: [
        { kind: 'header', label: 'New Task' },
        { kind: 'input', placeholder: 'Task title' },
        { kind: 'input', placeholder: 'Category' },
        { kind: 'input', placeholder: 'Due date' },
        { kind: 'button', label: 'Save task', variant: 'primary' },
      ],
    },
  ],
  ecommerce: [
    {
      name: 'Shop',
      regionType: 'screen',
      description: 'Product grid with categories and search bar.',
      elements: [
        { kind: 'header', label: 'Shop' },
        { kind: 'input', placeholder: 'Search products...' },
        { kind: 'list', items: ['Featured', 'New arrivals', 'Sale'] },
        { kind: 'card', label: 'Product card', value: '$29.99' },
        { kind: 'tabbar' },
      ],
    },
    {
      name: 'Product Detail',
      regionType: 'screen',
      description: 'Product image, price, description, and add-to-cart button.',
      intentionallyIncomplete: true,
      elements: [
        { kind: 'header', label: 'Product' },
        { kind: 'image', label: 'Product image' },
        { kind: 'text', label: '$29.99' },
        { kind: 'button', label: 'Add to cart', variant: 'primary' },
      ],
    },
  ],
  chat: [
    {
      name: 'Chats',
      regionType: 'screen',
      description: 'Conversation list with avatars and last message preview.',
      elements: [
        { kind: 'header', label: 'Chats' },
        { kind: 'avatar', label: 'Alice — See you tomorrow!' },
        { kind: 'avatar', label: 'Bob — Thanks!' },
        { kind: 'avatar', label: 'Group — 3 new messages' },
        { kind: 'tabbar' },
      ],
    },
    {
      name: 'Conversation',
      regionType: 'screen',
      description: 'Message bubbles with text input at the bottom.',
      intentionallyIncomplete: true,
      elements: [
        { kind: 'header', label: 'Alice' },
        { kind: 'card', label: 'Hello! How are you?' },
        { kind: 'card', label: "I'm great, thanks!" },
        { kind: 'input', placeholder: 'Type a message...' },
        { kind: 'button', label: 'Send', variant: 'primary' },
      ],
    },
  ],
  fitness: [
    {
      name: 'Today',
      regionType: 'screen',
      description: 'Daily activity summary with steps, calories, and workout cards.',
      elements: [
        { kind: 'header', label: 'Today' },
        { kind: 'stat', label: 'Steps', value: '8,432' },
        { kind: 'stat', label: 'Calories', value: '520' },
        { kind: 'button', label: 'Start workout', variant: 'primary' },
        { kind: 'tabbar' },
      ],
    },
    {
      name: 'Workouts',
      regionType: 'screen',
      description: 'List of workout routines with duration and difficulty.',
      intentionallyIncomplete: true,
      elements: [
        { kind: 'header', label: 'Workouts' },
        { kind: 'card', label: 'Morning run', value: '30 min' },
        { kind: 'card', label: 'Upper body', value: '45 min' },
        { kind: 'card', label: 'Yoga flow', value: '20 min' },
      ],
    },
  ],
  finance: [
    {
      name: 'Overview',
      regionType: 'screen',
      description: 'Balance card with recent transactions list.',
      elements: [
        { kind: 'header', label: 'Overview' },
        { kind: 'stat', label: 'Balance', value: '$4,280.50' },
        { kind: 'list', items: ['Groceries -$42', 'Salary +$3,200', 'Rent -$1,200'] },
        { kind: 'button', label: '+ Add expense', variant: 'primary' },
        { kind: 'tabbar' },
      ],
    },
    {
      name: 'Add Expense',
      regionType: 'screen',
      description: 'Form to add an expense with amount, category, and note.',
      intentionallyIncomplete: true,
      elements: [
        { kind: 'header', label: 'Add Expense' },
        { kind: 'input', placeholder: 'Amount' },
        { kind: 'input', placeholder: 'Category' },
        { kind: 'input', placeholder: 'Note' },
        { kind: 'button', label: 'Save', variant: 'primary' },
      ],
    },
  ],
  recipe: [
    {
      name: 'Discover',
      regionType: 'screen',
      description: 'Recipe feed with images, titles, and cooking time.',
      elements: [
        { kind: 'header', label: 'Discover' },
        { kind: 'image', label: 'Featured recipe' },
        { kind: 'card', label: 'Pasta Carbonara', value: '25 min' },
        { kind: 'card', label: 'Avocado Toast', value: '10 min' },
        { kind: 'tabbar' },
      ],
    },
    {
      name: 'Recipe Detail',
      regionType: 'screen',
      description: 'Ingredients list and step-by-step instructions.',
      intentionallyIncomplete: true,
      elements: [
        { kind: 'header', label: 'Recipe' },
        { kind: 'image', label: 'Dish photo' },
        { kind: 'list', items: ['200g pasta', '2 eggs', '50g cheese', 'Pepper'] },
        { kind: 'button', label: 'Start cooking', variant: 'primary' },
      ],
    },
  ],
  notes: [
    {
      name: 'Notes',
      regionType: 'screen',
      description: 'List of notes with title and preview text.',
      elements: [
        { kind: 'header', label: 'Notes' },
        { kind: 'input', placeholder: 'Search notes...' },
        { kind: 'card', label: 'Meeting notes', value: 'Discussed roadmap...' },
        { kind: 'card', label: 'Ideas', value: 'New feature ideas...' },
        { kind: 'button', label: '+ New note', variant: 'primary' },
        { kind: 'tabbar' },
      ],
    },
  ],
  weather: [
    {
      name: 'Weather',
      regionType: 'screen',
      description: 'Current weather with temperature, condition, and 5-day forecast.',
      elements: [
        { kind: 'header', label: 'Cairo' },
        { kind: 'stat', label: '32°C', value: 'Sunny' },
        { kind: 'list', items: ['Mon 33°', 'Tue 30°', 'Wed 28°', 'Thu 31°', 'Fri 34°'] },
        { kind: 'tabbar' },
      ],
    },
  ],
  news: [
    {
      name: 'Headlines',
      regionType: 'screen',
      description: 'News article list with image, title, and source.',
      elements: [
        { kind: 'header', label: 'Headlines' },
        { kind: 'image', label: 'Top story' },
        { kind: 'card', label: 'Tech news headline' },
        { kind: 'card', label: 'World news headline' },
        { kind: 'tabbar' },
      ],
    },
  ],
  music: [
    {
      name: 'Library',
      regionType: 'screen',
      description: 'Playlist list with album art and song count.',
      elements: [
        { kind: 'header', label: 'Library' },
        { kind: 'avatar', label: 'Chill Vibes — 42 songs' },
        { kind: 'avatar', label: 'Workout Mix — 28 songs' },
        { kind: 'button', label: 'Play', variant: 'primary' },
        { kind: 'tabbar' },
      ],
    },
  ],
  booking: [
    {
      name: 'Bookings',
      regionType: 'screen',
      description: 'Upcoming appointments with date and time.',
      elements: [
        { kind: 'header', label: 'My Bookings' },
        { kind: 'card', label: 'Haircut', value: 'Mon 2:00 PM' },
        { kind: 'card', label: 'Dentist', value: 'Wed 10:00 AM' },
        { kind: 'button', label: '+ New booking', variant: 'primary' },
        { kind: 'tabbar' },
      ],
    },
  ],
  education: [
    {
      name: 'Courses',
      regionType: 'screen',
      description: 'Course list with progress bars.',
      elements: [
        { kind: 'header', label: 'My Courses' },
        { kind: 'card', label: 'React Basics', value: '65% complete' },
        { kind: 'card', label: 'Spanish 101', value: '30% complete' },
        { kind: 'tabbar' },
      ],
    },
  ],
  habit: [
    {
      name: 'Habits',
      regionType: 'screen',
      description: 'Daily habit tracker with streak counters.',
      elements: [
        { kind: 'header', label: 'Habits' },
        { kind: 'stat', label: '7 day streak' },
        { kind: 'list', items: ['Drink water ✓', 'Read 20 min ✓', 'Meditate'] },
        { kind: 'button', label: '+ New habit', variant: 'primary' },
        { kind: 'tabbar' },
      ],
    },
  ],
  social: [
    {
      name: 'Feed',
      regionType: 'screen',
      description: 'Social feed with posts, likes, and comments.',
      elements: [
        { kind: 'header', label: 'Feed' },
        { kind: 'avatar', label: 'Alice shared a photo' },
        { kind: 'image', label: 'Post image' },
        { kind: 'card', label: 'Like · Comment · Share' },
        { kind: 'tabbar' },
      ],
    },
  ],
  game: [
    {
      name: 'Menu',
      regionType: 'screen',
      description: 'Game main menu with play button and high score.',
      elements: [
        { kind: 'header', label: 'Game' },
        { kind: 'stat', label: 'High score', value: '12,450' },
        { kind: 'button', label: 'Play', variant: 'primary' },
        { kind: 'button', label: 'Settings', variant: 'secondary' },
      ],
    },
  ],
  tracker: [
    {
      name: 'Dashboard',
      regionType: 'screen',
      description: 'Tracking dashboard with key metrics.',
      elements: [
        { kind: 'header', label: 'Dashboard' },
        { kind: 'stat', label: 'Total', value: '256' },
        { kind: 'stat', label: 'Active', value: '42' },
        { kind: 'button', label: '+ Add entry', variant: 'primary' },
        { kind: 'tabbar' },
      ],
    },
  ],
  general: [
    {
      name: 'Home',
      regionType: 'screen',
      description: 'Main dashboard with summary cards and quick actions.',
      elements: [
        { kind: 'header', label: 'Home' },
        { kind: 'stat', label: 'Welcome', value: 'Let’s get started' },
        { kind: 'card', label: 'Quick action 1' },
        { kind: 'card', label: 'Quick action 2' },
        { kind: 'button', label: 'Get started', variant: 'primary' },
        { kind: 'tabbar' },
      ],
    },
  ],
};

export function parsePrompt(prompt: string): AppSpec {
  const keyword = detectKeyword(prompt);
  const appName = extractAppName(prompt, keyword);
  const features = detectFeatures(prompt, keyword);
  const screens = buildScreens(keyword, features);
  return {
    appName,
    appType: keyword,
    features,
    screens,
    colorScheme: COLOR_SCHEMES[keyword] ?? COLOR_SCHEMES.general,
  };
}

export const DEVICE_PRESETS: DevicePreset[] = [
  { type: 'iphone', label: 'iPhone 15 Pro', width: 280, height: 580, borderRadius: 2.5, notchStyle: 'dynamic-island' },
  { type: 'android', label: 'Pixel 8', width: 275, height: 570, borderRadius: 2, notchStyle: 'punch-hole' },
  { type: 'ipad', label: 'iPad Pro', width: 420, height: 540, borderRadius: 2, notchStyle: 'none' },
];

export function getDevicePreset(type: DeviceType): DevicePreset {
  return DEVICE_PRESETS.find((d) => d.type === type) ?? DEVICE_PRESETS[0];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace('#', '').match(/.{1,2}/g);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
}

function adjustBrightness(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `#${adjust(r).toString(16).padStart(2, '0')}${adjust(g).toString(16).padStart(2, '0')}${adjust(b).toString(16).padStart(2, '0')}`;
}

export function applyDarkMode(scheme: ColorScheme): ColorScheme {
  return {
    primary: adjustBrightness(scheme.primary, 0.8),
    secondary: adjustBrightness(scheme.secondary, 0.7),
    accent: scheme.accent,
    background: adjustBrightness(scheme.background, 0.12),
    surface: adjustBrightness(scheme.surface, 0.15),
    text: adjustBrightness(scheme.text, 2.5),
  };
}

export function platformLabel(platform: Platform): string {
  if (platform === 'ios') return 'iOS';
  if (platform === 'android') return 'Android';
  return 'iOS + Android';
}

export const STAGE_DEFINITIONS: { type: StageType; name: string }[] = [
  { type: 'analysis', name: 'Analyzing your prompt' },
  { type: 'scaffold', name: 'Scaffolding project structure' },
  { type: 'design', name: 'Generating design system' },
  { type: 'screens', name: 'Building screens' },
  { type: 'database', name: 'Setting up database' },
  { type: 'logic', name: 'Wiring app logic' },
  { type: 'testing', name: 'Running tests' },
  { type: 'deploy', name: 'Preparing deployment' },
];

const STAGE_LOGS: Record<StageType, string[]> = {
  analysis: [
    'Parsing natural language prompt...',
    `Detected app category: ${'{appType}'}`,
    'Extracting features and requirements...',
    'Planning data model and user flows...',
    'Analysis complete. Ready to build.',
  ],
  scaffold: [
    'Creating project directories...',
    'Installing dependencies (React Native, Expo)...',
    'Setting up navigation stack...',
    'Configuring app.json and manifest...',
    'Project scaffold ready.',
  ],
  design: [
    'Selecting color palette...',
    'Generating typography scale...',
    'Creating component tokens...',
    'Design system generated.',
  ],
  screens: [
    'Rendering screen components...',
    'Building navigation flow...',
    'Wiring screen transitions...',
    'All screens generated.',
  ],
  database: [
    'Designing database schema...',
    'Creating tables and relations...',
    'Enabling row-level security...',
    'Database ready.',
  ],
  logic: [
    'Implementing state management...',
    'Connecting API endpoints...',
    'Adding form validation...',
    'App logic wired.',
  ],
  testing: [
    'Running unit tests...',
    'Running integration tests...',
    'Checking for type errors...',
    'All tests passed.',
  ],
  deploy: [
    'Bundling app for production...',
    'Uploading to build server...',
    'Generating preview link...',
    'Deployment ready.',
  ],
};

export function stageLogs(type: StageType, appType: string): string[] {
  const logs = STAGE_LOGS[type] ?? [];
  return logs.map((l) => l.replace('{appType}', APP_TYPE_LABELS[appType] ?? appType));
}

function toPascalCase(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase()) || 'App';
}

function generateScreenCode(screen: ScreenSpec, scheme: ColorScheme, appName: string): string {
  const comp = toPascalCase(screen.name);
  const q = (s?: string) => JSON.stringify(s ?? '');
  const lines: string[] = [
    `import React from 'react';`,
    `import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';`,
    ``,
    `export default function ${comp}() {`,
    `  return (`,
    `    <ScrollView style={styles.container} contentContainerStyle={styles.content}>`,
  ];
  for (const el of screen.elements) {
    switch (el.kind) {
      case 'header':
        lines.push(`      <Text style={styles.header}>{${q(el.label)}}</Text>`);
        break;
      case 'text':
        lines.push(`      <Text style={styles.text}>{${q(el.label)}}</Text>`);
        break;
      case 'button':
        lines.push(`      <TouchableOpacity style={styles.button}>`);
        lines.push(`        <Text style={styles.buttonText}>{${q(el.label)}}</Text>`);
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
        if (el.value) lines.push(`        <Text style={styles.statValue}>{${q(el.value)}}</Text>`);
        lines.push(`      </View>`);
        break;
      case 'avatar':
        lines.push(`      <View style={styles.avatarRow}>`);
        lines.push(`        <View style={styles.avatar}><Text>{${q(el.label?.charAt(0))}}</Text></View>`);
        lines.push(`        <Text>{${q(el.label)}}</Text>`);
        lines.push(`      </View>`);
        break;
      case 'image':
        lines.push(`      <View style={styles.image} />`);
        break;
      case 'tabbar':
        lines.push(`      <TabBar />`);
        break;
    }
  }
  lines.push(`    </ScrollView>`);
  lines.push(`  );`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`const styles = StyleSheet.create({`);
  lines.push(`  container: { flex: 1, backgroundColor: '${scheme.background}' },`);
  lines.push(`  content: { padding: 16, gap: 12 },`);
  lines.push(`  header: { fontSize: 24, fontWeight: 'bold', color: '${scheme.text}' },`);
  lines.push(`  text: { fontSize: 14, color: '${scheme.text}' },`);
  lines.push(`  button: { backgroundColor: '${scheme.primary}', padding: 14, borderRadius: 12, alignItems: 'center' },`);
  lines.push(`  buttonText: { color: '#fff', fontWeight: '600' },`);
  lines.push(`  input: { backgroundColor: '${scheme.surface}', borderWidth: 1, borderColor: '${scheme.secondary}40', padding: 12, borderRadius: 12 },`);
  lines.push(`  card: { backgroundColor: '${scheme.surface}', padding: 16, borderRadius: 12 },`);
  lines.push(`  cardTitle: { fontWeight: '600', color: '${scheme.text}' },`);
  lines.push(`  cardValue: { fontSize: 12, color: '${scheme.text}99', marginTop: 4 },`);
  lines.push(`  listItem: { backgroundColor: '${scheme.surface}', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },`);
  lines.push(`  stat: { backgroundColor: '${scheme.surface}', padding: 16, borderRadius: 12 },`);
  lines.push(`  statLabel: { fontSize: 12, color: '${scheme.text}99' },`);
  lines.push(`  statValue: { fontSize: 20, fontWeight: 'bold', color: '${scheme.primary}', marginTop: 4 },`);
  lines.push(`  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },`);
  lines.push(`  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '${scheme.secondary}', alignItems: 'center', justifyContent: 'center' },`);
  lines.push(`  image: { height: 120, borderRadius: 12, backgroundColor: '${scheme.primary}30' },`);
  lines.push(`});`);
  return lines.join('\n');
}

export function generateProjectFiles(spec: AppSpec): ProjectFile[] {
  const appPascal = toPascalCase(spec.appName);
  const files: ProjectFile[] = [];

  const dirs = [
    { path: `src`, name: 'src', type: 'directory' as const },
    { path: `src/screens`, name: 'screens', type: 'directory' as const },
    { path: `src/components`, name: 'components', type: 'directory' as const },
    { path: `src/lib`, name: 'lib', type: 'directory' as const },
    { path: `src/assets`, name: 'assets', type: 'directory' as const },
    { path: `src/assets/images`, name: 'images', type: 'directory' as const },
  ];

  for (const d of dirs) {
    files.push({
      path: d.path,
      name: d.name,
      ext: '',
      type: d.type,
      content: '',
      language: 'text',
      lines: 0,
    });
  }

  files.push({
    path: 'package.json',
    name: 'package.json',
    ext: 'json',
    type: 'config',
    language: 'json',
    content: JSON.stringify({
      name: spec.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      version: '1.0.0',
      main: 'src/App.tsx',
      dependencies: {
        'react': '^18.3.1',
        'react-native': '^0.74.0',
        '@react-navigation/native': '^6.1.0',
        '@react-navigation/stack': '^6.3.0',
        'expo': '^51.0.0',
      },
      devDependencies: { '@types/react': '^18.3.0', typescript: '^5.5.0' },
      scripts: { start: 'expo start', build: 'expo build' },
    }, null, 2),
    lines: 16,
  });

  files.push({
    path: 'app.json',
    name: 'app.json',
    ext: 'json',
    type: 'config',
    language: 'json',
    content: JSON.stringify({
      expo: {
        name: spec.appName,
        slug: spec.appName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        version: '1.0.0',
        sdkVersion: '51.0.0',
        platform: ['ios', 'android'],
        icon: './src/assets/images/icon.png',
        splash: { backgroundColor: spec.colorScheme.background },
      },
    }, null, 2),
    lines: 10,
  });

  files.push({
    path: 'src/theme.ts',
    name: 'theme.ts',
    ext: 'ts',
    type: 'code',
    language: 'ts',
    content: [
      `export const theme = {`,
      `  primary: '${spec.colorScheme.primary}',`,
      `  secondary: '${spec.colorScheme.secondary}',`,
      `  accent: '${spec.colorScheme.accent}',`,
      `  background: '${spec.colorScheme.background}',`,
      `  surface: '${spec.colorScheme.surface}',`,
      `  text: '${spec.colorScheme.text}',`,
      `};`,
      ``,
      `export type Theme = typeof theme;`,
    ].join('\n'),
    lines: 10,
  });

  for (const screen of spec.screens) {
    const code = generateScreenCode(screen, spec.colorScheme, spec.appName);
    files.push({
      path: `src/screens/${toPascalCase(screen.name)}.tsx`,
      name: `${toPascalCase(screen.name)}.tsx`,
      ext: 'tsx',
      type: 'code',
      language: 'tsx',
      content: code,
      lines: code.split('\n').length,
    });
  }

  const navCode = [
    `import { createStackNavigator } from '@react-navigation/stack';`,
    ...spec.screens.map((s) => `import ${toPascalCase(s.name)} from './screens/${toPascalCase(s.name)}';`),
    ``,
    `const Stack = createStackNavigator();`,
    ``,
    `export default function AppNavigator() {`,
    `  return (`,
    `    <Stack.Navigator initialRouteName="${spec.screens[0]?.name ?? 'Home'}">`,
    ...spec.screens.map((s) => `      <Stack.Screen name="${s.name}" component={${toPascalCase(s.name)}} />`),
    `    </Stack.Navigator>`,
    `  );`,
    `}`,
  ].join('\n');
  files.push({
    path: 'src/Navigation.tsx',
    name: 'Navigation.tsx',
    ext: 'tsx',
    type: 'code',
    language: 'tsx',
    content: navCode,
    lines: navCode.split('\n').length,
  });

  files.push({
    path: 'README.md',
    name: 'README.md',
    ext: 'md',
    type: 'doc',
    language: 'md',
    content: [
      `# ${spec.appName}`,
      ``,
      `> ${spec.features.join(' · ')}`,
      ``,
      `## Getting started`,
      ``,
      `\`\`\`bash`,
      `npm install`,
      `npm start`,
      `\`\`\``,
      ``,
      `## Screens`,
      ``,
      ...spec.screens.map((s) => `- **${s.name}** — ${s.description}`),
    ].join('\n'),
    lines: 8 + spec.screens.length,
  });

  files.push({
    path: 'src/assets/images/icon.png',
    name: 'icon.png',
    ext: 'png',
    type: 'asset',
    language: 'image',
    content: `placeholder-icon:${spec.colorScheme.primary}`,
    lines: 0,
  });
  files.push({
    path: 'src/assets/images/splash.png',
    name: 'splash.png',
    ext: 'png',
    type: 'asset',
    language: 'image',
    content: `placeholder-splash:${spec.colorScheme.background}`,
    lines: 0,
  });

  return files;
}
