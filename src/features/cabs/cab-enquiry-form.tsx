"use client";

/**
 * Cab booking form. Options, placeholders and the button label are the live
 * form's own (CF7 291), passed in as props. Dropdowns and the date use the
 * site's own controls (no browser-native pickers). Same behaviour as the query
 * form: shared validation, errors next to fields, input kept on failure, one
 * submission id per booking, "sent" only when the server confirms it.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRightIcon } from "@/ui/icons";
import { DatePicker } from "@/ui/date-picker";
import { SelectField } from "@/ui/select-field";
import {
  CAB_LIMITS,
  cabFieldErrors,
  makeCabEnquirySchema,
  type CabEnquiryInput,
  type CabField,
} from "./cab-enquiry.schema";
import type { EnquiryResponse } from "@/features/enquiry/enquiry.schema";

export type CabFormCopy = {
  pickup: { placeholder: string; options: string[] };
  drop: { placeholder: string; options: string[] };
  time: { placeholder: string; options: string[] };
  vehicle: { placeholder: string; options: string[] };
  countryCodes: string[];
  placeholders: { date: string; name: string; email: string; phone: string };
  submitLabel: string;
  honeypotLabel: string;
  dateRule: { minDaysFromToday: number; maxYearsAhead: number };
  fallback: { label: string; value: string; href: string };
};

type Status = { kind: "idle" } | { kind: "submitting" } | { kind: "sent"; message: string } | { kind: "failed"; message: string };
type Errors = Partial<Record<CabField, string>>;

const FIELD_ORDER: CabField[] = ["pickup", "drop", "date", "time", "name", "email", "countryCode", "phone", "vehicle"];
const REQUEST_TIMEOUT_MS = 15_000;
const VALIDATION_ONLY_ID = "00000000-0000-4000-8000-000000000000";

function readForm(form: HTMLFormElement, submissionId: string, page?: string): CabEnquiryInput {
  const data = new FormData(form);
  const text = (k: string) => String(data.get(k) ?? "");
  return {
    submissionId,
    pickup: text("pickup"),
    drop: text("drop"),
    date: text("date"),
    time: text("time"),
    name: text("name"),
    email: text("email"),
    countryCode: text("countryCode"),
    phone: text("phone"),
    vehicle: text("vehicle"),
    website: text("website"),
    ...(page ? { page } : {}),
  };
}

export function CabEnquiryForm({ copy, page }: { copy: CabFormCopy; page?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const submissionId = useRef("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Errors>({});
  const [pickTick, setPickTick] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const uid = useId();

  const schema = useMemo(
    () =>
      makeCabEnquirySchema({
        locations: copy.pickup.options,
        times: copy.time.options,
        vehicles: copy.vehicle.options,
        countryCodes: copy.countryCodes,
        maxYearsAhead: copy.dateRule.maxYearsAhead,
      }),
    [copy],
  );

  // Custom controls tell us when they change; re-validate (only after a failed attempt).
  useEffect(() => {
    if (!pickTick || !formRef.current) return;
    setErrors((current) => {
      if (Object.keys(current).length === 0) return current;
      const result = schema.safeParse(readForm(formRef.current as HTMLFormElement, VALIDATION_ONLY_ID, page));
      return result.success ? {} : cabFieldErrors(result.error);
    });
  }, [pickTick, schema, page]);

  const onPick = () => setPickTick((t) => t + 1);

  const focusFirstError = (form: HTMLFormElement, found: Errors) => {
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) form.querySelector<HTMLElement>(`#${CSS.escape(`${uid}-${first}`)}`)?.focus();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status.kind === "submitting") return;
    const form = e.currentTarget;
    if (!submissionId.current) submissionId.current = crypto.randomUUID();

    const input = readForm(form, submissionId.current, page);
    const local = schema.safeParse(input);
    if (!local.success) {
      const found = cabFieldErrors(local.error);
      setErrors(found);
      setStatus({ kind: "idle" });
      focusFirstError(form, found);
      return;
    }

    setErrors({});
    setStatus({ kind: "submitting" });
    let response: EnquiryResponse;
    try {
      const res = await fetch("/api/cab-enquiry/", {
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
          ? `Your booking may have been received, but we couldn't confirm it. Sending again is safe and won't create a duplicate. You can also WhatsApp us on ${copy.fallback.value}.`
          : `We couldn't reach the server. Check your connection and try again, or WhatsApp us on ${copy.fallback.value}.`,
      });
      return;
    }

    if (response.ok) {
      setStatus({ kind: "sent", message: response.message });
      form.reset();
      setResetKey((k) => k + 1); // remount custom controls so they clear too
      submissionId.current = "";
      return;
    }
    const found = (response.error.fields ?? {}) as Errors;
    setErrors(found);
    setStatus({ kind: "failed", message: response.error.message });
    focusFirstError(form, found);
  };

  const id = (f: CabField) => `${uid}-${f}`;
  const errId = (f: CabField) => `${uid}-${f}-error`;
  const a11y = (f: CabField) => ({ invalid: Boolean(errors[f]), describedBy: errors[f] ? errId(f) : undefined });
  const submitting = status.kind === "submitting";

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={onSubmit}
      onChange={onPick}
      aria-describedby={`${uid}-status`}
      className="flex flex-col gap-6"
    >
      <div key={resetKey} className="grid gap-x-5 gap-y-3 sm:grid-cols-2 sm:gap-y-4">
        <Field label={copy.pickup.placeholder} htmlFor={id("pickup")} error={errors.pickup} errorId={errId("pickup")}>
          <SelectField id={id("pickup")} name="pickup" placeholder={copy.pickup.placeholder} options={copy.pickup.options} onPick={onPick} {...a11y("pickup")} />
        </Field>
        <Field label={copy.drop.placeholder} htmlFor={id("drop")} error={errors.drop} errorId={errId("drop")}>
          <SelectField id={id("drop")} name="drop" placeholder={copy.drop.placeholder} options={copy.drop.options} onPick={onPick} {...a11y("drop")} />
        </Field>
        <Field label={copy.placeholders.date} htmlFor={id("date")} error={errors.date} errorId={errId("date")}>
          <DatePicker
            id={id("date")}
            name="date"
            placeholder={copy.placeholders.date}
            minDaysFromToday={copy.dateRule.minDaysFromToday}
            maxYearsAhead={copy.dateRule.maxYearsAhead}
            onPick={onPick}
            {...a11y("date")}
          />
        </Field>
        <Field label={copy.time.placeholder} htmlFor={id("time")} error={errors.time} errorId={errId("time")}>
          <SelectField id={id("time")} name="time" placeholder={copy.time.placeholder} options={copy.time.options} onPick={onPick} {...a11y("time")} />
        </Field>
        <Field label={copy.placeholders.name} htmlFor={id("name")} error={errors.name} errorId={errId("name")}>
          <input
            id={id("name")}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={CAB_LIMITS.name}
            placeholder={copy.placeholders.name}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? errId("name") : undefined}
            className={inputClass}
          />
        </Field>
        <Field label={copy.placeholders.email} htmlFor={id("email")} error={errors.email} errorId={errId("email")}>
          <input
            id={id("email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={CAB_LIMITS.email}
            placeholder={copy.placeholders.email}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? errId("email") : undefined}
            className={inputClass}
          />
        </Field>
        <Field label={copy.placeholders.phone} htmlFor={id("phone")} error={errors.countryCode ?? errors.phone} errorId={errId("phone")}>
          <div className="grid grid-cols-[5.25rem_1fr] gap-3">
            <SelectField
              id={id("countryCode")}
              name="countryCode"
              placeholder={copy.countryCodes[0] ?? ""}
              options={copy.countryCodes}
              defaultValue={copy.countryCodes[0]}
              ariaLabel="Country code"
              onPick={onPick}
              {...a11y("countryCode")}
            />
            <input
              id={id("phone")}
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={CAB_LIMITS.phone}
              placeholder={copy.placeholders.phone}
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={errors.phone ? errId("phone") : undefined}
              className={inputClass}
            />
          </div>
        </Field>
        <Field label={copy.vehicle.placeholder} htmlFor={id("vehicle")} error={errors.vehicle} errorId={errId("vehicle")}>
          <SelectField id={id("vehicle")} name="vehicle" placeholder={copy.vehicle.placeholder} options={copy.vehicle.options} onPick={onPick} {...a11y("vehicle")} />
        </Field>
      </div>

      {/* Honeypot: off-screen for people, tempting for bots. Label is the live site's own. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-website`}>{copy.honeypotLabel}</label>
        <input id={`${uid}-website`} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
  "w-full min-w-0 border-0 border-b border-ink/25 bg-transparent px-0 py-3 text-[1.0625rem] text-ink placeholder:text-moss/60 transition-colors focus:border-ink focus:outline-none focus-visible:border-b-2 focus-visible:border-mandarin aria-invalid:border-alert";

function Field({
  label,
  htmlFor,
  error,
  errorId,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  errorId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {/* The live form shows the placeholder text only; the label is kept for screen readers. */}
      <label htmlFor={htmlFor} className="sr-only">
        {label}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-[0.9rem] text-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" className="animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="42 60" strokeLinecap="round" />
    </svg>
  );
}
