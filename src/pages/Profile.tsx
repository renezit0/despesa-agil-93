import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Camera, User, Mail, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, uploading, updateProfile, uploadAvatar } = useProfile();
  
  const [formData, setFormData] = useState({
    display_name: "",
    username: "",
    full_name: "",
    cpf: "",
    birth_date: "",
    address: "",
    cep: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  // Sincronizar formData quando o profile é carregado
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        username: profile.username || "",
        full_name: profile.full_name || "",
        cpf: profile.cpf || "",
        birth_date: profile.birth_date || "",
        address: profile.address || "",
        cep: profile.cep || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    try {
      await uploadAvatar(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
          </div>
        </div>
        
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Editar Perfil
          </Button>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Avatar Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Avatar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="relative inline-block">
              <Avatar className="h-32 w-32 mx-auto">
                <AvatarImage 
                  src={profile?.avatar_url} 
                  alt="Avatar do usuário" 
                />
                <AvatarFallback className="text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            {uploading && (
              <div className="text-sm text-muted-foreground">
                Fazendo upload...
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              {profile?.display_name || user?.email}
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Nome de Exibição</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Como você quer ser chamado"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Nome de Usuário</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Seu nome de usuário único"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, bairro, cidade, estado"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={uploading}>
                    Salvar Alterações
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        display_name: profile?.display_name || "",
                        username: profile?.username || "",
                        full_name: profile?.full_name || "",
                        cpf: profile?.cpf || "",
                        birth_date: profile?.birth_date || "",
                        address: profile?.address || "",
                        cep: profile?.cep || "",
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome de Exibição</Label>
                    <p className="mt-1">{profile?.display_name || "Não informado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome de Usuário</Label>
                    <p className="mt-1">{profile?.username || "Não informado"}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                  <p className="mt-1">{profile?.full_name || "Não informado"}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">CPF</Label>
                    <p className="mt-1">{profile?.cpf || "Não informado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data de Nascimento</Label>
                    <p className="mt-1">
                      {profile?.birth_date 
                        ? format(new Date(profile.birth_date), "dd/MM/yyyy", { locale: ptBR })
                        : "Não informado"
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Endereço</Label>
                  <p className="mt-1">{profile?.address || "Não informado"}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">CEP</Label>
                  <p className="mt-1">{profile?.cep || "Não informado"}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">E-mail</Label>
                  <p className="mt-1">{user?.email}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;