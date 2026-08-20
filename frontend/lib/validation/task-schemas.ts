import { z } from "zod";

export const taskStatusValues = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE"] as const;
export const priorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const subtaskSchema = z.object({
  title: z.string().min(1),
  done: z.boolean().default(false),
});

export const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200, "Max 200 characters."),
  description: z.string().max(5000, "Max 5000 characters.").optional().or(z.literal("")),
  status: z.enum(taskStatusValues),
  priority: z.enum(priorityValues),
  dueDate: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  subtasks: z.array(subtaskSchema).default([]),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;