import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, AlertCircle } from "lucide-react";
import { Expense } from "@/hooks/useExpenses";
import { isBefore, isAfter, addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QuickStatsProps {
  expenses: Expense[];
}

export function QuickStats({ expenses }: QuickStatsProps) {
  const today = new Date();
  
  // Calculate stats
  const totalExpenses = expenses.length;
  const paidCount = expenses.filter(e => e.is_paid).length;
  const pendingCount = totalExpenses - paidCount;
  const overdueCount = expenses.filter(e => !e.is_paid && isBefore(new Date(e.due_date), today)).length;
  const dueSoonCount = expenses.filter(e => 
    !e.is_paid && 
    isAfter(new Date(e.due_date), today) && 
    isBefore(new Date(e.due_date), addDays(today, 7))
  ).length;
  
  const recurrentCount = expenses.filter(e => e.is_recurring).length;
  const categoriesCount = new Set(expenses.map(e => e.category_id).filter(Boolean)).size;
  
  // Next upcoming expense
  const upcomingExpenses = expenses
    .filter(e => !e.is_paid && isAfter(new Date(e.due_date), today))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  
  const nextExpense = upcomingExpenses[0];

  if (totalExpenses === 0) {
    return null;
  }

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Estatísticas Rápidas</h3>
          <p className="text-sm text-muted-foreground">
            Resumo dos seus gastos
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-primary" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-success/5 rounded-lg border border-success/20">
          <p className="text-2xl font-bold text-success">{paidCount}</p>
          <p className="text-xs text-muted-foreground">Pagos</p>
        </div>
        
        <div className="text-center p-3 bg-warning/5 rounded-lg border border-warning/20">
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </div>
        
        <div className="text-center p-3 bg-destructive/5 rounded-lg border border-destructive/20">
          <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
          <p className="text-xs text-muted-foreground">Vencidos</p>
        </div>
        
        <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-2xl font-bold text-primary">{recurrentCount}</p>
          <p className="text-xs text-muted-foreground">Recorrentes</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total de categorias:</span>
          <Badge variant="outline">{categoriesCount}</Badge>
        </div>
        
        {dueSoonCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center">
              <AlertCircle className="h-4 w-4 mr-1 text-warning" />
              Vencem em 7 dias:
            </span>
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              {dueSoonCount}
            </Badge>
          </div>
        )}
        
        {nextExpense && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{nextExpense.title}</p>
                <p className="text-xs text-muted-foreground">
                  Próximo vencimento: {format(new Date(nextExpense.due_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">
                  R$ {nextExpense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <Badge variant="outline" className="text-xs">
                  {nextExpense.category_id || 'Sem categoria'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {paidCount > 0 && totalExpenses > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de pagamento:</span>
            <div className="flex items-center space-x-2">
              <div className={`w-16 h-2 bg-muted rounded-full overflow-hidden`}>
                <div 
                  className="h-full bg-success transition-all duration-500"
                  style={{ width: `${(paidCount / totalExpenses) * 100}%` }}
                />
              </div>
              <span className="font-medium">
                {Math.round((paidCount / totalExpenses) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}