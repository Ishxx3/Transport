"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  MapPin,
  Truck,
  Navigation,
  Phone,
  Clock,
  RefreshCw,
  Filter,
  MessageSquare,
  Wifi,
  WifiOff,
  Gauge,
  AlertTriangle,
} from "lucide-react"
import { TrackingMap } from "@/components/tracking/tracking-map"
import { TrackerDevicesList } from "@/components/tracking/tracker-devices-list"
import { useTrackerDevices, useAllTrackerPositions, useTrackerAlerts } from "@/lib/hooks/use-tracker"
import type { IOPGPSDevice } from "@/lib/services/a-tracker"
import { useLanguage } from "@/lib/i18n/context"

// Missions de démonstration
const mockActiveMissions = [
  {
    id: "MIS-001",
    transporter: { first_name: "Kouassi", last_name: "Yao", phone: "+225 07 12 34 56" },
    client: { first_name: "Jean", last_name: "Dupont", phone: "+225 01 23 45 67" },
    pickup_city: "Abidjan",
    pickup_lat: 5.3600,
    pickup_lng: -4.0083,
    delivery_city: "Accra",
    delivery_lat: 5.6037,
    delivery_lng: -0.1870,
    status: "in_transit",
    progress: 65,
    eta: "2h 30min",
    last_update: "Il y a 5 min",
    vehicle: "Camion - AB 1234 CI",
    tracker_imei: "123456789012345",
  },
  {
    id: "MIS-002",
    transporter: { first_name: "Mamadou", last_name: "Diallo", phone: "+221 77 123 45 67" },
    client: { first_name: "Marie", last_name: "Koné", phone: "+221 78 987 65 43" },
    pickup_city: "Dakar",
    pickup_lat: 14.7167,
    pickup_lng: -17.4677,
    delivery_city: "Bamako",
    delivery_lat: 12.6392,
    delivery_lng: -8.0029,
    status: "picked_up",
    progress: 25,
    eta: "8h 45min",
    last_update: "Il y a 15 min",
    vehicle: "Camion frigorifique - DK 5678 SN",
    tracker_imei: "123456789012346",
  },
  {
    id: "MIS-003",
    transporter: { first_name: "Kofi", last_name: "Mensah", phone: "+233 24 123 4567" },
    client: { first_name: "Amadou", last_name: "Traoré", phone: "+228 90 12 34 56" },
    pickup_city: "Lomé",
    pickup_lat: 6.1319,
    pickup_lng: 1.2228,
    delivery_city: "Cotonou",
    delivery_lat: 6.3654,
    delivery_lng: 2.4183,
    status: "in_transit",
    progress: 85,
    eta: "45min",
    last_update: "Il y a 2 min",
    vehicle: "Camion benne - LM 9012 TG",
    tracker_imei: "123456789012347",
  },
]

export default function ModeratorTrackingPage() {
  const { t } = useLanguage()

  const statusConfig: Record<string, { label: string; color: string }> = {
    assigned: { label: "Assigné", color: "bg-secondary text-secondary-foreground" },
    picked_up: { label: "Enlevé", color: "bg-warning/20 text-warning" },
    in_transit: { label: "En transit", color: "bg-primary/20 text-primary" },
  }

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedMission, setSelectedMission] = useState<(typeof mockActiveMissions)[0] | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<IOPGPSDevice | null>(null)
  const [activeTab, setActiveTab] = useState("missions")

  // Hooks A-TRACKER
  const { data: devices, isLoading: devicesLoading } = useTrackerDevices()
  const { data: allPositions } = useAllTrackerPositions()
  const { data: alerts } = useTrackerAlerts()

  const filteredMissions = mockActiveMissions.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.transporter.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.pickup_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.delivery_city.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || m.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleDeviceSelect = (device: IOPGPSDevice) => {
    setSelectedDevice(device)
    setActiveTab("devices")
  }

  const onlineDevicesCount = devices?.filter((d) => d.status === "online").length || 0
  const totalDevicesCount = devices?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("moderator_tracking.title")}</h1>
          <p className="text-muted-foreground">{t("moderator_tracking.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <Wifi className="h-3 w-3 text-success" />
            {onlineDevicesCount}/{totalDevicesCount} {t("moderator_tracking.online")}
          </Badge>
          <Button variant="outline" className="gap-2 border-border bg-transparent">
            <RefreshCw className="h-4 w-4" />
            {t("moderator_tracking.refresh")}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{mockActiveMissions.length}</p>
                <p className="text-xs text-muted-foreground">{t("moderator_tracking.active_missions")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {mockActiveMissions.filter((m) => m.status === "in_transit").length}
                </p>
                <p className="text-xs text-muted-foreground">{"En transit"}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Navigation className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{onlineDevicesCount}</p>
                <p className="text-xs text-muted-foreground">{t("moderator_tracking.online_trackers")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">3h 45min</p>
                <p className="text-xs text-muted-foreground">{t("moderator_tracking.avg_eta")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{alerts?.length || 0}</p>
                <p className="text-xs text-muted-foreground">{t("moderator_tracking.alerts")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs pour basculer entre missions et dispositifs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="missions" className="gap-2">
            <Truck className="h-4 w-4" />
            {t("moderator_tracking.missions")}
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Wifi className="h-4 w-4" />
            {t("moderator_tracking.devices")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Carte */}
            <div className="lg:col-span-2">
              <TrackingMap
                imei={selectedMission?.tracker_imei}
                pickupLat={selectedMission?.pickup_lat}
                pickupLng={selectedMission?.pickup_lng}
                deliveryLat={selectedMission?.delivery_lat}
                deliveryLng={selectedMission?.delivery_lng}
              />
            </div>

            {/* Liste des missions */}
            <div className="space-y-4">
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("moderator_tracking.search")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background border-border"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-32 bg-background border-border">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("requests.all")}</SelectItem>
                        <SelectItem value="picked_up">{"Enlevé"}</SelectItem>
                        <SelectItem value="in_transit">{"En transit"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-base">{t("moderator_tracking.ongoing_missions")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                  {filteredMissions.map((mission) => (
                    <div
                      key={mission.id}
                      className={`p-3 rounded-lg transition-colors cursor-pointer ${
                        selectedMission?.id === mission.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-secondary/50 hover:bg-secondary/70"
                      }`}
                      onClick={() => setSelectedMission(mission)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {mission.transporter.first_name[0]}
                              {mission.transporter.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {mission.transporter.first_name} {mission.transporter.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{mission.vehicle}</p>
                          </div>
                        </div>
                        <Badge className={statusConfig[mission.status]?.color}>
                          {statusConfig[mission.status]?.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        {mission.pickup_city} → {mission.delivery_city}
                      </div>

                      <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{t("moderator_tracking.progress")}</span>
                          <span className="text-foreground">{mission.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${mission.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t("client.tracking.eta")}: {mission.eta}
                        </span>
                        <span className="text-muted-foreground">{t("moderator_tracking.last_update")}: {mission.last_update}</span>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-border text-foreground bg-transparent h-8 text-xs"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          {t("moderator_tracking.call")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-border text-foreground bg-transparent h-8 text-xs"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {t("moderator_tracking.message")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Carte avec le dispositif sélectionné */}
            <div className="lg:col-span-2">
              <TrackingMap
                imei={selectedDevice?.imei}
                showControls={true}
              />
            </div>

            {/* Liste des dispositifs */}
            <div>
              <TrackerDevicesList
                onSelectDevice={handleDeviceSelect}
                selectedDeviceId={selectedDevice?.id}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Alertes récentes */}
      {alerts && alerts.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {t("moderator_tracking.recent_alerts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{alert.type}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
