import { useState, useEffect } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EarlyPaymentDialog } from "@/components/EarlyPaymentDialog";

export default function ExpenseInstances() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"month" | "pending">("month");
  const [earlyPaymentDialogOpen, setEarlyPaymentDialogOpen] = useState(false);
  const [selectedFinancing, setSelectedFinancing] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [financingInstances, setFinancingInstances] = useState([]);
  const { 
    expenseInstances, 
    allTimeInstances,
    generateExpenseInstances, 
    generateAllFinancingInstances,
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

  // Get instances to display based on view mode
  const getInstancesToShow = () => {
    if (viewMode === "pending") {
      // Mostrar TODAS as parcelas pendentes de allTimeInstances
      return allTimeInstances.filter(instance => !instance.is_paid);
    } else {
      // Mostrar instâncias do mês atual + parcelas pendentes
      const monthInstances = expenseInstances.filter(instance => {
        const instanceDate = new Date(instance.instance_date);
        return instanceDate.getMonth() === currentMonth.getMonth() && 
               instanceDate.getFullYear() === currentMonth.getFullYear();
      });
      
      // Adicionar parcelas pendentes que não estão no mês atual
      const pendingFromOtherMonths = allTimeInstances.filter(instance => {
        const instanceDate = new Date(instance.instance_date);
        const isDifferentMonth = instanceDate.getMonth() !== currentMonth.getMonth() || 
                                instanceDate.getFullYear() !== currentMonth.getFullYear();
        return !instance.is_paid && isDifferentMonth && instance.installment_number;
      });
      
      // Combinar e remover duplicatas
      const combined = [...monthInstances, ...pendingFromOtherMonths];
      const unique = combined.filter((instance, index, self) => 
        index === self.findIndex(i => i.id === instance.id)
      );
      
      return unique;
    }
  };

  const instancesToShow = getInstancesToShow();

  // Calculate totals
  const totalAmount = instancesToShow.reduce((sum, instance) => sum + instance.amount, 0);
  const paidAmount = instancesToShow.filter(e => e.is_paid).reduce((sum, instance) => sum + instance.amount, 0);
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
      {/* View Toggle and Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            {/* Toggle para modo de visualização */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant={viewMode === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                >
                  Mês Atual
                </Button>
                <Button
                  variant={viewMode === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("pending")}
                >
                  Todas Pendentes
                </Button>
              </div>
              <Badge variant="outline" className="text-xs">
                {viewMode === "pending" ? 'Todas pendentes' : 'Mês + pendentes'}
              </Badge>
            </div>

            {/* Month Navigation - sempre visível */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  disabled={viewMode === "pending"}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <CardTitle className="text-xl">
                    {viewMode === "pending" ? "Todas as Parcelas Pendentes" : format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {loading ? 'Carregando...' : `${instancesToShow.length} ${instancesToShow.length === 1 ? 'gasto' : 'gastos'}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  disabled={viewMode === "pending"}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium truncate">
                  {viewMode === "pending" ? 'Total Pendente' : 'Total'}
                </p>
                <p className="text-lg sm:text-2xl font-bold truncate">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium truncate">Valores Pagos</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium truncate">Pendentes</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600 truncate">R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
            <span>
              {viewMode === "pending" ? 'Todas as Parcelas Pendentes' : 'Gastos do Mês + Parcelas Pendentes'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {instancesToShow.length === 0 && !loading ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {viewMode === "pending" ? 'Nenhuma parcela pendente' : 'Nenhum gasto'}
              </h3>
              <p className="text-muted-foreground">
                {viewMode === "pending" 
                  ? 'Parabéns! Você não tem parcelas pendentes.'
                  : `Não há gastos para exibir.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {instancesToShow.map((instance) => (
                <div key={instance.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={instance.is_paid}
                        onCheckedChange={() => toggleInstancePaid(instance)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
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
                          {instance.installment_number && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Parcela {instance.installment_number}
                            </Badge>
                          )}
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
                          <span className="ml-2">
                            • {format(new Date(instance.due_date), "MMMM yyyy", { locale: ptBR })}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {instance.instance_type === 'financing' && instance.original_expense?.is_financing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            // Get ALL instances for this financing expense
                            const financingInstances = await generateAllFinancingInstances(instance.original_expense);
                            setSelectedFinancing(instance.original_expense);
                            setFinancingInstances(financingInstances);
                            setSelectedInstance(instance);
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
        selectedInstance={selectedInstance}
        availableInstances={financingInstances}
      />
    </div>
  );
}
