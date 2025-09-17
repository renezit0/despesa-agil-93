import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useContacts } from "@/hooks/useContacts";
import { useExpenses } from "@/hooks/useExpenses";

interface AddExpenseFormProps {}

const categories = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Entretenimento",
  "Roupas",
  "Outros"
];

const expenseTypes = [
  { value: "normal", label: "Gasto Normal" },
  { value: "financing", label: "Financiamento" }
];

export function AddExpenseForm() {
  const { contacts } = useContacts();
  const { addExpense } = useExpenses();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    dueDate: new Date(),
    isRecurrent: false,
    recurringStartDate: new Date(),
    endDate: undefined as Date | undefined,
    description: "",
    expenseType: "normal",
    // Installment fields
    isInstallment: false,
    installments: "",
    firstInstallmentDate: new Date(),
    // Financing fields
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
      amount: "",
      category: "",
      dueDate: new Date(),
      isRecurrent: false,
      recurringStartDate: new Date(),
      endDate: undefined,
      description: "",
      expenseType: "normal",
      isInstallment: false,
      installments: "",
      firstInstallmentDate: new Date(),
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
      if (!formData.title || !formData.amount) {
        toast({
          title: "Erro",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      if (formData.expenseType === "financing") {
        // Use addExpense for financing
        await addExpense({
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          due_date: format(formData.dueDate, "yyyy-MM-dd"),
          is_financing: true,
          financing_total_amount: formData.financing_total_amount ? parseFloat(formData.financing_total_amount) : undefined,
          financing_months_total: formData.financing_months_total ? parseInt(formData.financing_months_total) : undefined,
          early_payment_discount_rate: formData.early_payment_discount_rate ? parseFloat(formData.early_payment_discount_rate) : 0,
          needs_approval: formData.needs_approval,
          shared_with_user_id: formData.shared_with_user_id || undefined,
          notes: formData.notes,
          financing_paid_amount: 0,
          financing_discount_amount: 0,
          financing_months_paid: 0,
          is_paid: false,
          is_recurring: formData.isRecurrent,
          recurring_start_date: formData.isRecurrent ? format(formData.recurringStartDate, "yyyy-MM-dd") : undefined,
        });
      } else {
        // Normal expense - always use addExpense to save to database
        await addExpense({
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          due_date: formData.isInstallment ? format(formData.firstInstallmentDate, "yyyy-MM-dd") : format(formData.dueDate, "yyyy-MM-dd"),
          is_financing: false,
          is_paid: false,
          is_recurring: formData.isRecurrent,
          recurring_start_date: formData.isRecurrent ? format(formData.recurringStartDate, "yyyy-MM-dd") : undefined,
          installments: formData.isInstallment ? parseInt(formData.installments) : undefined,
          current_installment: formData.isInstallment ? 1 : undefined,
        });
      }
      
      resetForm();
      setIsOpen(false);

      toast({
        title: "Sucesso!",
        description: formData.expenseType === "financing" 
          ? "Financiamento adicionado com sucesso!" 
          : "Gasto adicionado com sucesso.",
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar gasto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Adicionar Gasto</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre gastos normais ou financiamentos com desconto antecipado
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>{isOpen ? 'Fechar' : 'Novo Gasto'}</span>
        </Button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in max-h-[80vh] overflow-y-auto">
          {/* Tipo de Gasto */}
          <div className="space-y-2">
            <Label>Tipo de Gasto *</Label>
            <Select 
              value={formData.expenseType} 
              onValueChange={(value) => {
                setFormData({ 
                  ...formData, 
                  expenseType: value,
                  is_financing: value === "financing"
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {expenseTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder={formData.expenseType === "financing" ? "Ex: Carro Honda Civic" : "Ex: Aluguel, Supermercado..."}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">{formData.expenseType === "financing" ? "Valor da Parcela *" : "Valor *"}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => {
                    const amount = e.target.value;
                    const months = parseInt(formData.financing_months_total) || 0;
                    const total = formData.expenseType === "financing" && amount && months ? 
                      (parseFloat(amount) * months).toString() : "";
                    setFormData({ 
                      ...formData, 
                      amount,
                      financing_total_amount: formData.expenseType === "financing" ? total : formData.financing_total_amount
                    });
                  }}
                />
              </div>
            </div>

            {formData.expenseType === "normal" && (
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder={formData.expenseType === "financing" ? "Honda Civic 2023 - Financiamento Banco XYZ" : "Informações adicionais..."}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? (
                      format(formData.dueDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => date && setFormData({ ...formData, dueDate: date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurrent"
                  checked={formData.isRecurrent}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRecurrent: checked, endDate: checked ? formData.endDate : undefined })}
                />
                <Label htmlFor="recurrent" className="text-sm">
                  Gasto recorrente (mensal)
                </Label>
              </div>

              {formData.isRecurrent && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label>Data de Início da Recorrência</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.recurringStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.recurringStartDate ? (
                            format(formData.recurringStartDate, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecionar data de início</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.recurringStartDate}
                          onSelect={(date) => date && setFormData({ ...formData, recurringStartDate: date })}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-sm text-muted-foreground">
                      A partir de quando este gasto deve aparecer mensalmente
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Término (opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? (
                            format(formData.endDate, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecionar data de término</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => setFormData({ ...formData, endDate: date })}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-sm text-muted-foreground">
                      Se não definir, o gasto continuará indefinidamente
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="installment"
                  checked={formData.isInstallment}
                  onCheckedChange={(checked) => setFormData({ ...formData, isInstallment: checked })}
                />
                <Label htmlFor="installment" className="text-sm">
                  Gasto parcelado
                </Label>
              </div>

              {formData.isInstallment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label>Data da 1ª Parcela</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.firstInstallmentDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.firstInstallmentDate ? (
                            format(formData.firstInstallmentDate, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecionar data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.firstInstallmentDate}
                          onSelect={(date) => date && setFormData({ ...formData, firstInstallmentDate: date })}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="installments">Quantidade de Parcelas</Label>
                    <Input
                      id="installments"
                      type="number"
                      min="2"
                      max="120"
                      value={formData.installments}
                      onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                      placeholder="12"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Opções de Financiamento */}
          {formData.expenseType === "financing" && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Opções de Financiamento</h3>
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
                        setFormData({ 
                          ...formData, 
                          financing_months_total: months,
                          financing_total_amount: total
                        });
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
                      onChange={(e) => setFormData({ ...formData, early_payment_discount_rate: e.target.value })}
                      placeholder="5.0"
                    />
                  </div>
                </div>

                <Separator />

                {/* Aprovação */}
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
                      onCheckedChange={(checked) => setFormData({ ...formData, needs_approval: checked })}
                    />
                  </div>

                  {formData.needs_approval && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <Label htmlFor="shared_with_user_id">Quem deve aprovar?</Label>
                        <Select 
                          value={formData.shared_with_user_id} 
                          onValueChange={(value) => setFormData({ ...formData, shared_with_user_id: value })}
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
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informações adicionais sobre o financiamento..."
                    rows={3}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex space-x-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Adicionando..." : `Adicionar ${formData.expenseType === "financing" ? "Financiamento" : "Gasto"}`}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}