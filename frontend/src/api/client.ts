// Mock API client — the single seam to a real /api/v1 backend.
// Swap the bodies here for real `fetch` calls; the rest of the app is unchanged.
// CRUD + RBAC enforcement live in ./store (the data/API layer).
import { makeToken, roleForUsername } from "../rbac";

export { bootstrap, create, update, remove, setRole } from "./store";

export interface LoginResult {
  token: string;
  user: { name: string; roleKey: string; roleLabel: string };
}

export async function login(username: string): Promise<LoginResult> {
  // eslint-disable-next-line no-console
  console.log("[API] POST /api/v1/auth/login");
  await new Promise((r) => setTimeout(r, 300)); // simulate network
  const role = roleForUsername(username);
  const name = username?.trim() || "ghada";
  return {
    token: makeToken(name, role.key),
    user: { name, roleKey: role.key, roleLabel: role.label },
  };
}
