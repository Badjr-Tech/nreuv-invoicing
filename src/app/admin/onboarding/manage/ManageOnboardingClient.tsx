"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  createOnboardingCategory,
  createOnboardingTask,
  deleteOnboardingCategory,
  deleteOnboardingTask,
  moveOnboardingCategory,
  moveOnboardingTask,
  removeOnboardingTaskAttachment,
  renameOnboardingCategory,
  updateOnboardingTask,
  uploadOnboardingTaskAttachment,
} from "@/app/actions/onboarding-admin";

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
}

export default function ManageOnboardingClient({ categories, tasks }: Props) {
  const [busy, startTransition] = useTransition();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingTaskForCat, setAddingTaskForCat] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [renamingCatId, setRenamingCatId] = useState<string | null>(null);

  const tasksByCategory = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const cat of categories) m.set(cat.id, []);
    for (const t of tasks) {
      if (!m.has(t.categoryId)) m.set(t.categoryId, []);
      m.get(t.categoryId)!.push(t);
    }
    return m;
  }, [categories, tasks]);

  const run = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      try {
        await fn();
      } catch (err: any) {
        alert(err?.message || "Something went wrong");
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-2 md:p-4">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-nreuv-black tracking-tight">
            Manage Onboarding Checklist
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Edit the master checklist every new hire works through. Changes affect everyone.
          </p>
        </div>
        <Link
          href="/admin/onboarding"
          className="text-sm font-medium text-nreuv-primary hover:text-nreuv-accent"
        >
          ← Back to progress
        </Link>
      </div>

      {/* Add category */}
      <div className="mb-5">
        {showNewCategory ? (
          <form
            className="flex gap-2 bg-white border border-slate-200 rounded-lg p-3 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const name = newCategoryName.trim();
              if (!name) return;
              run(async () => {
                await createOnboardingCategory(name);
                setNewCategoryName("");
                setShowNewCategory(false);
              });
            }}
          >
            <input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name (e.g. First Week)"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-nreuv-accent"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-nreuv-primary text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:opacity-60"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewCategory(false);
                setNewCategoryName("");
              }}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowNewCategory(true)}
            className="text-sm font-semibold text-nreuv-primary hover:text-nreuv-accent"
          >
            + Add Category
          </button>
        )}
      </div>

      <div className="space-y-5">
        {categories.map((cat, catIdx) => {
          const catTasks = tasksByCategory.get(cat.id) || [];
          const isFirst = catIdx === 0;
          const isLast = catIdx === categories.length - 1;
          return (
            <section
              key={cat.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
            >
              <header className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    disabled={busy || isFirst}
                    onClick={() => run(() => moveOnboardingCategory(cat.id, "up"))}
                    className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs leading-none"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    disabled={busy || isLast}
                    onClick={() => run(() => moveOnboardingCategory(cat.id, "down"))}
                    className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs leading-none"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>
                {renamingCatId === cat.id ? (
                  <CategoryRenameForm
                    initial={cat.name}
                    onCancel={() => setRenamingCatId(null)}
                    onSave={(name) =>
                      run(async () => {
                        await renameOnboardingCategory(cat.id, name);
                        setRenamingCatId(null);
                      })
                    }
                  />
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-slate-800 flex-1">{cat.name}</h2>
                    <span className="text-xs text-slate-500 font-medium">
                      {catTasks.length} {catTasks.length === 1 ? "task" : "tasks"}
                    </span>
                    <button
                      onClick={() => setRenamingCatId(cat.id)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm(`Delete "${cat.name}" and all its tasks? This cannot be undone.`)) return;
                        run(() => deleteOnboardingCategory(cat.id));
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-2"
                    >
                      Delete
                    </button>
                  </>
                )}
              </header>

              <ul className="divide-y divide-slate-100">
                {catTasks.length === 0 && (
                  <li className="px-4 py-6 text-sm text-slate-400 text-center italic">
                    No tasks yet.
                  </li>
                )}
                {catTasks.map((task, idx) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isFirst={idx === 0}
                    isLast={idx === catTasks.length - 1}
                    busy={busy}
                    onEdit={() => setEditingTask(task)}
                    onMoveUp={() => run(() => moveOnboardingTask(task.id, "up"))}
                    onMoveDown={() => run(() => moveOnboardingTask(task.id, "down"))}
                    onDelete={() => {
                      if (!confirm(`Delete task "${task.title}"?`)) return;
                      run(() => deleteOnboardingTask(task.id));
                    }}
                  />
                ))}
              </ul>

              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                {addingTaskForCat === cat.id ? (
                  <AddTaskForm
                    categoryId={cat.id}
                    existingGroups={Array.from(
                      new Set(catTasks.map((t) => t.groupName).filter(Boolean) as string[]),
                    )}
                    onCancel={() => setAddingTaskForCat(null)}
                    onSubmit={(values) =>
                      run(async () => {
                        await createOnboardingTask({ categoryId: cat.id, ...values });
                        setAddingTaskForCat(null);
                      })
                    }
                  />
                ) : (
                  <button
                    onClick={() => setAddingTaskForCat(cat.id)}
                    className="text-sm font-semibold text-nreuv-primary hover:text-nreuv-accent"
                  >
                    + Add Task
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          existingGroups={Array.from(
            new Set(
              (tasksByCategory.get(editingTask.categoryId) || [])
                .map((t) => t.groupName)
                .filter(Boolean) as string[],
            ),
          )}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

function CategoryRenameForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <form
      className="flex-1 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSave(value.trim());
      }}
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-nreuv-accent"
      />
      <button
        type="submit"
        className="px-3 py-1.5 bg-nreuv-primary text-white text-xs font-semibold rounded-md hover:opacity-90"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
      >
        Cancel
      </button>
    </form>
  );
}

function TaskRow({
  task,
  isFirst,
  isLast,
  busy,
  onEdit,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  task: Task;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/40">
      <div className="flex flex-col pt-1">
        <button
          disabled={busy || isFirst}
          onClick={onMoveUp}
          className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs leading-none"
          title="Move up"
        >
          ▲
        </button>
        <button
          disabled={busy || isLast}
          onClick={onMoveDown}
          className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs leading-none"
          title="Move down"
        >
          ▼
        </button>
      </div>
      <div className="flex-1 min-w-0">
        {task.groupName && (
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
            {task.groupName}
          </div>
        )}
        <div className="text-sm font-medium text-slate-900">{task.title}</div>
        {task.description && (
          <div className="text-xs text-slate-600 mt-0.5">{task.description}</div>
        )}
        <div className="flex gap-3 mt-1 text-xs">
          {task.externalUrl && (
            <a
              href={task.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-nreuv-primary hover:text-nreuv-accent font-medium"
            >
              Link ↗
            </a>
          )}
          {task.attachmentUrl && (
            <a
              href={task.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-nreuv-primary hover:text-nreuv-accent font-medium"
            >
              Attachment ↓
            </a>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 items-end">
        <button
          onClick={onEdit}
          className="text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-red-600 hover:text-red-800 font-medium"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function AddTaskForm({
  categoryId,
  existingGroups,
  onCancel,
  onSubmit,
}: {
  categoryId: string;
  existingGroups: string[];
  onCancel: () => void;
  onSubmit: (values: {
    title: string;
    description?: string | null;
    groupName?: string | null;
    externalUrl?: string | null;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupMode, setGroupMode] = useState<"none" | "existing" | "new">("none");
  const [groupExisting, setGroupExisting] = useState(existingGroups[0] || "");
  const [groupNew, setGroupNew] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        const groupName =
          groupMode === "existing"
            ? groupExisting || null
            : groupMode === "new"
              ? groupNew.trim() || null
              : null;
        onSubmit({
          title,
          description: description || null,
          groupName,
          externalUrl: externalUrl || null,
        });
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        placeholder="Task title"
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-nreuv-accent"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional description / instructions"
        rows={2}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-nreuv-accent"
      />
      <div className="flex gap-2 items-center flex-wrap">
        <label className="text-xs text-slate-600 font-medium">Subgroup:</label>
        <select
          value={groupMode}
          onChange={(e) => setGroupMode(e.target.value as any)}
          className="px-2 py-1.5 border border-slate-300 rounded-md text-sm"
        >
          <option value="none">None</option>
          {existingGroups.length > 0 && <option value="existing">Existing…</option>}
          <option value="new">New…</option>
        </select>
        {groupMode === "existing" && (
          <select
            value={groupExisting}
            onChange={(e) => setGroupExisting(e.target.value)}
            className="px-2 py-1.5 border border-slate-300 rounded-md text-sm"
          >
            {existingGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}
        {groupMode === "new" && (
          <input
            value={groupNew}
            onChange={(e) => setGroupNew(e.target.value)}
            placeholder="New subgroup name"
            className="px-2 py-1.5 border border-slate-300 rounded-md text-sm flex-1"
          />
        )}
      </div>
      <input
        value={externalUrl}
        onChange={(e) => setExternalUrl(e.target.value)}
        placeholder="Optional external link (https://…)"
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-nreuv-accent"
      />
      <p className="text-xs text-slate-500">
        Tip: attachments can be uploaded after creating the task — click Edit on the row.
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-nreuv-primary text-white text-sm font-semibold rounded-md hover:opacity-90"
        >
          Create Task
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditTaskModal({
  task,
  existingGroups,
  onClose,
}: {
  task: Task;
  existingGroups: string[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [groupName, setGroupName] = useState(task.groupName || "");
  const [externalUrl, setExternalUrl] = useState(task.externalUrl || "");
  const [saving, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState(task.attachmentUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = () => {
    startTransition(async () => {
      try {
        await updateOnboardingTask(task.id, {
          title,
          description: description || null,
          groupName: groupName || null,
          externalUrl: externalUrl || null,
        });
        onClose();
      } catch (err: any) {
        alert(err?.message || "Failed to save");
      }
    });
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("taskId", task.id);
      fd.append("file", file);
      const res = await uploadOnboardingTaskAttachment(fd);
      setAttachmentUrl(res.url);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      alert(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = () => {
    if (!confirm("Remove the attached file?")) return;
    startTransition(async () => {
      try {
        await removeOnboardingTaskAttachment(task.id);
        setAttachmentUrl(null);
      } catch (err: any) {
        alert(err?.message || "Failed to remove");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Edit Task</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-nreuv-accent"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-nreuv-accent"
            />
          </Field>
          <Field label="Subgroup">
            <div className="flex gap-2">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="(none)"
                list={`groups-${task.id}`}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-nreuv-accent"
              />
              <datalist id={`groups-${task.id}`}>
                {existingGroups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
          </Field>
          <Field label="External Link (URL)">
            <input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-nreuv-accent"
            />
          </Field>
          <Field label="Attachment">
            {attachmentUrl ? (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md p-2">
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-nreuv-primary hover:text-nreuv-accent font-medium truncate"
                >
                  {decodeURIComponent(attachmentUrl.split("/").pop() || "Attached file")}
                </a>
                <button
                  onClick={handleRemoveAttachment}
                  disabled={saving}
                  className="text-xs text-red-600 hover:text-red-800 font-medium ml-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  className="flex-1 text-sm"
                />
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-700 text-white rounded-md hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
                >
                  {uploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">25 MB max.</p>
          </Field>
        </div>
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md font-medium"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm bg-nreuv-primary text-white rounded-md hover:opacity-90 font-semibold disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
