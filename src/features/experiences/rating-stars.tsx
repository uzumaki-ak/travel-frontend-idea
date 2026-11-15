import { StarIcon } from "@/ui/icons";

/** Five stars filled to the rating (partial last star). The number is always shown next to it. */
export function RatingStars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`relative inline-flex shrink-0 ${className}`}>
      <span className="flex text-ink/15">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} />
        ))}
      </span>
      <span className="absolute inset-0 flex overflow-hidden text-mandarin" style={{ width: `${(Math.min(5, Math.max(0, value)) / 5) * 100}%` }}>
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} className="shrink-0" />
        ))}
      </span>
    </span>
  );
}
