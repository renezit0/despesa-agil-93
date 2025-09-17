import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  contact_name: string;
  contact_email?: string;
  relationship?: string;
  created_at: string;
  updated_at: string;
}

export const useContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContacts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('contact_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Erro ao carregar contatos",
        description: "Não foi possível carregar seus contatos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (contactData: {
    contact_name: string;
    contact_email?: string;
    relationship?: string;
    contact_user_id?: string;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          contact_user_id: contactData.contact_user_id || crypto.randomUUID(),
          contact_name: contactData.contact_name,
          contact_email: contactData.contact_email,
          relationship: contactData.relationship,
        })
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => [...prev, data]);
      toast({
        title: "Contato adicionado",
        description: `${contactData.contact_name} foi adicionado aos seus contatos.`,
      });

      return data;
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Erro ao adicionar contato",
        description: "Não foi possível adicionar o contato.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => prev.map(contact => 
        contact.id === id ? data : contact
      ));

      toast({
        title: "Contato atualizado",
        description: "Contato foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Erro ao atualizar contato",
        description: "Não foi possível atualizar o contato.",
        variant: "destructive",
      });
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast({
        title: "Contato removido",
        description: "Contato foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Erro ao remover contato",
        description: "Não foi possível remover o contato.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  return {
    contacts,
    loading,
    addContact,
    updateContact,
    deleteContact,
    refetchContacts: fetchContacts,
  };
};