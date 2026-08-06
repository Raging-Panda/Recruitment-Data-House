"use client";

import { useState } from "react";
import type { WorkExperience } from "@ipskill/shared";
import { buttonClass } from "@/lib/button-styles";
import { EmptyState } from "@/components/empty-state";
import { LayersIcon } from "@/components/icons";

interface FormState {
  company: string;
  role: string;
  location: string;
  startDate: string; // YYYY-MM, from an <input type="month">
  endDate: string; // YYYY-MM
  isCurrent: boolean;
  description: string;
}

const INPUT_CLASS =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none";

const EMPTY_FORM: FormState = {
  company: "",
  role: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
};

function toMonthInput(value: string | null): string {
  return value ? value.slice(0, 7) : "";
}

function formatMonth(value: string | null, isCurrent: boolean): string {
  if (isCurrent) return "Present";
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function ExperienceManager({ initialEntries }: { initialEntries: WorkExperience[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId("new");
    setError(null);
  }

  function startEdit(entry: WorkExperience) {
    setForm({
      company: entry.company,
      role: entry.role,
      location: entry.location ?? "",
      startDate: toMonthInput(entry.startDate),
      endDate: toMonthInput(entry.endDate),
      isCurrent: entry.isCurrent,
      description: entry.description ?? "",
    });
    setEditingId(entry.id);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company || !form.role || !form.startDate) {
      setError("Company, role, and start date are required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      company: form.company,
      role: form.role,
      location: form.location || null,
      startDate: `${form.startDate}-01`,
      endDate: form.isCurrent || !form.endDate ? null : `${form.endDate}-01`,
      isCurrent: form.isCurrent,
      description: form.description || null,
    };

    try {
      const isNew = editingId === "new";
      const res = await fetch(isNew ? "/api/experience" : `/api/experience/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");

      setEntries((prev) => {
        if (isNew) return [data.entry, ...prev];
        return prev.map((e) => (e.id === data.entry.id ? data.entry : e));
      });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/experience/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  }

  return (
    <div className="mt-6">
      {entries.length === 0 && editingId === null && (
        <EmptyState
          icon={LayersIcon}
          title="No work history added yet"
          description="Add your first role to start building your experience timeline."
        />
      )}

      <div className="flex flex-col gap-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-2xl border border-surface-border bg-background-elevated p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-heading">{entry.role}</h3>
                <p className="text-sm text-text-secondary">
                  {entry.company}
                  {entry.location ? ` · ${entry.location}` : ""}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {formatMonth(entry.startDate, false)} — {formatMonth(entry.endDate, entry.isCurrent)}
                </p>
                {entry.description && (
                  <p className="mt-2 text-sm text-text-secondary">{entry.description}</p>
                )}
              </div>
              <div className="flex gap-3 text-xs">
                <button
                  onClick={() => startEdit(entry)}
                  className="text-primary hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-accent-red hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingId === null && (
        <button onClick={startAdd} className={buttonClass("primary", "md", "mt-4")}>
          + Add Experience
        </button>
      )}

      {editingId !== null && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-3 rounded-2xl border border-surface-border bg-background-elevated p-5"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Company">
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={INPUT_CLASS}
                required
              />
            </Field>
            <Field label="Role">
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={INPUT_CLASS}
                required
              />
            </Field>
            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Start date">
              <input
                type="month"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={INPUT_CLASS}
                required
              />
            </Field>
            <Field label="End date">
              <input
                type="month"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                disabled={form.isCurrent}
                className={`${INPUT_CLASS} disabled:opacity-40`}
              />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={form.isCurrent}
                onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              />
              I currently work here
            </label>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${INPUT_CLASS} min-h-20`}
            />
          </Field>

          {error && <p className="text-sm text-accent-red">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={isSaving} className={buttonClass("primary")}>
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancelEdit} className={buttonClass("ghost")}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-text-secondary">
      {label}
      {children}
    </label>
  );
}
