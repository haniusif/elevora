// Role-based access control model + token helpers for the mock API.
// Mirrors the server-side intent: authorization is checked in the data/API
// layer (see api/store.ts), not only by hiding UI (Rule 8 in the audit).

export type Verb = "view" | "create" | "edit" | "delete";
export type Module =
  | "dashboard" | "elevators" | "work_orders" | "faults"
  | "contracts" | "customers" | "inventory" | "settings";

export interface Role {
  key: string;
  label: string;
  perms: Partial<Record<Module, Verb[]>>;
}

const ALL: Verb[] = ["view", "create", "edit", "delete"];
const MODULES: Module[] = ["dashboard", "elevators", "work_orders", "faults", "contracts", "customers", "inventory", "settings"];

const allPerms = (): Role["perms"] => Object.fromEntries(MODULES.map((m) => [m, ALL]));
const viewAll = (): Role["perms"] => Object.fromEntries(MODULES.filter((m) => m !== "settings").map((m) => [m, ["view"]]));

export const ROLES: Record<string, Role> = {
  gm: { key: "gm", label: "مدير عام", perms: allPerms() },
  admin: { key: "admin", label: "مدير النظام", perms: allPerms() },
  ops: {
    key: "ops", label: "مدير العمليات",
    perms: { dashboard: ["view"], elevators: ALL, work_orders: ALL, faults: ALL, contracts: ["view", "create", "edit"], customers: ["view", "create", "edit"], inventory: ["view"] },
  },
  dispatcher: {
    key: "dispatcher", label: "منسق إرسال",
    perms: { dashboard: ["view"], elevators: ["view"], work_orders: ["view", "create", "edit"], faults: ["view", "create", "edit"], contracts: ["view"], customers: ["view"], inventory: ["view"] },
  },
  technician: {
    key: "technician", label: "فني",
    perms: { dashboard: ["view"], elevators: ["view"], work_orders: ["view", "edit"], faults: ["view", "edit"] },
  },
  accountant: {
    key: "accountant", label: "محاسب",
    perms: { dashboard: ["view"], contracts: ["view", "edit"], customers: ["view"], elevators: ["view"] },
  },
  storekeeper: {
    key: "storekeeper", label: "أمين مستودع",
    perms: { dashboard: ["view"], inventory: ALL, work_orders: ["view"], elevators: ["view"] },
  },
  auditor: { key: "auditor", label: "مدقق (قراءة فقط)", perms: viewAll() },
};

// Demo username -> role (so you can sign in as different roles)
const USER_ROLE: Record<string, string> = {
  ghada: "gm", admin: "admin", ops: "ops", disp: "dispatcher",
  tech: "technician", acc: "accountant", store: "storekeeper", view: "auditor",
};

export const DEMO_USERS: { username: string; label: string }[] = [
  { username: "ghada", label: "مدير عام" },
  { username: "ops", label: "مدير العمليات" },
  { username: "disp", label: "منسق إرسال" },
  { username: "tech", label: "فني" },
  { username: "acc", label: "محاسب" },
  { username: "store", label: "أمين مستودع" },
  { username: "view", label: "مدقق (قراءة فقط)" },
];

export function roleForUsername(username: string): Role {
  return ROLES[USER_ROLE[username?.trim().toLowerCase()] ?? "gm"];
}

export function hasPerm(roleKey: string | undefined, module: Module, verb: Verb): boolean {
  if (!roleKey) return false;
  const r = ROLES[roleKey];
  return !!r && !!r.perms[module] && r.perms[module]!.includes(verb);
}

// Collection name (store) -> RBAC module
export function moduleOfCollection(coll: string): Module {
  const map: Record<string, Module> = {
    elevators: "elevators", workOrders: "work_orders", faults: "faults",
    contracts: "contracts", customers: "customers", items: "inventory",
  };
  return map[coll] ?? "dashboard";
}

// ---- Fake JWT (unsigned, base64 payload) --------------------------------
const enc = (s: string) => btoa(unescape(encodeURIComponent(s)));
const dec = (s: string) => decodeURIComponent(escape(atob(s)));

export function makeToken(sub: string, role: string): string {
  const header = enc(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = enc(JSON.stringify({ sub, role, iat: Date.now(), exp: Date.now() + 86400000 }));
  return `${header}.${payload}.mock`;
}

export function readToken(token: string | null): { sub: string; role: string } | null {
  try {
    if (!token) return null;
    const payload = JSON.parse(dec(token.split(".")[1]));
    if (payload.exp && payload.exp < Date.now()) return null;
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
