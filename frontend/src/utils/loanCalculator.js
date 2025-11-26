// Client-side loan calculator utilities
export const calculateLoanPayment = (principal, annualRate, months) => {
  if (annualRate === 0) {
    return principal / months;
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return payment;
};

export const generateAmortizationSchedule = (principal, annualRate, months) => {
  const schedule = [];
  let remainingBalance = principal;
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateLoanPayment(principal, annualRate, months);
  
  for (let month = 1; month <= months; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance = remainingBalance - principalPayment;
    
    // Handle rounding for last payment
    if (month === months) {
      remainingBalance = 0;
    }
    
    schedule.push({
      month,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal_payment: Math.round(principalPayment * 100) / 100,
      interest_payment: Math.round(interestPayment * 100) / 100,
      remaining_balance: Math.round(Math.max(0, remainingBalance) * 100) / 100
    });
  }
  
  return schedule;
};

export const calculateLoanSummary = (principal, annualRate, months) => {
  const schedule = generateAmortizationSchedule(principal, annualRate, months);
  const totalPayment = schedule.reduce((sum, entry) => sum + entry.payment, 0);
  const totalInterest = totalPayment - principal;
  
  return {
    monthly_payment: schedule[0]?.payment || 0,
    total_interest: Math.round(totalInterest * 100) / 100,
    total_amount: Math.round(totalPayment * 100) / 100,
    amortization_schedule: schedule
  };
};
