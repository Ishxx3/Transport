"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  Filter,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  TrendingUp,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

export default function AdminWalletsPage() {
  const { t } = useLanguage()

  const mockWallets = [
  {
    id: "1",
    user: { first_name: "Jean", last_name: "Dupont", role: "client", email: "jean@email.com" },
    balance: 450000,
    total_credits: 850000,
    total_debits: 400000,
    last_transaction: "2024-03-15",
  },
  {
    id: "2",
    user: { first_name: "Kouassi", last_name: "Yao", role: "transporter", email: "kouassi@email.com" },
    balance: 1250000,
    total_credits: 2500000,
    total_debits: 1250000,
    last_transaction: "2024-03-16",
  },
  {
    id: "3",
    user: { first_name: "Marie", last_name: "Koné", role: "client", email: "marie@email.com" },
    balance: 125000,
    total_credits: 500000,
    total_debits: 375000,
    last_transaction: "2024-03-14",
  },
  {
    id: "4",
    user: { first_name: "Mamadou", last_name: "Diallo", role: "transporter", email: "mamadou@email.com" },
    balance: 780000,
    total_credits: 1500000,
    total_debits: 720000,
    last_transaction: "2024-03-16",
  },
]

const mockTransactions = [
  {
    id: "1",
    type: "credit",
    amount: 100000,
    user: "Jean Dupont",
    description: "Recharge portefeuille",
    date: "2024-03-16 14:30",
  },
  {
    id: "2",
    type: "debit",
    amount: 45000,
    user: "Marie Koné",
    description: "Paiement transport REQ-001",
    date: "2024-03-16 12:15",
  },
  {
    id: "3",
    type: "credit",
    amount: 85000,
    user: "Kouassi Yao",
    description: "Commission transport",
    date: "2024-03-16 11:00",
  },
  {
    id: "4",
    type: "penalty",
    amount: 15000,
    user: "Amadou Traoré",
    description: "Pénalité annulation",
    date: "2024-03-15 18:45",
  },
]

  const roleConfig: Record<string, { label: string; color: string }> = {
    client: { label: t("auth.client"), color: "bg-primary/10 text-primary border-primary/20" },
    transporter: { label: t("auth.transporter"), color: "bg-accent/10 text-accent border-accent/20" },
  }

  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<(typeof mockWallets)[0] | null>(null)
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit")
  const [adjustAmount, setAdjustAmount] = useState("")

  const filteredWallets = mockWallets.filter((w) => {
    const matchesSearch =
      !searchQuery ||
      w.user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === "all" || w.user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const totalBalance = mockWallets.reduce((acc, w) => acc + w.balance, 0)
  const clientBalance = mockWallets.filter((w) => w.user.role === "client").reduce((acc, w) => acc + w.balance, 0)
  const transporterBalance = mockWallets
    .filter((w) => w.user.role === "transporter")
    .reduce((acc, w) => acc + w.balance, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin_wallets.title")}</h1>
        <p className="text-muted-foreground">{t("admin_wallets.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{(totalBalance / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-muted-foreground">{t("admin_wallets.total_balance")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{(clientBalance / 1000000).toFixed(2)}M</p>
                <p className="text-xs text-muted-foreground">{t("admin_wallets.client_balance")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{(transporterBalance / 1000000).toFixed(2)}M</p>
                <p className="text-xs text-muted-foreground">{t("admin_wallets.transporter_balance")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{mockTransactions.length}</p>
                <p className="text-xs text-muted-foreground">{t("admin_wallets.today_transactions")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("admin_wallets.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-background border-border">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t("admin_wallets.role")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("requests.all")}</SelectItem>
                    <SelectItem value="client">{t("auth.client")}</SelectItem>
                    <SelectItem value="transporter">{t("auth.transporter")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">{t("admin_wallets.title")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {t("admin_wallets.user")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {t("admin_wallets.balance")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {t("admin_wallets.total_credits")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {t("admin_wallets.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredWallets.map((wallet) => (
                      <tr key={wallet.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {wallet.user.first_name[0]}
                                {wallet.user.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {wallet.user.first_name} {wallet.user.last_name}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge className={roleConfig[wallet.user.role]?.color}>
                                  {roleConfig[wallet.user.role]?.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-foreground">
                            {wallet.balance.toLocaleString()} FCFA
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-success">+{wallet.total_credits.toLocaleString()} FCFA</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-success text-success hover:bg-success/10 bg-transparent h-8"
                              onClick={() => {
                                setSelectedWallet(wallet)
                                setAdjustType("credit")
                                setShowAdjustDialog(true)
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {t("admin_wallets.credit")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive/10 bg-transparent h-8"
                              onClick={() => {
                                setSelectedWallet(wallet)
                                setAdjustType("debit")
                                setShowAdjustDialog(true)
                              }}
                            >
                              <Minus className="h-3 w-3 mr-1" />
                              {t("admin_wallets.debit")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">{t("admin_wallets.recent_transactions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${
                      tx.type === "credit"
                        ? "bg-success/10"
                        : tx.type === "penalty"
                          ? "bg-warning/10"
                          : "bg-destructive/10"
                    }`}
                  >
                    {tx.type === "credit" ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight
                        className={`h-4 w-4 ${tx.type === "penalty" ? "text-warning" : "text-destructive"}`}
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.user}</p>
                    <p className="text-xs text-muted-foreground">{tx.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === "credit"
                        ? "text-success"
                        : tx.type === "penalty"
                          ? "text-warning"
                          : "text-destructive"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "-"}
                    {tx.amount.toLocaleString()} FCFA
                  </p>
                  <p className="text-xs text-muted-foreground">{tx.date.split(" ")[1]}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {adjustType === "credit" ? t("admin_wallets.credit") : t("admin_wallets.debit")} {t("admin_wallets.adjust_wallet")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedWallet && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-foreground">
                  {selectedWallet.user.first_name} {selectedWallet.user.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("admin_wallets.current_balance")}: {selectedWallet.balance.toLocaleString()} FCFA
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-foreground">{t("admin_wallets.amount")} (FCFA)</Label>
              <Input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Ex: 50000"
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdjustDialog(false)}
              className="bg-transparent border-border"
            >
              {t("requests.cancel")}
            </Button>
            <Button
              onClick={() => {
                setShowAdjustDialog(false)
                setAdjustAmount("")
              }}
              className={
                adjustType === "credit" ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"
              }
            >
              {adjustType === "credit" ? t("admin_wallets.credit") : t("admin_wallets.debit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
