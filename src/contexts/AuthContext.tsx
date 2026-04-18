import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";

export type UserRole = "student" | "concern-hod" | "school-hod" | "daa" | "admin";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  school?: string;
  avatarUrl?: string;
  registrationNumber?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

const fetchUserData = async (supaUser: SupaUser): Promise<User | null> => {
  try {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("name, department, school, avatar_url, registration_number").eq("id", supaUser.id).single(),
      supabase.from("user_roles").select("role").eq("user_id", supaUser.id).single(),
    ]);

    const profile = profileRes.data;
    const role = (roleRes.data?.role as UserRole) || "student";

    return {
      id: supaUser.id,
      email: supaUser.email || "",
      name: profile?.name || supaUser.email || "User",
      role,
      department: profile?.department || undefined,
      school: profile?.school || undefined,
      avatarUrl: profile?.avatar_url || undefined,
      registrationNumber: profile?.registration_number || undefined,
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Use setTimeout to avoid deadlock with Supabase client
        setTimeout(async () => {
          const userData = await fetchUserData(session.user);
          setUser(userData);
          setLoading(false);
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userData = await fetchUserData(session.user);
        setUser(userData);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
