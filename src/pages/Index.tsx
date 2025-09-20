import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { FinancialSummaryCard } from "@/components/FinancialSummaryCard";
import { AddExpenseForm } from "@/components/AddExpenseForm";
import ExpenseInstances from "@/pages/ExpenseInstances";
import { ExpenseChart } from "@/components/ExpenseChart";
import { QuickStats } from "@/components/QuickStats";
import { Button } from "@/components/ui/button";
import { PlusCircle, Wallet, TrendingDown, Calendar, CheckCircle, LogOut, User, Users } from "lucide-react";
import { isBefore } from "date-fns";
import gastoseellIcon from "@/assets/gastoseell-icon.png";

const Index = () => {
  const {
    user,
    signOut,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const {
    expenses,
    expenseInstances,
    allTimeInstances,
    loading: expensesLoading,
    updateExpense,
    deleteExpense,
    generateExpenseInstances,
    toggleInstancePaid
  } = useExpenses();

  // DEBUG: Log dos dados
  console.log('🔍 INDEX DEBUG:', {
    expenses: expenses.length,
    expenseInstances: expenseInstances.length,
    allTimeInstances: allTimeInstances.length,
    allTimeInstancesData: allTimeInstances
  });

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleTogglePaid = async (id: string) => {
    const instance = expenseInstances.find(e => e.id === id);
    if (instance) {
      await toggleInstancePaid(instance);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
  };

  const handleMonthChange = async (month: Date) => {
    await generateExpenseInstances(month);
  };

  // Calculate summary data from instances
  const totalExpenses = expenseInstances.reduce((sum, instance) => sum + instance.amount, 0);
  const paidExpenses = expenseInstances.filter(e => e.is_paid).reduce((sum, instance) => sum + instance.amount, 0);
  const pendingExpenses = totalExpenses - paidExpenses;
  const overdueExpenses = expenseInstances.filter(e => !e.is_paid && isBefore(new Date(e.due_date), new Date())).reduce((sum, instance) => sum + instance.amount, 0);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading || expensesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 animate-fade-in">
      {/* Header - Mobile Optimized */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl overflow-hidden bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg flex-shrink-0">
                <img src={gastoseellIcon} alt="GastoseeLL Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-3xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text truncate text-slate-950 font-thin">seeLL</h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto justify-stretch sm:justify-start">
              <Button variant="default" size="sm" onClick={() => navigate("/manage-expenses")} className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-0">
                <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Gerenciar</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/contacts")} className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-0">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Contatos</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-0">
                <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Perfil</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm flex-1 sm:flex-none min-w-0">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* PRIORIDADE 1: GASTOS DO MÊS - Movido para o topo */}
        <section>
          <ExpenseInstances />
        </section>

        {/* PRIORIDADE 2: FORMULÁRIO RÁPIDO - Para adicionar gastos facilmente */}
        <section className="lg:max-w-md">
          <AddExpenseForm />
        </section>

        {/* PRIORIDADE 3: RESUMO FINANCEIRO - Cards de resumo */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Resumo Geral</h2>
            <p className="text-sm text-muted-foreground">Visão geral das suas finanças</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <FinancialSummaryCard 
              title="Total de Gastos" 
              amount={totalExpenses} 
              icon="balance" 
              trend={expenseInstances.length > 0 ? {
                value: 12.5,
                isPositive: false
              } : undefined} 
            />
            <FinancialSummaryCard 
              title="Valores Pagos" 
              amount={paidExpenses} 
              icon="income" 
              trend={expenseInstances.length > 0 ? {
                value: 8.2,
                isPositive: true
              } : undefined} 
            />
            <FinancialSummaryCard 
              title="Pendentes" 
              amount={pendingExpenses} 
              icon="expense" 
              trend={expenseInstances.length > 0 ? {
                value: 5.1,
                isPositive: false
              } : undefined} 
            />
            <FinancialSummaryCard 
              title="Em Atraso" 
              amount={overdueExpenses} 
              icon="expense" 
              trend={expenseInstances.length > 0 ? {
                value: 2.3,
                isPositive: false
              } : undefined} 
            />
          </div>
        </section>

        {/* PRIORIDADE 4: ANÁLISES E GRÁFICOS - Para consulta */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Análises e Relatórios</h2>
            <p className="text-sm text-muted-foreground">Dados e tendências dos seus gastos</p>
          </div>
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
            <ExpenseChart expenses={expenses} expenseInstances={allTimeInstances} />
            <QuickStats expenses={expenses} />
          </div>
        </section>

        {/* Additional Quick Actions - Mobile Only */}
        <section className="lg:hidden px-1">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-16 flex-col space-y-1 text-xs" onClick={() => navigate("/contacts")}>
              <Users className="h-5 w-5" />
              <span>Contatos</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col space-y-1 text-xs" onClick={() => navigate("/manage-expenses")}>
              <Wallet className="h-5 w-5" />
              <span>Gastos</span>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;