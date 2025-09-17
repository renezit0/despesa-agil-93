import { useState, useEffect } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EarlyPaymentDialog } from "@/components/EarlyPaymentDialog";

export default function ExpenseInstances() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [earlyPaymentDialogOpen, setEarlyPaymentDialogOpen] = useState(false);
  const [selectedFinancing, setSelectedFinancing] = useState(null);
  const { 
    expenseInstances, 
    generateExpenseInstances, 
    toggleInstancePaid,
    loading 
  } = useExpenses();

  // Generate instances when component mounts or month changes
  useEffect(() => {
    generateExpenseInstances(currentMonth);
  }, [currentMonth, generateExpenseInstances]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' 
      ? subMonths(currentMonth, 1) 
      : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  // Filter instances for current month
  const currentMonthInstances = expenseInstances.filter(instance => {
    const instanceDate = new Date(instance.instance_date);
    return instanceDate.getMonth() === currentMonth.getMonth() && 
           instanceDate.getFullYear() === currentMonth.getFullYear();
  });

  // Calculate totals
  const totalAmount = currentMonthInstances.reduce((sum, instance) => sum + instance.amount, 0);
  const paidAmount = currentMonthInstances.filter(e => e.is_paid).reduce((sum, instance) => sum + instance.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando gastos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <CardTitle className="text-xl">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {currentMonthInstances.length} {currentMonthInstances.length === 1 ? 'gasto' : 'gastos'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total do Mês</p>
                <p className="text-2xl font-bold">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Valores Pagos</p>
                <p className="text-2xl font-bold text-green-600">R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Pendentes</p>
                <p className="text-2xl font-bold text-red-600">R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Instances List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Gastos do Mês</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentMonthInstances.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum gasto neste mês</h3>
              <p className="text-muted-foreground">
                Não há gastos programados para {format(currentMonth, "MMMM yyyy", { locale: ptBR })}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentMonthInstances.map((instance) => (
                <div key={instance.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={instance.is_paid}
                        onCheckedChange={() => toggleInstancePaid(instance)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{instance.title}</h4>
                          <Badge 
                            variant={
                              instance.instance_type === 'normal' ? 'default' :
                              instance.instance_type === 'recurring' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {instance.instance_type === 'normal' ? 'Normal' :
                             instance.instance_type === 'recurring' ? 'Recorrente' : 'Financiamento'}
                          </Badge>
                          {instance.is_paid && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Pago
                            </Badge>
                          )}
                        </div>
                        {instance.description && (
                          <p className="text-sm text-muted-foreground">{instance.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Vencimento: {format(new Date(instance.due_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {instance.instance_type === 'financing' && instance.original_expense.is_financing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedFinancing(instance.original_expense);
                            setEarlyPaymentDialogOpen(true);
                          }}
                          className="h-8 px-2"
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Pagar
                        </Button>
                      )}
                      <div className="text-right">
                        <span className="font-semibold text-lg">
                          R$ {instance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EarlyPaymentDialog
        open={earlyPaymentDialogOpen}
        onOpenChange={setEarlyPaymentDialogOpen}
        expense={selectedFinancing}
      />
    </div>
  );
}