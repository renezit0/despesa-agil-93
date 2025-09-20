import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useExpenses } from "@/hooks/useExpenses";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Edit, Trash2, Plus, DollarSign, RotateCcw, ChevronDown, ChevronRight, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Expense } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/use-toast";

const ManageExpenses = () => {
  const navigate = useNavigate();
  const { 
    expenses, 
    expenseInstances, 
    allTimeInstances,
    updateExpense, 
    deleteExpense, 
    addExpense, 
    resetAllPayments, 
    updateFinancingPaidMonths,
    generateAllFinancingInstances,
    toggleInstancePaid
  } = useExpenses();
  const { toast } = useToast();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set());
  const [financingInstances, setFinancingInstances] = useState<Record<string, any[]>>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    due_date: "",
    is_recurring: false,
    recurring_start_date: "",
    is_financing: false,
    financing_total_amount: "",
    financing_months_total: "",
    early_payment_discount_rate: "",
    notes: "",
    installments: "",
    current_installment: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      amount: "",
      due_date: "",
      is_recurring: false,
      recurring_start_date: "",
      is_financing: false,
      financing_total_amount: "",
      financing_months_total: "",
      early_payment_discount_rate: "",
      notes: "",
      installments: "",
      current_installment: "",
    });
    setEditingExpense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const expenseData = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        is_recurring: formData.is_recurring,
        recurring_start_date: formData.is_recurring ? formData.recurring_start_date : null,
        is_financing: formData.is_financing,
        financing_total_amount: formData.is_financing ? parseFloat(formData.financing_total_amount) : null,
        financing_months_total: formData.is_financing ? parseInt(formData.financing_months_total) : null,
        early_payment_discount_rate: formData.is_financing ? parseFloat(formData.early_payment_discount_rate) : 0,
        notes: formData.notes,
        installments: formData.installments ? parseInt(formData.installments) : null,
        current_installment: formData.current_installment ? parseInt(formData.current_installment) : null,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
        toast({
          title: "Gasto atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        await addExpense(expenseData);
        toast({
          title: "Gasto criado",
          description: "Novo gasto foi adicionado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || "",
      amount: expense.amount.toString(),
      due_date: expense.due_date,
      is_recurring: expense.is_recurring,
      recurring_start_date: expense.recurring_start_date || "",
      is_financing: expense.is_financing,
      financing_total_amount: expense.financing_total_amount?.toString() || "",
      financing_months_total: expense.financing_months_total?.toString() || "",
      early_payment_discount_rate: expense.early_payment_discount_rate?.toString() || "",
      notes: expense.notes || "",
      installments: expense.installments?.toString() || "",
      current_installment: expense.current_installment?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (expense: Expense) => {
    if (window.confirm(`Tem certeza que deseja excluir "${expense.title}"?`)) {
      await deleteExpense(expense.id);
      toast({
        title: "Gasto excluído",
        description: "O gasto foi removido com sucesso.",
      });
    }
  };

  const toggleExpenseExpansion = async (expenseId: string) => {
    const newExpanded = new Set(expandedExpenses);
    if (newExpanded.has(expenseId)) {
      newExpanded.delete(expenseId);
      // Limpar instâncias de financiamento quando fechar
      setFinancingInstances(prev => {
        const updated = { ...prev };
        delete updated[expenseId];
        return updated;
      });
    } else {
      newExpanded.add(expenseId);
      
      // Se for financiamento, buscar todas as parcelas
      const expense = expenses.find(e => e.id === expenseId);
      if (expense?.is_financing) {
        try {
          console.log('🏦 Buscando todas as parcelas do financiamento:', expense.title);
          const allInstances = await generateAllFinancingInstances(expense);
          setFinancingInstances(prev => ({
            ...prev,
            [expenseId]: allInstances
          }));
          console.log('✅ Parcelas carregadas:', allInstances.length);
        } catch (error) {
          console.error('Erro ao carregar parcelas do financiamento:', error);
        }
      }
    }
    setExpandedExpenses(newExpanded);
  };

  // Get instances for a specific expense
  const getExpenseInstances = (expenseId: string) => {
    return allTimeInstances.filter(instance => instance.expense_id === expenseId);
  };

  // Get expense type badge and count info
  const getExpenseTypeBadge = (expense: Expense) => {
    if (expense.is_financing) {
      const totalMonths = expense.financing_months_total || 0;
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        Financiamento ({totalMonths} parcelas)
      </Badge>;
    }
    if (expense.is_recurring) {
      return <Badge variant="secondary">Recorrente</Badge>;
    }
    if (expense.installments && expense.installments > 1) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Parcelado ({expense.installments}x)
      </Badge>;
    }
    return <Badge variant="default">Normal</Badge>;
  };

  // Get expense status with correct logic for financing
  const getExpenseStatus = (expense: Expense) => {
    if (expense.is_financing) {
      // Para financiamentos, usar a lógica específica
      const totalAmount = expense.financing_total_amount || 0;
      const paidAmount = expense.financing_paid_amount || 0;
      const discountAmount = expense.financing_discount_amount || 0;
      const remainingAmount = totalAmount - paidAmount - discountAmount;
      
      if (remainingAmount <= 0) {
        return 'Pago';
      }
      
      const paidMonths = expense.financing_months_paid || 0;
      const totalMonths = expense.financing_months_total || 0;
      
      if (paidMonths === 0) return 'Pendente';
      return `${paidMonths}/${totalMonths} Pagas`;
    }
    
    // Para gastos normais, usar a lógica de instâncias
    const instances = getExpenseInstances(expense.id);
    if (instances.length === 0) {
      return expense.is_paid ? 'Pago' : 'Pendente';
    }
    
    const paidInstances = instances.filter(i => i.is_paid).length;
    const totalInstances = instances.length;
    
    if (paidInstances === 0) return 'Pendente';
    if (paidInstances === totalInstances) return 'Pago';
    return `${paidInstances}/${totalInstances} Pagas`;
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'Pago') return 'outline';
    if (status === 'Pendente') return 'destructive';
    return 'secondary';
  };

  // Handle instance toggle with better error handling
  const handleToggleInstance = async (instance) => {
    try {
      console.log('🔄 ManageExpenses: Toggling instance:', {
        id: instance.id,
        title: instance.title,
        currentStatus: instance.is_paid
      });
      
      await toggleInstancePaid(instance);
      console.log('✅ ManageExpenses: Toggle completed successfully');
    } catch (error) {
      console.error('❌ ManageExpenses: Error in toggle:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Gastos</h1>
              <p className="text-muted-foreground">
                {expenses.length} {expenses.length === 1 ? 'gasto cadastrado' : 'gastos cadastrados'}
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingExpense ? 'Editar Gasto' : 'Novo Gasto'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Vencimento *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                    />
                    <Label htmlFor="is_recurring">Gasto recorrente</Label>
                  </div>

                  {formData.is_recurring && (
                    <div className="space-y-2">
                      <Label htmlFor="recurring_start_date">Data de início da recorrência</Label>
                      <Input
                        id="recurring_start_date"
                        type="date"
                        value={formData.recurring_start_date}
                        onChange={(e) => setFormData({ ...formData, recurring_start_date: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_financing"
                      checked={formData.is_financing}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_financing: checked })}
                    />
                    <Label htmlFor="is_financing">É financiamento</Label>
                  </div>

                  {formData.is_financing && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="financing_total_amount">Valor total</Label>
                        <Input
                          id="financing_total_amount"
                          type="number"
                          step="0.01"
                          value={formData.financing_total_amount}
                          onChange={(e) => setFormData({ ...formData, financing_total_amount: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="financing_months_total">Total de meses</Label>
                        <Input
                          id="financing_months_total"
                          type="number"
                          value={formData.financing_months_total}
                          onChange={(e) => setFormData({ ...formData, financing_months_total: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="early_payment_discount_rate">Taxa desconto (%)</Label>
                        <Input
                          id="early_payment_discount_rate"
                          type="number"
                          step="0.1"
                          value={formData.early_payment_discount_rate}
                          onChange={(e) => setFormData({ ...formData, early_payment_discount_rate: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {!formData.is_financing && (
                    <div className="space-y-2">
                      <Label htmlFor="installments">Número de parcelas (opcional)</Label>
                      <Input
                        id="installments"
                        type="number"
                        min="1"
                        value={formData.installments}
                        onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                        placeholder="1 para pagamento único"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    {editingExpense ? 'Atualizar' : 'Criar'} Gasto
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <Card className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum gasto cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro gasto.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Gasto
              </Button>
            </Card>
          ) : (
            expenses.map((expense) => {
              const instances = getExpenseInstances(expense.id);
              const status = getExpenseStatus(expense);
              const isExpanded = expandedExpenses.has(expense.id);
              const hasInstances = instances.length > 0;

              // Create unique key to force re-render when needed
              const expenseKey = `${expense.id}-${status}-${instances.length}`;

              return (
                <Card key={expenseKey} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {hasInstances && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpenseExpansion(expense.id)}
                            className="p-1"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-lg">{expense.title}</h3>
                            {getExpenseTypeBadge(expense)}
                            <Badge 
                              variant={getStatusBadgeVariant(status)}
                              className={status === 'Pago' ? 'text-green-600 border-green-600' : ''}
                            >
                              {status}
                            </Badge>
                          </div>
                          
                          {expense.description && (
                            <p className="text-muted-foreground text-sm mb-2">{expense.description}</p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Vencimento: {format(new Date(expense.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                            {expense.is_financing && expense.financing_months_total && (
                              <span>• {expense.financing_months_total} parcelas (Financiamento)</span>
                            )}
                            {!expense.is_financing && hasInstances && (
                              <span>• {instances.length} {instances.length === 1 ? 'parcela' : 'parcelas'}</span>
                            )}
                            {expense.is_recurring && (
                              <span>• Recorrente</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {expense.is_financing && expense.financing_total_amount && (
                            <p className="text-sm text-muted-foreground">
                              Total: R$ {expense.financing_total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(expense)}
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded instances view */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-3">
                          {expense.is_financing ? 'Parcelas do Financiamento:' : 'Parcelas:'}
                        </h4>
                        <div className="space-y-2">
                          {expense.is_financing ? (
                            // Para financiamentos, usar as instâncias carregadas
                            financingInstances[expense.id] ? (
                              financingInstances[expense.id].map((instance) => {
                                const instanceKey = `${instance.id}-${instance.is_paid}-${instance.amount}`;
                                
                                return (
                                  <div
                                    key={instanceKey}
                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        checked={instance.is_paid}
                                        onChange={() => handleToggleInstance(instance)}
                                        className="rounded"
                                      />
                                      <div>
                                        <p className={`font-medium text-sm ${instance.is_paid ? 'line-through text-gray-500' : ''}`}>
                                          {instance.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Vencimento: {format(new Date(instance.due_date), "dd/MM/yyyy", { locale: ptBR })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`font-medium ${instance.is_paid ? 'text-green-600' : ''}`}>
                                        R$ {instance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                      {instance.is_paid && (
                                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                          Pago
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                <p className="text-sm text-muted-foreground">Carregando parcelas...</p>
                              </div>
                            )
                          ) : (
                            // Para gastos normais, usar as instâncias existentes
                            hasInstances ? instances.map((instance) => {
                              const instanceKey = `${instance.id}-${instance.is_paid}-${instance.amount}`;
                              
                              return (
                                <div
                                  key={instanceKey}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                >
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="checkbox"
                                      checked={instance.is_paid}
                                      onChange={() => handleToggleInstance(instance)}
                                      className="rounded"
                                    />
                                    <div>
                                      <p className={`font-medium text-sm ${instance.is_paid ? 'line-through text-gray-500' : ''}`}>
                                        {instance.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Vencimento: {format(new Date(instance.due_date), "dd/MM/yyyy", { locale: ptBR })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`font-medium ${instance.is_paid ? 'text-green-600' : ''}`}>
                                      R$ {instance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    {instance.is_paid && (
                                      <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                        Pago
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            }) : (
                              <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground">Nenhuma parcela encontrada</p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageExpenses;