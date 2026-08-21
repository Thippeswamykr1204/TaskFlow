import { z } from "zod";

export const taskStatusValues = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE"] as const;
export const priorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const subtaskSchema = z.object({
  // Present for existing subtasks loaded from the API, absent for a subtask
  // just added locally in create mode before the task has been saved.
  _id: z.string().optional(),
  title: z.string().min(1),
  done: z.boolean(),
});

// Note: no .default() on tags/subtasks/done here on purpose — with
// @hookform/resolvers v5 + zod v4, a .default() makes the schema's input and
// output types diverge (field becomes optional-in / required-out), which
// zodResolver's generics don't like and surfaces as a type error on
// useForm's resolver. toFormValues() below already supplies concrete
// defaults (tags: [], subtasks: [], done: false) via defaultValues, so the
// schema doesn't need to also default them.
export const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200, "Max 200 characters."),
  description: z.string().max(5000, "Max 5000 characters.").optional().or(z.literal("")),
  status: z.enum(taskStatusValues),
  priority: z.enum(priorityValues),
  dueDate: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()),
  subtasks: z.array(subtaskSchema),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;