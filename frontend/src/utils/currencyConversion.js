import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Cache for exchange rates
const ratesCache = {};
const CACHE_DURATION = 3600000; // 1 hour

export const getExchangeRate = async (fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return 1;
  
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = ratesCache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate;
  }
  
  try {
    const response = await axios.get(
      `${API}/prices/currency/${fromCurrency}/${toCurrency}`,
      { withCredentials: true }
    );
    const rate = response.data.rate;
    ratesCache[cacheKey] = { rate, timestamp: Date.now() };
    return rate;
  } catch (error) {
    console.error('Exchange rate fetch failed:', error);
    return 1;
  }
};

export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
};

// Helper function to format Indian numbering (X,XX,XX,XXX)
const formatIndianNumber = (num) => {
  const numStr = Math.abs(num).toFixed(2);
  const [integerPart, decimalPart] = numStr.split('.');
  
  // For Indian format: last 3 digits, then groups of 2
  let formatted = '';
  let count = 0;
  
  for (let i = integerPart.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      formatted = ',' + formatted;
    }
    formatted = integerPart[i] + formatted;
    count++;
  }
  
  return (num < 0 ? '-' : '') + formatted + '.' + decimalPart;
};

export const formatCurrency = (value, currency = 'USD', format = 'standard') => {
  const absValue = Math.abs(value);
  
  if (currency === 'INR' && format === 'indian') {
    // Indian numbering system with lakhs and crores
    if (absValue >= 10000000) {
      const crores = value / 10000000;
      return `₹${formatIndianNumber(crores)} Cr`;
    } else if (absValue >= 100000) {
      const lakhs = value / 100000;
      return `₹${formatIndianNumber(lakhs)} L`;
    } else {
      return `₹${formatIndianNumber(value)}`;
    }
  } else if (currency === 'INR') {
    return `₹${formatIndianNumber(value)}`;
  } else if (currency === 'USD') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency === 'EUR') {
    return `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency === 'GBP') {
    return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};
