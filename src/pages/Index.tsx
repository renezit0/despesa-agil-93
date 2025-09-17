import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { FinancialSummaryCard } from "@/components/FinancialSummaryCard";
import { AddExpenseForm } from "@/components/AddExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseChart } from "@/components/ExpenseChart";
import { QuickStats } from "@/components/QuickStats";
import { Button } from "@/components/ui/button";
import { PlusCircle, Wallet, TrendingDown, Calendar, CheckCircle, LogOut, User, Users } from "lucide-react";
import { isBefore } from "date-fns";
import financialHero from "@/assets/financial-hero.jpg";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { expenseInstances, loading: expensesLoading, updateExpense, deleteExpense, generateExpenseInstances, toggleInstancePaid } = useExpenses();

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
    await signOut();
    navigate("/auth");
  };

  // Show loading state while checking authentication
  if (loading || expensesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Wallet className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Controle Financeiro</h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo, {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/contacts")}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Contatos</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/manage-expenses")}
                className="flex items-center space-x-2"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Gerenciar</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            icon="pending"
            trend={expenseInstances.length > 0 ? { value: 5.1, isPositive: false } : undefined}
          />
          <FinancialSummaryCard
            title="Vencidos"
            amount={overdueExpenses}
            icon="expense"
            trend={expenseInstances.length > 0 ? { value: 2.3, isPositive: false } : undefined}
          />
        </section>

        {/* Add Expense Form */}
        <section>
          <AddExpenseForm />
        </section>

        {/* Quick Stats */}
        {expenseInstances.length > 0 && (
          <section>
            <QuickStats expenses={expenseInstances.map(inst => ({
              ...inst.original_expense,
              amount: inst.amount,
              is_paid: inst.is_paid,
              due_date: inst.due_date
            }))} />
          </section>
        )}

        {/* Charts */}
        {expenseInstances.length > 0 && (
          <section>
            <ExpenseChart expenses={expenseInstances.map(inst => ({
              ...inst.original_expense,
              amount: inst.amount,
              is_paid: inst.is_paid,
              due_date: inst.due_date
            }))} />
          </section>
        )}

        {/* Expense List */}
        <section>
          <ExpenseList
            expenses={expenseInstances.map(inst => ({
              ...inst.original_expense,
              id: inst.id,
              title: inst.title,
              amount: inst.amount,
              is_paid: inst.is_paid,
              due_date: inst.due_date
            }))}
            onTogglePaid={handleTogglePaid}
            onDeleteExpense={handleDeleteExpense}
            onMonthChange={handleMonthChange}
          />
        </section>

        {/* Empty State */}
        {expenseInstances.length === 0 && (
          <section className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="relative mb-8">
                <img 
                  src={financialHero} 
                  alt="Controle Financeiro - Dashboard ilustrativo" 
                  className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">Comece a controlar seus gastos!</h3>
              <p className="text-muted-foreground mb-6">
                Adicione seu primeiro gasto ou conta recorrente para começar a organizar suas finanças.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <PlusCircle className="h-5 w-5 mr-2 text-primary" />
                  Adicionar gastos
                </div>
                <div className="flex items-center justify-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Controlar vencimentos
                </div>
                <div className="flex items-center justify-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <TrendingDown className="h-5 w-5 mr-2 text-primary" />
                  Ver estatísticas
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
