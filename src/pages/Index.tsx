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
import financialHero from "@/assets/financial-hero.jpg";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { expenses, expenseInstances, allTimeInstances, loading: expensesLoading, updateExpense, deleteExpense, generateExpenseInstances, toggleInstancePaid } = useExpenses();
  
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
  const overdueExpenses = expenseInstances
    .filter(e => !e.is_paid && isBefore(new Date(e.due_date), new Date()))
    .reduce((sum, instance) => sum + instance.amount, 0);

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
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary-foreground shadow-lg">
                <img 
                  src={financialHero} 
                  alt="Controle Financeiro" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  DespesaÁgil
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Controle inteligente de gastos
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => navigate("/manage-expenses")}
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Gerenciar</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/profile")}
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Perfil</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Summary Cards - Mobile Responsive */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <FinancialSummaryCard
            title="Total de Gastos"
            amount={totalExpenses}
            icon="balance"
            trend={expenseInstances.length > 0 ? { value: 12.5, isPositive: false } : undefined}
          />
          <FinancialSummaryCard
            title="Valores Pagos"
            amount={paidExpenses}
            icon="income"
            trend={expenseInstances.length > 0 ? { value: 8.2, isPositive: true } : undefined}
          />
          <FinancialSummaryCard
            title="Pendentes"
            amount={pendingExpenses}
            icon="expense"
            trend={expenseInstances.length > 0 ? { value: 5.1, isPositive: false } : undefined}
          />
          <FinancialSummaryCard
            title="Em Atraso"
            amount={overdueExpenses}
            icon="expense"
            trend={expenseInstances.length > 0 ? { value: 2.3, isPositive: false } : undefined}
          />
        </section>

        {/* Charts and Analysis - Mobile Responsive */}
        <section className="grid gap-6 sm:gap-8 lg:grid-cols-2">
          <ExpenseChart expenses={expenses} expenseInstances={allTimeInstances} />
          <QuickStats expenses={expenses} />
        </section>

        {/* Expense Management - Mobile Responsive */}
        <section className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <AddExpenseForm />
          </div>
          
          <div className="lg:col-span-2">
            <ExpenseInstances />
          </div>
        </section>

        {/* Additional Quick Actions - Mobile Only */}
        <section className="lg:hidden">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate("/contacts")}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Contatos</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate("/manage-expenses")}
            >
              <Wallet className="h-6 w-6" />
              <span className="text-sm">Gastos</span>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;