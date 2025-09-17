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
import { ArrowLeft, Camera, User, Mail } from "lucide-react";
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
    <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl animate-fade-in">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 space-y-3 sm:space-y-0 gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto min-w-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground p-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Meu Perfil</h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground truncate">Gerencie suas informações pessoais</p>
          </div>
        </div>
        
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} size="sm" className="w-full sm:w-auto flex-shrink-0">
            Editar Perfil
          </Button>
        )}
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Avatar Section - Mobile Friendly */}
        <Card className="lg:col-span-1 animate-scale-in">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Avatar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="relative inline-block">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mx-auto hover-scale transition-transform duration-200">
                <AvatarImage 
                  src={profile?.avatar_url} 
                  alt="Avatar do usuário" 
                />
                <AvatarFallback className="text-lg sm:text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
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
                <div className="animate-pulse">Fazendo upload...</div>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              {profile?.display_name || user?.email}
            </div>
          </CardContent>
        </Card>

        {/* Profile Information - Mobile Responsive */}
        <Card className="lg:col-span-2 animate-slide-in-right">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="display_name" className="text-sm font-medium">Nome de Exibição</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Como você quer ser chamado"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">Nome de Usuário</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Seu nome de usuário único"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Seu nome completo"
                    className="w-full"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-sm font-medium">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birth_date" className="text-sm font-medium">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep" className="text-sm font-medium">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">Endereço</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, bairro, cidade, estado"
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
                    Salvar Alterações
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full sm:w-auto"
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
              <div className="space-y-4 sm:space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome de Exibição</Label>
                    <p className="mt-1 text-sm sm:text-base">{profile?.display_name || "Não informado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome de Usuário</Label>
                    <p className="mt-1 text-sm sm:text-base">{profile?.username || "Não informado"}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                  <p className="mt-1 text-sm sm:text-base">{profile?.full_name || "Não informado"}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">CPF</Label>
                    <p className="mt-1 text-sm sm:text-base">{profile?.cpf || "Não informado"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data de Nascimento</Label>
                    <p className="mt-1 text-sm sm:text-base">
                      {profile?.birth_date 
                        ? format(new Date(profile.birth_date), "dd/MM/yyyy", { locale: ptBR })
                        : "Não informado"
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">CEP</Label>
                  <p className="mt-1 text-sm sm:text-base">{profile?.cep || "Não informado"}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Endereço</Label>
                  <p className="mt-1 text-sm sm:text-base">{profile?.address || "Não informado"}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">E-mail</Label>
                  <p className="mt-1 text-sm sm:text-base font-mono">{user?.email}</p>
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