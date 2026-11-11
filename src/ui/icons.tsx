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

export const socialIcons: Record<string, (props: IconProps) => React.JSX.Element> = {
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  instagram: InstagramIcon,
};
