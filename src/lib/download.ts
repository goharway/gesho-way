import JSZip from 'jszip';
import type { ProjectFile } from '@/types/builder';

export async function downloadProjectZip(
  files: ProjectFile[],
  appName: string,
): Promise<void> {
  if (files.length === 0) return;

  const zip = new JSZip();
  const root = slugify(appName);

  for (const file of files) {
    if (file.type === 'directory' || file.type === 'asset') continue;
    zip.file(`${root}/${file.path}`, file.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${root}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'app';
}
