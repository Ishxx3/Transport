"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Filter, Users, Truck, Eye, Phone, Mail, MapPin, Star, Package, Wallet } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

export default function ModeratorUsersPage() {
  const { t } = useLanguage()

  const mockUsers = [
  {
    id: "1",
    first_name: "Jean",
    last_name: "Dupont",
    email: "jean@email.com",
    phone: "+225 01 23 45 67",
    role: "client",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    requests_count: 12,
    wallet_balance: 450000,
    created_at: "2024-01-15",
  },
  {
    id: "2",
    first_name: "Kouassi",
    last_name: "Yao",
    email: "kouassi@email.com",
    phone: "+225 07 12 34 56",
    role: "transporter",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    rating: 4.8,
    missions_count: 156,
    wallet_balance: 1250000,
    created_at: "2024-01-20",
  },
  {
    id: "3",
    first_name: "Marie",
    last_name: "Koné",
    email: "marie@email.com",
    phone: "+221 78 987 65 43",
    role: "client",
    city: "Dakar",
    country: "Sénégal",
    requests_count: 8,
    wallet_balance: 125000,
    created_at: "2024-02-10",
  },
  {
    id: "4",
    first_name: "Mamadou",
    last_name: "Diallo",
    email: "mamadou@email.com",
    phone: "+221 77 123 45 67",
    role: "transporter",
    city: "Dakar",
    country: "Sénégal",
    rating: 4.5,
    missions_count: 89,
    wallet_balance: 780000,
    created_at: "2024-02-15",
  },
]

  const roleConfig: Record<string, { label: string; color: string }> = {
    client: { label: t("auth.client"), color: "bg-primary/10 text-primary border-primary/20" },
    transporter: { label: t("auth.transporter"), color: "bg-accent/10 text-accent border-accent/20" },
  }

  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<(typeof mockUsers)[0] | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === "all" || u.role === roleFilter

    return matchesSearch && matchesRole
  })

  const totalClients = mockUsers.filter((u) => u.role === "client").length
  const totalTransporters = mockUsers.filter((u) => u.role === "transporter").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("moderator_users.title")}</h1>
        <p className="text-muted-foreground">{t("moderator_users.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{mockUsers.length}</p>
                <p className="text-xs text-muted-foreground">{t("common.total")} {t("moderator_users.title").toLowerCase()}</p>
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
                <p className="text-2xl font-bold text-foreground">{totalClients}</p>
                <p className="text-xs text-muted-foreground">{t("moderator_users.clients")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{totalTransporters}</p>
                <p className="text-xs text-muted-foreground">{t("moderator_users.transporters")}</p>
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
                <p className="text-2xl font-bold text-foreground">4.6</p>
                <p className="text-xs text-muted-foreground">{t("ratings.average_rating")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-warning fill-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("moderator_users.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-background border-border">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("requests.all")}</SelectItem>
                <SelectItem value="client">{t("moderator_users.clients")}</SelectItem>
                <SelectItem value="transporter">{t("moderator_users.transporters")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground">{filteredUsers.length} {filteredUsers.length === 1 ? t("moderator_users.utilisateur_singular") : t("moderator_users.utilisateur_plural")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("moderator_users.utilisateur")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("moderator_users.role_label")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("common.location")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("moderator_users.activity")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {user.first_name[0]}
                            {user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={roleConfig[user.role]?.color}>{roleConfig[user.role]?.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-foreground">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {user.city}, {user.country}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "client" ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span className="text-foreground">{user.requests_count} {t("moderator_users.requests_count")}</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{user.missions_count} {t("common.missions")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-warning fill-warning" />
                            <span className="text-xs text-foreground">{user.rating}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border bg-transparent"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowDialog(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t("moderator_users.view")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("moderator_users.user_profile")}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedUser.first_name[0]}
                    {selectedUser.last_name[0]}
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
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{selectedUser.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {selectedUser.city}, {selectedUser.country}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-success">
                    {selectedUser.wallet_balance.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-border bg-transparent">
                  <Phone className="h-4 w-4 mr-2" />
                  {t("moderator_users.call")}
                </Button>
                <Button variant="outline" className="flex-1 border-border bg-transparent">
                  <Mail className="h-4 w-4 mr-2" />
                  {t("common.email")}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="bg-transparent border-border">
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
