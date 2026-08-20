import { CheckSquare, Tag, Sun } from "lucide-react";

const features = [
  { icon: CheckSquare, color: "indigo", title: "Tasks that stay on track", desc: "Create, prioritize, and complete tasks with clarity and ease." },
  { icon: Tag, color: "teal", title: "Organize your way", desc: "Use tags and priorities to sort what matters most." },
  { icon: Sun, color: "teal", title: "Stay ahead, every day", desc: "See the weather and plan your day with confidence." },
] as const;

export function RegisterVisual() {
  return (
    <div className="flex h-full w-full flex-col justify-center border-l border-border bg-background-secondary px-16 py-12">
      <h2 className="font-heading text-4xl font-bold leading-tight tracking-tight">
        <span className="block text-foreground">Plan less.</span>
        <span className="block text-primary">Focus more.</span>
        <span className="block text-secondary-accent">Get things done.</span>
      </h2>

      <div className="my-8 h-px w-full bg-border" />

      <div className="space-y-6">
        {features.map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="flex items-start gap-4">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                color === "indigo" ? "border-primary text-primary" : "border-secondary-accent text-secondary-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-start gap-3 border-l-2 border-primary pl-3">
        <p className="text-sm italic text-muted-foreground">
          Built for focus. Designed for you. Your tasks. Your space. Always private.
        </p>
      </div>
    </div>
  );
}