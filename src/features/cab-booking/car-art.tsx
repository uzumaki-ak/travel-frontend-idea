/**
 * Side-view outlines for cab types without a photo yet: hatchback, sedan, SUV
 * and van. Drawn for this site (no third-party artwork); one colour, so they sit
 * quietly on the cab rows.
 */
const BODY: Record<string, string> = {
  hatch:
    "M8 37V31c0-2.4 1.5-4 3.8-4.6L24 23l12-10.5c1.6-1.4 3.5-2 5.6-2H70c2.6 0 4.7 1 6.4 2.9L86 24l12 2.4c3 .6 5 3 5 6V37c0 1.4-1 2.4-2.4 2.4H96a11 11 0 0 0-22 0H40a11 11 0 0 0-22 0h-7.6C9 39.4 8 38.4 8 37z",
  sedan:
    "M5 37V32c0-2.4 1.6-4.2 4-4.6L26 25l13-11c1.7-1.5 3.8-2.3 6-2.3h30c2.7 0 5 1 6.8 3L93 25l17 2.8c3 .5 5 3 5 6V37c0 1.4-1 2.4-2.4 2.4H104a11 11 0 0 0-22 0H39a11 11 0 0 0-22 0H7.4C6 39.4 5 38.4 5 37z",
  suv:
    "M6 37V28c0-2.5 1.7-4.4 4.2-4.8L22 21l9-9.6c1.6-1.7 3.8-2.6 6.2-2.6H82c2.4 0 4.6 1 6.2 2.8L98 22l12 2.6c2.9.6 5 3.1 5 6.1V37c0 1.4-1 2.4-2.4 2.4H104a11 11 0 0 0-22 0H39a11 11 0 0 0-22 0H8.4C7 39.4 6 38.4 6 37z",
  van: "M6 37V14c0-3.3 2.7-6 6-6h78c2.4 0 4.6 1.4 5.5 3.6L104 26l8 2.3c2.4.7 4 2.9 4 5.4V37c0 1.4-1 2.4-2.4 2.4H105a11 11 0 0 0-22 0H39a11 11 0 0 0-22 0H8.4C7 39.4 6 38.4 6 37z",
};
const GLASS: Record<string, string> = {
  hatch: "M38 15.6 29.5 23H55V14h-14.4c-1 0-1.9.6-2.6 1.6zM59 14v9h22.5l-6.8-7.6c-.9-1-2.2-1.4-3.5-1.4H59z",
  sedan: "M43 16.4 33.2 25H57V15h-11c-1.1 0-2.2.5-3 1.4zM61 15v10h26.5l-8-8.4c-1-1-2.3-1.6-3.7-1.6H61z",
  suv: "M36 13.4 28.6 21H54v-9H39.4c-1.3 0-2.5.5-3.4 1.4zM58 12v9h33l-6.3-7.6c-.9-1-2.2-1.4-3.5-1.4H58z",
  van: "M14 12h20v11H12V14c0-1.1.9-2 2-2zM38 12h22v11H38zM64 12h24c1 0 1.9.6 2.3 1.5L95 23H64z",
};

export function CarArt({ shape, className = "" }: { shape: string; className?: string }) {
  const s = BODY[shape] ? shape : "sedan";
  return (
    <svg viewBox="0 0 120 52" aria-hidden="true" className={className}>
      <path d={BODY[s]} className="fill-river" />
      <path d={GLASS[s]} className="fill-jade/70" />
      {[28, 93].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={40} r={8.5} className="fill-ink" />
          <circle cx={cx} cy={40} r={3.6} className="fill-cloud" />
        </g>
      ))}
    </svg>
  );
}
