"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, MapPin, Calendar, Star, Download, Eye } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/context"

const history = [
  {
    id: "TR-2024-098",
    from: "Parakou",
    to: "Cotonou",
    status: "delivered",
    date: "10 Jan 2025",
    amount: "30 000 FCFA",
    transporter: "Speed Delivery",
    rating: 5,
  },
  {
    id: "TR-2024-092",
    from: "Cotonou",
    to: "Lagos",
    status: "delivered",
    date: "05 Jan 2025",
    amount: "150 000 FCFA",
    transporter: "Trans Africa",
    rating: 4,
  },
  {
    id: "TR-2024-088",
    from: "Porto-Novo",
    to: "Lomé",
    status: "delivered",
    date: "28 Dec 2024",
    amount: "45 000 FCFA",
    transporter: "Express Togo",
    rating: 5,
  },
  {
    id: "TR-2024-085",
    from: "Cotonou",
    to: "Niamey",
    status: "delivered",
    date: "20 Dec 2024",
    amount: "180 000 FCFA",
    transporter: "Sahel Transport",
    rating: 4,
  },
  {
    id: "TR-2024-080",
    from: "Abomey-Calavi",
    to: "Cotonou",
    status: "delivered",
    date: "15 Dec 2024",
    amount: "15 000 FCFA",
    transporter: "Local Express",
    rating: 5,
  },
]

export default function HistoryPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("history.title")}</h1>
          <p className="text-muted-foreground">{t("history.subtitle")}</p>
        </div>
        <Button variant="outline" className="gap-2 border-border text-foreground bg-transparent">
          <Download className="h-4 w-4" />
          {t("history.export")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">24</p>
            <p className="text-sm text-muted-foreground">{t("history.total_deliveries")}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-success">96%</p>
            <p className="text-sm text-muted-foreground">{t("history.success_rate")}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">4.8</p>
            <p className="text-sm text-muted-foreground">{t("history.average_rating")}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">1.2M</p>
            <p className="text-sm text-muted-foreground">{t("history.total_transported")}</p>
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
                placeholder={t("history.search")}
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
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
                      {item.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {t("history.transporter")}: <span className="text-foreground">{item.transporter}</span>
                    </span>
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
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                  <p className="text-lg font-bold text-foreground">{item.amount}</p>
                  <Link href={`/client/requests/${item.id}`}>
                    <Button variant="outline" size="sm" className="gap-1 border-border text-foreground bg-transparent">
                      <Eye className="h-4 w-4" />
                      {t("history.view")}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
