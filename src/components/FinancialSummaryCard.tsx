import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

interface FinancialSummaryCardProps {
  title: string;
  amount: number;
  icon: "income" | "expense" | "balance" | "pending";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const iconMap = {
  income: TrendingUp,
  expense: TrendingDown,
  balance: DollarSign,
  pending: Calendar,
};

const colorMap = {
  income: "text-success border-success/20 bg-success/5",
  expense: "text-destructive border-destructive/20 bg-destructive/5",
  balance: "text-primary border-primary/20 bg-primary/5",
  pending: "text-warning border-warning/20 bg-warning/5",
};

export function FinancialSummaryCard({ title, amount, icon, trend }: FinancialSummaryCardProps) {
  const Icon = iconMap[icon];
  const colorClass = colorMap[icon];

  return (
    <Card className="p-6 border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold">
              R$ {Math.abs(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            {trend && (
              <div className={`flex items-center text-sm ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {trend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="ml-1">{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
        </div>
        <div className={`p-4 rounded-full border-2 ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}