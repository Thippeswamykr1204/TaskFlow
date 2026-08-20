import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { MailService } from './mail.service';
import { Task, TaskStatus, Priority } from '../tasks/schemas/task.schema';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

describe('MailService', () => {
  let service: MailService;
  let mockConfigService: Partial<ConfigService>;
  let mockSend: jest.Mock;

  const baseTask = {
    _id: 'task123',
    title: 'Ship Tier 5',
    priority: Priority.HIGH,
    status: TaskStatus.TODO,
    dueDate: new Date('2026-09-01T00:00:00.000Z'),
    location: { city: 'Bengaluru' },
  } as unknown as Task;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          RESEND_API_KEY: 'test-resend-key',
          EMAIL_FROM_ADDRESS: 'TaskFlow <notifications@yourdomain.com>',
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mockSend = (Resend as unknown as jest.Mock).mock.results[0].value.emails.send;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendTaskCreatedEmail', () => {
    it('sends via Resend with expected task fields in the HTML', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email1' }, error: null });

      await service.sendTaskCreatedEmail('user@example.com', baseTask);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.from).toBe('TaskFlow <notifications@yourdomain.com>');
      expect(call.subject).toContain('Ship Tier 5');
      expect(call.html).toContain('Ship Tier 5');
      expect(call.html).toContain('HIGH');
      expect(call.html).toContain('Bengaluru');
      expect(call.html).toContain('September 1, 2026');
    });

    it('falls back to "No due date" when dueDate is unset', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email1' }, error: null });
      const taskWithoutDueDate = { ...baseTask, dueDate: undefined } as unknown as Task;

      await service.sendTaskCreatedEmail('user@example.com', taskWithoutDueDate);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('No due date');
    });

    it('swallows a thrown error from the Resend SDK and does not propagate', async () => {
      mockSend.mockRejectedValue(new Error('network blip'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(
        service.sendTaskCreatedEmail('user@example.com', baseTask),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL_FAILED]'),
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('swallows an error-shaped response from Resend without throwing', async () => {
      mockSend.mockResolvedValue({ data: null, error: { message: 'invalid from address' } });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(
        service.sendTaskCreatedEmail('user@example.com', baseTask),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('sendTaskCompletedEmail', () => {
    it('sends via Resend with expected task fields in the HTML', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email2' }, error: null });

      await service.sendTaskCompletedEmail('user@example.com', baseTask);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain('Ship Tier 5');
      expect(call.html).toContain('Ship Tier 5');
      expect(call.html).toContain('HIGH');
      expect(call.html).toContain('Bengaluru');
    });

    it('swallows a thrown error from the Resend SDK and does not propagate', async () => {
      mockSend.mockRejectedValue(new Error('timeout'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(
        service.sendTaskCompletedEmail('user@example.com', baseTask),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});