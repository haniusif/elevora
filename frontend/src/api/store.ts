// Reactive, localStorage-backed mock store. Replaces static mock arrays so CRUD
// actually persists across reloads. Swap these functions for a real /api/v1
// client later (same signatures) without touching the pages.
import { useSyncExternalStore } from "react";
import {
  elevators as seedElevators,
  workOrders as seedWO,
  faults as seedFaults,
  type Elevator,
  type WorkOrder,
  type FaultTicket,
} from "../data/mock";
import {
  customers as seedCustomers,
  contracts as seedContracts,
  items as seedItems,
  type Customer,
  type Contract,
  type Item,
} from "../data/seed";
import { hasPerm, moduleOfCollection, type Verb } from "../rbac";
import { toast } from "../lib/ui";

export interface DB {
  elevators: Elevator[];
  workOrders: WorkOrder[];
  faults: FaultTicket[];
  customers: Customer[];
  contracts: Contract[];
  items: Item[];
}

const KEY = "elevora-db-v1";

function seed(): DB {
  return {
    elevators: structuredClone(seedElevators),
    workOrders: structuredClone(seedWO),
    faults: structuredClone(seedFaults),
    customers: structuredClone(seedCustomers),
    contracts: structuredClone(seedContracts),
    items: structuredClone(seedItems),
  };
}

function load(): DB {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return JSON.parse(s) as DB;
  } catch {
    /* ignore */
  }
  return seed();
}

let state: DB = load();
const listeners = new Set<() => void>();

function commit(next: DB) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Select a STABLE slice (a whole collection). Do filtering in the component with useMemo. */
export function useDB<T>(selector: (db: DB) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state)
  );
}

export function getDB(): DB {
  return state;
}

export function resetDB() {
  commit(seed());
}

type Coll = keyof DB;

export function nextNumId(coll: Coll, base = 1000): number {
  const arr = state[coll] as { id: unknown }[];
  const max = arr.reduce((m, x) => (typeof x.id === "number" ? Math.max(m, x.id) : m), base);
  return max + 1;
}

export function nextStrId(prefix: string): string {
  return prefix + Date.now().toString(36);
}

// ---- Mock-API behaviour: session, latency, server-side RBAC --------------
// Authorization is enforced HERE (the data/API layer), not only by hiding UI.
let currentRole: string | undefined;
export function setRole(role?: string) {
  currentRole = role;
}

const latency = () => new Promise<void>((r) => setTimeout(r, 50 + Math.random() * 110));

function allow(coll: Coll, verb: Verb): boolean {
  if (hasPerm(currentRole, moduleOfCollection(coll), verb)) return true;
  toast("ليس لديك صلاحية لهذا الإجراء", "err");
  return false;
}
function log(method: string, coll: string, id?: unknown) {
  // eslint-disable-next-line no-console
  console.log(`[API] ${method} /api/v1/${coll}${id != null ? "/" + id : ""}`);
}

export async function bootstrap(): Promise<void> {
  log("GET", "bootstrap");
  await latency();
}

export async function create<K extends Coll>(coll: K, item: DB[K][number]): Promise<boolean> {
  if (!allow(coll, "create")) return false;
  log("POST", coll);
  await latency();
  commit({ ...state, [coll]: [item as never, ...(state[coll] as never[])] });
  return true;
}

export async function update<K extends Coll>(coll: K, id: unknown, patch: Partial<DB[K][number]>): Promise<boolean> {
  if (!allow(coll, "edit")) return false;
  log("PATCH", coll, id);
  await latency();
  commit({
    ...state,
    [coll]: (state[coll] as { id: unknown }[]).map((x) => (x.id === id ? ({ ...x, ...patch } as never) : (x as never))),
  });
  return true;
}

export async function remove<K extends Coll>(coll: K, id: unknown): Promise<boolean> {
  if (!allow(coll, "delete")) return false;
  log("DELETE", coll, id);
  await latency();
  commit({ ...state, [coll]: (state[coll] as { id: unknown }[]).filter((x) => x.id !== id) as never[] });
  return true;
}
