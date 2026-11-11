"use client";

/**
 * Query form. Field labels and placeholders are the live site's own copy,
 * passed in as props (the content snapshot never ships to the browser).
 *
 * Behaviour (see the forms playbook):
 * - validates with the same schema as the server, shows errors next to fields;
 * - keeps everything the visitor typed on any failure;
 * - one submission id per message, reused on retry, so a double click or a
 *   retry after a lost response can't send two emails;
 * - says "sent" only when the server confirms it.
 */
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRightIcon } from "@/ui/icons";
import {
  ENQUIRY_LIMITS,
  enquirySchema,
  fieldErrors,
  type EnquiryField,
  type EnquiryInput,
  type EnquiryResponse,
} from "./enquiry.schema";

export type EnquiryFormCopy = {
  labels: { name: string; email: string; phone: string; date: string; travellers: string; message: string };
  placeholders: {
    name: string;
    email: string;
    phone: string;
    date: string;
    adults: string;
    children: string;
    message: string;
  };
  submitLabel: string;
  honeypotLabel: string;
  fallback: { label: string; value: string; href: string };
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent"; message: string }
  | { kind: "failed"; message: string };

type Errors = Partial<Record<EnquiryField, string>>;

const FIELD_ORDER: EnquiryField[] = ["name", "email", "phone", "travelDate", "adults", "children", "message"];
const REQUEST_TIMEOUT_MS = 15_000;
/** Live re-validation only checks fields; the real id is attached on submit. */
const VALIDATION_ONLY_ID = "00000000-0000-4000-8000-000000000000";

function newSubmissionId() {
  return crypto.randomUUID();
}

function todayLocalIso() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function readForm(form: HTMLFormElement, submissionId: string): EnquiryInput {
  const data = new FormData(form);
  const text = (key: string) => String(data.get(key) ?? "");
  return {
    submissionId,
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    travelDate: text("travelDate"),
    adults: text("adults"),
    children: text("children"),
    message: text("message"),
    website: text("website"),
  };
}

export function EnquiryForm({ copy }: { copy: EnquiryFormCopy }) {
  const submissionId = useRef<string>("");
  const dateInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Errors>({});
  const [messageLength, setMessageLength] = useState(0);
  const uid = useId();

  useEffect(() => {
    // The server can't know the visitor's local date, so set it on the element after mount.
    if (dateInput.current) dateInput.current.min = todayLocalIso();
  }, []);

  const focusFirstError = (form: HTMLFormElement, found: Errors) => {
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  /** After a failed attempt, fields re-validate as the visitor fixes them (delegated from <form>). */
  const revalidate = (e: React.FormEvent<HTMLFormElement>) => {
    if (Object.keys(errors).length === 0) return;
    const result = enquirySchema.safeParse(readForm(e.currentTarget, VALIDATION_ONLY_ID));
    setErrors(result.success ? {} : fieldErrors(result.error));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status.kind === "submitting") return;
    const form = e.currentTarget;
    // One id per message: kept across retries, replaced only after a confirmed send.
    if (!submissionId.current) submissionId.current = newSubmissionId();

    const input = readForm(form, submissionId.current);
    const local = enquirySchema.safeParse(input);
    if (!local.success) {
      const found = fieldErrors(local.error);
      setErrors(found);
      setStatus({ kind: "idle" });
      focusFirstError(form, found);
      return;
    }

    setErrors({});
    setStatus({ kind: "submitting" });

    let response: EnquiryResponse;
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      response = (await res.json()) as EnquiryResponse;
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === "TimeoutError";
      setStatus({
        kind: "failed",
        message: timedOut
          ? `Your query may have been received, but we couldn't confirm it. Sending again is safe and won't create a duplicate. You can also WhatsApp us on ${copy.fallback.value}.`
          : `We couldn't reach the server. Check your connection and try again, or WhatsApp us on ${copy.fallback.value}.`,
      });
      return;
    }

    if (response.ok) {
      setStatus({ kind: "sent", message: response.message });
      form.reset();
      setMessageLength(0);
      submissionId.current = ""; // the next message is a new enquiry
      return;
    }

    const found = response.error.fields ?? {};
    setErrors(found);
    setStatus({ kind: "failed", message: response.error.message });
    focusFirstError(form, found);
  };

  const errorId = (field: EnquiryField) => `${uid}-${field}-error`;
  const fieldProps = (field: EnquiryField) => ({
    name: field,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? errorId(field) : undefined,
  });

  const submitting = status.kind === "submitting";

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      onChange={revalidate}
      className="flex flex-col gap-9"
      aria-describedby={`${uid}-status`}
    >
      <div className="grid gap-9 sm:grid-cols-2">
        <Field id={`${uid}-name`} label={copy.labels.name} error={errors.name} errorId={errorId("name")} wide>
          <input
            id={`${uid}-name`}
            type="text"
            autoComplete="name"
            maxLength={ENQUIRY_LIMITS.name}
            required
            placeholder={copy.placeholders.name}
            className={inputClass}
            {...fieldProps("name")}
          />
        </Field>

        <Field id={`${uid}-email`} label={copy.labels.email} error={errors.email} errorId={errorId("email")}>
          <input
            id={`${uid}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={ENQUIRY_LIMITS.email}
            required
            placeholder={copy.placeholders.email}
            className={inputClass}
            {...fieldProps("email")}
          />
        </Field>

        <Field id={`${uid}-phone`} label={copy.labels.phone} error={errors.phone} errorId={errorId("phone")}>
          <input
            id={`${uid}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            minLength={10}
            maxLength={ENQUIRY_LIMITS.phone + 6}
            required
            placeholder={copy.placeholders.phone}
            className={inputClass}
            {...fieldProps("phone")}
          />
        </Field>

        <Field id={`${uid}-date`} label={copy.labels.date} error={errors.travelDate} errorId={errorId("travelDate")}>
          <input
            ref={dateInput}
            id={`${uid}-date`}
            type="date"
            required
            aria-label={copy.placeholders.date}
            className={`${inputClass} [color-scheme:light]`}
            {...fieldProps("travelDate")}
          />
        </Field>

        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 label text-moss">{copy.labels.travellers}</legend>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={ENQUIRY_LIMITS.travellers}
              required
              aria-label={copy.placeholders.adults}
              placeholder={copy.placeholders.adults}
              className={inputClass}
              {...fieldProps("adults")}
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={ENQUIRY_LIMITS.travellers}
              aria-label={copy.placeholders.children}
              placeholder={copy.placeholders.children}
              className={inputClass}
              {...fieldProps("children")}
            />
          </div>
          <FieldError id={errorId("adults")} message={errors.adults} />
          <FieldError id={errorId("children")} message={errors.children} />
        </fieldset>

        <Field id={`${uid}-message`} label={copy.labels.message} error={errors.message} errorId={errorId("message")} wide>
          <textarea
            id={`${uid}-message`}
            rows={4}
            maxLength={ENQUIRY_LIMITS.message}
            required
            placeholder={copy.placeholders.message}
            className={`${inputClass} resize-none`}
            {...fieldProps("message")}
            onChange={(e) => setMessageLength(e.currentTarget.value.length)}
          />
          <span className="self-end font-mono text-[0.7rem] text-moss tabular-nums" aria-hidden="true">
            {messageLength}/{ENQUIRY_LIMITS.message}
          </span>
        </Field>
      </div>

      {/* Honeypot: off-screen for people, tempting for bots. Label is the live site's own. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-website`}>{copy.honeypotLabel}</label>
        <input id={`${uid}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting || undefined}
          className="group inline-flex items-center justify-center gap-3 rounded-full bg-mandarin py-3 pr-3 pl-7 font-display text-lg font-semibold text-ink transition-[transform,opacity] duration-300 ease-out-expo hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
        >
          {copy.submitLabel}
          <span className="grid size-10 place-items-center rounded-full bg-ink text-fog transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
            {submitting ? <Spinner /> : <ArrowRightIcon />}
          </span>
        </button>

        <p className="text-[0.95rem] text-moss">
          {copy.fallback.label}{" "}
          <a href={copy.fallback.href} target="_blank" rel="noreferrer noopener" className="font-mono text-[0.85rem] text-ink underline underline-offset-4">
            {copy.fallback.value}
          </a>
        </p>
      </div>

      {/* Pre-mounted live region: announced reliably by screen readers. */}
      <div id={`${uid}-status`} role="status" aria-live="polite" className="min-h-6">
        {status.kind === "sent" ? (
          <p className="rounded-tl-2xl rounded-br-2xl bg-river px-5 py-4 text-cloud">{status.message}</p>
        ) : null}
        {status.kind === "failed" ? (
          <p className="rounded-tl-2xl rounded-br-2xl border border-alert/30 bg-alert/8 px-5 py-4 text-alert">{status.message}</p>
        ) : null}
      </div>
    </form>
  );
}

const inputClass =
  "w-full min-w-0 border-0 border-b border-ink/25 bg-transparent px-0 py-3 text-[1.0625rem] text-ink placeholder:text-moss/60 transition-colors focus:border-ink focus:outline-none focus-visible:outline-none focus-visible:border-b-2 focus-visible:border-mandarin aria-invalid:border-alert";

function Field({
  id,
  label,
  error,
  errorId,
  wide = false,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  errorId: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="label text-moss">
        {label}
      </label>
      {children}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[0.9rem] text-alert">
      {message}
    </p>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" className="animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="42 60" strokeLinecap="round" />
    </svg>
  );
}
