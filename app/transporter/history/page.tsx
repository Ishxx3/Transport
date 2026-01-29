"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, MapPin, Calendar, Star, Download, CheckCircle2 } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

const history = [
  {
    id: "TR-2024-098",
    from: "Parakou",
    to: "Cotonou",
    completedAt: "10 Jan 2025",
    amount: "27 000 FCFA",
    rating: 5,
    client: "Amina Sow",
  },
  {
    id: "TR-2024-095",
    from: "Lomé",
    to: "Cotonou",
    completedAt: "08 Jan 2025",
    amount: "40 500 FCFA",
    rating: 5,
    client: "Pierre Mensah",
  },
  {
    id: "TR-2024-090",
    from: "Cotonou",
    to: "Lagos",
    completedAt: "05 Jan 2025",
    amount: "67 500 FCFA",
    rating: 4,
    client: "Fatou Diallo",
  },
  {
    id: "TR-2024-085",
    from: "Accra",
    to: "Lomé",
    completedAt: "02 Jan 2025",
    amount: "54 000 FCFA",
    rating: 5,
    client: "Kofi Asante",
  },
]

export default function TransporterHistoryPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("transporter_history.title")}</h1>
          <p className="text-muted-foreground">{t("transporter_history.subtitle")}</p>
        </div>
        <Button variant="outline" className="gap-2 border-border text-foreground bg-transparent">
          <Download className="h-4 w-4" />
          {t("transporter_history.export")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">156</p>
            <p className="text-sm text-muted-foreground">{t("transporter_history.total_missions")}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-success">98%</p>
            <p className="text-sm text-muted-foreground">{t("history.success_rate")}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">4.9</p>
            <p className="text-sm text-muted-foreground">{t("history.average_rating")}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">5.8M</p>
            <p className="text-sm text-muted-foreground">{t("transporter_history.earned")}</p>
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
                placeholder={t("transporter_history.search")}
                className="pl-10 bg-input border-border text-foreground"
              />
            </div>
            <Button variant="outline" className="gap-2 border-border text-foreground bg-transparent">
              <Filter className="h-4 w-4" />
              {t("history.filter")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History list */}
      <div className="space-y-4">
        {history.map((item) => (
          <Card key={item.id} className="border-border bg-card hover:border-primary/30 transition-colors">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{item.id}</span>
                      <Badge className="bg-success/20 text-success">{"Livré"}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {item.from} → {item.to}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {item.completedAt}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{t("transporter_history.client")}: {item.client}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                  <p className="text-lg font-bold text-success">{item.amount}</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < item.rating ? "text-warning fill-warning" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
