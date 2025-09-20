"use client";

/**
 * ProspectForm (Create + Edit)
 * - First Name / Last Name
 * - Phone with country flag (default Malaysia, saves +E.164)
 * - Email + phone validation
 * - First Contact entered as "dd-m-yyyy" and validated client-side
 * - Error text appears on blur or after Save is clicked
 * - If `prospectId` prop is present => PATCH (edit), otherwise POST (create)
 */

import { useState } from "react";
import { z } from "zod";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

/* ---------- Helpers: date formatting/parsing for dd-m-yyyy ---------- */
function todayDdMYyyy(): string {
  const now = new Date();
  const d = now.getDate();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  return `${d}-${m}-${y}`;
}
function parseDdMYyyyToDate(s: string): Date | null {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const y = Number(m[3]);
  const dt = new Date(y, mo, d);
  return isNaN(dt.getTime()) ? null : dt;
}
function looksLikeDdMYyyy(s: string) {
  return /^(\d{1,2})-(\d{1,2})-(\d{4})$/.test(s.trim());
}

/* -------------------------- Client validation -------------------------- */
const emailSchema = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ?? "").trim())
  .refine(
    (v) => v === "" || z.string().email().safeParse(v).success,
    "Please enter a valid email address."
  );

const relaxedPhoneSchema = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ?? "").trim())
  .refine((v) => {
    if (!v) return true; // optional
    const digits = v.replace(/\D/g, "");
    if (digits.length < 7) return true; // allow partial while typing
    return /^\+[1-9]\d{6,14}$/.test(v); // enforce E.164 once long enough
  }, "Please enter a valid phone in international format (e.g., +60123456789).");

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  company: z.string().optional(),
  email: emailSchema,
  phone: relaxedPhoneSchema,
  /** Form stores dd-m-yyyy string; server converts to Date */
  firstContact: z
    .string()
    .min(1, "First contact is required.")
    .refine(looksLikeDdMYyyy, "Use format dd-m-yyyy (e.g., 15-9-2025)."),
  status: z
    .enum([
      "Pending",
      "Interested",
      "MeetingScheduled",
      "DealClosed",
      "NotInterested",
    ])
    .default("Pending"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
type FieldErrors = Partial<Record<keyof FormData, string>>;
type TouchedMap = Partial<Record<keyof FormData, boolean>>;

export default function ProspectForm({
  preset,
  prospectId, // if present -> edit mode (PATCH)
}: {
  preset?: Partial<FormData>;
  prospectId?: string;
}) {
  /* ---- local form state ---- */
  const [form, setForm] = useState<FormData>({
    firstName: preset?.firstName ?? "",
    lastName: preset?.lastName ?? "",
    company: preset?.company ?? "",
    email: (preset?.email as string) ?? "",
    phone: (preset?.phone as string) ?? "",
    firstContact: preset?.firstContact ?? todayDdMYyyy(),
    status: (preset?.status as FormData["status"]) ?? "Pending",
    notes: preset?.notes ?? "",
  });

  /* ---- validation UI state ---- */
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedMap>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ---- small helpers for rendering ---- */
  const showError = (f: keyof FormData) =>
    (touched[f] || submitAttempted) && !!errors[f];
  const inputClass = (f: keyof FormData) =>
    `w-full border rounded-lg px-3 py-2 ${
      showError(f) ? "border-red-500" : "border-gray-300"
    }`;
  const errorText = (f: keyof FormData) =>
    showError(f) ? (
      <div className="text-xs text-red-600 mt-1">{errors[f]}</div>
    ) : null;

  const setField =
    <K extends keyof FormData>(k: K) =>
    (v: FormData[K]) =>
      setForm((s) => ({ ...s, [k]: v }));

  const validateField = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    const single = formSchema.pick({ [k]: true } as any);
    const res = single.safeParse({ [k]: v } as any);
    setErrors((prev) => ({
      ...prev,
      [k]: res.success ? undefined : res.error.issues[0]?.message,
    }));
  };

  const onBlur =
    <K extends keyof FormData>(k: K) =>
    () => {
      setTouched((t) => ({ ...t, [k]: true }));
      validateField(k, form[k]);
    };

  const validateAll = (): boolean => {
    const res = formSchema.safeParse(form);
    if (res.success) {
      setErrors({});
      return true;
    }
    const map: FieldErrors = {};
    for (const issue of res.error.issues) {
      const key = issue.path[0] as keyof FormData;
      if (!map[key]) map[key] = issue.message;
    }
    setErrors(map);
    return false;
  };

  /* ---- save: POST (create) or PATCH (edit) ---- */
  const save = async () => {
    setSubmitAttempted(true);
    setTouched((t) => ({
      ...t,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      firstContact: true,
      status: true,
    }));
    if (!validateAll()) return;

    // extra guard: make sure date parses correctly
    if (!parseDdMYyyyToDate(form.firstContact)) {
      setErrors((e) => ({
        ...e,
        firstContact: "Use format dd-m-yyyy (e.g., 15-9-2025).",
      }));
      return;
    }

    setSaving(true);

    const url = prospectId ? `/api/prospects/${prospectId}` : `/api/prospects`;
    const method = prospectId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form), // server expects firstContact as dd-m-yyyy
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "Failed to save.");
      return;
    }

    // navigate after save
    if (prospectId) {
      window.location.href = `/prospects/${prospectId}`;
    } else {
      window.location.href = "/prospects";
    }
  };

  /* ---- UI ---- */
  return (
    <div className="card p-4 max-w-2xl">
      <h3 className="font-semibold mb-3">
        {prospectId ? "Edit Prospect" : "Add Prospect"}
      </h3>

      <div className="grid md:grid-cols-2 gap-3">
        {/* First Name */}
        <div>
          <label className="text-xs text-gray-600">First Name</label>
          <input
            className={inputClass("firstName")}
            value={form.firstName}
            onChange={(e) => setField("firstName")(e.target.value)}
            onBlur={onBlur("firstName")}
            placeholder="First name"
          />
          {errorText("firstName")}
        </div>

        {/* Last Name */}
        <div>
          <label className="text-xs text-gray-600">Last Name</label>
          <input
            className={inputClass("lastName")}
            value={form.lastName}
            onChange={(e) => setField("lastName")(e.target.value)}
            onBlur={onBlur("lastName")}
            placeholder="Last name"
          />
          {errorText("lastName")}
        </div>

        {/* Company */}
        <div>
          <label className="text-xs text-gray-600">Company</label>
          <input
            className={inputClass("company")}
            value={form.company || ""}
            onChange={(e) => setField("company")(e.target.value)}
            onBlur={onBlur("company")}
            placeholder="Company name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs text-gray-600">Email</label>
          <input
            className={inputClass("email")}
            value={form.email || ""}
            onChange={(e) => setField("email")(e.target.value)}
            onBlur={onBlur("email")}
            placeholder="name@company.com"
            inputMode="email"
          />
          {errorText("email")}
        </div>

        {/* Phone (flag, default MY) */}
        <div>
          <label className="text-xs text-gray-600">Phone</label>
          <PhoneInput
            defaultCountry="my"
            value={form.phone || ""}
            onChange={(val) => setField("phone")(val as any)}
            inputProps={{ onBlur: onBlur("phone") as any }}
            placeholder="e.g., +60 12 345 6789"
            className={
              showError("phone") ? "ring-1 ring-red-500 rounded-lg" : ""
            }
            inputClassName="w-full border rounded-lg px-3 py-2"
            preferredCountries={["my", "sg", "id", "th", "ph", "vn"]}
            forceDialCode
          />
          {errorText("phone")}
        </div>

        {/* First Contact (dd-m-yyyy) */}
        <div>
          <label className="text-xs text-gray-600">
            First Contact (dd-m-yyyy)
          </label>
          <input
            className={inputClass("firstContact")}
            value={form.firstContact}
            onChange={(e) => setField("firstContact")(e.target.value)}
            onBlur={onBlur("firstContact")}
            placeholder="15-9-2025"
          />
          {errorText("firstContact")}
        </div>

        {/* Status */}
        <div>
          <label className="text-xs text-gray-600">Status</label>
          <select
            className={inputClass("status")}
            value={form.status}
            onChange={(e) =>
              setField("status")(e.target.value as FormData["status"])
            }
            onBlur={onBlur("status")}
          >
            <option>Pending</option>
            <option>Interested</option>
            <option value="MeetingScheduled">Meeting Scheduled</option>
            <option>Deal Closed</option>
            <option>Not Interested</option>
          </select>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="text-xs text-gray-600">Notes</label>
          <input
            className={inputClass("notes")}
            value={form.notes || ""}
            onChange={(e) => setField("notes")(e.target.value)}
            onBlur={onBlur("notes")}
            placeholder="Any context or remarks"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <a
          className="btn"
          href={prospectId ? `/prospects/${prospectId}` : "/prospects"}
        >
          Cancel
        </a>
      </div>
    </div>
  );
}
