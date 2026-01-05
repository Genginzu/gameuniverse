import { User } from "@supabase/supabase-js";
import React from "react";

export const DashboardContext = React.createContext<{
  user: User;
  loading: boolean;
} | null>(null);

export const useDashboard = () => {
  const context = React.useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardLayout");
  }
  return context;
};
