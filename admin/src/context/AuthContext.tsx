import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (phoneOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = api.getToken();
      if (savedToken) {
        try {
          const profile = await api.get<User>("/users/profile");
          setUser(profile);
        } catch {
          api.setToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (phoneOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const payload = phoneOrEmail.includes("@")
        ? { email: phoneOrEmail, password }
        : { phone: phoneOrEmail, password };

      const res = await api.post<{ accessToken: string }>(
        "/auth/login",
        payload,
      );
      api.setToken(res.accessToken);
      setToken(res.accessToken);

      const profile = await api.get<User>("/users/profile");
      setUser(profile);
    } catch (error) {
      api.setToken(null);
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
