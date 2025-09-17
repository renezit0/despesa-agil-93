import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useExpenses, type Expense, type ExpenseInstance } from "@/hooks/useExpenses";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EarlyPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  selectedInstance?: ExpenseInstance | null;
  availableInstances?: ExpenseInstance[];
}

export function EarlyPaymentDialog({ 
  open, 
  onOpenChange, 
  expense, 
  selectedInstance, 
  availableInstances = [] 
}: EarlyPaymentDialogProps) {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"installment" | "remaining" | "early_discount">("installment");
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalFromTransactions, setTotalFromTransactions] = useState(0);
  const { makeEarlyPayment, toggleInstancePaid } = useExpenses();

  // Initialize selected instance
  useEffect(() => {
    if (selectedInstance) {
      setSelectedInstanceId(selectedInstance.id);
    } else if (availableInstances.length > 0) {
      setSelectedInstanceId(availableInstances[0].id);
    }
  }, [selectedInstance, availableInstances]);

  // Buscar transações de pagamento para calcular total real
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!expense?.id || !expense.is_financing) return;

      try {
        const { data: transactions, error } = await supabase
          .from('payment_transactions')
          .select('payment_amount, discount_amount')
          .eq('expense_id', expense.id);

        if (!error && transactions) {
          const total = transactions.reduce((sum, t) => sum + t.payment_amount + t.discount_amount, 0);
          setTotalFromTransactions(total);
        } else {
          setTotalFromTransactions(0);
        }
      } catch (error) {
        console.error('Erro ao buscar transações:', error);
        setTotalFromTransactions(0);
      }
    };

    fetchTransactions();
  }, [expense?.id, open]); // Só refaz quando abre o modal ou muda o expense

  if (!expense?.is_financing) return null;

  const totalAmount = expense.financing_total_amount || 0;
  const paidAmount = expense.financing_paid_amount || 0;
  const discountAmount = expense.financing_discount_amount || 0;
  const monthsTotal = expense.financing_months_total || 0;
  const discountRate = expense.early_payment_discount_rate || 0;
  
  // Calculate paid months from actual instances, not from the expense field
  const paidInstancesCount = availableInstances.filter(inst => inst.is_paid).length;
  const monthsPaid = paidInstancesCount;
  
  // Calculate total paid from instances (parcelas pagas individualmente)
  const paidFromInstances = availableInstances
    .filter(inst => inst.is_paid)
    .reduce((sum, inst) => sum + inst.amount, 0);
  
  // Total efetivamente pago = transações + parcelas pagas individualmente 
  const totalPaidAmount = totalFromTransactions + paidFromInstances;
  
  // Saldo devedor = valor total - total pago (incluindo transações)
  const remainingAmount = totalAmount - totalPaidAmount;
  const remainingMonths = monthsTotal - monthsPaid;
  
  // Calculado uma vez só, sem flood
  if (availableInstances.length === 0) {
    console.log('Nenhuma instância disponível para o modal');
  }
  
  // Find selected instance
  const currentInstance = availableInstances.find(inst => inst.id === selectedInstanceId) || selectedInstance;
  const installmentAmount = currentInstance?.amount || (totalAmount / monthsTotal);
  
  // Calculate amounts based on payment type
  let calculatedAmount = 0;
  let description = "";
  
  switch (paymentType) {
    case "installment":
      calculatedAmount = installmentAmount;
      description = "Pagamento da parcela selecionada";
      break;
    case "remaining":
      calculatedAmount = Math.max(0, remainingAmount);
      description = "Pagamento do saldo devedor restante";
      break;
    case "early_discount":
      const discount = discountRate > 0 ? (Math.max(0, remainingAmount) * discountRate / 100) : 0;
      calculatedAmount = Math.max(0, remainingAmount);
      description = `Pagamento do saldo devedor com ${discountRate}% desconto (economia de R$ ${discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
      break;
  }

  // LÓGICA CORRIGIDA: Se o valor personalizado for menor, é um pagamento COM desconto
  const hasCustomAmount = customAmount && customAmount.trim() !== "" && !isNaN(parseFloat(customAmount));
  const customAmountValue = hasCustomAmount ? parseFloat(customAmount) : 0;
  
  // Se o valor personalizado é menor que o calculado = desconto personalizado
  const isCustomDiscount = hasCustomAmount && customAmountValue < calculatedAmount;
  const discountFromCustomAmount = isCustomDiscount ? calculatedAmount - customAmountValue : 0;
  
  // O valor final é sempre o valor que você digitou (ou o calculado se não digitou nada)
  const finalAmount = hasCustomAmount ? customAmountValue : calculatedAmount;

  const handlePayment = async () => {
    console.log('🎯 BOTÃO CLICADO! handlePayment executando...');
    // DEBUG FINAL - só executa quando clica no botão
    console.log('🚀 PAYMENT START - RAW VALUES:', {
      'customAmount (raw)': customAmount,
      'customAmount type': typeof customAmount,
      'customAmount length': customAmount?.length,
      'parsed': customAmount ? parseFloat(customAmount) : 'EMPTY',
      'finalAmount': finalAmount,
      'discountFromCustomAmount': discountFromCustomAmount
    });
    
    console.log('🔍 VALIDAÇÃO:', {
      finalAmount,
      'finalAmount > 0': finalAmount > 0,
      paymentType,
      'currentInstance exists': !!currentInstance,
      'vai para installment?': paymentType === "installment" && currentInstance,
      'vai para early payment?': !(paymentType === "installment" && currentInstance)
    });
    
    if (!finalAmount || finalAmount <= 0) {
      console.log('❌ ERRO: Valor inválido');
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para o pagamento.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ VALOR VÁLIDO, continuando...');
    setIsLoading(true);
    try {
      // LÓGICA CORRIGIDA: Se tem desconto personalizado, sempre vai para early payment
      if (paymentType === "installment" && currentInstance && discountFromCustomAmount === 0) {
        console.log('📝 PAGAMENTO DE PARCELA INDIVIDUAL (SEM DESCONTO)');
        // Mark specific instance as paid
        await toggleInstancePaid(currentInstance);
      } else {
        console.log('🚨 INDO PARA EARLY PAYMENT!');
        console.log('🚨 CHAMANDO makeEarlyPayment COM DESCONTO:', discountFromCustomAmount);
        
        // Make early payment with custom discount
        await makeEarlyPayment(expense.id, finalAmount, discountFromCustomAmount);
        
        console.log('✅ makeEarlyPayment CONCLUÍDO COM SUCESSO');
      }
      
      setCustomAmount("");
      onOpenChange(false);
      
      toast({
        title: "Pagamento realizado!",
        description: `Pagamento de R$ ${finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} processado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagamento - {expense.title}</DialogTitle>
          <DialogDescription>
            Selecione o tipo de pagamento e a parcela desejada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção da Parcela */}
          {availableInstances.length > 0 && (
            <div className="space-y-2">
              <Label>Selecionar Parcela</Label>
              <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma parcela" />
                </SelectTrigger>
                <SelectContent>
                  {availableInstances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.title} - R$ {instance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      {instance.is_paid && " (Paga)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tipo de Pagamento */}
          <div className="space-y-3">
            <Label>Tipo de Pagamento</Label>
            <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="installment" id="installment" />
                <Label htmlFor="installment" className="flex-1">
                  Pagar Parcela Selecionada
                  <span className="text-sm text-muted-foreground block">
                    R$ {installmentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remaining" id="remaining" />
                <Label htmlFor="remaining" className="flex-1">
                  Quitar Saldo Devedor
                  <span className="text-sm text-muted-foreground block">
                    R$ {Math.max(0, remainingAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                    {remainingAmount <= 0 ? " (Já quitado)" : " (sem desconto)"}
                  </span>
                </Label>
              </div>
              
              {discountRate > 0 && remainingAmount > 0 && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="early_discount" id="early_discount" />
                  <Label htmlFor="early_discount" className="flex-1">
                    Pagamento Antecipado com Desconto
                    <span className="text-sm text-green-600 block">
                      Pagar R$ {Math.max(0, remainingAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                      (com {discountRate}% desconto aplicado automaticamente)
                    </span>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Status atual */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Total:</span>
                <span>R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Pago (Antecipado):</span>
                <span>R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Pago (Parcelas):</span>
                <span>R$ {paidFromInstances.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Pago:</span>
                <span>R$ {totalPaidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto Obtido:</span>
                <span className="text-green-600">R$ {discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Saldo Devedor Real:</span>
                <span className={remainingAmount > 0 ? "text-red-600" : "text-green-600"}>
                  R$ {Math.max(0, remainingAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parcelas Restantes:</span>
                <span>{remainingMonths} de {monthsTotal} (Pagas: {paidInstancesCount})</span>
              </div>
              {remainingAmount <= 0 && (
                <div className="flex justify-center">
                  <span className="text-green-600 font-medium">✅ Financiamento Quitado!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valor customizado */}
          <div className="space-y-2">
            <Label htmlFor="custom-amount">Valor Personalizado (opcional)</Label>
            <Input
              id="custom-amount"
              type="number"
              step="0.01"
              placeholder={`${calculatedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {description}
              {isCustomDiscount && (
                <span className="text-green-600 block">
                  💰 Desconto personalizado de R$ {discountFromCustomAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} será aplicado!
                </span>
              )}
            </p>
          </div>

          {/* Resumo do pagamento */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Valor a Pagar:</span>
                  <span>R$ {finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                {/* Desconto personalizado */}
                {isCustomDiscount && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>Desconto personalizado:</span>
                    <span>- R$ {discountFromCustomAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                
                {/* Desconto automático por taxa */}
                {paymentType === "early_discount" && discountRate > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Valor base:</span>
                      <span>R$ {calculatedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-green-600 text-sm">
                      <span>Desconto automático ({discountRate}%):</span>
                      <span>- R$ {((calculatedAmount * discountRate) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
                
                {/* Total de descontos */}
                {(isCustomDiscount || (paymentType === "early_discount" && discountRate > 0)) && (
                  <div className="border-t pt-2 flex justify-between font-medium text-green-600">
                    <span>Total de Descontos:</span>
                    <span>- R$ {(discountFromCustomAmount + (paymentType === "early_discount" && discountRate > 0 ? (calculatedAmount * discountRate / 100) : 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              onClick={handlePayment}
              disabled={isLoading || !finalAmount || finalAmount <= 0}
              className="flex-1"
            >
              {isLoading ? "Processando..." : "Confirmar Pagamento"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}