import { usePaymentRequests } from "@/hooks/usePaymentRequests";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const PaymentRequestsManager = () => {
  const { paymentRequests, loading, approvePaymentRequest, rejectPaymentRequest } = usePaymentRequests();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Aprovado</Badge>;
      case 'rejected':  
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Carregando solicitações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle>Solicitações de Pagamento</CardTitle>
        </div>
        <CardDescription>
          Gerencie as solicitações de aprovação de pagamentos compartilhados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentRequests.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma solicitação de pagamento encontrada.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="font-medium">
                      {formatCurrency(request.amount)}
                    </span>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Data do Pagamento: {format(new Date(request.payment_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  <p>Criado em: {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  {request.notes && (
                    <p className="mt-2 p-2 bg-muted rounded text-sm">
                      <strong>Observações:</strong> {request.notes}
                    </p>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => approvePaymentRequest(request.id)}
                      className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                      <span>Aprovar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectPaymentRequest(request.id)}
                      className="flex items-center space-x-1 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      <span>Rejeitar</span>
                    </Button>
                  </div>
                )}

                {request.status === 'approved' && request.approved_at && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    Aprovado em: {format(new Date(request.approved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};