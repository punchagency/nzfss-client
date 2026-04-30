"use client";

import React, { useState, createContext, useContext } from "react";

// Define types for the context
type TabContextProviderProps = {
  children: React.ReactNode;
  initialTab?: number;
};

type TabContextType = {
  activeTab: number;
  setActiveTab: (tabId: number) => void;
  activeTabEvents: number;
  setActiveTabEvents: (tabId: number) => void;
};

// Create a context with default value of null (since context is optional initially)
const TabContext = createContext<TabContextType | null>(null);

export default function TabContextProvider({ children, initialTab }: TabContextProviderProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 1); // Default tab is "1" unless initialTab is provided
  const [activeTabEvents, setActiveTabEvents] = useState(initialTab ?? 0); // Default to 0 for events section

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab, activeTabEvents, setActiveTabEvents }}>
      {children}
    </TabContext.Provider>
  );
}

// Custom hook to use the Tab context
export function useTab() {
  const context = useContext(TabContext);

  if (context === null) {
    throw new Error("useTab must be used within a TabContextProvider");
  }

  return context;
}
