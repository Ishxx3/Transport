"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ThumbsUp, MessageSquare } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

const ratings = [
  {
    id: "TR-2024-098",
    transporter: "Speed Delivery",
    transporterInitials: "SD",
    date: "10 Jan 2025",
    rating: 5,
    comment: "Excellent service, livraison rapide et chauffeur très professionnel.",
    route: "Parakou → Cotonou",
  },
  {
    id: "TR-2024-092",
    transporter: "Trans Africa",
    transporterInitials: "TA",
    date: "05 Jan 2025",
    rating: 4,
    comment: "Bonne livraison, léger retard mais marchandise en bon état.",
    route: "Cotonou → Lagos",
  },
  {
    id: "TR-2024-088",
    transporter: "Express Togo",
    transporterInitials: "ET",
    date: "28 Dec 2024",
    rating: 5,
    comment: "Service impeccable du début à la fin. Je recommande vivement.",
    route: "Porto-Novo → Lomé",
  },
]

const pendingRatings = [
  {
    id: "TR-2024-100",
    transporter: "Logistics Pro",
    transporterInitials: "LP",
    date: "12 Jan 2025",
    route: "Cotonou → Accra",
  },
]

export default function RatingsPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("ratings.title")}</h1>
        <p className="text-muted-foreground">{t("ratings.subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-5 w-5 text-warning fill-warning" />
              <span className="text-2xl font-bold text-foreground">4.8</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("ratings.average_given")}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">24</p>
            <p className="text-sm text-muted-foreground">{t("ratings.given")}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">1</p>
            <p className="text-sm text-muted-foreground">{t("ratings.pending")}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">95%</p>
            <p className="text-sm text-muted-foreground">{t("ratings.satisfaction_rate")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending ratings */}
      {pendingRatings.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-warning" />
              {t("ratings.pending_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRatings.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {item.transporterInitials}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.transporter}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.route} • {item.date}
                    </p>
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <Star className="h-4 w-4" />
                  {t("ratings.rate")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Given ratings */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t("ratings.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="p-4 rounded-xl bg-secondary/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {rating.transporterInitials}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{rating.transporter}</p>
                    <p className="text-sm text-muted-foreground">{rating.route}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < rating.rating ? "text-warning fill-warning" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rating.date}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{rating.comment}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                  {rating.id}
                </Badge>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ThumbsUp className="h-3 w-3" />
                  Utile
                </button>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-3 w-3" />
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
