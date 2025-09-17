import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExpenses, type Expense } from "@/hooks/useExpenses";
import { toast } from "@/hooks/use-toast";

interface EarlyPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

export function EarlyPaymentDialog({ open, onOpenChange, expense }: EarlyPaymentDialogProps) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { makeEarlyPayment, calculateFinancingDiscount } = useExpenses();

  if (!expense?.is_financing) return null;

  const totalAmount = expense.financing_total_amount || 0;
  const paidAmount = expense.financing_paid_amount || 0;
  const discountAmount = expense.financing_discount_amount || 0;
  const monthsTotal = expense.financing_months_total || 0;
  const monthsPaid = expense.financing_months_paid || 0;
  const discountRate = expense.early_payment_discount_rate || 0;

  const remainingAmount = totalAmount - paidAmount - discountAmount;
  const remainingMonths = monthsTotal - monthsPaid;
  
  // Calculate discount for current payment
  const currentPayment = parseFloat(paymentAmount) || 0;
  const discount = discountRate > 0 ? (remainingAmount * discountRate / 100) : 0;
  const finalPaymentNeeded = remainingAmount - discount;

  const handlePayment = async () => {
    if (!currentPayment || currentPayment <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para o pagamento.",
        variant: "destructive",
      });
      return;
    }

    if (currentPayment > finalPaymentNeeded) {
      toast({
        title: "Valor muito alto",
        description: `O valor máximo para quitar é R$ ${finalPaymentNeeded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await makeEarlyPayment(expense.id, currentPayment);
      setPaymentAmount("");
      onOpenChange(false);
      
      toast({
        title: "Pagamento realizado!",
        description: `Pagamento de R$ ${currentPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} processado com sucesso.`,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento Antecipado</DialogTitle>
          <DialogDescription>
            {expense.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status atual */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Total:</span>
                <span>R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Pago:</span>
                <span>R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto Obtido:</span>
                <span className="text-green-600">R$ {discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Saldo Devedor:</span>
                <span>R$ {remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parcelas Restantes:</span>
                <span>{remainingMonths} de {monthsTotal}</span>
              </div>
            </CardContent>
          </Card>

          {/* Calculadora de desconto */}
          {discountRate > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {discountRate}% desconto
                  </Badge>
                  <span className="text-sm font-medium">Pagamento à vista</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Saldo devedor:</span>
                    <span>R$ {remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({discountRate}%):</span>
                    <span>- R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t pt-1 flex justify-between font-medium">
                    <span>Valor para quitar:</span>
                    <span>R$ {finalPaymentNeeded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Input de pagamento */}
          <div className="space-y-2">
            <Label htmlFor="payment">Valor do Pagamento</Label>
            <Input
              id="payment"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Você pode pagar qualquer valor entre R$ 0,01 e R$ {finalPaymentNeeded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              onClick={() => setPaymentAmount(finalPaymentNeeded.toString())}
              variant="outline"
              className="flex-1"
            >
              Quitar Total
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isLoading || !currentPayment || currentPayment <= 0}
              className="flex-1"
            >
              {isLoading ? "Processando..." : "Pagar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}