"use client";

import { createContext, useContext, useState } from "react";

type UserPayload = {
  userId: string;
  email: string;
  nombre: string;
  role?: string;
};

type AuthContextType = {
  user: UserPayload | null;
  setUser: (user: UserPayload | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children, 
  initialUser 
}: { 
  children: React.ReactNode;
  initialUser: UserPayload | null;
}) {
  const [user, setUser] = useState<UserPayload | null>(initialUser);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
