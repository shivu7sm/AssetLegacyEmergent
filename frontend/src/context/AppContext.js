import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [currencyFormat, setCurrencyFormat] = useState('standard');
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await axios.get(`${API}/user/preferences`, { withCredentials: true });
      const prefs = response.data;
      setPreferences(prefs);
      setSelectedCurrency(prefs.selected_currency || 'USD');
      setCurrencyFormat(prefs.currency_format || 'standard');
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Set defaults if not authenticated
      setSelectedCurrency('USD');
      setCurrencyFormat('standard');
    } finally {
      setLoading(false);
    }
  };

  const updateCurrency = async (currency) => {
    try {
      await axios.put(
        `${API}/user/preferences`,
        { selected_currency: currency },
        { withCredentials: true }
      );
      setSelectedCurrency(currency);
    } catch (error) {
      console.error('Failed to update currency:', error);
    }
  };

  const updateCurrencyFormat = async (format) => {
    try {
      await axios.put(
        `${API}/user/preferences`,
        { currency_format: format },
        { withCredentials: true }
      );
      setCurrencyFormat(format);
    } catch (error) {
      console.error('Failed to update currency format:', error);
    }
  };

  const value = {
    selectedCurrency,
    setSelectedCurrency: updateCurrency,
    currencyFormat,
    setCurrencyFormat: updateCurrencyFormat,
    preferences,
    loadPreferences,
    loading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
