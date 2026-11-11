"use client";

/**
 * Horizontal rail built on native scrolling + scroll-snap (fast, touch-native,
 * keyboard-scrollable). Adds: arrow buttons, a progress line, and click-drag
 * for mouse users. Clicks that end a drag are swallowed so cards don't open.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/ui/icons";

const DRAG_THRESHOLD_PX = 6;

export function TourRail({ label, children }: { label: string; children: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });
  const [progress, setProgress] = useState(0);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ atStart: el.scrollLeft <= 2, atEnd: el.scrollLeft >= max - 2 });
    setProgress(max > 0 ? el.scrollLeft / max : 1);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const page = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: reduced ? "auto" : "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = scroller.current;
    if (!el) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startScroll: el.scrollLeft };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    const state = drag.current;
    if (!el || !state.active) return;
    const dx = e.clientX - state.startX;
    if (!state.moved && Math.abs(dx) > DRAG_THRESHOLD_PX) {
      state.moved = true;
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = "true"; // disables snap while dragging (see className)
    }
    if (state.moved) el.scrollLeft = state.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (!el || !drag.current.active) return;
    drag.current.active = false;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    delete el.dataset.dragging;
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div
        ref={scroller}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        // `relative` makes this the containing block, so absolutely positioned children
        // (e.g. sr-only text) are clipped by the rail instead of widening the whole page.
        className="scrollbar-none relative flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-px-(--gutter-x) px-[max(var(--gutter-x),env(safe-area-inset-left,0px))] pb-2 select-none data-dragging:snap-none data-dragging:cursor-grabbing md:cursor-grab md:gap-7"
      >
        {children}
        {/* Trailing spacer so the last card can snap with a gutter after it. */}
        <div aria-hidden="true" className="w-px shrink-0" />
      </div>

      <div className="wrap flex items-center gap-6">
        <div className="relative h-px flex-1 bg-ink/15">
          <div
            className="absolute inset-y-0 left-0 w-full origin-left bg-ink transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${Math.max(progress, 0.04)})` }}
          />
        </div>
        <div className="flex gap-2">
          <RailButton label="Previous" disabled={edges.atStart} onClick={() => page(-1)}>
            <ArrowLeftIcon />
          </RailButton>
          <RailButton label="Next" disabled={edges.atEnd} onClick={() => page(1)}>
            <ArrowRightIcon />
          </RailButton>
        </div>
      </div>
    </div>
  );
}

function RailButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-12 place-items-center rounded-full border border-ink/20 text-xl transition-colors hover:border-ink hover:bg-ink hover:text-fog disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
