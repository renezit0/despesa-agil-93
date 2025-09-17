import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";
import { startOfMonth, format, addMonths, isBefore, isAfter } from "date-fns";

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  amount: number;
  category_id?: string;
  due_date: string;
  is_paid: boolean;
  is_recurring: boolean;
  installments?: number;
  current_installment?: number;
  recurring_type?: string;
  tags?: string[];
  notes?: string;
  original_amount?: number;
  paid_at?: string;
  recurring_start_date?: string;
  // Financing fields
  is_financing: boolean;
  financing_total_amount?: number;
  financing_paid_amount: number;
  financing_discount_amount: number;
  financing_months_total?: number;
  financing_months_paid: number;
  early_payment_discount_rate: number;
  // Approval fields
  needs_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  shared_with_user_id?: string;
  payment_proof_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInstance {
  id: string;
  expense_id: string;
  title: string;
  description?: string;
  amount: number;
  category_id?: string;
  due_date: string;
  is_paid: boolean;
  instance_type: 'normal' | 'recurring' | 'financing';
  installment_number?: number;
  instance_date: string;
  // Original expense data
  original_expense: Expense;
}

export const useExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseInstances, setExpenseInstances] = useState<ExpenseInstance[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExpenses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch base expenses
      const { data: allExpenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setExpenses(allExpenses || []);
      
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Erro ao carregar gastos",
        description: "Não foi possível carregar seus gastos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateExpenseInstances = async (targetMonth: Date) => {
    if (!user || expenses.length === 0) return;

    try {
      // Fetch existing instances for the target month
      const startDate = startOfMonth(targetMonth);
      const endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
      
      const { data: existingInstances, error } = await supabase
        .from('expense_instances')
        .select('*')
        .eq('user_id', user.id)
        .gte('instance_date', format(startDate, 'yyyy-MM-dd'))
        .lte('instance_date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      const instances: ExpenseInstance[] = [];
      const instanceMap = new Map();
      
      // Map existing instances
      (existingInstances || []).forEach(instance => {
        const key = `${instance.expense_id}-${instance.instance_date}-${instance.instance_type}-${instance.installment_number || 0}`;
        instanceMap.set(key, instance);
      });

      for (const expense of expenses) {
        const expenseDate = new Date(expense.due_date);
        const targetMonthStart = startOfMonth(targetMonth);
        
        // Normal expenses (non-recurring, non-financing)
        if (!expense.is_recurring && !expense.is_financing) {
          if (expenseDate.getMonth() === targetMonth.getMonth() && 
              expenseDate.getFullYear() === targetMonth.getFullYear()) {
            instances.push({
              id: expense.id,
              expense_id: expense.id,
              title: expense.title,
              description: expense.description,
              amount: expense.amount,
              category_id: expense.category_id,
              due_date: expense.due_date,
              is_paid: expense.is_paid,
              instance_type: 'normal',
              instance_date: expense.due_date,
              original_expense: expense,
            });
          }
        }

        // Recurring expenses
        if (expense.is_recurring) {
          const recurringStart = expense.recurring_start_date ? 
            new Date(expense.recurring_start_date) : expenseDate;
          
          // Check if this month should have this recurring expense
          if (!isAfter(targetMonthStart, recurringStart) || 
              targetMonthStart.getTime() >= recurringStart.getTime()) {
            
            const monthlyDueDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), expenseDate.getDate());
            const instanceDateStr = format(monthlyDueDate, 'yyyy-MM-dd');
            const key = `${expense.id}-${instanceDateStr}-recurring-0`;
            
            const existingInstance = instanceMap.get(key);
            
            instances.push({
              id: existingInstance?.id || `recurring-${expense.id}-${format(targetMonth, 'yyyy-MM')}`,
              expense_id: expense.id,
              title: expense.title,
              description: expense.description,
              amount: expense.amount,
              category_id: expense.category_id,
              due_date: instanceDateStr,
              is_paid: existingInstance?.is_paid || false,
              instance_type: 'recurring',
              instance_date: instanceDateStr,
              original_expense: expense,
            });
          }
        }

        // Financing installments
        if (expense.is_financing && expense.financing_months_total && expense.financing_total_amount) {
          const financingStart = expenseDate;
          const monthsSinceStart = (targetMonth.getFullYear() - financingStart.getFullYear()) * 12 + 
                                   (targetMonth.getMonth() - financingStart.getMonth());
          
          // Check if financing is fully paid
          const totalAmount = expense.financing_total_amount;
          const paidAmount = expense.financing_paid_amount || 0;
          const discountAmount = expense.financing_discount_amount || 0;
          const isFullyPaid = paidAmount >= (totalAmount - discountAmount);
          
          // Only show installments if not fully paid and within the financing period
          if (!isFullyPaid && monthsSinceStart >= 0 && monthsSinceStart < expense.financing_months_total) {
            const installmentNumber = monthsSinceStart + 1;
            const installmentAmount = expense.financing_total_amount / expense.financing_months_total;
            const monthlyDueDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), financingStart.getDate());
            const instanceDateStr = format(monthlyDueDate, 'yyyy-MM-dd');
            const key = `${expense.id}-${instanceDateStr}-financing-${installmentNumber}`;
            
            const existingInstance = instanceMap.get(key);
            
            instances.push({
              id: existingInstance?.id || `financing-${expense.id}-${installmentNumber}`,
              expense_id: expense.id,
              title: `${expense.title} - Parcela ${installmentNumber}/${expense.financing_months_total}`,
              description: expense.description,
              amount: installmentAmount,
              category_id: expense.category_id,
              due_date: instanceDateStr,
              is_paid: existingInstance?.is_paid || false,
              instance_type: 'financing',
              installment_number: installmentNumber,
              instance_date: instanceDateStr,
              original_expense: expense,
            });
          }
        }
      }

      setExpenseInstances(instances);
    } catch (error) {
      console.error('Error generating expense instances:', error);
    }
  };

  const fetchExpensesForMonth = async (month: Date) => {
    await fetchExpenses();
    // This will be called after expenses are loaded via useEffect
  };

  const toggleInstancePaid = async (instance: ExpenseInstance) => {
    try {
      const newPaidStatus = !instance.is_paid;
      
      if (instance.instance_type === 'normal') {
        // Update the original expense directly
        await updateExpense(instance.expense_id, { is_paid: newPaidStatus });
      } else {
        // Create or update expense instance
        const instanceData = {
          expense_id: instance.expense_id,
          user_id: user!.id,
          instance_date: instance.instance_date,
          instance_type: instance.instance_type,
          installment_number: instance.installment_number || null,
          amount: instance.amount,
          is_paid: newPaidStatus,
          paid_at: newPaidStatus ? new Date().toISOString() : null,
        };

        if (instance.id.startsWith('recurring-') || instance.id.startsWith('financing-')) {
          // Create new instance
          const { error } = await supabase
            .from('expense_instances')
            .insert(instanceData);
          
          if (error) throw error;
        } else {
          // Update existing instance
          const { error } = await supabase
            .from('expense_instances')
            .update({ 
              is_paid: newPaidStatus,
              paid_at: newPaidStatus ? new Date().toISOString() : null 
            })
            .eq('id', instance.id);
          
          if (error) throw error;
        }
      }

      // Update local state immediately
      setExpenseInstances(prev => 
        prev.map(inst => 
          inst.id === instance.id 
            ? { ...inst, is_paid: newPaidStatus }
            : inst
        )
      );

      // Refresh instances to get updated data
      await generateExpenseInstances(new Date(instance.instance_date));

      toast({
        title: newPaidStatus ? "Marcado como pago" : "Marcado como não pago",
        description: `${instance.title} - R$ ${instance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      });

    } catch (error) {
      console.error('Error toggling instance payment:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status do pagamento.",
        variant: "destructive",
      });
    }
  };

  const addExpense = async (expenseData: Partial<Expense>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          title: expenseData.title || '',
          amount: expenseData.amount || 0,
          due_date: expenseData.due_date || new Date().toISOString().split('T')[0],
          is_paid: expenseData.is_paid || false,
          is_recurring: expenseData.is_recurring || false,
          is_financing: expenseData.is_financing || false,
          financing_paid_amount: expenseData.financing_paid_amount || 0,
          financing_discount_amount: expenseData.financing_discount_amount || 0,
          financing_months_paid: expenseData.financing_months_paid || 0,
          early_payment_discount_rate: expenseData.early_payment_discount_rate || 0,
          needs_approval: expenseData.needs_approval || false,
          ...expenseData,
        })
        .select()
        .single();

      if (error) throw error;

      setExpenses(prev => [...prev, data]);
      toast({
        title: "Gasto adicionado",
        description: "Gasto foi adicionado com sucesso.",
      });

      return data;
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Erro ao adicionar gasto",
        description: "Não foi possível adicionar o gasto.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setExpenses(prev => prev.map(expense => 
        expense.id === id ? data : expense
      ));

      toast({
        title: "Gasto atualizado",
        description: "Gasto foi atualizado com sucesso.",
      });

      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Erro ao atualizar gasto",
        description: "Não foi possível atualizar o gasto.",
        variant: "destructive",
      });
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses(prev => prev.filter(expense => expense.id !== id));
      toast({
        title: "Gasto removido",
        description: "Gasto foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Erro ao remover gasto",
        description: "Não foi possível remover o gasto.",
        variant: "destructive",
      });
    }
  };

  const calculateFinancingDiscount = (
    totalAmount: number,
    monthsTotal: number,
    monthsPaid: number,
    discountRate: number
  ) => {
    const remainingMonths = monthsTotal - monthsPaid;
    const monthlyAmount = totalAmount / monthsTotal;
    const remainingAmount = monthlyAmount * remainingMonths;
    const discount = remainingAmount * (discountRate / 100);
    
    return {
      remainingAmount,
      discount,
      finalAmount: remainingAmount - discount,
    };
  };

  const makeEarlyPayment = async (expenseId: string, paymentAmount: number) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense || !expense.is_financing) return;

    const totalAmount = expense.financing_total_amount || 0;
    const paidAmount = expense.financing_paid_amount || 0;
    const discountAmount = expense.financing_discount_amount || 0;
    const monthsTotal = expense.financing_months_total || 0;
    const monthsPaid = expense.financing_months_paid || 0;

    // Calculate remaining amount after current payments and discounts
    const remainingAmount = totalAmount - paidAmount - discountAmount;
    const discountRate = expense.early_payment_discount_rate || 0;
    
    // If this payment will complete the financing, apply full discount to remaining amount
    const isFullPayment = paymentAmount >= remainingAmount;
    let newDiscountAmount = discountAmount;
    
    if (isFullPayment && discountRate > 0) {
      // Apply discount to the remaining amount
      const discount = remainingAmount * (discountRate / 100);
      newDiscountAmount = discountAmount + discount;
    }

    const newPaidAmount = paidAmount + paymentAmount;
    const isFullyPaid = newPaidAmount >= (totalAmount - newDiscountAmount);

    await updateExpense(expenseId, {
      financing_paid_amount: newPaidAmount,
      financing_discount_amount: newDiscountAmount,
      is_paid: isFullyPaid,
      paid_at: isFullyPaid ? new Date().toISOString() : undefined,
    });
  };

  // Auto-generate instances when expenses change or month is selected
  useEffect(() => {
    if (expenses.length > 0) {
      generateExpenseInstances(new Date());
    }
  }, [expenses]);

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  return {
    expenses,
    expenseInstances,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    makeEarlyPayment,
    calculateFinancingDiscount,
    refetchExpenses: fetchExpenses,
    fetchExpensesForMonth,
    generateExpenseInstances,
    toggleInstancePaid,
  };
};