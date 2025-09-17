import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExpenses } from "@/hooks/useExpenses";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Trash2, Plus, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Expense } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/use-toast";

const ManageExpenses = () => {
  const navigate = useNavigate();
  const { expenses, updateExpense, deleteExpense, addExpense } = useExpenses();
  const { toast } = useToast();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    due_date: "",
    is_recurring: false,
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
      is_financing: false,
      financing_total_amount: "",
      financing_months_total: "",
      early_payment_discount_rate: "",
      notes: "",
    });
    setEditingExpense(null);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || "",
      amount: expense.amount.toString(),
      due_date: expense.due_date,
      is_recurring: expense.is_recurring,
      is_financing: expense.is_financing,
      financing_total_amount: expense.financing_total_amount?.toString() || "",
      financing_months_total: expense.financing_months_total?.toString() || "",
      early_payment_discount_rate: expense.early_payment_discount_rate?.toString() || "",
      notes: expense.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const expenseData = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        is_recurring: formData.is_recurring,
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

  const handleDelete = async (expense: Expense) => {
    if (confirm(`Tem certeza que deseja excluir "${expense.title}"?`)) {
      await deleteExpense(expense.id);
      toast({
        title: "Gasto removido",
        description: "O gasto foi excluído com sucesso.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
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
                <p className="text-sm text-muted-foreground">
                  Edite, crie e organize seus gastos
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Novo Gasto</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingExpense ? "Editar Gasto" : "Novo Gasto"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Nome do gasto"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Valor *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição opcional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="due_date">Data de Vencimento *</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="recurring"
                        checked={formData.is_recurring}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                      />
                      <Label htmlFor="recurring">Gasto recorrente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="financing"
                        checked={formData.is_financing}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_financing: checked })}
                      />
                      <Label htmlFor="financing">Financiamento</Label>
                    </div>
                  </div>

                  {formData.is_financing && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <Label htmlFor="financing_total">Valor Total do Financiamento</Label>
                        <Input
                          id="financing_total"
                          type="number"
                          step="0.01"
                          value={formData.financing_total_amount}
                          onChange={(e) => setFormData({ ...formData, financing_total_amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="financing_months">Parcelas (meses)</Label>
                        <Input
                          id="financing_months"
                          type="number"
                          value={formData.financing_months_total}
                          onChange={(e) => setFormData({ ...formData, financing_months_total: e.target.value })}
                          placeholder="12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="discount_rate">Desconto Antecipação (%)</Label>
                        <Input
                          id="discount_rate"
                          type="number"
                          step="0.1"
                          value={formData.early_payment_discount_rate}
                          onChange={(e) => setFormData({ ...formData, early_payment_discount_rate: e.target.value })}
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                      {editingExpense ? "Salvar Alterações" : "Criar Gasto"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {expenses.map((expense) => (
            <Card key={expense.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold">{expense.title}</h3>
                    <div className="flex space-x-2">
                      {expense.is_recurring && (
                        <Badge variant="secondary">Recorrente</Badge>
                      )}
                      {expense.is_financing && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Financiamento
                        </Badge>
                      )}
                      {expense.is_paid && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Pago</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Valor:</strong> R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Vencimento:</strong> {format(new Date(expense.due_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                    {expense.description && (
                      <p><strong>Descrição:</strong> {expense.description}</p>
                    )}
                    {expense.is_financing && expense.financing_total_amount && (
                      <div className="bg-blue-50 p-2 rounded text-xs space-y-1">
                        <p><strong>Valor Total:</strong> R$ {expense.financing_total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p><strong>Parcelas:</strong> {expense.financing_months_paid || 0}/{expense.financing_months_total || 0}</p>
                        <p><strong>Pago:</strong> R$ {expense.financing_paid_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    )}
                    {expense.notes && (
                      <p><strong>Obs:</strong> {expense.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(expense)}
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
            </Card>
          ))}
          
          {expenses.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">Nenhum gasto encontrado</p>
              <Button onClick={() => setIsDialogOpen(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Criar Primeiro Gasto</span>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageExpenses;