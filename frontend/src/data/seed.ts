// Seed data for the new modules (Customers, Contracts, Inventory).
// Fictional data; shapes mirror schema-v1.1.sql.
import type { ContractCover } from "./mock";

export interface Customer {
  id: number;
  code: string;
  type: "individual" | "company";
  name: string;
  phone: string;
  vat?: string;
  nationalId?: string;
  city: string;
  district: string;
  sites: number;
  elevators: number;
}

export type ContractStatus = "active" | "renewal_due" | "expired" | "draft" | "suspended";

export interface Contract {
  id: number;
  contractNo: string;
  customer: string;
  cover: ContractCover;
  status: ContractStatus;
  elevators: number;
  value: number;
  startDate: string;
  endDate: string;
  visitsTotal: number;
  visitEveryDays: number;
  zone: string;
  tech: string;
}

export interface Item {
  id: number;
  sku: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  cost: number;
  price: number;
  onHand: number;
  reserved: number;
  minStock: number;
  warehouse: string;
}

export const customers: Customer[] = [
  { id: 2001, code: "C-1046", type: "individual", name: "عبدالله الفالح", phone: "0506200001", nationalId: "10•••••••1", city: "الرياض", district: "السعادة - شرق", sites: 1, elevators: 1 },
  { id: 2002, code: "C-1075", type: "company", name: "شركة النخبة العقارية", phone: "0503200002", vat: "3001234500003", city: "الرياض", district: "العارض - شمال", sites: 3, elevators: 5 },
  { id: 2003, code: "C-1084", type: "individual", name: "منى العبدالله", phone: "0501100003", nationalId: "10•••••••4", city: "الرياض", district: "الواحة - وسط", sites: 1, elevators: 1 },
  { id: 2004, code: "C-1016", type: "company", name: "راز العقارية", phone: "0505400004", vat: "3009876500005", city: "الرياض", district: "العريجاء - جنوب", sites: 4, elevators: 7 },
  { id: 2005, code: "C-1003", type: "individual", name: "سالم المعمر", phone: "0545500005", nationalId: "10•••••••6", city: "الرياض", district: "نمار - غرب", sites: 1, elevators: 1 },
  { id: 2006, code: "C-1114", type: "company", name: "مركز قرطبة الطبي", phone: "0567500006", vat: "3005555500007", city: "الرياض", district: "قرطبة - شرق", sites: 1, elevators: 3 },
  { id: 2007, code: "C-1131", type: "company", name: "فندق الصحافة", phone: "0554600008", vat: "3004444400009", city: "الرياض", district: "الصحافة - شمال", sites: 1, elevators: 4 },
  { id: 2008, code: "C-1120", type: "company", name: "شركة الملقا التجارية", phone: "0558200010", vat: "3003333300011", city: "الرياض", district: "الملقا - شمال", sites: 2, elevators: 2 },
  { id: 2009, code: "C-1083", type: "individual", name: "هند السالم", phone: "0532300012", nationalId: "10•••••••3", city: "الرياض", district: "لبن - غرب", sites: 1, elevators: 1 },
  { id: 2010, code: "C-1145", type: "individual", name: "عائلة الحميد", phone: "0504800013", nationalId: "10•••••••7", city: "الرياض", district: "العليا - وسط", sites: 1, elevators: 1 },
];

export const contracts: Contract[] = [
  { id: 871, contractNo: "871", customer: "عبدالله الفالح", cover: "non_comprehensive", status: "active", elevators: 1, value: 1300, startDate: "2024-10-05", endDate: "2027-05-05", visitsTotal: 12, visitEveryDays: 30, zone: "السعادة - شرق", tech: "سعد القحطاني" },
  { id: 873, contractNo: "873", customer: "شركة النخبة العقارية", cover: "comprehensive", status: "active", elevators: 5, value: 7500, startDate: "2024-05-01", endDate: "2028-04-29", visitsTotal: 12, visitEveryDays: 30, zone: "العارض - شمال", tech: "ماجد العتيبي" },
  { id: 874, contractNo: "874", customer: "منى العبدالله", cover: "non_comprehensive", status: "active", elevators: 1, value: 1200, startDate: "2024-11-10", endDate: "2027-07-30", visitsTotal: 20, visitEveryDays: 30, zone: "الواحة - وسط", tech: "فهد الدوسري" },
  { id: 875, contractNo: "875", customer: "راز العقارية", cover: "comprehensive", status: "renewal_due", elevators: 7, value: 11200, startDate: "2023-12-01", endDate: "2026-10-30", visitsTotal: 23, visitEveryDays: 30, zone: "العريجاء - جنوب", tech: "نايف الشهري" },
  { id: 876, contractNo: "876", customer: "سالم المعمر", cover: "non_comprehensive", status: "active", elevators: 1, value: 1100, startDate: "2024-09-01", endDate: "2027-08-27", visitsTotal: 12, visitEveryDays: 30, zone: "نمار - غرب", tech: "سعد القحطاني" },
  { id: 877, contractNo: "877", customer: "مركز قرطبة الطبي", cover: "comprehensive", status: "active", elevators: 3, value: 9600, startDate: "2025-01-16", endDate: "2027-05-30", visitsTotal: 16, visitEveryDays: 22, zone: "قرطبة - شرق", tech: "تركي الحربي" },
  { id: 878, contractNo: "878", customer: "شركة الملقا التجارية", cover: "non_comprehensive", status: "renewal_due", elevators: 2, value: 2400, startDate: "2025-01-07", endDate: "2026-01-06", visitsTotal: 12, visitEveryDays: 30, zone: "الملقا - شمال", tech: "ماجد العتيبي" },
  { id: 883, contractNo: "883", customer: "فندق الصحافة", cover: "comprehensive", status: "active", elevators: 4, value: 14000, startDate: "2025-06-01", endDate: "2027-11-30", visitsTotal: 15, visitEveryDays: 24, zone: "الصحافة - شمال", tech: "ياسر الغامدي" },
  { id: 879, contractNo: "879", customer: "عبدالعزيز الدغيثر", cover: "non_comprehensive", status: "expired", elevators: 1, value: 1500, startDate: "2025-02-01", endDate: "2026-05-30", visitsTotal: 16, visitEveryDays: 30, zone: "الملقا - شمال", tech: "خالد الزهراني" },
  { id: 885, contractNo: "885", customer: "عمر الدرعية", cover: "non_comprehensive", status: "active", elevators: 1, value: 1250, startDate: "2025-08-09", endDate: "2026-10-30", visitsTotal: 14, visitEveryDays: 30, zone: "الدرعية - غرب", tech: "فهد الدوسري" },
  { id: 894, contractNo: "894", customer: "عائلة الحميد", cover: "comprehensive", status: "active", elevators: 1, value: 1800, startDate: "2025-03-20", endDate: "2028-03-19", visitsTotal: 12, visitEveryDays: 30, zone: "العليا - وسط", tech: "نايف الشهري" },
  { id: 900, contractNo: "900", customer: "عبدالله الفالح", cover: "non_comprehensive", status: "draft", elevators: 1, value: 1400, startDate: "2026-11-01", endDate: "2027-11-01", visitsTotal: 12, visitEveryDays: 30, zone: "السعادة - شرق", tech: "سعد القحطاني" },
];

export const items: Item[] = [
  { id: 3001, sku: "SP-DR-SENS", name: "حساس باب أوتوماتيك", category: "أبواب", brand: "محلي", unit: "قطعة", cost: 320, price: 480, onHand: 24, reserved: 3, minStock: 8, warehouse: "المستودع الرئيسي" },
  { id: 3002, sku: "SP-CTRL-VEGA", name: "لوحة كنترول Vega", category: "كنترول", brand: "إيطالي", unit: "قطعة", cost: 2100, price: 2950, onHand: 4, reserved: 1, minStock: 3, warehouse: "المستودع الرئيسي" },
  { id: 3003, sku: "SP-ROPE-10", name: "حبل فولاذي 10مم", category: "حبال", brand: "محلي", unit: "متر", cost: 28, price: 45, onHand: 320, reserved: 0, minStock: 100, warehouse: "المستودع الرئيسي" },
  { id: 3004, sku: "SP-BAT-SMS", name: "بطارية طوارئ SMS", category: "كهرباء", brand: "SMS", unit: "قطعة", cost: 3500, price: 4600, onHand: 2, reserved: 0, minStock: 3, warehouse: "المستودع الرئيسي" },
  { id: 3005, sku: "SP-BRK-PAD", name: "فحمات مكابح", category: "ميكانيكا", brand: "محلي", unit: "طقم", cost: 180, price: 280, onHand: 15, reserved: 2, minStock: 6, warehouse: "المستودع الرئيسي" },
  { id: 3006, sku: "SP-BTN-PB", name: "علبة طلبات (أزرار)", category: "كهرباء", brand: "محلي", unit: "قطعة", cost: 140, price: 230, onHand: 9, reserved: 1, minStock: 5, warehouse: "المستودع الرئيسي" },
  { id: 3007, sku: "SP-LED-CAB", name: "إضاءة كابينة LED", category: "كهرباء", brand: "محلي", unit: "قطعة", cost: 60, price: 110, onHand: 40, reserved: 0, minStock: 10, warehouse: "المستودع الرئيسي" },
  { id: 3008, sku: "SP-GUIDE-16", name: "سكة توجيه 16مم", category: "سكك", brand: "إيطالي", unit: "متر", cost: 95, price: 150, onHand: 60, reserved: 4, minStock: 40, warehouse: "المستودع الرئيسي" },
  { id: 3009, sku: "SP-VVVF-SCH", name: "محرك VVVF شنايدر", category: "كنترول", brand: "Schneider", unit: "قطعة", cost: 2000, price: 2800, onHand: 3, reserved: 0, minStock: 2, warehouse: "المستودع الرئيسي" },
  { id: 3010, sku: "SP-DOOR-OP", name: "محرك باب (Door Operator)", category: "أبواب", brand: "إيطالي", unit: "قطعة", cost: 1650, price: 2300, onHand: 5, reserved: 1, minStock: 3, warehouse: "المستودع الرئيسي" },
  { id: 3011, sku: "SP-OIL-5L", name: "زيت تزييت 5 لتر", category: "مستهلكات", brand: "محلي", unit: "عبوة", cost: 70, price: 120, onHand: 2, reserved: 0, minStock: 6, warehouse: "مركبة الفني" },
  { id: 3012, sku: "SP-BRG-SET", name: "طقم محامل (Bearings)", category: "ميكانيكا", brand: "محلي", unit: "طقم", cost: 240, price: 390, onHand: 11, reserved: 0, minStock: 4, warehouse: "المستودع الرئيسي" },
];

export const contractStatusAr: Record<ContractStatus, string> = {
  active: "نشط",
  renewal_due: "تجديد مستحق",
  expired: "منتهي",
  draft: "مسودة",
  suspended: "موقوف",
};
