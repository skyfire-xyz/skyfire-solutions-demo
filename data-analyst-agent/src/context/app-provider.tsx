import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { AgentContext, AppContextType } from "@/lib/types";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        sessionStorage.getItem("skyfire_api_key") ||
        process.env.SKYFIRE_API_KEY ||
        ""
      );
    }
    return process.env.SKYFIRE_API_KEY || "";
  });

  const [agentContext, setAgentContext] = useState<AgentContext>(()  => {
    if (typeof window !== "undefined") {
      return (
        JSON.parse(sessionStorage.getItem("agentContext")||"{}") ||
        {}
      );
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== "undefined" && apiKey) {
      sessionStorage.setItem("skyfire_api_key", apiKey);
    }
  }, [apiKey]);

  useEffect(() => {
    if (typeof window !== "undefined" && agentContext) {
      sessionStorage.setItem("agentContext", JSON.stringify(agentContext));
    }
  }, [agentContext]);

  const value: AppContextType = {
    apiKey,
    setApiKey,
    agentContext,
    setAgentContext
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
