import { Task } from '../../tasks/schemas/task.schema';
import { formatDueDate, escapeHtml } from '../format.util';
import { EmailContent } from './task-created.template';

export function buildTaskCompletedEmail(task: Task): EmailContent {
  const subject = `Task completed: ${task.title}`;

  const locationRow = task.location?.city
    ? `<tr>
        <td style="padding: 6px 12px; font-weight: bold;">Location</td>
        <td style="padding: 6px 12px;">${escapeHtml(task.location.city)}</td>
      </tr>`
    : '';

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; color: #1a1a1a;">
      <h2 style="margin-bottom: 4px;">Task completed 🎉</h2>
      <p style="color: #555;">Nice work — this task was just marked done.</p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 12px;">
        <tr>
          <td style="padding: 6px 12px; font-weight: bold;">Title</td>
          <td style="padding: 6px 12px;">${escapeHtml(task.title)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; font-weight: bold;">Priority</td>
          <td style="padding: 6px 12px;">${task.priority}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; font-weight: bold;">Due date</td>
          <td style="padding: 6px 12px;">${formatDueDate(task.dueDate)}</td>
        </tr>
        ${locationRow}
      </table>
    </div>
  `.trim();

  return { subject, html };
}