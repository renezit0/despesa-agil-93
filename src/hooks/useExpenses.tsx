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
    if (!user) return;

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

  // Generate ALL instances for a specific financing expense
  const generateAllFinancingInstances = async (expense: Expense): Promise<ExpenseInstance[]> => {
    if (!expense.is_financing || !expense.financing_months_total || !expense.financing_total_amount) {
      return [];
    }

    try {
      // Fetch ALL existing instances for this financing
      const { data: existingInstances, error } = await supabase
        .from('expense_instances')
        .select('*')
        .eq('expense_id', expense.id)
        .eq('instance_type', 'financing')
        .order('installment_number');

      if (error) throw error;

      const instances: ExpenseInstance[] = [];
      const instanceMap = new Map();
      
      // Map existing instances by installment number
      (existingInstances || []).forEach(instance => {
        instanceMap.set(instance.installment_number, instance);
      });

      const financingStart = new Date(expense.due_date);
      const installmentAmount = expense.financing_total_amount / expense.financing_months_total;

      // Generate all installments (1 to total months)
      for (let i = 1; i <= expense.financing_months_total; i++) {
        const installmentDate = new Date(financingStart);
        installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
        const instanceDateStr = format(installmentDate, 'yyyy-MM-dd');
        
        const existingInstance = instanceMap.get(i);
        
        instances.push({
          id: existingInstance?.id || `financing-${expense.id}-${i}`,
          expense_id: expense.id,
          title: `${expense.title} - Parcela ${i}/${expense.financing_months_total}`,
          description: expense.description,
          amount: installmentAmount,
          category_id: expense.category_id,
          due_date: instanceDateStr,
          is_paid: existingInstance?.is_paid || false,
          instance_type: 'financing',
          installment_number: i,
          instance_date: instanceDateStr,
          original_expense: expense,
        });
      }

      return instances;
    } catch (error) {
      console.error('Error generating all financing instances:', error);
      return [];
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

        // If it's a financing instance, update the original expense's paid months count
        if (instance.instance_type === 'financing') {
          await updateFinancingPaidMonths(instance.expense_id);
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

      // Note: Removed automatic refresh to prevent duplicate calls

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

  const updateFinancingPaidMonths = async (expenseId: string) => {
    try {
      // Count paid financing instances for this expense
      const { data: paidInstances, error } = await supabase
        .from('expense_instances')
        .select('id')
        .eq('expense_id', expenseId)
        .eq('instance_type', 'financing')
        .eq('is_paid', true);

      if (error) throw error;

      const paidMonthsCount = paidInstances?.length || 0;

      // Update the expense with the new paid months count
      await updateExpense(expenseId, {
        financing_months_paid: paidMonthsCount
      });

    } catch (error) {
      console.error('Error updating financing paid months:', error);
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

      console.log('Local state updated with data from DB:', {
        id,
        updatedData: data,
        financing_discount_amount: data.financing_discount_amount
      });

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

  const makeEarlyPayment = async (expenseId: string, paymentAmount: number, customDiscount: number = 0) => {
    console.log('🔥 makeEarlyPayment INICIADA AGORA!', {
      expenseId,
      paymentAmount,
      customDiscount,
      userExists: !!user
    });
    
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense || !expense.is_financing) return;

    const totalAmount = expense.financing_total_amount || 0;
    const paidAmount = expense.financing_paid_amount || 0;
    const discountAmount = expense.financing_discount_amount || 0;
    const discountRate = expense.early_payment_discount_rate || 0;

    // Calculate remaining amount after current payments and discounts
    const remainingAmount = totalAmount - paidAmount - discountAmount;
    
    // LÓGICA CORRIGIDA: Qualquer valor menor que o devido É desconto
    let newDiscountAmount = discountAmount + customDiscount;
    
    console.log('🎯 CÁLCULO DO DESCONTO:', {
      'descontoAnterior': discountAmount,
      'descontoPersonalizado': customDiscount,
      'novoDescontoTotal': newDiscountAmount
    });
    
    // Se tem taxa de desconto E está pagando o valor total, aplica a taxa também
    if (discountRate > 0 && paymentAmount >= remainingAmount) {
      const automaticDiscount = remainingAmount * (discountRate / 100);
      newDiscountAmount = discountAmount + automaticDiscount + customDiscount;
    }

    const newPaidAmount = paidAmount + paymentAmount;
    const totalAfterDiscount = totalAmount - newDiscountAmount;
    const isFullyPaid = newPaidAmount >= totalAfterDiscount;

    console.log('=== UPDATING EXPENSE ===');
    console.log('🔥 PAYLOAD FINAL:', {
      financing_paid_amount: newPaidAmount,
      financing_discount_amount: newDiscountAmount,
      is_paid: isFullyPaid,
      paid_at: isFullyPaid ? new Date().toISOString() : undefined,
    });

    // 1. PRIMEIRO: Registrar a transação de pagamento
    console.log('💾 INSERINDO TRANSAÇÃO NO DB:', {
      expense_id: expenseId,
      user_id: user?.id,
      payment_amount: paymentAmount,
      discount_amount: customDiscount,
      payment_type: customDiscount > 0 ? 'partial_payment' : 'early_payment',
      user_available: !!user
    });

    const { data: transactionData, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        expense_id: expenseId,
        user_id: user.id,
        payment_amount: paymentAmount,
        discount_amount: customDiscount,
        payment_type: customDiscount > 0 ? 'partial_payment' : 'early_payment',
        notes: customDiscount > 0 ? `Pagamento com desconto de R$ ${customDiscount.toFixed(2)}` : 'Pagamento antecipado'
      })
      .select();

    console.log('💾 RESULTADO DA INSERÇÃO:', {
      data: transactionData,
      error: transactionError
    });

    if (transactionError) {
      console.error('❌ ERRO AO REGISTRAR TRANSAÇÃO:', transactionError);
      throw transactionError;
    }

    // 2. SEGUNDO: Atualizar o expense
    await updateExpense(expenseId, {
      financing_paid_amount: newPaidAmount,
      financing_discount_amount: newDiscountAmount,
      is_paid: isFullyPaid,
      paid_at: isFullyPaid ? new Date().toISOString() : undefined,
    });

    // 3. TERCEIRO: Marcar instâncias como pagas baseado no valor pago
    await markInstancesAsPaidByPayment(expenseId, paymentAmount, newPaidAmount);
    
    console.log('✅ TRANSACTION + UPDATE + INSTANCES COMPLETED');
  };

  // Função para marcar instâncias como pagas baseado no pagamento
  const markInstancesAsPaidByPayment = async (expenseId: string, paymentAmount: number, totalPaidAmount: number) => {
    try {
      const expense = expenses.find(e => e.id === expenseId);
      if (!expense || !expense.is_financing) return;

      const monthlyAmount = (expense.financing_total_amount || 0) / (expense.financing_months_total || 1);
      const monthsToPay = Math.floor(totalPaidAmount / monthlyAmount);

      // Buscar instâncias do financiamento
      const { data: instances, error } = await supabase
        .from('expense_instances')
        .select('*')
        .eq('expense_id', expenseId)
        .eq('instance_type', 'financing')
        .order('installment_number');

      if (error) throw error;

      // Marcar as primeiras N instâncias como pagas
      const instancesToUpdate = instances?.slice(0, monthsToPay) || [];
      
      for (const instance of instancesToUpdate) {
        if (!instance.is_paid) {
          await supabase
            .from('expense_instances')
            .update({ 
              is_paid: true,
              paid_at: new Date().toISOString()
            })
            .eq('id', instance.id);
        }
      }

      // Atualizar estado local
      setExpenseInstances(prev => 
        prev.map(inst => {
          if (inst.expense_id === expenseId && inst.instance_type === 'financing') {
            const shouldBePaid = instancesToUpdate.some(i => i.id === inst.id);
            return shouldBePaid ? { ...inst, is_paid: true } : inst;
          }
          return inst;
        })
      );

    } catch (error) {
      console.error('Error marking instances as paid:', error);
    }
  };
  // Função para resetar todos os pagamentos de um expense
  const resetAllPayments = async (expenseId: string) => {
    try {
      // 1. Remover todas as transações de pagamento
      const { error: deleteTransactionsError } = await supabase
        .from('payment_transactions')
        .delete()
        .eq('expense_id', expenseId);

      if (deleteTransactionsError) throw deleteTransactionsError;

      // 2. Resetar campos do expense
      const { error: updateExpenseError } = await supabase
        .from('expenses')
        .update({
          financing_paid_amount: 0,
          financing_discount_amount: 0,
          financing_months_paid: 0,
          is_paid: false,
          paid_at: null
        })
        .eq('id', expenseId);

      if (updateExpenseError) throw updateExpenseError;

      // 3. Resetar todas as instances para não pagas
      const { error: updateInstancesError } = await supabase
        .from('expense_instances')
        .update({
          is_paid: false,
          paid_at: null
        })
        .eq('expense_id', expenseId);

      if (updateInstancesError) throw updateInstancesError;

      // 4. Atualizar estado local
      await fetchExpenses();

      toast({
        title: "Pagamentos resetados!",
        description: "Todos os pagamentos foram removidos com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao resetar pagamentos:', error);
      toast({
        title: "Erro ao resetar",
        description: "Não foi possível resetar os pagamentos.",
        variant: "destructive",
      });
    }
  };

  // Buscar histórico de transações de pagamento
  const getPaymentTransactions = async (expenseId: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('expense_id', expenseId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      return [];
    }
  };

  // Calcular total pago incluindo transações individuais
  const calculateTotalPaidWithTransactions = async (expense: Expense) => {
    if (!expense.is_financing) return expense.financing_paid_amount || 0;

    const transactions = await getPaymentTransactions(expense.id);
    const totalFromTransactions = transactions.reduce((sum, t) => sum + t.payment_amount + t.discount_amount, 0);
    
    // Total de parcelas pagas individualmente
    const paidInstances = expenseInstances.filter(
      inst => inst.expense_id === expense.id && inst.instance_type === 'financing' && inst.is_paid
    );
    const paidFromInstances = paidInstances.reduce((sum, inst) => sum + inst.amount, 0);

    return totalFromTransactions + paidFromInstances;
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
    generateAllFinancingInstances,
    toggleInstancePaid,
    updateFinancingPaidMonths,
    getPaymentTransactions,
    calculateTotalPaidWithTransactions,
    resetAllPayments,
    markInstancesAsPaidByPayment,
  };
};