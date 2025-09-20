import { useState, useEffect } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, Bug } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EarlyPaymentDialog } from "@/components/EarlyPaymentDialog";

export default function ExpenseInstances() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [showDebug, setShowDebug] = useState(false);
  const [earlyPaymentDialogOpen, setEarlyPaymentDialogOpen] = useState(false);
  const [selectedFinancing, setSelectedFinancing] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [financingInstances, setFinancingInstances] = useState([]);
  
  const { 
    expenseInstances, 
    allTimeInstances,
    expenses,
    generateExpenseInstances, 
    generateAllFinancingInstances,
    toggleInstancePaid,
    loading 
  } = useExpenses();

  // Generate instances when component mounts or month changes
  useEffect(() => {
    generateExpenseInstances(currentMonth);
  }, [currentMonth]);

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

  // Handle checkbox toggle with better error handling
  const handleToggleInstancePaid = async (instance) => {
    try {
      console.log('🔄 Checkbox clicked for instance:', {
        id: instance.id,
        title: instance.title,
        current_status: instance.is_paid,
        will_become: !instance.is_paid
      });
      
      await toggleInstancePaid(instance);
      console.log('✅ Toggle completed successfully');
    } catch (error) {
      console.error('❌ Error in checkbox toggle:', error);
    }
  };

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
      {/* Month Navigation - Mantém no topo para navegação */}
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
                  {loading ? 'Carregando...' : `${currentMonthInstances.length} ${currentMonthInstances.length === 1 ? 'gasto' : 'gastos'}`}
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
            {!showDebug && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDebug(true)}
              >
                <Bug className="h-4 w-4 mr-2" />
                Debug
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* PRIORIDADE: Expense Instances List - Movido para cima */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Gastos do Mês</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentMonthInstances.length === 0 && !loading ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum gasto neste mês</h3>
              <p className="text-muted-foreground">
                Não há gastos programados para {format(currentMonth, "MMMM yyyy", { locale: ptBR })}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentMonthInstances.map((instance) => {
                // Force re-render when instance changes by creating a unique key
                const instanceKey = `${instance.id}-${instance.is_paid}-${instance.amount}`;
                
                return (
                  <div key={instanceKey} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Checkbox
                            checked={instance.is_paid}
                            onCheckedChange={() => handleToggleInstancePaid(instance)}
                            className="mt-1"
                          />
                          {showDebug && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({instance.is_paid ? 'CHECKED' : 'UNCHECKED'})
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-medium ${instance.is_paid ? 'line-through text-gray-500' : ''}`}>
                              {instance.title}
                            </h4>
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
                            <p className="text-sm text-muted-foreground mt-1">{instance.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Vencimento: {format(new Date(instance.due_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          {showDebug && (
                            <p className="text-xs text-red-500 mt-1">
                              DEBUG: ID={instance.id}, is_paid={instance.is_paid ? 'true' : 'false'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {instance.instance_type === 'financing' && instance.original_expense?.is_financing && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const financingInstances = await generateAllFinancingInstances(instance.original_expense);
                              setSelectedFinancing(instance.original_expense);
                              setFinancingInstances(financingInstances);
                              setSelectedInstance(instance);
                              setEarlyPaymentDialogOpen(true);
                            }}
                            className="h-8 px-3"
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Pagar
                          </Button>
                        )}
                        <div className="text-right">
                          <span className={`font-semibold text-lg ${instance.is_paid ? 'text-green-600' : 'text-slate-900'}`}>
                            R$ {instance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Separador visual */}
      <Separator className="my-8" />

      {/* Summary Cards - Movido para baixo, agora como resumo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Resumo Financeiro do Mês
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate">Total do Mês</p>
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
      </div>

      {/* DEBUG INFO - Movido para o final */}
      {showDebug && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700">
              <Bug className="h-5 w-5" />
              <span>Debug Info</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDebug(false)}
                className="ml-auto"
              >
                Ocultar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div className="bg-white p-3 rounded border">
              <p><strong>Mês selecionado:</strong> {format(currentMonth, "MMMM yyyy", { locale: ptBR })}</p>
              <p><strong>Total de instâncias:</strong> {expenseInstances.length}</p>
              <p><strong>Instâncias do mês atual:</strong> {currentMonthInstances.length}</p>
              <p><strong>All time instances:</strong> {allTimeInstances.length}</p>
            </div>

            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p><strong>Instâncias do mês atual:</strong></p>
              {currentMonthInstances.slice(0, 3).map((instance, idx) => (
                <div key={instance.id} className="ml-4 text-xs">
                  {idx + 1}. {instance.title} - {instance.is_paid ? 'PAGO' : 'PENDENTE'} - ID: {instance.id}
                </div>
              ))}
              {currentMonthInstances.length > 3 && <p className="ml-4 text-xs">... e mais {currentMonthInstances.length - 3}</p>}
            </div>
          </CardContent>
        </Card>
      )}

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