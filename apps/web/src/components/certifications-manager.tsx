"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { Certification } from "@ipskill/shared";
import { buttonClass } from "@/lib/button-styles";
import { EmptyState } from "@/components/empty-state";
import { ShieldCheckIcon } from "@/components/icons";
import { useToast } from "@/components/toast-provider";

const INPUT_CLASS =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none";

interface FormState {
  name: string;
  issuer: string;
  issueDate: string; // YYYY-MM, from an <input type="month">
  expiryDate: string; // YYYY-MM
  credentialId: string;
  credentialUrl: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  issuer: "",
  issueDate: "",
  expiryDate: "",
  credentialId: "",
  credentialUrl: "",
  description: "",
};

function toMonthInput(value: string | null): string {
  return value ? value.slice(0, 7) : "";
}

function formatMonth(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function CertificationsManager({ initialEntries }: { initialEntries: Certification[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showToast = useToast();

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId("new");
    setError(null);
  }

  function startEdit(entry: Certification) {
    setForm({
      name: entry.name,
      issuer: entry.issuer,
      issueDate: toMonthInput(entry.issueDate),
      expiryDate: toMonthInput(entry.expiryDate),
      credentialId: entry.credentialId ?? "",
      credentialUrl: entry.credentialUrl ?? "",
      description: entry.description ?? "",
    });
    setEditingId(entry.id);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.issuer || !form.issueDate) {
      setError("Name, issuer, and issue date are required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      issuer: form.issuer,
      issueDate: `${form.issueDate}-01`,
      expiryDate: form.expiryDate ? `${form.expiryDate}-01` : null,
      credentialId: form.credentialId || null,
      credentialUrl: form.credentialUrl || null,
      description: form.description || null,
    };

    try {
      const isNew = editingId === "new";
      const res = await fetch(isNew ? "/api/certifications" : `/api/certifications/${editingId}`, {
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
      showToast(isNew ? "Certification added" : "Certification updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/certifications/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("Certification deleted");
    } else {
      showToast("Failed to delete certification", "error");
    }
  }

  return (
    <div className="mt-6">
      {entries.length === 0 && editingId === null && (
        <EmptyState
          icon={ShieldCheckIcon}
          title="No certifications added yet"
          description="Add a certification to show off verified credentials on your profile."
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
                <h3 className="font-semibold text-heading">{entry.name}</h3>
                <p className="text-sm text-text-secondary">{entry.issuer}</p>
                <p className="mt-1 text-xs text-text-muted">
                  Issued {formatMonth(entry.issueDate)}
                  {entry.expiryDate ? ` · Expires ${formatMonth(entry.expiryDate)}` : ""}
                </p>
                {entry.credentialId && (
                  <p className="mt-1 text-xs text-text-muted">Credential ID: {entry.credentialId}</p>
                )}
                {entry.credentialUrl && (
                  <a
                    href={entry.credentialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-primary hover:underline"
                  >
                    View credential
                  </a>
                )}
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
          + Add Certification
        </button>
      )}

      {editingId !== null && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-3 rounded-2xl border border-surface-border bg-background-elevated p-5"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Certification name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={INPUT_CLASS}
                required
              />
            </Field>
            <Field label="Issuing organization">
              <input
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                className={INPUT_CLASS}
                required
              />
            </Field>
            <Field label="Issue date">
              <input
                type="month"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className={INPUT_CLASS}
                required
              />
            </Field>
            <Field label="Expiry date (optional)">
              <input
                type="month"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Credential ID (optional)">
              <input
                value={form.credentialId}
                onChange={(e) => setForm({ ...form, credentialId: e.target.value })}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Credential URL (optional)">
              <input
                type="url"
                value={form.credentialUrl}
                onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })}
                className={INPUT_CLASS}
              />
            </Field>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-text-secondary">
      {label}
      {children}
    </label>
  );
}
