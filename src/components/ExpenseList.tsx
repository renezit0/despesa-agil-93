import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle, Clock, Repeat, Trash2, Filter } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Expense } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/use-toast";

interface ExpenseListProps {
  expenses: Expense[];
  onTogglePaid: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

export function ExpenseList({ expenses, onTogglePaid, onDeleteExpense }: ExpenseListProps) {
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();

  const today = new Date();

  const filteredExpenses = expenses.filter((expense) => {
    // Status filter
    let statusMatch = true;
    switch (filter) {
      case "paid":
        statusMatch = expense.is_paid;
        break;
      case "pending":
        statusMatch = !expense.is_paid;
        break;
      case "overdue":
        statusMatch = !expense.is_paid && isBefore(new Date(expense.due_date), today);
        break;
    }

    // Category filter
    const categoryMatch = categoryFilter === "all" || expense.category_id === categoryFilter;

    return statusMatch && categoryMatch;
  });

  const categories = Array.from(new Set(expenses.map(e => e.category_id).filter(Boolean)));

  const getStatusBadge = (expense: Expense) => {
    if (expense.is_paid) {
      return <Badge variant="secondary" className="bg-success/10 text-success">Pago</Badge>;
    }
    
    if (isBefore(new Date(expense.due_date), today)) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    
    if (isBefore(new Date(expense.due_date), addDays(today, 3))) {
      return <Badge variant="secondary" className="bg-warning/10 text-warning">Vence em breve</Badge>;
    }
    
    return <Badge variant="outline">Pendente</Badge>;
  };

  const handleTogglePaid = (expense: Expense) => {
    onTogglePaid(expense.id);
    toast({
      title: expense.is_paid ? "Marcado como não pago" : "Marcado como pago",
      description: `${expense.title} - R$ ${expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    });
  };

  const handleDelete = (expense: Expense) => {
    onDeleteExpense(expense.id);
    toast({
      title: "Gasto removido",
      description: `${expense.title} foi removido da lista.`,
    });
  };

  return (
    <Card className="p-6 animate-slide-up">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Meus Gastos</h3>
            <p className="text-sm text-muted-foreground">
              {filteredExpenses.length} gasto(s) encontrado(s)
            </p>
          </div>
          <Filter className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="overdue">Vencidos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum gasto encontrado</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 animate-fade-in"
            >
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={expense.is_paid}
                  onCheckedChange={() => handleTogglePaid(expense)}
                  className="data-[state=checked]:bg-success data-[state=checked]:border-success"
                />
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium ${expense.is_paid ? 'line-through text-muted-foreground' : ''}`}>
                      {expense.title}
                    </h4>
                    {expense.is_recurring && (
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{expense.category_id || 'Sem categoria'}</span>
                    <span>•</span>
                    <span>Vence: {format(new Date(expense.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                    {expense.description && (
                      <>
                        <span>•</span>
                        <span>{expense.description}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className={`font-semibold ${expense.is_paid ? 'text-success' : 'text-destructive'}`}>
                    R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {getStatusBadge(expense)}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(expense)}
                  className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}