// Mock data for the clickable prototype. Shapes mirror schema-v1.1.sql.
// NOTE: all names/numbers are fictional (no real PII from the audited system).

export type AssetStatus = "active" | "under_maintenance" | "out_of_service" | "decommissioned";
export type WoStatus =
  | "scheduled" | "assigned" | "en_route" | "started" | "on_hold_parts"
  | "completed" | "customer_signed" | "supervisor_approved" | "closed";
export type TicketStatus =
  | "open" | "assigned" | "acknowledged" | "en_route" | "on_site"
  | "diagnosis" | "waiting_parts" | "repairing" | "testing" | "resolved" | "closed";
export type Priority = "low" | "normal" | "high" | "critical" | "emergency";
export type ContractCover = "comprehensive" | "non_comprehensive";

export const branches = ["الرياض", "جدة", "الدمام"];

export const kpis = {
  elevators: 142,
  activeElevators: 131,
  outOfService: 6,
  activeContracts: 125,
  expiringContracts: 11,
  pmDue: 87,
  pmOverdue: 23,
  openTickets: 8,
  criticalTickets: 2,
  slaBreaches: 3,
  techsAvailable: 9,
  woToday: 14,
  lowStock: 5,
  monthlyRevenue: 318500,
  monthlyCost: 171200,
};

// 12-month trend for the dashboard chart (SAR thousands)
export const revenueTrend = [212, 198, 241, 263, 255, 274, 289, 266, 301, 288, 312, 318];
export const costTrend = [141, 132, 150, 158, 149, 161, 170, 155, 168, 160, 175, 171];

export const techs = [
  "سعد القحطاني", "ماجد العتيبي", "فهد الدوسري", "نايف الشهري",
  "تركي الحربي", "بندر المطيري", "خالد الزهراني", "ياسر الغامدي",
];

export interface Elevator {
  id: number;
  assetNo: string;
  qr: string;
  brand: string;
  model: string;
  type: string; // automatic/manual + passenger
  capacityKg: number;
  speed: number;
  stops: number;
  drive: string;
  doorType: string;
  status: AssetStatus;
  customer: string;
  customerType: "سكني" | "تجاري";
  site: string; // district
  building: string;
  contractNo: string;
  cover: ContractCover;
  maintenanceTech: string;
  commissioned: string;
  warrantyEnd: string;
}

export const elevators: Elevator[] = [
  { id: 1046, assetNo: "LFT-1046", qr: "QR-1046", brand: "Sigma", model: "HELIX-800", type: "ركاب أوتوماتيك", capacityKg: 630, speed: 1.0, stops: 6, drive: "Gearless", doorType: "أوتوماتيك", status: "active", customer: "عبدالله الفالح", customerType: "سكني", site: "السعادة - شرق", building: "عمارة A", contractNo: "871", cover: "non_comprehensive", maintenanceTech: "سعد القحطاني", commissioned: "2024-10-05", warrantyEnd: "2027-05-05" },
  { id: 1075, assetNo: "LFT-1075", qr: "QR-1075", brand: "Fuji", model: "FJ-ZEN", type: "ركاب أوتوماتيك", capacityKg: 800, speed: 1.5, stops: 8, drive: "Gearless", doorType: "أوتوماتيك", status: "active", customer: "شركة النخبة العقارية", customerType: "تجاري", site: "العارض - شمال", building: "برج الأعمال", contractNo: "873", cover: "comprehensive", maintenanceTech: "ماجد العتيبي", commissioned: "2024-05-01", warrantyEnd: "2028-04-29" },
  { id: 1084, assetNo: "LFT-1084", qr: "QR-1084", brand: "Sigma", model: "HELIX-630", type: "ركاب عادي", capacityKg: 450, speed: 1.0, stops: 4, drive: "Geared", doorType: "نصف أوتوماتيك", status: "under_maintenance", customer: "منى العبدالله", customerType: "سكني", site: "الواحة - وسط", building: "فيلا 12", contractNo: "874", cover: "non_comprehensive", maintenanceTech: "فهد الدوسري", commissioned: "2024-11-10", warrantyEnd: "2027-07-30" },
  { id: 1016, assetNo: "LFT-1016", qr: "QR-1016", brand: "Thyssen", model: "TK-EVO", type: "ركاب أوتوماتيك", capacityKg: 1000, speed: 1.6, stops: 10, drive: "Gearless", doorType: "أوتوماتيك", status: "active", customer: "راز العقارية", customerType: "تجاري", site: "العريجاء - جنوب", building: "مجمع الخير", contractNo: "875", cover: "comprehensive", maintenanceTech: "نايف الشهري", commissioned: "2023-12-01", warrantyEnd: "2026-10-30" },
  { id: 1003, assetNo: "LFT-1003", qr: "QR-1003", brand: "Sigma", model: "HELIX-450", type: "ركاب عادي", capacityKg: 450, speed: 1.0, stops: 3, drive: "Geared", doorType: "عادي", status: "out_of_service", customer: "سالم المعمر", customerType: "سكني", site: "نمار - غرب", building: "عمارة C", contractNo: "876", cover: "non_comprehensive", maintenanceTech: "سعد القحطاني", commissioned: "2024-09-01", warrantyEnd: "2027-08-27" },
  { id: 1114, assetNo: "LFT-1114", qr: "QR-1114", brand: "Mitsubishi", model: "NEXIEZ", type: "ركاب أوتوماتيك", capacityKg: 800, speed: 1.75, stops: 12, drive: "Gearless", doorType: "أوتوماتيك", status: "active", customer: "مركز قرطبة الطبي", customerType: "تجاري", site: "قرطبة - شرق", building: "المبنى الرئيسي", contractNo: "877", cover: "comprehensive", maintenanceTech: "تركي الحربي", commissioned: "2025-01-16", warrantyEnd: "2027-05-30" },
  { id: 1083, assetNo: "LFT-1083", qr: "QR-1083", brand: "Fuji", model: "FJ-LITE", type: "ركاب عادي", capacityKg: 450, speed: 1.0, stops: 4, drive: "Geared", doorType: "نصف أوتوماتيك", status: "active", customer: "هند السالم", customerType: "سكني", site: "لبن - غرب", building: "فيلا 7", contractNo: "878", cover: "non_comprehensive", maintenanceTech: "بندر المطيري", commissioned: "2025-01-07", warrantyEnd: "2026-01-06" },
  { id: 1115, assetNo: "LFT-1115", qr: "QR-1115", brand: "Sigma", model: "HELIX-800", type: "ركاب أوتوماتيك", capacityKg: 630, speed: 1.0, stops: 5, drive: "Gearless", doorType: "أوتوماتيك", status: "active", customer: "عبدالعزيز الدغيثر", customerType: "سكني", site: "الملقا - شمال", building: "عمارة B", contractNo: "879", cover: "non_comprehensive", maintenanceTech: "خالد الزهراني", commissioned: "2025-02-01", warrantyEnd: "2026-05-30" },
  { id: 1131, assetNo: "LFT-1131", qr: "QR-1131", brand: "Thyssen", model: "TK-EVO", type: "ركاب أوتوماتيك", capacityKg: 1000, speed: 2.0, stops: 15, drive: "Gearless", doorType: "أوتوماتيك", status: "active", customer: "فندق الصحافة", customerType: "تجاري", site: "الصحافة - شمال", building: "البرج الفندقي", contractNo: "883", cover: "comprehensive", maintenanceTech: "ياسر الغامدي", commissioned: "2025-06-01", warrantyEnd: "2027-11-30" },
  { id: 1120, assetNo: "LFT-1120", qr: "QR-1120", brand: "Mitsubishi", model: "NEXIEZ", type: "ركاب أوتوماتيك", capacityKg: 800, speed: 1.5, stops: 9, drive: "Gearless", doorType: "أوتوماتيك", status: "active", customer: "شركة الملقا التجارية", customerType: "تجاري", site: "الملقا - شمال", building: "مجمع تجاري", contractNo: "884", cover: "non_comprehensive", maintenanceTech: "ماجد العتيبي", commissioned: "2025-09-01", warrantyEnd: "2027-08-31" },
  { id: 1134, assetNo: "LFT-1134", qr: "QR-1134", brand: "Sigma", model: "HELIX-630", type: "ركاب عادي", capacityKg: 450, speed: 1.0, stops: 4, drive: "Geared", doorType: "نصف أوتوماتيك", status: "active", customer: "عمر الدرعية", customerType: "سكني", site: "الدرعية - غرب", building: "فيلا 3", contractNo: "885", cover: "non_comprehensive", maintenanceTech: "فهد الدوسري", commissioned: "2025-08-09", warrantyEnd: "2026-10-30" },
  { id: 1145, assetNo: "LFT-1145", qr: "QR-1145", brand: "Fuji", model: "FJ-ZEN", type: "ركاب أوتوماتيك", capacityKg: 630, speed: 1.0, stops: 6, drive: "Gearless", doorType: "أوتوماتيك", status: "active", customer: "عائلة الحميد", customerType: "سكني", site: "العليا - وسط", building: "عمارة D", contractNo: "894", cover: "comprehensive", maintenanceTech: "نايف الشهري", commissioned: "2025-03-20", warrantyEnd: "2028-03-19" },
];

export interface HistoryEvent {
  kind: "visit" | "fault" | "part" | "inspection";
  date: string;
  title: string;
  by: string;
  note?: string;
}

export const elevatorHistory: Record<number, HistoryEvent[]> = {
  1046: [
    { kind: "visit", date: "2026-09-18", title: "صيانة دورية — زيارة #11", by: "سعد القحطاني", note: "فحص كامل، لا ملاحظات" },
    { kind: "fault", date: "2026-08-02", title: "بلاغ عطل — باب لا يغلق", by: "سعد القحطاني", note: "استبدال حساس الباب" },
    { kind: "part", date: "2026-08-02", title: "صرف قطعة: حساس باب أوتوماتيك", by: "المستودع", note: "الكمية 1" },
    { kind: "visit", date: "2026-07-15", title: "صيانة دورية — زيارة #10", by: "سعد القحطاني" },
    { kind: "inspection", date: "2026-06-01", title: "فحص سلامة سنوي — ناجح", by: "مشرف الجودة" },
  ],
  1114: [
    { kind: "fault", date: "2026-10-12", title: "بلاغ عطل — توقف بين الأدوار", by: "تركي الحربي", note: "إعادة ضبط الكنترول" },
    { kind: "visit", date: "2026-09-25", title: "صيانة دورية — زيارة #14", by: "تركي الحربي" },
    { kind: "part", date: "2026-07-03", title: "صرف قطعة: لوحة كنترول", by: "المستودع", note: "الكمية 1" },
  ],
};

export type TechRole = "رئيسي" | "مساعد" | "متدرب";

export interface WoChecklistItem {
  label: string;
  type: "pass_fail" | "boolean" | "measurement" | "number" | "text" | "photo" | "signature";
  result?: "pass" | "fail" | "na";
  value?: string;
  unit?: string;
  done: boolean;
}

export interface WoPart {
  itemId: number;
  sku: string;
  name: string;
  qty: number;
  unitCost: number;
  unitPrice: number;
}

export interface WorkOrder {
  id: string;
  woNo: string;
  type: "صيانة دورية" | "إصلاح عطل" | "فحص" | "تركيب";
  status: WoStatus;
  priority: Priority;
  elevatorId: number;
  customer: string;
  site: string;
  scheduledAt: string;
  technicians: { name: string; role: TechRole }[];
  checklistDone: number;
  checklistTotal: number;
  partsCount: number;
  cost: number;
  labourHours?: number;
  checklist?: WoChecklistItem[];
  parts?: WoPart[];
  signatureUrl?: string;
}

export const workOrders: WorkOrder[] = [
  { id: "wo1", woNo: "WO-3220", type: "صيانة دورية", status: "scheduled", priority: "normal", elevatorId: 1046, customer: "عبدالله الفالح", site: "السعادة - شرق", scheduledAt: "2026-10-17 09:00", technicians: [{ name: "سعد القحطاني", role: "رئيسي" }], checklistDone: 0, checklistTotal: 18, partsCount: 0, cost: 0 },
  { id: "wo2", woNo: "WO-3461", type: "إصلاح عطل", status: "started", priority: "high", elevatorId: 1114, customer: "مركز قرطبة الطبي", site: "قرطبة - شرق", scheduledAt: "2026-10-16 11:30", technicians: [{ name: "تركي الحربي", role: "رئيسي" }, { name: "بندر المطيري", role: "مساعد" }], checklistDone: 3, checklistTotal: 9, partsCount: 1, cost: 480 },
  { id: "wo3", woNo: "WO-3458", type: "صيانة دورية", status: "assigned", priority: "normal", elevatorId: 1120, customer: "شركة الملقا التجارية", site: "الملقا - شمال", scheduledAt: "2026-10-16 14:00", technicians: [{ name: "ماجد العتيبي", role: "رئيسي" }], checklistDone: 0, checklistTotal: 18, partsCount: 0, cost: 0 },
  { id: "wo4", woNo: "WO-3407", type: "فحص", status: "supervisor_approved", priority: "normal", elevatorId: 1016, customer: "راز العقارية", site: "العريجاء - جنوب", scheduledAt: "2026-10-14 10:00", technicians: [{ name: "نايف الشهري", role: "رئيسي" }], checklistDone: 22, checklistTotal: 22, partsCount: 0, cost: 0 },
  { id: "wo5", woNo: "WO-3463", type: "إصلاح عطل", status: "on_hold_parts", priority: "critical", elevatorId: 1003, customer: "سالم المعمر", site: "نمار - غرب", scheduledAt: "2026-10-15 16:20", technicians: [{ name: "سعد القحطاني", role: "رئيسي" }], checklistDone: 4, checklistTotal: 9, partsCount: 2, cost: 1250 },
  { id: "wo6", woNo: "WO-3432", type: "صيانة دورية", status: "completed", priority: "normal", elevatorId: 1083, customer: "هند السالم", site: "لبن - غرب", scheduledAt: "2026-10-13 09:30", technicians: [{ name: "بندر المطيري", role: "رئيسي" }], checklistDone: 18, checklistTotal: 18, partsCount: 0, cost: 0 },
  { id: "wo7", woNo: "WO-3246", type: "إصلاح عطل", status: "customer_signed", priority: "high", elevatorId: 1131, customer: "فندق الصحافة", site: "الصحافة - شمال", scheduledAt: "2026-10-12 20:00", technicians: [{ name: "ياسر الغامدي", role: "رئيسي" }], checklistDone: 9, checklistTotal: 9, partsCount: 1, cost: 640 },
  { id: "wo8", woNo: "WO-3247", type: "تركيب", status: "en_route", priority: "normal", elevatorId: 1145, customer: "عائلة الحميد", site: "العليا - وسط", scheduledAt: "2026-10-16 13:00", technicians: [{ name: "نايف الشهري", role: "رئيسي" }], checklistDone: 0, checklistTotal: 25, partsCount: 0, cost: 0 },
];

export const woChecklistSample = [
  { label: "فحص لوحة التحكم والكنترول", type: "pass_fail", result: "pass" },
  { label: "فحص المكابح واختبار الطوارئ", type: "pass_fail", result: "pass" },
  { label: "قياس جهد المحرك (فولت)", type: "measurement", value: "380", unit: "V" },
  { label: "فحص الأبواب وحساساتها", type: "pass_fail", result: "fail" },
  { label: "تزييت السكك والتوجيهات", type: "pass_fail", result: "pass" },
  { label: "اختبار إضاءة الطوارئ", type: "boolean", value: "نعم" },
  { label: "صورة غرفة الماكينة", type: "photo", value: "مرفقة" },
  { label: "توقيع العميل", type: "signature", value: "تم" },
];

export interface FaultTicket {
  id: string;
  ticketNo: string;
  elevatorId: number;
  customer: string;
  site: string;
  fault: string;
  priority: Priority;
  status: TicketStatus;
  reportedAt: string;
  slaDueMins: number; // minutes until/over repair SLA (negative = breached)
  tech: string;
  timeline: { at: string; label: string }[];
  comments: { by: string; visibility: "customer" | "internal"; body: string; at: string }[];
}

export const faults: FaultTicket[] = [
  { id: "f1", ticketNo: "FLT-287", elevatorId: 1114, customer: "مركز قرطبة الطبي", site: "قرطبة - شرق", fault: "المصعد يتوقف بين الأدوار", priority: "critical", status: "repairing", reportedAt: "2026-10-16 10:12", slaDueMins: 35, tech: "تركي الحربي", timeline: [{ at: "10:12", label: "تم البلاغ" }, { at: "10:18", label: "إبلاغ الفني" }, { at: "10:41", label: "وصول الموقع" }, { at: "10:55", label: "بدء الإصلاح" }], comments: [{ by: "خدمة العملاء", visibility: "internal", body: "العميل منشأة طبية — أولوية قصوى", at: "10:13" }] },
  { id: "f2", ticketNo: "FLT-284", elevatorId: 1003, customer: "سالم المعمر", site: "نمار - غرب", fault: "صوت غير طبيعي من الماكينة", priority: "high", status: "waiting_parts", reportedAt: "2026-10-15 13:12", slaDueMins: -120, tech: "سعد القحطاني", timeline: [{ at: "13:12", label: "تم البلاغ" }, { at: "13:25", label: "إبلاغ الفني" }, { at: "14:40", label: "تشخيص: تلف محمل" }], comments: [{ by: "الفني", visibility: "internal", body: "بانتظار توريد محمل من المستودع", at: "14:45" }] },
  { id: "f3", ticketNo: "FLT-276", elevatorId: 1083, customer: "هند السالم", site: "لبن - غرب", fault: "الباب لا يفتح بالكامل", priority: "normal", status: "on_site", reportedAt: "2026-10-16 09:30", slaDueMins: 90, tech: "بندر المطيري", timeline: [{ at: "09:30", label: "تم البلاغ" }, { at: "09:44", label: "إبلاغ الفني" }, { at: "10:20", label: "وصول الموقع" }], comments: [] },
  { id: "f4", ticketNo: "FLT-272", elevatorId: 1120, customer: "شركة الملقا التجارية", site: "الملقا - شمال", fault: "إضاءة الكابينة لا تعمل", priority: "low", status: "assigned", reportedAt: "2026-10-16 08:05", slaDueMins: 220, tech: "ماجد العتيبي", timeline: [{ at: "08:05", label: "تم البلاغ" }, { at: "08:20", label: "تعيين الفني" }], comments: [] },
  { id: "f5", ticketNo: "FLT-262", elevatorId: 1145, customer: "عائلة الحميد", site: "العليا - وسط", fault: "اهتزاز عند التوقف", priority: "normal", status: "diagnosis", reportedAt: "2026-10-16 07:40", slaDueMins: 15, tech: "نايف الشهري", timeline: [{ at: "07:40", label: "تم البلاغ" }, { at: "07:55", label: "إبلاغ الفني" }, { at: "08:30", label: "وصول الموقع" }], comments: [] },
  { id: "f6", ticketNo: "FLT-255", elevatorId: 1075, customer: "شركة النخبة العقارية", site: "العارض - شمال", fault: "زر الطابق 3 لا يستجيب", priority: "low", status: "open", reportedAt: "2026-10-16 11:48", slaDueMins: 300, tech: "—", timeline: [{ at: "11:48", label: "تم البلاغ" }], comments: [{ by: "النظام", visibility: "internal", body: "لم يتم الإرسال: على العميل فاتورة متأخرة (قابل للتجاوز)", at: "11:49" }] },
  { id: "f7", ticketNo: "FLT-248", elevatorId: 1131, customer: "فندق الصحافة", site: "الصحافة - شمال", fault: "تأخر الاستجابة عند النداء", priority: "normal", status: "testing", reportedAt: "2026-10-15 20:15", slaDueMins: 60, tech: "ياسر الغامدي", timeline: [{ at: "20:15", label: "تم البلاغ" }, { at: "20:22", label: "إبلاغ الفني" }, { at: "20:58", label: "وصول الموقع" }, { at: "21:30", label: "إصلاح وضبط" }], comments: [] },
  { id: "f8", ticketNo: "FLT-244", elevatorId: 1016, customer: "راز العقارية", site: "العريجاء - جنوب", fault: "صيانة طارئة — حجز شخص (تم الإنقاذ)", priority: "emergency", status: "resolved", reportedAt: "2026-10-14 17:00", slaDueMins: 0, tech: "نايف الشهري", timeline: [{ at: "17:00", label: "تم البلاغ" }, { at: "17:03", label: "إبلاغ الفني" }, { at: "17:15", label: "وصول وإنقاذ" }, { at: "17:40", label: "تم الإصلاح" }], comments: [{ by: "العميل", visibility: "customer", body: "شكراً للاستجابة السريعة", at: "18:05" }] },
];

export const statusAr: Record<string, string> = {
  active: "يعمل", under_maintenance: "تحت الصيانة", out_of_service: "خارج الخدمة", decommissioned: "مستبعد",
  scheduled: "مجدول", assigned: "مُسند", en_route: "في الطريق", started: "بدأ", on_hold_parts: "بانتظار قطع",
  completed: "مكتمل", customer_signed: "موقّع من العميل", supervisor_approved: "معتمد", closed: "مغلق",
  open: "مفتوح", acknowledged: "تم الاستلام", on_site: "في الموقع", diagnosis: "تشخيص",
  waiting_parts: "بانتظار قطع", repairing: "إصلاح", testing: "اختبار", resolved: "تم الحل",
  low: "منخفض", normal: "عادي", high: "مرتفع", critical: "حرج", emergency: "طارئ",
  comprehensive: "شامل", non_comprehensive: "غير شامل",
};

// Checklist templates per work type (used to initialize a WO's editable checklist)
type ChecklistTemplateItem = Omit<WoChecklistItem, "done" | "result" | "value">;
export const checklistTemplates: Record<string, ChecklistTemplateItem[]> = {
  "صيانة دورية": [
    { label: "فحص لوحة التحكم والكنترول", type: "pass_fail" },
    { label: "فحص المكابح واختبار الطوارئ", type: "pass_fail" },
    { label: "قياس جهد المحرك", type: "measurement", unit: "فولت" },
    { label: "فحص الأبواب وحساساتها", type: "pass_fail" },
    { label: "تزييت السكك والتوجيهات", type: "pass_fail" },
    { label: "اختبار إضاءة الطوارئ", type: "boolean" },
    { label: "فحص الحبال والتوصيلات", type: "pass_fail" },
    { label: "صورة غرفة الماكينة", type: "photo" },
    { label: "ملاحظات الفني", type: "text" },
    { label: "توقيع العميل", type: "signature" },
  ],
  "إصلاح عطل": [
    { label: "تشخيص سبب العطل", type: "text" },
    { label: "فحص السلامة قبل الإصلاح", type: "pass_fail" },
    { label: "تنفيذ الإصلاح", type: "pass_fail" },
    { label: "اختبار التشغيل بعد الإصلاح", type: "pass_fail" },
    { label: "صورة بعد الإصلاح", type: "photo" },
    { label: "توقيع العميل", type: "signature" },
  ],
  "فحص": [
    { label: "فحص السلامة العام", type: "pass_fail" },
    { label: "قياس دقة التوقف بين الأدوار", type: "measurement", unit: "مم" },
    { label: "اختبار زر الطوارئ والجرس", type: "boolean" },
    { label: "فحص قفل الأبواب", type: "pass_fail" },
    { label: "فحص حد السرعة (Governor)", type: "pass_fail" },
    { label: "التوثيق بالصور", type: "photo" },
    { label: "توقيع المشرف", type: "signature" },
  ],
  "تركيب": [
    { label: "مطابقة المواصفات للعقد", type: "pass_fail" },
    { label: "محاذاة السكك", type: "measurement", unit: "مم" },
    { label: "تركيب الماكينة والكنترول", type: "pass_fail" },
    { label: "تركيب الأبواب والكابينة", type: "pass_fail" },
    { label: "اختبار التشغيل الأولي", type: "pass_fail" },
    { label: "توقيع التسليم", type: "signature" },
  ],
};
export function defaultChecklist(type: string): WoChecklistItem[] {
  return (checklistTemplates[type] ?? []).map((t) => ({ ...t, done: false }));
}
