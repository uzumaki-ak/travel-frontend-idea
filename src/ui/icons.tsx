/**
 * Hand-drawn icon set: 24px grid, 1.5px stroke, square caps — matches the
 * mono "ticket" details. Deliberately not an icon library.
 * Icons are decorative by default; pass `title` when an icon is the only label.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Svg({ title, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 17 17 7M9 7h8v8" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12H5M11 6l-6 6 6 6" />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 3.5h3.2l1.6 4.6-2.1 1.4a11.5 11.5 0 0 0 6.8 6.8l1.4-2.1 4.6 1.6v3.2a1.5 1.5 0 0 1-1.5 1.5C10.6 20.5 3.5 13.4 3.5 5A1.5 1.5 0 0 1 5 3.5Z" />
    </Svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.2 11.6a8.4 8.4 0 0 1-12.4 7.4L3.6 20.3l1.3-4A8.4 8.4 0 1 1 20.2 11.6Z" />
      <path d="M9 8.4c.2 3.3 2.9 6 6.4 6.4l.9-1.7-2.1-1-1 .8a4.4 4.4 0 0 1-2.4-2.4l.8-1-1-2.1Z" strokeWidth={1.2} />
    </Svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 5.5h17v13h-17z" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.5 21v-7.5H16l.5-3h-3V8.8c0-.9.4-1.5 1.6-1.5h1.5V4.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.1H8v3h2.5V21" />
    </Svg>
  );
}

export function TwitterIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 4h4.6L20 20h-4.6Z" />
      <path d="M19.6 4 13.4 11M10.6 13 4.4 20" />
    </Svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M17.2 6.8h.01" strokeWidth={2.2} />
    </Svg>
  );
}

/* ---- Tour details ---------------------------------------------------- */

export function BedIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 6v13M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-8v6" />
      <circle cx="6.5" cy="11.5" r="1.8" />
    </Svg>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 16v-4l2-5h12l2 5v4z" />
      <path d="M4 12h16M6 16v2.5M18 16v2.5" />
      <path d="M7.5 14h.01M16.5 14h.01" strokeWidth={2.4} />
    </Svg>
  );
}

export function CupIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H15.5M8 3.5v2.5M12 3.5v2.5" />
    </Svg>
  );
}

export function TentIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4 2.5 20h19z" />
      <path d="M12 4v16M9 20l3-6 3 6" />
    </Svg>
  );
}

export function BinocularsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6.5" cy="15.5" r="3.5" />
      <circle cx="17.5" cy="15.5" r="3.5" />
      <path d="M10 15.5h4M4.5 12.5 7 5h3l.5 7M19.5 12.5 17 5h-3l-.5 7" />
    </Svg>
  );
}

export function PaddleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 19 19 5" />
      <path d="M17 3.5 20.5 7l-2 2L15 5.5zM7 20.5 3.5 17l2-2L9 18.5z" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />
    </Svg>
  );
}

export function DepartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 20.5h17M5 15l14-5.5a2 2 0 0 0-1.5-3.7L13 7.6 7.5 4.5 5.5 5.3l3.6 4.1-3.2 1.3-2.4-1.5-1.3.6L5 15Z" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4.5 12.5 4.5 4.5 10.5-11" />
    </Svg>
  );
}

export function CrossIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5.5 9 6.5 6.5L18.5 9" />
    </Svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </Svg>
  );
}

/** Rupee with a strike — "No Hidden Charges". */
export function RupeeCheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 5h10M7 9h10M10.5 5c3 0 4.5 1.6 4.5 4s-1.5 4-4.5 4H7l7 6" />
      <path d="M4 20 20 4" strokeWidth={1.2} />
    </Svg>
  );
}

export function SteeringIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M3.8 10.5c2.6.6 5.4.6 8.2 0s5.6-.6 8.2 0M10.2 13.8 7 19.6M13.8 13.8l3.2 5.8" />
    </Svg>
  );
}

export function HeadsetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
      <path d="M4.5 13.5h3v5h-3zM16.5 13.5h3v5h-3z" />
      <path d="M19.5 18.5c0 1.5-1.5 2.5-4 2.5h-2.5" />
    </Svg>
  );
}

/** Filled star — used only to draw a numeric review rating. */
export function StarIcon(props: IconProps) {
  return (
    <Svg {...props} fill="currentColor" stroke="none">
      <path d="m12 3 2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 17l-5.6 3.2 1.3-6.3L3 9.6l6.3-.7z" />
    </Svg>
  );
}

export const socialIcons: Record<string, (props: IconProps) => React.JSX.Element> = {
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  instagram: InstagramIcon,
};
