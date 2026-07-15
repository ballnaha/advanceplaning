'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextProps {
  isNavigating: boolean;
  activePath: string;
  startNavigation: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextProps>({
  isNavigating: false,
  activePath: '',
  startNavigation: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [activePath, setActivePath] = useState(pathname);

  useEffect(() => {
    setActivePath(pathname);
    setIsNavigating(false);
  }, [pathname]);

  const startNavigation = (href: string) => {
    if (href !== pathname) {
      setActivePath(href);
      setIsNavigating(true);
    }
  };

  return (
    <NavigationContext.Provider value={{ isNavigating, activePath, startNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export const useNavigation = () => useContext(NavigationContext);
