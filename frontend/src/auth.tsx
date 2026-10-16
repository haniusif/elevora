import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ROLES, roleForUsername, hasPerm, readToken, type Module, type Verb } from "./rbac";
import { setRole } from "./api/store";
import { login as apiLogin } from "./api/client";

export interface User {
  name: string;
  roleKey: string;
  roleLabel: string;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
  can: (module: Module, verb: Verb) => boolean;
}

const Ctx = createContext<AuthCtx>(null!);
const KEY = "elevora-auth";

function restore(): { user: User | null; token: string | null } {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return { user: null, token: null };
    const { token } = JSON.parse(s) as { token: string };
    const p = readToken(token);
    if (!p) return { user: null, token: null };
    const role = ROLES[p.role] ?? roleForUsername(p.sub);
    return { token, user: { name: p.sub, roleKey: role.key, roleLabel: role.label } };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ user, token }, setState] = useState(restore);

  useEffect(() => {
    setRole(user?.roleKey);
  }, [user]);

  const login = async (username: string) => {
    const { token: tk, user: u } = await apiLogin(username);
    try {
      localStorage.setItem(KEY, JSON.stringify({ token: tk }));
    } catch {
      /* ignore */
    }
    setState({ user: u, token: tk });
  };

  const logout = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setState({ user: null, token: null });
  };

  const can = (module: Module, verb: Verb) => hasPerm(user?.roleKey, module, verb);

  return <Ctx.Provider value={{ user, token, login, logout, can }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
