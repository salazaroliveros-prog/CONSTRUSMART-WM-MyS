import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  sidebarCollapsed: boolean;
  toggleCollapse: () => void;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  sidebarCollapsed: false,
  toggleCollapse: () => {},
};

const AppContext = createContext<AppContextType>(defaultAppContext);

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);

const COLLAPSED_KEY = 'wm_sidebar_collapsed';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, String(sidebarCollapsed)); } catch { /* ignore */ }
  }, [sidebarCollapsed]);

  const toggleSidebar  = useCallback(() => setSidebarOpen(p => !p), []);
  const closeSidebar   = useCallback(() => setSidebarOpen(false), []);
  const toggleCollapse = useCallback(() => setSidebarCollapsed(p => !p), []);

  return (
    <AppContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar, sidebarCollapsed, toggleCollapse }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
