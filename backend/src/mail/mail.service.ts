import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EnvConfig } from '../config/env.validation';
import { Task } from '../tasks/schemas/task.schema';
import { buildTaskCreatedEmail } from './templates/task-created.template';
import { buildTaskCompletedEmail } from './templates/task-completed.template';

// Guards against a slow/hanging Resend request blocking a task request —
// this is intentionally shorter than any reasonable HTTP client timeout.
const SEND_TIMEOUT_MS = 10_000;

/**
 * Narrow public interface: TasksService (and anything else that wants to
 * notify a user) depends on this, not on the Resend SDK directly. If the
 * email provider ever changes, only this file's internals change.
 */
@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly fromAddress: string;

  constructor(private configService: ConfigService<EnvConfig, true>) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY', { infer: true }));
    this.fromAddress = this.configService.get('EMAIL_FROM_ADDRESS', { infer: true });
  }

  async sendTaskCreatedEmail(to: string, task: Task): Promise<void> {
    const { subject, html } = buildTaskCreatedEmail(task);
    await this.send(to, subject, html, String(task._id));
  }

  async sendTaskCompletedEmail(to: string, task: Task): Promise<void> {
    const { subject, html } = buildTaskCompletedEmail(task);
    await this.send(to, subject, html, String(task._id));
  }

  /**
   * Wraps the actual Resend SDK call. Never throws — email delivery is
   * best-effort and must never fail or roll back the task create/update
   * request that triggered it. Failures are caught here and logged with
   * enough context (task id, recipient, underlying error) to debug, tagged
   * EMAIL_FAILED in the log line only (this is not a thrown error code).
   */
  private async send(to: string, subject: string, html: string, taskId: string): Promise<void> {
    try {
      const result = await Promise.race([
        this.resend.emails.send({
          from: this.fromAddress,
          to,
          subject,
          html,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Resend request timed out')), SEND_TIMEOUT_MS),
        ),
      ]);

      if (result?.error) {
        throw new Error(result.error.message ?? 'Resend returned an error response');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `[EMAIL_FAILED] taskId=${taskId} to=${to} subject="${subject}":`,
        err,
      );
    }
  }
}