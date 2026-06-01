import type { StaffRole } from "@/lib/types";

export const DINING_ROLES: StaffRole[] = ["DINING_MANAGER", "ASST_DINING"];
export const ADMISSION_ROLES: StaffRole[] = ["DSW"];
export const INVENTORY_ROLES: StaffRole[] = [
  "ASST_INVENTORY",
  "INVENTORY_SECTION_OFFICER",
];
export const FINANCE_ROLES: StaffRole[] = [
  "ASST_FINANCE",
  "FINANCE_SECTION_OFFICER",
];

export function hasRoleAccess(
  designation: string | undefined,
  roles: StaffRole[],
): boolean {
  if (!designation) return false;
  if (designation === "PROVOST") {
    return !roles.every((role) => role === "DSW");
  }
  return roles.includes(designation as StaffRole);
}

export function formatLabel(value: string | null | undefined): string {
  return value?.replace(/_/g, " ") ?? "—";
}
