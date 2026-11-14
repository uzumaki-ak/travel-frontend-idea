import { BedIcon, BinocularsIcon, CarIcon, CheckIcon, CupIcon, PaddleIcon, TentIcon } from "@/ui/icons";

/** "Package Includes" names (as written on the live site) → icon. Shared by tour pages and the listing. */
export const INCLUDE_ICONS: Record<string, typeof CheckIcon> = {
  Hotel: BedIcon,
  Transportation: CarIcon,
  Breakfast: CupIcon,
  Camping: TentIcon,
  Sightseeing: BinocularsIcon,
  Activities: PaddleIcon,
};

export const includeIcon = (name: string) => INCLUDE_ICONS[name] ?? CheckIcon;
