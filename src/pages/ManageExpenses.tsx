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
import { ArrowLeft, Edit, Trash2, Plus, DollarSign, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Expense } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/use-toast";

const ManageExpenses = () => {
  const navigate = useNavigate();
  const { expenses, expenseInstances, updateExpense, deleteExpense, addExpense, resetAllPayments, updateFinancingPaidMonths } = useExpenses();
  const { toast } = useToast();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [totalsPaid, setTotalsPaid] = useState<Record<string, number>>({});

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

  // Calculate total paid amount - USAR APENAS financing_paid_amount
  const calculateTotalPaidAmount = (expense: Expense) => {
    // SIMPLIFIQUEI: usar apenas financing_paid_amount para evitar duplicação
    return expense.financing_paid_amount || 0;
  };

  // Update totals when expenses change
  useEffect(() => {
    // Sincronizar parcelas pagas para todos os expenses de financiamento
    expenses.forEach(expense => {
      if (expense.is_financing) {
        updateFinancingPaidMonths(expense.id);
      }
    });
  }, [expenses, updateFinancingPaidMonths]);

  useEffect(() => {
    const newTotals: Record<string, number> = {};
    expenses.forEach(expense => {
      if (expense.is_financing) {
        newTotals[expense.id] = calculateTotalPaidAmount(expense);
      }
    });
    setTotalsPaid(newTotals);
  }, [expenses, expenseInstances]);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || "",
      amount: expense.amount.toString(),
      due_date: expense.due_date,
      is_recurring: expense.is_recurring,
      recurring_start_date: expense.recurring_start_date || "",
      is_financing: expense.is_financing || false,
      financing_total_amount: expense.financing_total_amount?.toString() || "",
      financing_months_total: expense.financing_months_total?.toString() || "",
      early_payment_discount_rate: expense.early_payment_discount_rate?.toString() || "",
      notes: expense.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este gasto?")) {
      await deleteExpense(id);
      toast({
        title: "Gasto excluído",
        description: "O gasto foi removido com sucesso.",
      });
    }
  };

  const handleResetPayments = async (expenseId: string) => {
    if (confirm("Tem certeza que deseja resetar todos os pagamentos deste financiamento?")) {
      await resetAllPayments(expenseId);
    }
  };

  const calculateRemainingAmount = (expense: Expense) => {
    if (!expense.is_financing || !expense.financing_total_amount) return 0;
    
    const totalPaid = calculateTotalPaidAmount(expense);
    const discount = expense.financing_discount_amount || 0;
    
    return Math.max(0, expense.financing_total_amount - totalPaid - discount);
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8 animate-fade-in">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar Gastos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visualize e edite todos os seus gastos
            </p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? "Editar Gasto" : "Novo Gasto"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-sm font-medium">Data de Vencimento *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              {/* Financing Options - Mobile Responsive */}
              <div className="space-y-4 border rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_financing"
                    checked={formData.is_financing}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_financing: checked })}
                  />
                  <Label htmlFor="is_financing" className="text-sm font-medium">É um financiamento?</Label>
                </div>
                
                {formData.is_financing && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="financing_total_amount" className="text-sm font-medium">Valor Total do Financiamento</Label>
                      <Input
                        id="financing_total_amount"
                        type="number"
                        step="0.01"
                        value={formData.financing_total_amount}
                        onChange={(e) => setFormData({ ...formData, financing_total_amount: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="financing_months_total" className="text-sm font-medium">Total de Parcelas</Label>
                      <Input
                        id="financing_months_total"
                        type="number"
                        value={formData.financing_months_total}
                        onChange={(e) => setFormData({ ...formData, financing_months_total: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="early_payment_discount_rate" className="text-sm font-medium">Taxa de Desconto (%)</Label>
                      <Input
                        id="early_payment_discount_rate"
                        type="number"
                        step="0.01"
                        value={formData.early_payment_discount_rate}
                        onChange={(e) => setFormData({ ...formData, early_payment_discount_rate: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" className="w-full sm:w-auto">
                  {editingExpense ? "Atualizar" : "Criar"} Gasto
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expenses List - Mobile Responsive */}
      <div className="grid gap-4 sm:gap-6">
        {expenses.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <div className="text-muted-foreground">
              <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Nenhum gasto encontrado</h3>
              <p className="text-sm sm:text-base">Comece criando seu primeiro gasto clicando no botão acima.</p>
            </div>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200 animate-scale-in">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg sm:text-xl font-semibold">{expense.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      <Badge variant={expense.is_paid ? "default" : "secondary"}>
                        {expense.is_paid ? "Pago" : "Pendente"}
                      </Badge>
                      {expense.is_financing && (
                        <Badge variant="outline">Financiamento</Badge>
                      )}
                      {expense.is_recurring && (
                        <Badge variant="outline">Recorrente</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm sm:text-base text-muted-foreground space-y-1">
                    <p><strong>Valor:</strong> R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Vencimento:</strong> {format(new Date(expense.due_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                    {expense.description && (
                      <p><strong>Descrição:</strong> {expense.description}</p>
                    )}
                    {expense.is_financing && expense.financing_total_amount && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-xs sm:text-sm space-y-1 mt-2">
                        <p><strong>Valor Total:</strong> R$ {expense.financing_total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p><strong>Parcelas:</strong> {expense.financing_months_paid || 0}/{expense.financing_months_total || 0}</p>
                        <p><strong>Pago:</strong> R$ {(totalsPaid[expense.id] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        {expense.financing_discount_amount > 0 && (
                          <p><strong>Desconto Aplicado:</strong> R$ {expense.financing_discount_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        )}
                        <p><strong>Valor Restante:</strong> R$ {calculateRemainingAmount(expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 lg:ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(expense)}
                    className="flex items-center space-x-1 flex-1 lg:flex-none"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Editar</span>
                  </Button>
                  
                  {expense.is_financing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPayments(expense.id)}
                      className="flex items-center space-x-1"
                    >
                      <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm hidden sm:inline">Reset</span>
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                    className="flex items-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm hidden sm:inline">Excluir</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageExpenses;