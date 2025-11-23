export const formatCurrency = (value, currency = 'USD', format = 'standard') => {
  const absValue = Math.abs(value);
  
  if (currency === 'INR' && format === 'indian') {
    // Indian numbering system
    if (absValue >= 10000000) {
      // Crores
      return `₹${(value / 10000000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
    } else if (absValue >= 100000) {
      // Lakhs
      return `₹${(value / 100000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;
    } else {
      // Less than 1 lakh - use proper Indian comma separation
      return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  } else if (currency === 'INR') {
    // Standard INR formatting
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (currency === 'USD') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

export const getSymbolForCurrency = (currency) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'SGD': 'S$',
    'AED': 'AED'
  };
  return symbols[currency] || currency;
};
