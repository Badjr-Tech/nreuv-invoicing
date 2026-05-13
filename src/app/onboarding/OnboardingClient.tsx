"use client";

import { useMemo, useState, useTransition } from "react";
import { toggleOnboardingTask } from "@/app/actions";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

interface Task {
  id: string;
  categoryId: string;
  groupName: string | null;
  title: string;
  description: string | null;
  externalUrl: string | null;
  attachmentUrl: string | null;
  sortOrder: number;
}

interface Props {
  categories: Category[];
  tasks: Task[];
  completedIds: string[];
}

export default function OnboardingClient({ categories, tasks, completedIds }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedIds));
  const [pending, startTransition] = useTransition();

  const total = tasks.length;
  const done = completed.size;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  // Group tasks: category → optional groupName → ordered tasks
  const grouped = useMemo(() => {
    const byCategory = new Map<string, Map<string, Task[]>>();
    for (const cat of categories) {
      byCategory.set(cat.id, new Map());
    }
    for (const t of tasks) {
      const cat = byCategory.get(t.categoryId);
      if (!cat) continue;
      const key = t.groupName ?? "__ungrouped__";
      if (!cat.has(key)) cat.set(key, []);
      cat.get(key)!.push(t);
    }
    return byCategory;
  }, [categories, tasks]);

  const toggle = (taskId: string, next: boolean) => {
    // Optimistic update
    setCompleted((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(taskId);
      else copy.delete(taskId);
      return copy;
    });
    startTransition(async () => {
      try {
        await toggleOnboardingTask(taskId, next);
      } catch {
        // Roll back on failure
        setCompleted((prev) => {
          const copy = new Set(prev);
          if (next) copy.delete(taskId);
          else copy.add(taskId);
          return copy;
        });
      }
    });
  };

  const allDone = done === total && total > 0;

  return (
    <div className="max-w-4xl mx-auto p-2 md:p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-nreuv-black tracking-tight">Onboarding</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Work through these steps to get fully set up. Your progress saves automatically.
        </p>
      </div>

      {/* Progress card */}
      <div
        className={`rounded-xl border p-5 mb-6 shadow-sm ${
          allDone ? "bg-green-50 border-green-200" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-slate-800">
            {allDone ? "All done! 🎉" : `${done} of ${total} complete`}
          </div>
          <div className="text-sm font-medium text-slate-500">{pct}%</div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              allDone ? "bg-green-500" : "bg-nreuv-accent"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const cgroups = grouped.get(cat.id);
          if (!cgroups || cgroups.size === 0) return null;

          // Preserve original group order by walking the tasks list
          const groupOrder: string[] = [];
          for (const t of tasks) {
            if (t.categoryId !== cat.id) continue;
            const key = t.groupName ?? "__ungrouped__";
            if (!groupOrder.includes(key)) groupOrder.push(key);
          }

          const catTaskIds = tasks.filter((t) => t.categoryId === cat.id).map((t) => t.id);
          const catDone = catTaskIds.filter((id) => completed.has(id)).length;
          const catTotal = catTaskIds.length;

          return (
            <section
              key={cat.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
            >
              <header className="flex items-center justify-between bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">{cat.name}</h2>
                <span className="text-xs font-medium text-slate-500">
                  {catDone} / {catTotal}
                </span>
              </header>

              <div className="divide-y divide-slate-100">
                {groupOrder.map((groupKey) => {
                  const items = cgroups.get(groupKey) || [];
                  return (
                    <div key={groupKey}>
                      {groupKey !== "__ungrouped__" && (
                        <div className="px-5 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {groupKey}
                        </div>
                      )}
                      <ul>
                        {items.map((task) => {
                          const isDone = completed.has(task.id);
                          return (
                            <li
                              key={task.id}
                              className={`px-5 py-3 flex items-start gap-3 transition-colors ${
                                isDone ? "bg-slate-50/60" : "hover:bg-slate-50/40"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                disabled={pending}
                                onChange={(e) => toggle(task.id, e.target.checked)}
                                className="mt-1 h-5 w-5 rounded border-slate-300 text-nreuv-primary focus:ring-nreuv-accent cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-sm font-medium ${
                                    isDone ? "text-slate-400 line-through" : "text-slate-900"
                                  }`}
                                >
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div
                                    className={`text-xs mt-0.5 ${
                                      isDone ? "text-slate-400" : "text-slate-600"
                                    }`}
                                  >
                                    {task.description}
                                  </div>
                                )}
                                <div className="flex gap-3 mt-1.5">
                                  {task.externalUrl && (
                                    <a
                                      href={task.externalUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-medium text-nreuv-primary hover:text-nreuv-accent inline-flex items-center gap-1"
                                    >
                                      Open link →
                                    </a>
                                  )}
                                  {task.attachmentUrl && (
                                    <a
                                      href={task.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-medium text-nreuv-primary hover:text-nreuv-accent inline-flex items-center gap-1"
                                    >
                                      Download ↓
                                    </a>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
