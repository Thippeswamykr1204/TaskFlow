/**
 * Small shared helpers for the inline HTML email templates. Kept minimal on
 * purpose — no templating engine at this scale.
 */

export function formatDueDate(dueDate?: Date): string {
  if (!dueDate) {
    return 'No due date';
  }

  return new Date(dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Bare-bones HTML escaping for the handful of user-supplied strings
 * (title, location city) that get interpolated into the templates below.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}