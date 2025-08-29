import { toPng } from 'html-to-image';

/**
 * Export a DOM element to a PNG data URL and trigger download.
 * Adds a temporary white background to improve readability on dark themes.
 */
export async function downloadElementAsPng(target: HTMLElement, filename: string): Promise<void> {
  if (!target) return;

  // Clone node to avoid mutating original layout/styles
  const cloned = target.cloneNode(true) as HTMLElement;
  const width = target.offsetWidth || 800;
  const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1.5));

  // Ensure a consistent background for readability
  cloned.style.background = 'white';
  cloned.style.color = '#111827';
  cloned.style.borderRadius = '12px';
  cloned.style.padding = '16px';

  // Wrap in container to preserve computed width
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-99999px';
  wrapper.style.top = '0';
  wrapper.style.width = `${width}px`;
  wrapper.style.zIndex = '-1';
  wrapper.appendChild(cloned);
  document.body.appendChild(wrapper);

  try {
    const dataUrl = await toPng(cloned, {
      cacheBust: true,
      pixelRatio: scale,
      backgroundColor: 'white'
    });

    const link = document.createElement('a');
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } finally {
    document.body.removeChild(wrapper);
  }
}

/**
 * Convenience: find closest card-like parent and export.
 */
export async function downloadClosestCard(triggerEl: HTMLElement, baseName: string): Promise<void> {
  if (!triggerEl) return;
  const candidate = triggerEl.closest('.ai-message-card, .ai-structured-card, .voice-response-card') as HTMLElement | null;
  const target = candidate ?? (triggerEl.parentElement as HTMLElement | null);
  if (target) {
    await downloadElementAsPng(target, baseName);
  }
}


