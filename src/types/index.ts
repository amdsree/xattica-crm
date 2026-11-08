export type Role = "SUPER_ADMIN" | "BRANCH_MANAGER" | "INHOUSE_TECH" | "FIELD_TECH";

export type JobStatus =
  | "RECEIVED"
  | "ASSIGNED"
  | "DIAGNOSIS_WIP"
  | "APPROVAL_PENDING"
  | "TRANSFER_IN_TRANSIT"
  | "TRANSFER_WIP"
  | "TRANSFER_QA"
  | "REPAIR_COMPLETED"
  | "NON_REPAIRABLE"
  | "RETURNED_UNREPAIRED"
  | "READY_FOR_DELIVERY"
  | "DELIVERED_PAID"
  | "DELIVERED_CREDIT"
  | "OVERDUE_DISPOSAL_WARNING"
  | "DISPOSED_SCRAP";

export const COMPLAINT_CATEGORIES = [
  "Dust Cleaning & Repasting",
  "Power / Motherboard Issue",
  "Display Broken / No Display",
  "Battery / Charging Issue",
  "SSD / RAM Upgrade",
  "OS / Software Installation",
  "Liquid Damage / Corrosion",
  "Keyboard / Trackpad Malfunction",
  "Hinges / Body Damage",
  "Hard Disk Data Recovery",
  "Other Hardware Issue",
] as const;

export const POPULAR_BRANDS = [
  "Lenovo",
  "Dell",
  "HP",
  "Asus",
  "Acer",
  "Apple",
  "MSI",
  "Custom Desktop / Assembled",
  "Other",
] as const;
