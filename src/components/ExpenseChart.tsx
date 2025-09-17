import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useState } from "react";
import { Expense } from "@/hooks/useExpenses";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp } from "lucide-react";

interface ExpenseChartProps {
  expenses: Expense[];
  expenseInstances?: any[]; // Include instances for comprehensive data
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--accent))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#a4de6c'
];

export function ExpenseChart({ expenses, expenseInstances = [] }: ExpenseChartProps) {
  const [chartType, setChartType] = useState<"monthly" | "category" | "trend">("monthly");
  const [period, setPeriod] = useState("6"); // months

  // Enhanced data combining expenses and instances correctly with stable state
  const allExpenseData = () => {
    // Garantir que sempre retorna dados consistentes
    if (!expenses.length && !expenseInstances.length) {
      return [];
    }
    
    const combined = [];
    
    // Para expenses de financiamento, usar as instâncias
    expenses.forEach(expense => {
      if (expense.is_financing && expense.financing_total_amount && expense.financing_months_total) {
        // Buscar instâncias relacionadas ao financiamento
        const financingInstances = expenseInstances.filter(
          instance => instance.expense_id === expense.id && instance.instance_type === 'financing'
        );
        
        // Adicionar cada instância de financiamento
        financingInstances.forEach(instance => {
          combined.push({
            id: instance.id,
            title: instance.title,
            amount: instance.amount,
            category_id: expense.category_id,
            due_date: instance.due_date,
            is_paid: instance.is_paid,
            is_financing: true
          });
        });
        
        // Se não há instâncias, calcular valores mensais baseados no total
        if (financingInstances.length === 0) {
          const monthlyAmount = expense.financing_total_amount / expense.financing_months_total;
          const paidMonths = expense.financing_months_paid || 0;
          
          // Adicionar algumas parcelas para visualização
          for (let i = 0; i < Math.min(6, expense.financing_months_total); i++) {
            const monthDate = new Date(expense.due_date);
            monthDate.setMonth(monthDate.getMonth() + i);
            
            combined.push({
              id: `${expense.id}-calc-${i}`,
              title: `${expense.title} - Parcela ${i + 1}`,
              amount: monthlyAmount,
              category_id: expense.category_id,
              due_date: monthDate.toISOString().split('T')[0],
              is_paid: i < paidMonths,
              is_financing: true
            });
          }
        }
      } else {
        // Gastos normais (não financiamento)
        combined.push({
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
          category_id: expense.category_id,
          due_date: expense.due_date,
          is_paid: expense.is_paid,
          is_financing: false
        });
      }
    });
    
    return combined;
  };

  // Monthly expenses data - show last 6 months with data
  const getMonthlyData = () => {
    const allData = allExpenseData();
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), parseInt(period) - 1),
      end: new Date()
    });

    return months.map(month => {
      const monthExpenses = allData.filter(expense => {
        const expenseMonth = startOfMonth(new Date(expense.due_date));
        return expenseMonth.getTime() === month.getTime();
      });

      const total = monthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const paid = monthExpenses.filter(e => e.is_paid).reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const pending = total - paid;

      return {
        month: format(month, "MMM/yy", { locale: ptBR }),
        total,
        paid,
        pending,
        count: monthExpenses.length
      };
    });
  };

  // Category expenses data
  const getCategoryData = () => {
    const allData = allExpenseData();
    const categoryTotals = allData.reduce((acc, expense) => {
      const category = expense.category_id || 'Sem categoria';
      acc[category] = (acc[category] || 0) + (expense.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount: Number(amount) || 0 }))
      .sort((a, b) => (b.amount || 0) - (a.amount || 0));
  };

  // Trend data (paid vs pending over time)
  const getTrendData = () => {
    const allData = allExpenseData();
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), parseInt(period) - 1),
      end: new Date()
    });

    return months.map(month => {
      const monthExpenses = allData.filter(expense => {
        const expenseMonth = startOfMonth(new Date(expense.due_date));
        return expenseMonth.getTime() === month.getTime();
      });

      const paid = monthExpenses.filter(e => e.is_paid).reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const pending = monthExpenses.filter(e => !e.is_paid).reduce((sum, expense) => sum + (expense.amount || 0), 0);

      return {
        month: format(month, "MMM/yy", { locale: ptBR }),
        paid,
        pending,
      };
    });
  };

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();
  const trendData = getTrendData();

  const renderChart = () => {
    switch (chartType) {
      case "monthly":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  ''
                ]}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Bar dataKey="paid" fill="hsl(var(--success))" name="Pago" />
              <Bar dataKey="pending" fill="hsl(var(--warning))" name="Pendente" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "category":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => 
                  typeof percent === 'number' ? `${category} ${(percent * 100).toFixed(0)}%` : `${category}`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  'Total'
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case "trend":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  ''
                ]}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="paid" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                name="Pago"
              />
              <Line 
                type="monotone" 
                dataKey="pending" 
                stroke="hsl(var(--warning))" 
                strokeWidth={3}
                name="Pendente"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const getChartTitle = () => {
    switch (chartType) {
      case "monthly":
        return "Gastos Mensais";
      case "category":
        return "Gastos por Categoria";
      case "trend":
        return "Tendência de Pagamentos";
      default:
        return "Gráfico";
    }
  };

  return (
    <Card className="p-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">{getChartTitle()}</h3>
            <p className="text-sm text-muted-foreground">
              Análise dos seus gastos
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="category">Por Categoria</SelectItem>
              <SelectItem value="trend">Tendência</SelectItem>
            </SelectContent>
          </Select>

          {chartType !== "category" && (
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="w-full">
        {renderChart()}
      </div>

      {chartType === "monthly" && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {monthlyData.reduce((sum, month) => sum + month.total, 0).toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {monthlyData.reduce((sum, month) => sum + month.paid, 0).toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </p>
            <p className="text-sm text-muted-foreground">Pago</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">
              {monthlyData.reduce((sum, month) => sum + month.pending, 0).toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              })}
            </p>
            <p className="text-sm text-muted-foreground">Pendente</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">
              {allExpenseData().length}
            </p>
            <p className="text-sm text-muted-foreground">Gastos</p>
          </div>
        </div>
      )}
    </Card>
  );
}