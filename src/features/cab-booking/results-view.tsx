"use client";

/**
 * The results screen: a summary bar (route, trip type, date) with Modify, then
 * either a "call us" message (rule broken or no online fare), or the distance
 * banner and the cab rows. Choosing a cab opens Review booking; its Edit link
 * comes back here and opens Modify.
 */
import { useState } from "react";
import type { BoxConfig } from "@/content/cab-booking";
import { PhoneIcon } from "@/ui/icons";
import { BookingBox, type BoxInitial } from "./booking-box";
import { CabRow } from "./cab-rows";
import { Drawer, DRAWER_BODY } from "./drawer";
import { ReviewSheet } from "./review-sheet";
import type { CabQuote, ReviewTrip } from "./review-types";

type Props = {
  summary: { title: string; chip: string; when: string };
  box: { config: BoxConfig; initial: BoxInitial };
  /** Rule problems (the search box opens straight away). */
  errors: string[];
  /** No online fare for this trip. */
  missing: string | null;
  banner: string | null;
  daysNote: string | null;
  quotes: CabQuote[];
  trip: ReviewTrip | null;
  preselect?: string;
};

export function ResultsView({ summary, box, errors, missing, banner, daysNote, quotes, trip, preselect }: Props) {
  const [modify, setModify] = useState(false);
  const [chosen, setChosen] = useState<CabQuote | null>(() => (preselect ? (quotes.find((q) => q.vehicle.id === preselect && !q.soldOut) ?? null) : null));
  const [review, setReview] = useState(!!chosen);
  const phone = box.config.settings.phone;
  const tel = `tel:${phone.replace(/[^0-9+]/g, "")}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-river-deep p-5 text-fog md:px-7">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="flex flex-wrap items-center gap-3">
            <strong className="font-display text-[1.25rem] font-semibold tracking-[-0.01em] md:text-[1.45rem]">{summary.title}</strong>
            <span className="rounded-full bg-jade px-3 py-0.5 text-[0.78rem] font-semibold text-river-deep">{summary.chip}</span>
          </p>
          <p className="text-[0.92rem] text-fog/70">{summary.when}</p>
        </div>
        {errors.length ? null : (
          <button type="button" onClick={() => setModify(true)} className="cursor-pointer rounded-full border border-fog/30 px-5 py-2.5 font-display font-semibold transition-colors hover:bg-fog hover:text-ink">
            Modify
          </button>
        )}
      </div>

      {errors.length ? (
        <>
          <Alert lines={errors} tel={tel} cta="Call us" />
          <BookingBox config={box.config} initial={box.initial} />
        </>
      ) : missing ? (
        <Alert lines={[missing]} tel={tel} cta={`Call ${phone} for a quote`} />
      ) : (
        <>
          {banner ? <p className="rounded-xl bg-jade/40 px-5 py-3 text-[0.95rem] font-medium text-river-deep">{banner}</p> : null}
          {daysNote ? <p className="text-[0.92rem] text-moss">{daysNote}</p> : null}
          {quotes.length ? (
            <ul className="flex flex-col gap-3">
              {quotes.map((q) => (
                <li key={q.vehicle.id}>
                  <CabRow
                    quote={q}
                    freeCancelHours={trip?.freeCancelHours ?? 0}
                    onSelect={() => {
                      setChosen(q);
                      setReview(true);
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <Alert lines={["No cabs are priced for this trip yet. Please call us for a quote."]} tel={tel} cta="Call us" />
          )}
        </>
      )}

      {/* Modify search */}
      <Drawer open={modify} onOpenChange={setModify} title="Modify search" wide>
        <div className={`${DRAWER_BODY} p-3 md:p-5`}>
          <BookingBox config={box.config} initial={box.initial} onSearched={() => setModify(false)} stacked />
        </div>
      </Drawer>

      {trip ? (
        <ReviewSheet
          trip={trip}
          quote={chosen}
          open={review}
          onOpenChange={setReview}
          onEdit={() => {
            setReview(false);
            setModify(true);
          }}
        />
      ) : null}
    </div>
  );
}

function Alert({ lines, tel, cta }: { lines: string[]; tel: string; cta: string }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-mandarin/40 bg-mandarin/10 p-6">
      {lines.map((l) => (
        <p key={l} className="max-w-[60ch] leading-relaxed">
          {l}
        </p>
      ))}
      <a href={tel} className="inline-flex items-center gap-2.5 rounded-full bg-ink px-5 py-3 font-display font-semibold text-fog transition-transform hover:-translate-y-0.5">
        <PhoneIcon />
        {cta}
      </a>
    </div>
  );
}
