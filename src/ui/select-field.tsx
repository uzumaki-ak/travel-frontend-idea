"use client";

/**
 * Dropdown in the site's own style (no browser-native select UI), built on
 * Radix Select: keyboard, typeahead and screen readers work out of the box,
 * and Radix renders a hidden native <select name=…> so the value is submitted
 * with the form like any other field.
 */
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon } from "./icons";

type SelectFieldProps = {
  id: string;
  name: string;
  placeholder: string;
  options: readonly string[];
  defaultValue?: string;
  invalid?: boolean;
  describedBy?: string;
  ariaLabel?: string;
  /** Called after the visitor picks an option, so the parent form can re-validate. */
  onPick?: () => void;
  className?: string;
};

export function SelectField({
  id,
  name,
  placeholder,
  options,
  defaultValue,
  invalid,
  describedBy,
  ariaLabel,
  onPick,
  className = "",
}: SelectFieldProps) {
  return (
    <Select.Root name={name} defaultValue={defaultValue} onValueChange={() => onPick?.()}>
      <Select.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`flex w-full min-w-0 items-center justify-between gap-3 border-0 border-b border-ink/25 bg-transparent px-0 py-3 text-left text-[1.0625rem] transition-colors focus:outline-none focus-visible:border-b-2 focus-visible:border-mandarin aria-invalid:border-alert data-[state=open]:border-ink data-placeholder:text-moss/60 ${className}`}
      >
        <span className="truncate">
          <Select.Value placeholder={placeholder} />
        </span>
        <Select.Icon className="shrink-0 text-moss">
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-tl-[1.5rem] rounded-br-[1.5rem] bg-ink text-fog shadow-[0_24px_60px_-20px_rgb(8_44_41/0.6)] motion-safe:animate-[fade-in_0.2s_var(--ease-out-expo)]"
        >
          <Select.ScrollUpButton className="grid h-7 place-items-center text-fog/60">
            <ChevronDownIcon className="rotate-180" />
          </Select.ScrollUpButton>
          <Select.Viewport className="p-1.5">
            {options.map((option) => (
              <Select.Item
                key={option}
                value={option}
                className="relative flex cursor-pointer items-center rounded-full px-4 py-2.5 text-[0.95rem] outline-none select-none data-highlighted:bg-white/10 data-[state=checked]:text-mandarin"
              >
                <Select.ItemText>{option}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="grid h-7 place-items-center text-fog/60">
            <ChevronDownIcon />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
