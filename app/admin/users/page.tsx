"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Filter, MoreHorizontal, Eye, Ban, CheckCircle, UserCheck, Wallet, Users, Truck, Download } from "lucide-react"
import { useAdminUsers, suspendUser, activateUser, verifyTransporter } from "@/lib/hooks/use-admin"
import { mutate } from "swr"
import { useLanguage } from "@/lib/i18n/context"

export default function AdminUsersPage() {
  const { t } = useLanguage()
  const [roleFilter, setRoleFilter] = useState("all")

  const roleConfig: Record<string, { label: string; color: string }> = {
    client: { label: t("auth.client"), color: "bg-primary/10 text-primary border-primary/20" },
    transporter: { label: t("auth.transporter"), color: "bg-accent/10 text-accent border-accent/20" },
    moderator: { label: t("moderator.hello").replace(",", ""), color: "bg-warning/10 text-warning border-warning/20" },
    admin: { label: t("admin.welcome"), color: "bg-destructive/10 text-destructive border-destructive/20" },
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: users, isLoading } = useAdminUsers(roleFilter)

  const handleExport = async () => {
    try {
      const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/africa_logistic'
      const token = localStorage.getItem('django_token')
      
      const response = await fetch(`${DJANGO_API_URL}/reports/admin/users.csv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Export error')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Erreur lors de l\'export des utilisateurs.')
    }
  }

  const filteredUsers = users?.filter((user) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.phone?.toLowerCase().includes(search)
    )
  })

  const handleSuspend = async (userId: string) => {
    setLoading(true)
    try {
      await suspendUser(userId)
      mutate(["admin-users", roleFilter])
    } catch (error) {
      console.error("Error suspending user:", error)
    }
    setLoading(false)
  }

  const handleActivate = async (userId: string) => {
    setLoading(true)
    try {
      await activateUser(userId)
      mutate(["admin-users", roleFilter])
    } catch (error) {
      console.error("Error activating user:", error)
    }
    setLoading(false)
  }

  const handleVerify = async (userId: string) => {
    setLoading(true)
    try {
      await verifyTransporter(userId)
      mutate(["admin-users", roleFilter])
    } catch (error) {
      console.error("Error verifying user:", error)
    }
    setLoading(false)
  }

  // Stats
  const totalClients = users?.filter((u) => u.role === "client").length || 0
  const totalTransporters = users?.filter((u) => u.role === "transporter").length || 0
  const pendingVerification = users?.filter((u) => u.role === "transporter" && !u.is_verified).length || 0
  const suspendedUsers = users?.filter((u) => !u.is_active).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">Gérez les comptes clients, transporteurs et modérateurs</p>
        </div>
        <Button 
          variant="outline" 
          className="border-border text-muted-foreground hover:text-foreground"
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{totalClients}</p>
                <p className="text-xs text-muted-foreground">Clients</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{totalTransporters}</p>
                <p className="text-xs text-muted-foreground">Transporteurs</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingVerification}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{suspendedUsers}</p>
                <p className="text-xs text-muted-foreground">Suspendus</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Ban className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-background border-border">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="transporter">Transporteurs</SelectItem>
                <SelectItem value="moderator">Modérateurs</SelectItem>
                <SelectItem value="admin">Administrateurs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground">{filteredUsers?.length || 0} utilisateur(s)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("admin_users.no_users").replace("Aucun ", "").replace("utilisateur", "Utilisateur")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("admin_users.role")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {"Portefeuille"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("admin_users.status")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("admin_users.registered")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("admin_users.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers?.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={roleConfig[user.role]?.color || "bg-muted"}>
                          {roleConfig[user.role]?.label || user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {((user.wallet as any)?.[0]?.balance || 0).toLocaleString()} FCFA
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <Badge
                            className={
                              user.is_active
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            }
                          >
                            {user.is_active ? t("admin_users.active") : t("admin_users.suspended")}
                          </Badge>
                          {user.role === "transporter" && !user.is_verified && (
                            <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">{t("admin_users.not_verified")}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem
                              className="text-muted-foreground hover:text-foreground focus:text-foreground"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowUserDialog(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {t("admin_users.view")} {"Mon profil".toLowerCase()}
                            </DropdownMenuItem>
                            {user.role === "transporter" && !user.is_verified && (
                              <DropdownMenuItem
                                className="text-success focus:text-success"
                                onClick={() => handleVerify(user.id)}
                                disabled={loading}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                {t("admin_users.verify")} {"S'inscrire".toLowerCase()}
                              </DropdownMenuItem>
                            )}
                            {user.is_active ? (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleSuspend(user.id)}
                                disabled={loading}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                {t("admin_users.suspend")}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-success focus:text-success"
                                onClick={() => handleActivate(user.id)}
                                disabled={loading}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t("admin_users.activate")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Profil utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedUser.first_name?.[0]}
                    {selectedUser.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <Badge className={roleConfig[selectedUser.role]?.color}>{roleConfig[selectedUser.role]?.label}</Badge>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm text-foreground">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Téléphone</span>
                  <span className="text-sm text-foreground">{selectedUser.phone || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ville</span>
                  <span className="text-sm text-foreground">{selectedUser.city || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pays</span>
                  <span className="text-sm text-foreground">{selectedUser.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Portefeuille</span>
                  <span className="text-sm font-semibold text-success">
                    {((selectedUser.wallet as any)?.[0]?.balance || 0).toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Inscrit le</span>
                  <span className="text-sm text-foreground">
                    {new Date(selectedUser.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)} className="bg-transparent border-border">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
