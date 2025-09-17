import { useState } from "react";
import { useContacts } from "@/hooks/useContacts";
import { useExpenses } from "@/hooks/useExpenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Car, Home, CreditCard, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const FinancingExpenseForm = () => {
  const { contacts } = useContacts();
  const { addExpense } = useExpenses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    due_date: "",
    is_financing: false,
    financing_total_amount: "",
    financing_months_total: "",
    early_payment_discount_rate: "",
    needs_approval: false,
    shared_with_user_id: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      amount: "",
      due_date: "",
      is_financing: false,
      financing_total_amount: "",
      financing_months_total: "",
      early_payment_discount_rate: "",
      needs_approval: false,
      shared_with_user_id: "",
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addExpense({
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        is_financing: formData.is_financing,
        financing_total_amount: formData.is_financing ? parseFloat(formData.financing_total_amount) : undefined,
        financing_months_total: formData.is_financing ? parseInt(formData.financing_months_total) : undefined,
        early_payment_discount_rate: formData.is_financing ? parseFloat(formData.early_payment_discount_rate || "0") : 0,
        needs_approval: formData.needs_approval,
        shared_with_user_id: formData.shared_with_user_id || undefined,
        notes: formData.notes,
        financing_paid_amount: 0,
        financing_discount_amount: 0,
        financing_months_paid: 0,
        is_paid: false,
        is_recurring: false,
      });

      resetForm();
      setIsDialogOpen(false);
      
      toast({
        title: "Financiamento adicionado!",
        description: formData.is_financing 
          ? "Financiamento criado com sucesso. Você pode fazer pagamentos antecipados para economizar." 
          : "Gasto compartilhado criado com sucesso.",
      });
    } catch (error) {
      console.error('Error adding financing expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFinancingExamples = () => [
    {
      icon: Car,
      title: "Carro Financiado",
      description: "Ex: Civic financiado em 48x de R$ 1.200",
      total: "R$ 57.600",
      discount: "5% desconto antecipação"
    },
    {
      icon: Home,
      title: "Casa Financiada",
      description: "Ex: Casa financiada em 360x de R$ 2.500",
      total: "R$ 900.000",
      discount: "3% desconto antecipação"
    },
    {
      icon: CreditCard,
      title: "Cartão Parcelado",
      description: "Ex: Compra parcelada em 12x de R$ 250",
      total: "R$ 3.000",
      discount: "0% desconto (sem juros)"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>Financiamentos e Gastos Compartilhados</span>
            </CardTitle>
            <CardDescription>
              Adicione financiamentos com desconto de antecipação ou gastos que precisam de aprovação
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Novo Financiamento</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Financiamento ou Gasto Compartilhado</DialogTitle>
                <DialogDescription>
                  Configure um financiamento com desconto de antecipação ou um gasto que precisa de aprovação
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informações Básicas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Carro Honda Civic"
                        required
                      />
                    </div>
                     <div className="space-y-2">
                       <Label htmlFor="amount">Valor da Parcela *</Label>
                       <Input
                         id="amount"
                         type="number"
                         step="0.01"
                         value={formData.amount}
                         onChange={(e) => {
                           const amount = e.target.value;
                           const months = parseInt(formData.financing_months_total) || 0;
                           const total = amount && months ? (parseFloat(amount) * months).toString() : "";
                           setFormData(prev => ({ 
                             ...prev, 
                             amount,
                             financing_total_amount: total
                           }));
                         }}
                         placeholder="1200.00"
                         required
                       />
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Honda Civic 2023 - Financiamento Banco XYZ"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Data de Vencimento</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <Separator />

                {/* Financing Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">É um Financiamento?</h3>
                      <p className="text-sm text-muted-foreground">
                        Ative para poder fazer pagamentos antecipados com desconto
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_financing}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_financing: checked }))}
                    />
                  </div>

                  {formData.is_financing && (
                     <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                       <div className="space-y-2">
                         <Label htmlFor="financing_months_total">Total de Parcelas *</Label>
                         <Input
                           id="financing_months_total"
                           type="number"
                           value={formData.financing_months_total}
                           onChange={(e) => {
                             const months = e.target.value;
                             const amount = parseFloat(formData.amount) || 0;
                             const total = months ? (amount * parseInt(months)).toString() : "";
                             setFormData(prev => ({ 
                               ...prev, 
                               financing_months_total: months,
                               financing_total_amount: total
                             }));
                           }}
                           placeholder="48"
                           required
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="financing_total_amount">Valor Total (Calculado)</Label>
                         <Input
                           id="financing_total_amount"
                           type="number"
                           step="0.01"
                           value={formData.financing_total_amount}
                           disabled
                           placeholder="Calculado automaticamente"
                           className="bg-muted"
                         />
                         <p className="text-xs text-muted-foreground">
                           Calculado: Parcela × Quantidade
                         </p>
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="early_payment_discount_rate">Desconto Antecipação (%)</Label>
                         <Input
                           id="early_payment_discount_rate"
                           type="number"
                           step="0.1"
                           value={formData.early_payment_discount_rate}
                           onChange={(e) => setFormData(prev => ({ ...prev, early_payment_discount_rate: e.target.value }))}
                           placeholder="5.0"
                         />
                       </div>
                     </div>
                  )}
                </div>

                <Separator />

                {/* Approval Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Precisa de Aprovação?</h3>
                      <p className="text-sm text-muted-foreground">
                        Para gastos no nome de outras pessoas ou compartilhados
                      </p>
                    </div>
                    <Switch
                      checked={formData.needs_approval}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needs_approval: checked }))}
                    />
                  </div>

                  {formData.needs_approval && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <Label htmlFor="shared_with_user_id">Quem deve aprovar?</Label>
                        <Select 
                          value={formData.shared_with_user_id} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, shared_with_user_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um contato" />
                          </SelectTrigger>
                          <SelectContent>
                            {contacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.contact_user_id}>
                                {contact.contact_name} {contact.contact_email && `(${contact.contact_email})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {contacts.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Adicione contatos primeiro para poder compartilhar gastos
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Informações adicionais sobre o financiamento ou gasto..."
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Adicionando..." : "Adicionar"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Exemplos de Financiamentos:</h4>
          <div className="grid gap-3">
            {getFinancingExamples().map((example, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:shadow-md transition-shadow">
                <div className="p-2 bg-primary/10 rounded-full">
                  <example.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{example.title}</p>
                    <span className="text-sm font-medium text-primary">{example.total}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{example.description}</p>
                  <p className="text-xs text-green-600">{example.discount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};