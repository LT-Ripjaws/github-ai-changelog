"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextType {
  resolvedTheme: "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ThemeContext.Provider value={{ resolvedTheme: "dark" }}>{children}</ThemeContext.Provider>;
  }

  return (
    <ThemeContext.Provider value={{ resolvedTheme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
