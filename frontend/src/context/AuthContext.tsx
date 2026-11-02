import React, { createContext, useContext, useState, useEffect } from "react";
import { User, PortfolioData } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  currentUser: User | null;
  portfolio: PortfolioData | null;
  demoUsers: User[];
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (username: string, email: string, pass: string, role: string) => Promise<void>;
  switchDemoUser: (user: User) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem("ledgertrade_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDemoUsers = async () => {
    try {
      const users = await api.getDemoUsers();
      setDemoUsers(users);
      return users;
    } catch (err) {
      console.warn("Could not fetch demo users list:", err);
      return [];
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getProfile();
      setCurrentUser(res.user);
      setPortfolio(res.portfolio);
    } catch (err) {
      console.warn("Failed refreshing profile:", err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const users = await fetchDemoUsers();

      const savedUserId = localStorage.getItem("ledgertrade_demo_user_id");
      if (savedUserId && users.length > 0) {
        const found = users.find((u) => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
          localStorage.setItem("ledgertrade_demo_user_id", found.id);
        }
      } else if (users.length > 0) {
        // Default to Alice (Investor)
        const defaultUser = users.find((u) => u.username === "alice") || users[0];
        setCurrentUser(defaultUser);
        localStorage.setItem("ledgertrade_demo_user_id", defaultUser.id);
      }

      await refreshProfile();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setCurrentUser(res.user);
    setToken(res.token);
    localStorage.setItem("ledgertrade_token", res.token);
    localStorage.setItem("ledgertrade_demo_user_id", res.user.id);
    await refreshProfile();
  };

  const register = async (username: string, email: string, pass: string, role: string) => {
    const res = await api.register(username, email, pass, role);
    setCurrentUser(res.user);
    setToken(res.token);
    localStorage.setItem("ledgertrade_token", res.token);
    localStorage.setItem("ledgertrade_demo_user_id", res.user.id);
    await fetchDemoUsers();
    await refreshProfile();
  };

  const switchDemoUser = async (user: User) => {
    try {
      const res = await api.switchDemoAccount(user.id);
      setCurrentUser(res.user);
      setToken(res.token);
      localStorage.setItem("ledgertrade_token", res.token);
      localStorage.setItem("ledgertrade_demo_user_id", res.user.id);
      await refreshProfile();
    } catch (err) {
      console.error("Failed switching demo user:", err);
      // Fallback local switch
      setCurrentUser(user);
      localStorage.setItem("ledgertrade_demo_user_id", user.id);
    }
  };

  const logout = () => {
    localStorage.removeItem("ledgertrade_token");
    setToken(null);
    if (demoUsers.length > 0) {
      switchDemoUser(demoUsers[0]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        portfolio,
        demoUsers,
        token,
        isLoading,
        login,
        register,
        switchDemoUser,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
