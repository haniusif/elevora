import { createContext, useContext, useState, ReactNode } from "react";

export interface User {
  name: string;
  role: string;
}

interface AuthCtx {
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null!);
const KEY = "elevora-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem(KEY);
      return s ? (JSON.parse(s) as User) : null;
    } catch {
      return null;
    }
  });

  const login = (username: string) => {
    const u: User = { name: username?.trim() || "غادة الشمري", role: "مدير عام" };
    setUser(u);
    try {
      localStorage.setItem(KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
