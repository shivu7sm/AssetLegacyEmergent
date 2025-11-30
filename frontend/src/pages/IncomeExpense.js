import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, Edit, Trash2, DollarSign, TrendingDown, TrendingUp, 
  Calendar, PieChart, ArrowUpRight, ArrowDownRight, Wallet, Receipt 
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' }
];

export default function IncomeExpense() {
  const { selectedCurrency } = useApp();
  const { theme } = useTheme();
  
  // State
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState({ expense_categories: {}, income_sources: [], payment_methods: [] });
  
  // Dialog state
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // Form state
  const [incomeForm, setIncomeForm] = useState({
    source: 'Salary',
    description: '',
    amount_before_tax: '',
    tax_deducted: '',
    currency: selectedCurrency,
    payment_date: '',
    notes: '',
    recurring: true
  });
  
  const [expenseForm, setExpenseForm] = useState({
    category: 'Food & Dining',
    subcategory: '',
    description: '',
    amount: '',
    currency: selectedCurrency,
    payment_method: 'Credit Card',
    payment_date: '',
    is_recurring: false,
    is_essential: true,
    notes: ''
  });

  // Helper functions
  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  function formatMonth(monthStr) {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Fetch data
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchIncomes();
      fetchExpenses();
      fetchSummary();
    }
  }, [selectedMonth, selectedCurrency]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/income-expense/categories`, { withCredentials: true });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchIncomes = async () => {
    try {
      const response = await axios.get(`${API}/income?month=${selectedMonth}`, { withCredentials: true });
      setIncomes(response.data.incomes || []);
    } catch (error) {
      console.error('Failed to fetch incomes:', error);
      toast.error('Failed to load income data');
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API}/expenses?month=${selectedMonth}`, { withCredentials: true });
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to load expense data');
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(
        `${API}/income-expense/summary?month=${selectedMonth}&target_currency=${selectedCurrency}`,
        { withCredentials: true }
      );
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  // Income CRUD
  const handleCreateIncome = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/income`, {
        ...incomeForm,
        month: selectedMonth,
        amount_before_tax: parseFloat(incomeForm.amount_before_tax),
        tax_deducted: parseFloat(incomeForm.tax_deducted || 0)
      }, { withCredentials: true });
      
      toast.success('Income added successfully');
      setIncomeDialogOpen(false);
      resetIncomeForm();
      fetchIncomes();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to add income');
    }
  };

  const handleUpdateIncome = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/income/${editingIncome.id}`, {
        ...incomeForm,
        amount_before_tax: parseFloat(incomeForm.amount_before_tax),
        tax_deducted: parseFloat(incomeForm.tax_deducted || 0)
      }, { withCredentials: true });
      
      toast.success('Income updated successfully');
      setIncomeDialogOpen(false);
      setEditingIncome(null);
      resetIncomeForm();
      fetchIncomes();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to update income');
    }
  };

  const handleDeleteIncome = async (incomeId) => {
    if (!window.confirm('Are you sure you want to delete this income entry?')) return;
    
    try {
      await axios.delete(`${API}/income/${incomeId}`, { withCredentials: true });
      toast.success('Income deleted');
      fetchIncomes();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to delete income');
    }
  };

  // Expense CRUD
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses`, {
        ...expenseForm,
        month: selectedMonth,
        amount: parseFloat(expenseForm.amount)
      }, { withCredentials: true });
      
      toast.success('Expense added successfully');
      setExpenseDialogOpen(false);
      resetExpenseForm();
      fetchExpenses();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/expenses/${editingExpense.id}`, {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      }, { withCredentials: true });
      
      toast.success('Expense updated successfully');
      setExpenseDialogOpen(false);
      setEditingExpense(null);
      resetExpenseForm();
      fetchExpenses();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to update expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense entry?')) return;
    
    try {
      await axios.delete(`${API}/expenses/${expenseId}`, { withCredentials: true });
      toast.success('Expense deleted');
      fetchExpenses();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  // Form helpers
  const resetIncomeForm = () => {
    setIncomeForm({
      source: 'Salary',
      description: '',
      amount_before_tax: '',
      tax_deducted: '',
      currency: selectedCurrency,
      payment_date: '',
      notes: '',
      recurring: true
    });
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      category: 'Food & Dining',
      subcategory: '',
      description: '',
      amount: '',
      currency: selectedCurrency,
      payment_method: 'Credit Card',
      payment_date: '',
      is_recurring: false,
      is_essential: true,
      notes: ''
    });
  };

  const openIncomeDialog = (income = null) => {
    if (income) {
      setEditingIncome(income);
      setIncomeForm({
        source: income.source,
        description: income.description,
        amount_before_tax: income.amount_before_tax.toString(),
        tax_deducted: income.tax_deducted.toString(),
        currency: income.currency,
        payment_date: income.payment_date || '',
        notes: income.notes || '',
        recurring: income.recurring
      });
    } else {
      setEditingIncome(null);
      resetIncomeForm();
    }
    setIncomeDialogOpen(true);
  };

  const openExpenseDialog = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseForm({
        category: expense.category,
        subcategory: expense.subcategory || '',
        description: expense.description,
        amount: expense.amount.toString(),
        currency: expense.currency,
        payment_method: expense.payment_method || 'Credit Card',
        payment_date: expense.payment_date || '',
        is_recurring: expense.is_recurring,
        is_essential: expense.is_essential,
        notes: expense.notes || ''
      });
    } else {
      setEditingExpense(null);
      resetExpenseForm();
    }
    setExpenseDialogOpen(true);
  };

  // Generate month options
  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      options.push({ value, label: formatMonth(value) });
    }
    return options;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{color: '#f8fafc'}}>Income & Expenses</h1>
            <p className="text-sm mt-1" style={{color: '#94a3b8'}}>Track your monthly cash flow</p>
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48" style={{background: '#1a1229', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                {getMonthOptions().map(option => (
                  <SelectItem key={option.value} value={option.value} style={{color: '#f8fafc'}}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#10b981'}}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{color: '#94a3b8'}}>Total Income</p>
                    <p className="text-2xl font-bold mt-1" style={{color: '#10b981'}}>
                      {formatCurrency(summary.total_income_after_tax)}
                    </p>
                    <p className="text-xs mt-1" style={{color: '#64748b'}}>After tax</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)'}}>
                    <ArrowDownRight className="w-6 h-6" style={{color: '#10b981'}} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#ef4444'}}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{color: '#94a3b8'}}>Total Expenses</p>
                    <p className="text-2xl font-bold mt-1" style={{color: '#ef4444'}}>
                      {formatCurrency(summary.total_expenses)}
                    </p>
                    <p className="text-xs mt-1" style={{color: '#64748b'}}>Monthly spending</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{background: 'rgba(239, 68, 68, 0.1)'}}>
                    <ArrowUpRight className="w-6 h-6" style={{color: '#ef4444'}} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#3b82f6'}}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{color: '#94a3b8'}}>Net Savings</p>
                    <p className="text-2xl font-bold mt-1" style={{color: summary.net_savings >= 0 ? '#10b981' : '#ef4444'}}>
                      {formatCurrency(summary.net_savings)}
                    </p>
                    <p className="text-xs mt-1" style={{color: '#64748b'}}>
                      {summary.net_savings >= 0 ? 'Surplus' : 'Deficit'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
                    <Wallet className="w-6 h-6" style={{color: '#3b82f6'}} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#a855f7'}}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm" style={{color: '#94a3b8'}}>Savings Rate</p>
                    <p className="text-2xl font-bold mt-1" style={{color: '#a855f7'}}>
                      {summary.savings_rate.toFixed(1)}%
                    </p>
                    <p className="text-xs mt-1" style={{color: '#64748b'}}>Of income saved</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)'}}>
                    <PieChart className="w-6 h-6" style={{color: '#a855f7'}} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <TabsTrigger value="summary" style={{color: '#94a3b8'}}>Summary</TabsTrigger>
            <TabsTrigger value="income" style={{color: '#94a3b8'}}>Income</TabsTrigger>
            <TabsTrigger value="expenses" style={{color: '#94a3b8'}}>Expenses</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary">
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income Breakdown */}
                <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                  <CardHeader>
                    <CardTitle style={{color: '#f8fafc'}}>Income by Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(summary.income_by_source).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(summary.income_by_source).map(([source, amount]) => (
                          <div key={source} className="flex justify-between items-center">
                            <span style={{color: '#cbd5e1'}}>{source}</span>
                            <span className="font-semibold" style={{color: '#10b981'}}>
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4" style={{color: '#64748b'}}>No income recorded</p>
                    )}
                  </CardContent>
                </Card>

                {/* Expense Breakdown */}
                <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                  <CardHeader>
                    <CardTitle style={{color: '#f8fafc'}}>Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(summary.expenses_by_category).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(summary.expenses_by_category)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 8)
                          .map(([category, amount]) => (
                            <div key={category} className="flex justify-between items-center">
                              <span style={{color: '#cbd5e1'}}>{category}</span>
                              <span className="font-semibold" style={{color: '#ef4444'}}>
                                {formatCurrency(amount)}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-center py-4" style={{color: '#64748b'}}>No expenses recorded</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income">
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle style={{color: '#f8fafc'}}>Income Entries</CardTitle>
                  <Button 
                    onClick={() => openIncomeDialog()}
                    style={{background: '#10b981', color: 'white'}}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Income
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {incomes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead style={{borderBottom: '1px solid #2d1f3d'}}>
                        <tr>
                          <th className="p-3 text-left" style={{color: '#94a3b8'}}>Source</th>
                          <th className="p-3 text-left" style={{color: '#94a3b8'}}>Description</th>
                          <th className="p-3 text-right" style={{color: '#94a3b8'}}>Before Tax</th>
                          <th className="p-3 text-right" style={{color: '#94a3b8'}}>Tax</th>
                          <th className="p-3 text-right" style={{color: '#94a3b8'}}>After Tax</th>
                          <th className="p-3 text-center" style={{color: '#94a3b8'}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomes.map(income => (
                          <tr key={income.id} style={{borderBottom: '1px solid #2d1f3d'}}>
                            <td className="p-3" style={{color: '#f8fafc'}}>{income.source}</td>
                            <td className="p-3" style={{color: '#cbd5e1'}}>{income.description}</td>
                            <td className="p-3 text-right" style={{color: '#94a3b8'}}>
                              {formatCurrency(income.amount_before_tax)}
                            </td>
                            <td className="p-3 text-right" style={{color: '#ef4444'}}>
                              {formatCurrency(income.tax_deducted)}
                            </td>
                            <td className="p-3 text-right font-semibold" style={{color: '#10b981'}}>
                              {formatCurrency(income.amount_after_tax)}
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center gap-2">
                                <Button 
                                  onClick={() => openIncomeDialog(income)}
                                  variant="outline"
                                  size="sm"
                                  style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  onClick={() => handleDeleteIncome(income.id)}
                                  variant="outline"
                                  size="sm"
                                  style={{borderColor: '#ef4444', color: '#ef4444'}}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 mx-auto mb-4" style={{color: '#2d1f3d'}} />
                    <p style={{color: '#64748b'}}>No income recorded for {formatMonth(selectedMonth)}</p>
                    <Button 
                      onClick={() => openIncomeDialog()}
                      className="mt-4"
                      style={{background: '#10b981', color: 'white'}}
                    >
                      Add Your First Income
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle style={{color: '#f8fafc'}}>Expense Entries</CardTitle>
                  <Button 
                    onClick={() => openExpenseDialog()}
                    style={{background: '#ef4444', color: 'white'}}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expenses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead style={{borderBottom: '1px solid #2d1f3d'}}>
                        <tr>
                          <th className="p-3 text-left" style={{color: '#94a3b8'}}>Category</th>
                          <th className="p-3 text-left" style={{color: '#94a3b8'}}>Description</th>
                          <th className="p-3 text-right" style={{color: '#94a3b8'}}>Amount</th>
                          <th className="p-3 text-center" style={{color: '#94a3b8'}}>Type</th>
                          <th className="p-3 text-center" style={{color: '#94a3b8'}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map(expense => (
                          <tr key={expense.id} style={{borderBottom: '1px solid #2d1f3d'}}>
                            <td className="p-3" style={{color: '#f8fafc'}}>
                              {expense.category}
                              {expense.subcategory && (
                                <span className="text-xs ml-2" style={{color: '#64748b'}}>({expense.subcategory})</span>
                              )}
                            </td>
                            <td className="p-3" style={{color: '#cbd5e1'}}>{expense.description}</td>
                            <td className="p-3 text-right font-semibold" style={{color: '#ef4444'}}>
                              {formatCurrency(expense.amount)}
                            </td>
                            <td className="p-3 text-center">
                              <span 
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                  background: expense.is_essential ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                  color: expense.is_essential ? '#ef4444' : '#f59e0b'
                                }}
                              >
                                {expense.is_essential ? 'Essential' : 'Discretionary'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center gap-2">
                                <Button 
                                  onClick={() => openExpenseDialog(expense)}
                                  variant="outline"
                                  size="sm"
                                  style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  variant="outline"
                                  size="sm"
                                  style={{borderColor: '#ef4444', color: '#ef4444'}}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 mx-auto mb-4" style={{color: '#2d1f3d'}} />
                    <p style={{color: '#64748b'}}>No expenses recorded for {formatMonth(selectedMonth)}</p>
                    <Button 
                      onClick={() => openExpenseDialog()}
                      className="mt-4"
                      style={{background: '#ef4444', color: 'white'}}
                    >
                      Add Your First Expense
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Income Dialog */}
        <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
          <DialogContent style={{background: '#1a1229', borderColor: '#2d1f3d', maxWidth: '600px'}}>
            <DialogHeader>
              <DialogTitle style={{color: '#f8fafc'}}>
                {editingIncome ? 'Edit Income' : 'Add Income'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={editingIncome ? handleUpdateIncome : handleCreateIncome} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{color: '#94a3b8'}}>Source</Label>
                  <Select value={incomeForm.source} onValueChange={(value) => setIncomeForm({...incomeForm, source: value})}>
                    <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                      {categories.income_sources.map(source => (
                        <SelectItem key={source} value={source} style={{color: '#f8fafc'}}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{color: '#94a3b8'}}>Currency</Label>
                  <Select value={incomeForm.currency} onValueChange={(value) => setIncomeForm({...incomeForm, currency: value})}>
                    <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d', maxHeight: '300px'}}>
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr.code} value={curr.code} style={{color: '#f8fafc'}}>
                          {curr.code} - {curr.name} ({curr.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Description</Label>
                <Input
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({...incomeForm, description: e.target.value})}
                  placeholder="e.g., Monthly salary from Company XYZ"
                  required
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{color: '#94a3b8'}}>Amount Before Tax</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={incomeForm.amount_before_tax}
                    onChange={(e) => setIncomeForm({...incomeForm, amount_before_tax: e.target.value})}
                    required
                    style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                  />
                </div>
                <div>
                  <Label style={{color: '#94a3b8'}}>Tax Deducted</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={incomeForm.tax_deducted}
                    onChange={(e) => setIncomeForm({...incomeForm, tax_deducted: e.target.value})}
                    style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                  />
                </div>
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Payment Date (Optional)</Label>
                <Input
                  type="date"
                  value={incomeForm.payment_date}
                  onChange={(e) => setIncomeForm({...incomeForm, payment_date: e.target.value})}
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Notes (Optional)</Label>
                <Input
                  value={incomeForm.notes}
                  onChange={(e) => setIncomeForm({...incomeForm, notes: e.target.value})}
                  placeholder="Additional notes"
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" style={{background: '#10b981', color: 'white'}}>
                  {editingIncome ? 'Update Income' : 'Add Income'}
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    setIncomeDialogOpen(false);
                    setEditingIncome(null);
                    resetIncomeForm();
                  }}
                  variant="outline"
                  style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Expense Dialog */}
        <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
          <DialogContent style={{background: '#1a1229', borderColor: '#2d1f3d', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'}}>
            <DialogHeader>
              <DialogTitle style={{color: '#f8fafc'}}>
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{color: '#94a3b8'}}>Category</Label>
                  <Select value={expenseForm.category} onValueChange={(value) => setExpenseForm({...expenseForm, category: value, subcategory: ''})}>
                    <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                      {Object.keys(categories.expense_categories).map(category => (
                        <SelectItem key={category} value={category} style={{color: '#f8fafc'}}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{color: '#94a3b8'}}>Subcategory</Label>
                  <Select value={expenseForm.subcategory} onValueChange={(value) => setExpenseForm({...expenseForm, subcategory: value})}>
                    <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                      {(categories.expense_categories[expenseForm.category] || []).map(sub => (
                        <SelectItem key={sub} value={sub} style={{color: '#f8fafc'}}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Description</Label>
                <Input
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  placeholder="e.g., Dinner at restaurant"
                  required
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{color: '#94a3b8'}}>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    required
                    style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                  />
                </div>
                <div>
                  <Label style={{color: '#94a3b8'}}>Currency</Label>
                  <Select value={expenseForm.currency} onValueChange={(value) => setExpenseForm({...expenseForm, currency: value})}>
                    <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d', maxHeight: '300px'}}>
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr.code} value={curr.code} style={{color: '#f8fafc'}}>
                          {curr.code} - {curr.name} ({curr.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label style={{color: '#94a3b8'}}>Payment Method</Label>
                  <Select value={expenseForm.payment_method} onValueChange={(value) => setExpenseForm({...expenseForm, payment_method: value})}>
                    <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                      {categories.payment_methods.map(method => (
                        <SelectItem key={method} value={method} style={{color: '#f8fafc'}}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{color: '#94a3b8'}}>Payment Date</Label>
                  <Input
                    type="date"
                    value={expenseForm.payment_date}
                    onChange={(e) => setExpenseForm({...expenseForm, payment_date: e.target.value})}
                    style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={expenseForm.is_recurring}
                    onChange={(e) => setExpenseForm({...expenseForm, is_recurring: e.target.checked})}
                    style={{accentColor: '#a855f7'}}
                  />
                  <Label htmlFor="is_recurring" style={{color: '#94a3b8'}}>Recurring Expense</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_essential"
                    checked={expenseForm.is_essential}
                    onChange={(e) => setExpenseForm({...expenseForm, is_essential: e.target.checked})}
                    style={{accentColor: '#a855f7'}}
                  />
                  <Label htmlFor="is_essential" style={{color: '#94a3b8'}}>Essential Expense</Label>
                </div>
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Notes (Optional)</Label>
                <Input
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                  placeholder="Additional notes"
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" style={{background: '#ef4444', color: 'white'}}>
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    setExpenseDialogOpen(false);
                    setEditingExpense(null);
                    resetExpenseForm();
                  }}
                  variant="outline"
                  style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
