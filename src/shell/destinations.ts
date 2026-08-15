export type DestinationId =
  | "projects"
  | "sheet-layouts"
  | "printing-setups"
  | "assets"
  | "settings-backup";

export interface Destination {
  id: DestinationId;
  label: string;
  path: string;
}

export const DESTINATIONS: readonly Destination[] = [
  { id: "projects", label: "Projects", path: "/projects" },
  { id: "sheet-layouts", label: "Sheet layouts", path: "/sheet-layouts" },
  {
    id: "printing-setups",
    label: "Printing setups and calibration",
    path: "/printing-setups",
  },
  { id: "assets", label: "Assets", path: "/assets" },
  {
    id: "settings-backup",
    label: "Settings and backup",
    path: "/settings-backup",
  },
];

export const DEFAULT_DESTINATION: Destination = DESTINATIONS[0];

export function findDestinationByPath(path: string): Destination | undefined {
  return DESTINATIONS.find((destination) => destination.path === path);
}
