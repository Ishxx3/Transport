"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { User, Mail, Phone, MapPin, Shield, Bell, Eye, EyeOff, Save, Camera, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/lib/i18n/context"

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState(user?.profile?.first_name || "")
  const [lastName, setLastName] = useState(user?.profile?.last_name || "")
  const [email, setEmail] = useState(user?.profile?.email || user?.email || "")
  const [phone, setPhone] = useState(user?.profile?.phone || "")
  const [address, setAddress] = useState(user?.profile?.address || "")

  const initials = `${user?.profile?.first_name?.[0] || ""}${user?.profile?.last_name?.[0] || ""}`.toUpperCase() || "CL"
  const fullName = `${user?.profile?.first_name || ""} ${user?.profile?.last_name || ""}`.trim() || "Client"
  const memberSince = user?.profile?.created_at
    ? new Date(user.profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : ""

  const handleUpdateProfile = async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        address,
      })
      .eq("id", user.id)

    if (updateError) {
      setError(t("profile.error"))
      console.error(updateError)
    } else {
      setSuccess(t("profile.success"))
      refreshUser()
    }

    setIsLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("profile.title")}</h1>
        <p className="text-muted-foreground">{t("profile.subtitle")}</p>
      </div>

      {/* Profile header */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
                {initials}
              </div>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 text-foreground"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
              <p className="text-muted-foreground">{t("profile.member_since")} {memberSince}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {email}
                </span>
                {phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {success && (
        <Alert className="border-success bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full justify-start bg-secondary overflow-x-auto">
          <TabsTrigger
            value="personal"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {t("profile.tabs.personal")}
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {t("profile.tabs.security")}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {t("profile.tabs.notifications")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {t("profile.personal_info_title")}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("profile.personal_info_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground">
                    {t("profile.first_name")}
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground">
                    {t("profile.last_name")}
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  {t("profile.email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="pl-10 bg-input border-border text-foreground opacity-60"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("profile.email_cannot_change")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">
                  {t("profile.phone")}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+229 XX XX XX XX"
                    className="pl-10 bg-input border-border text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground">
                  {t("profile.address")}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Rue de Commerce, Cotonou"
                    className="pl-10 bg-input border-border text-foreground"
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdateProfile}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? t("profile.saving") : t("profile.save")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t("profile.security")} {t("profile.account")}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("profile.change_password")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-foreground">
                  {t("profile.current_password")}
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
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
                <Label htmlFor="newPassword" className="text-foreground">
                  {t("profile.new_password")}
                </Label>
                <Input id="newPassword" type="password" className="bg-input border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">
                  {t("profile.confirm_password")}
                </Label>
                <Input id="confirmPassword" type="password" className="bg-input border-border text-foreground" />
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Save className="h-4 w-4" />
                {t("profile.update_password")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                {t("profile.notification_settings")}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("profile.manage_notifications")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: t("profile.email_notifications"), description: t("profile.email_notifications_desc") },
                { label: t("profile.sms_notifications"), description: t("profile.sms_notifications_desc") },
                { label: t("profile.push_notifications"), description: t("profile.push_notifications_desc") },
                { label: t("profile.delivery_updates"), description: t("profile.delivery_updates_desc") },
                { label: t("profile.offers_promotions"), description: t("profile.offers_promotions_desc") },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked={index < 4} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
