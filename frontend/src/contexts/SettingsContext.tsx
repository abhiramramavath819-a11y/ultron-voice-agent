import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

interface SettingsContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  currencySymbol: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => (localStorage.getItem('currency') as Currency) || 'USD');

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const symbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹'
  };

  return (
    <SettingsContext.Provider value={{ currency, setCurrency, currencySymbol: symbols[currency] }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
