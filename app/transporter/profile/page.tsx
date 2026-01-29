"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Building2,
  Eye,
  EyeOff,
  Save,
  Camera,
  Star,
  CheckCircle2,
} from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

export default function TransporterProfilePage() {
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("transporter_profile.title")}</h1>
        <p className="text-muted-foreground">{t("transporter_profile.subtitle")}</p>
      </div>

      {/* Profile header */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
                KY
              </div>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 text-foreground"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-xl font-bold text-foreground">Kouassi Yao</h2>
                <Badge className="bg-success/20 text-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Vérifié
                </Badge>
              </div>
              <p className="text-muted-foreground">Transport Express • Transporteur depuis Mars 2023</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <span className="text-sm font-medium text-foreground">4.9</span>
                  <span className="text-sm text-muted-foreground">(156 avis)</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">156 missions</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full justify-start bg-secondary overflow-x-auto">
          <TabsTrigger
            value="personal"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Informations
          </TabsTrigger>
          <TabsTrigger
            value="business"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Entreprise
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Sécurité
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Prénom</Label>
                  <Input defaultValue="Kouassi" className="bg-input border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Nom</Label>
                  <Input defaultValue="Yao" className="bg-input border-border text-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    defaultValue="kouassi.yao@email.com"
                    className="pl-10 bg-input border-border text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    defaultValue="+229 97 XX XX XX"
                    className="pl-10 bg-input border-border text-foreground"
                  />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Save className="h-4 w-4" />
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Informations entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-foreground">Nom de l'entreprise</Label>
                <Input defaultValue="Transport Express" className="bg-input border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Numéro RCCM</Label>
                <Input defaultValue="RB-COT-01-XXXX-XXXX" className="bg-input border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Adresse du siège</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    defaultValue="123 Boulevard de la Marina, Cotonou"
                    className="pl-10 bg-input border-border text-foreground"
                  />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Save className="h-4 w-4" />
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Sécurité du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-foreground">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="pr-10 bg-input border-border text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Nouveau mot de passe</Label>
                <Input type="password" className="bg-input border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Confirmer</Label>
                <Input type="password" className="bg-input border-border text-foreground" />
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Save className="h-4 w-4" />
                Mettre à jour
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Préférences de notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: "Nouvelles missions", description: "Être notifié des nouvelles missions disponibles" },
                { label: "Notifications SMS", description: "Recevoir les alertes par SMS" },
                { label: "Mises à jour missions", description: "Changements de statut de vos missions" },
                { label: "Rappels véhicules", description: "Alertes assurance et visite technique" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
