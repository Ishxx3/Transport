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
import { Package, MapPin, Clock, Truck, CheckCircle, ArrowRight, Star, Car } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

export default function ModeratorAssignmentsPage() {
  const { t } = useLanguage()

  const mockValidatedRequests = [
  {
    id: "REQ-001",
    client: { first_name: "Jean", last_name: "Dupont" },
    pickup_city: "Abidjan",
    delivery_city: "Accra",
    cargo_description: "Équipements électroniques",
    cargo_weight_kg: 500,
    estimated_price: 250000,
    transport_type: "Camion",
    validated_at: "2024-03-16",
  },
  {
    id: "REQ-002",
    client: { first_name: "Marie", last_name: "Koné" },
    pickup_city: "Dakar",
    delivery_city: "Bamako",
    cargo_description: "Produits alimentaires",
    cargo_weight_kg: 2000,
    estimated_price: 450000,
    transport_type: "Camion frigorifique",
    validated_at: "2024-03-15",
  },
]

const mockTransporters = [
  {
    id: "1",
    first_name: "Kouassi",
    last_name: "Yao",
    rating: 4.8,
    completed_missions: 156,
    city: "Abidjan",
    vehicles: [
      { id: "v1", type: "Camion", plate: "AB 1234 CI", capacity: 10000, available: true },
      { id: "v2", type: "Camion frigorifique", plate: "AB 5678 CI", capacity: 5000, available: false },
    ],
  },
  {
    id: "2",
    first_name: "Mamadou",
    last_name: "Diallo",
    rating: 4.5,
    completed_missions: 89,
    city: "Dakar",
    vehicles: [{ id: "v3", type: "Camion bâché", plate: "DK 1234 SN", capacity: 8000, available: true }],
  },
  {
    id: "3",
    first_name: "Kofi",
    last_name: "Mensah",
    rating: 4.9,
    completed_missions: 210,
    city: "Accra",
    vehicles: [{ id: "v4", type: "Camion", plate: "GH 1234 AC", capacity: 15000, available: true }],
  },
]

const mockAssignedMissions = [
  {
    id: "MIS-001",
    request_id: "REQ-003",
    transporter: { first_name: "Kouassi", last_name: "Yao" },
    client: { first_name: "Amadou", last_name: "Traoré" },
    pickup_city: "Lomé",
    delivery_city: "Cotonou",
    status: "in_progress",
    assigned_at: "2024-03-14",
  },
  {
    id: "MIS-002",
    request_id: "REQ-004",
    transporter: { first_name: "Mamadou", last_name: "Diallo" },
    client: { first_name: "Fatou", last_name: "Sow" },
    pickup_city: "Ouagadougou",
    delivery_city: "Niamey",
    status: "assigned",
    assigned_at: "2024-03-15",
  },
]

  const statusConfig: Record<string, { label: string; color: string }> = {
    assigned: { label: "Assigné", color: "bg-primary/20 text-primary" },
    picked_up: { label: "Enlevé", color: "bg-warning/20 text-warning" },
    in_progress: { label: "En transit", color: "bg-accent/20 text-accent" },
  }
  const [searchQuery, setSearchQuery] = useState("")
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<(typeof mockValidatedRequests)[0] | null>(null)
  const [selectedTransporter, setSelectedTransporter] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [finalPrice, setFinalPrice] = useState("")

  const selectedTransporterData = mockTransporters.find((t) => t.id === selectedTransporter)

  const openAssignDialog = (request: (typeof mockValidatedRequests)[0]) => {
    setSelectedRequest(request)
    setFinalPrice(request.estimated_price.toString())
    setShowAssignDialog(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("moderator_assignments.title")}</h1>
        <p className="text-muted-foreground">{t("moderator_assignments.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{mockValidatedRequests.length}</p>
                <p className="text-xs text-muted-foreground">{t("moderator_assignments.to_assign")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{mockAssignedMissions.length}</p>
                <p className="text-xs text-muted-foreground">{t("moderator_assignments.active_missions")}</p>
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
                  {mockTransporters.filter((t) => t.vehicles.some((v) => v.available)).length}
                </p>
                <p className="text-xs text-muted-foreground">{t("moderator_assignments.available_transporters")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-xs text-muted-foreground">{t("moderator_assignments.today")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Validated requests to assign */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-warning" />
              Demandes à affecter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockValidatedRequests.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                <p className="text-muted-foreground">Toutes les demandes ont été affectées</p>
              </div>
            ) : (
              mockValidatedRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-primary">{request.id}</span>
                        <Badge variant="outline" className="text-xs border-border">
                          {request.transport_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">
                        {request.client.first_name} {request.client.last_name}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      {request.estimated_price.toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3" />
                    {request.pickup_city}
                    <ArrowRight className="h-3 w-3" />
                    {request.delivery_city}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{request.cargo_description}</span>
                    <span>{request.cargo_weight_kg} kg</span>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => openAssignDialog(request)}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    {t("moderator_requests.assign")} {t("auth.transporter").toLowerCase()}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent assignments */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {t("moderator_assignments.assigned_missions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAssignedMissions.map((mission) => (
              <div key={mission.id} className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{mission.id}</span>
                      <Badge className={statusConfig[mission.status]?.color}>
                        {statusConfig[mission.status]?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{mission.request_id}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(mission.assigned_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-3 w-3" />
                  {mission.pickup_city}
                  <ArrowRight className="h-3 w-3" />
                  {mission.delivery_city}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-accent/10 text-accent text-xs">
                        {mission.transporter.first_name[0]}
                        {mission.transporter.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground">
                      {mission.transporter.first_name} {mission.transporter.last_name}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-border bg-transparent">
                    {t("moderator_disputes.details")}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("moderator_requests.assign_title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-primary">{selectedRequest.id}</span>
                  <span className="font-bold text-foreground">
                    {selectedRequest.estimated_price.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {selectedRequest.pickup_city} → {selectedRequest.delivery_city}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-foreground">{t("moderator_requests.transporter_label")} *</Label>
              <Select value={selectedTransporter} onValueChange={setSelectedTransporter}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder={t("moderator_requests.select_transporter")} />
                </SelectTrigger>
                <SelectContent>
                  {mockTransporters.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span>
                          {t.first_name} {t.last_name}
                        </span>
                        <span className="flex items-center gap-1 text-warning">
                          <Star className="h-3 w-3 fill-warning" />
                          {t.rating}
                        </span>
                        <span className="text-muted-foreground">({t.city})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTransporterData && (
              <div className="space-y-2">
                <Label className="text-foreground">{t("moderator_requests.vehicle_label")} *</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder={t("moderator_requests.select_vehicle")} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTransporterData.vehicles
                      .filter((v) => v.available)
                      .map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <div className="flex items-center gap-2">
                            <Car className="h-3 w-3" />
                            <span>
                              {v.type} - {v.plate}
                            </span>
                            <span className="text-muted-foreground">({v.capacity} kg)</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-foreground">{t("moderator_requests.final_price")} *</Label>
              <Input
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignDialog(false)}
              className="bg-transparent border-border"
            >
              {t("requests.cancel")}
            </Button>
            <Button
              onClick={() => {
                setShowAssignDialog(false)
                setSelectedTransporter("")
                setSelectedVehicle("")
              }}
              disabled={!selectedTransporter || !selectedVehicle || !finalPrice}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("moderator_requests.confirm_assignment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
