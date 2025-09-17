import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

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

export const useExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExpenses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
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

    // Calculate discount if early payment
    const { discount } = calculateFinancingDiscount(
      totalAmount,
      monthsTotal,
      monthsPaid,
      expense.early_payment_discount_rate || 0
    );

    const newPaidAmount = paidAmount + paymentAmount;
    const newDiscountAmount = discountAmount + discount;

    await updateExpense(expenseId, {
      financing_paid_amount: newPaidAmount,
      financing_discount_amount: newDiscountAmount,
      is_paid: newPaidAmount >= (totalAmount - newDiscountAmount),
      paid_at: newPaidAmount >= (totalAmount - newDiscountAmount) ? new Date().toISOString() : undefined,
    });
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    makeEarlyPayment,
    calculateFinancingDiscount,
    refetchExpenses: fetchExpenses,
  };
};