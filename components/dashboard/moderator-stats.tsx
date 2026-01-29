import { StatCard } from "./stat-card"
import { Package, CheckCircle, Clock, Truck, AlertTriangle, TrendingUp } from "lucide-react"

export function ModeratorStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="En attente"
        value="24"
        change="8 urgentes"
        changeType="negative"
        icon={Clock}
        iconColor="bg-warning/10 text-warning"
      />
      <StatCard
        title="Traitées aujourd'hui"
        value="47"
        change="+15% vs hier"
        changeType="positive"
        icon={CheckCircle}
        iconColor="bg-success/10 text-success"
      />
      <StatCard
        title="Missions en cours"
        value="18"
        change="3 avec retard"
        changeType="neutral"
        icon={Truck}
        iconColor="bg-primary/10 text-primary"
      />
      <StatCard
        title="Litiges ouverts"
        value="5"
        change="2 nouveaux"
        changeType="negative"
        icon={AlertTriangle}
        iconColor="bg-destructive/10 text-destructive"
      />
      <StatCard
        title="Taux validation"
        value="92%"
        change="+3% ce mois"
        changeType="positive"
        icon={TrendingUp}
        iconColor="bg-accent/10 text-accent"
      />
      <StatCard
        title="Temps moyen"
        value="12 min"
        change="-2 min vs semaine"
        changeType="positive"
        icon={Package}
        iconColor="bg-primary/10 text-primary"
      />
    </div>
  )
}
