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
  const [showDebug, setShowDebug] = useState(true);
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

  // Debug: Encontrar a despesa "qaa"
  const qaaExpense = expenses.find(exp => exp.title.toLowerCase().includes('qaa'));
  
  // Debug: Encontrar instâncias da despesa qaa em allTimeInstances
  const qaaInstancesInAll = qaaExpense ? allTimeInstances.filter(instance => 
    instance.expense_id === qaaExpense.id
  ) : [];

  // Debug: Encontrar instâncias da despesa qaa em expenseInstances
  const qaaInstancesInCurrent = qaaExpense ? expenseInstances.filter(instance => 
    instance.expense_id === qaaExpense.id
  ) : [];

  // Debug: Todas as instâncias do mês atual em allTimeInstances
  const allCurrentMonthInstances = allTimeInstances.filter(instance => {
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
      {/* DEBUG INFO DETALHADO */}
      {showDebug && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700">
              <Bug className="h-5 w-5" />
              <span>Debug Detalhado - Despesa QAA</span>
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
              <p><strong>Data atual:</strong> {format(new Date(), "dd/MM/yyyy")}</p>
            </div>

            {qaaExpense && (
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p><strong>🔍 Despesa QAA encontrada:</strong></p>
                <div className="ml-4 space-y-1">
                  <p>• ID: {qaaExpense.id}</p>
                  <p>• Título: {qaaExpense.title}</p>
                  <p>• Valor: R$ {qaaExpense.amount}</p>
                  <p>• Vencimento: {qaaExpense.due_date}</p>
                  <p>• Parcelas: {qaaExpense.installments}</p>
                  <p>• É parcelada: {qaaExpense.installments && qaaExpense.installments > 1 ? 'SIM' : 'NÃO'}</p>
                  <p>• É recorrente: {qaaExpense.is_recurring ? 'SIM' : 'NÃO'}</p>
                  <p>• É financiamento: {qaaExpense.is_financing ? 'SIM' : 'NÃO'}</p>
                </div>
              </div>
            )}

            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p><strong>📊 Instâncias da QAA em allTimeInstances:</strong> {qaaInstancesInAll.length}</p>
              {qaaInstancesInAll.map((instance, idx) => (
                <div key={instance.id} className="ml-4 text-xs">
                  {idx + 1}. {instance.title} - {instance.instance_date} - Parcela {instance.installment_number} - Tipo: {instance.instance_type}
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <p><strong>📊 Instâncias da QAA em expenseInstances:</strong> {qaaInstancesInCurrent.length}</p>
              {qaaInstancesInCurrent.map((instance, idx) => (
                <div key={instance.id} className="ml-4 text-xs">
                  {idx + 1}. {instance.title} - {instance.instance_date} - Parcela {instance.installment_number} - Tipo: {instance.instance_type}
                </div>
              ))}
            </div>

            <div className="bg-purple-50 p-3 rounded border border-purple-200">
              <p><strong>📅 TODAS as instâncias do mês atual (allTimeInstances):</strong> {allCurrentMonthInstances.length}</p>
              {allCurrentMonthInstances.map((instance, idx) => (
                <div key={instance.id} className="ml-4 text-xs">
                  {idx + 1}. {instance.title} - {instance.instance_date} - ExpenseID: {instance.expense_id} - Tipo: {instance.instance_type}
                </div>
              ))}
            </div>

            <div className="bg-orange-50 p-3 rounded border border-orange-200">
              <p><strong>📅 Instâncias em expenseInstances (processadas):</strong> {expenseInstances.length}</p>
              {expenseInstances.slice(0, 5).map((instance, idx) => (
                <div key={instance.id} className="ml-4 text-xs">
                  {idx + 1}. {instance.title} - {instance.instance_date} - ExpenseID: {instance.expense_id} - Tipo: {instance.instance_type}
                </div>
              ))}
              {expenseInstances.length > 5 && <p className="ml-4 text-xs">... e mais {expenseInstances.length - 5}</p>}
            </div>

            <div className="bg-red-50 p-3 rounded border border-red-200">
              <p><strong>❗ PROBLEMA:</strong></p>
              <p>Se a QAA tem parcelas em allTimeInstances mas não em expenseInstances, então a função generateExpenseInstances não está processando elas corretamente.</p>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Summary Cards */}
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

      {/* Expense Instances List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Gastos do Mês</span>
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
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
