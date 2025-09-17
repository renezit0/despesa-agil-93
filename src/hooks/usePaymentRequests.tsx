import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export interface PaymentRequest {
  id: string;
  expense_id: string;
  requester_user_id: string;
  approver_user_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export const usePaymentRequests = () => {
  const { user } = useAuth();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPaymentRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .or(`requester_user_id.eq.${user.id},approver_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentRequests((data || []) as PaymentRequest[]);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      toast({
        title: "Erro ao carregar solicitações",
        description: "Não foi possível carregar as solicitações de pagamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPaymentRequest = async (requestData: {
    expense_id: string;
    approver_user_id: string;
    amount: number;
    payment_date: string;
    notes?: string;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          ...requestData,
          requester_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setPaymentRequests(prev => [...prev, data as PaymentRequest]);
      toast({
        title: "Solicitação enviada",
        description: "Solicitação de pagamento foi enviada para aprovação.",
      });

      return data;
    } catch (error) {
      console.error('Error creating payment request:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: "Não foi possível enviar a solicitação de pagamento.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const approvePaymentRequest = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPaymentRequests(prev => prev.map(request => 
        request.id === id ? (data as PaymentRequest) : request
      ));

      toast({
        title: "Pagamento aprovado",
        description: "Solicitação de pagamento foi aprovada.",
      });

      return data;
    } catch (error) {
      console.error('Error approving payment request:', error);
      toast({
        title: "Erro ao aprovar pagamento",
        description: "Não foi possível aprovar a solicitação.",
        variant: "destructive",
      });
    }
  };

  const rejectPaymentRequest = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPaymentRequests(prev => prev.map(request => 
        request.id === id ? (data as PaymentRequest) : request
      ));

      toast({
        title: "Pagamento rejeitado",
        description: "Solicitação de pagamento foi rejeitada.",
      });

      return data;
    } catch (error) {
      console.error('Error rejecting payment request:', error);
      toast({
        title: "Erro ao rejeitar pagamento",
        description: "Não foi possível rejeitar a solicitação.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPaymentRequests();
  }, [user]);

  return {
    paymentRequests,
    loading,
    createPaymentRequest,
    approvePaymentRequest,
    rejectPaymentRequest,
    refetchPaymentRequests: fetchPaymentRequests,
  };
};