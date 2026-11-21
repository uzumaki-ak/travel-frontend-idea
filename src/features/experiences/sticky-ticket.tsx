"use client";

/**
 * Desktop only: keeps its children (the price ticket) pinned in a right-hand
 * column while the visitor scrolls the whole page. It sits in an overlay that is
 * as tall as the content, on the same 12-column grid as the page.
 */
export function StickyTicket({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
      <div className="wrap grid h-full grid-cols-12 gap-10">
        <div className="col-span-5 col-start-8">
          <div className="pointer-events-auto sticky top-48">{children}</div>
        </div>
      </div>
    </div>
  );
}
