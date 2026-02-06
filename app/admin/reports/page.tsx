"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Calendar, TrendingUp, Users, Truck, Package, BarChart3, Eye, Clock } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

export default function AdminReportsPage() {
  const { t } = useLanguage()
  const [period, setPeriod] = useState("month")

  const reportTypes = [
    {
      id: "revenue",
      name: t("admin_reports.revenue_report"),
      description: t("admin_reports.revenue_report_desc"),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
      lastGenerated: "2024-03-16",
      format: "CSV",
    },
    {
      id: "users",
      name: t("admin_reports.users_report"),
      description: t("admin_reports.users_report_desc"),
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      lastGenerated: "2024-03-15",
      format: "CSV",
    },
    {
      id: "transporters",
      name: t("admin_reports.transporters_report"),
      description: t("admin_reports.transporters_report_desc"),
      icon: Truck,
      color: "text-accent",
      bgColor: "bg-accent/10",
      lastGenerated: "2024-03-14",
      format: "CSV",
    },
    {
      id: "requests",
      name: t("admin_reports.requests_report"),
      description: t("admin_reports.requests_report_desc"),
      icon: Package,
      color: "text-warning",
      bgColor: "bg-warning/10",
      lastGenerated: "2024-03-16",
      format: "CSV",
    },
    {
      id: "disputes",
      name: t("admin_reports.disputes_report"),
      description: t("admin_reports.disputes_report_desc"),
      icon: FileText,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      lastGenerated: "2024-03-13",
      format: "CSV",
    },
    {
      id: "geographic",
      name: t("admin_reports.geographic_report"),
      description: t("admin_reports.geographic_report_desc"),
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
      lastGenerated: "2024-03-12",
      format: "CSV",
    },
  ]

  const handleGenerateReport = async (typeId: string) => {
    try {
      const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/africa_logistic'
      const token = localStorage.getItem('django_token')
      
      const response = await fetch(`${DJANGO_API_URL}/reports/admin/${typeId}.csv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du rapport')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${typeId}-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Erreur lors du téléchargement du rapport. Assurez-vous d\'être connecté en tant qu\'administrateur.')
    }
  }

  const recentReports: any[] = []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("admin_reports.title")}</h1>
          <p className="text-muted-foreground">{t("admin_reports.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-background border-border">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t("admin_reports.this_week")}</SelectItem>
              <SelectItem value="month">{t("admin_reports.this_month")}</SelectItem>
              <SelectItem value="quarter">{t("admin_reports.this_quarter")}</SelectItem>
              <SelectItem value="year">{t("admin_reports.this_year")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{reportTypes.length}</p>
                <p className="text-xs text-muted-foreground">{t("admin_reports.report_types")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{recentReports.length}</p>
                <p className="text-xs text-muted-foreground">{t("admin_reports.recent_reports")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">0.0 MB</p>
                <p className="text-xs text-muted-foreground">{t("admin_reports.total_size")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground">{t("admin_reports.downloads_this_month")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">{t("admin_reports.generate_report")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTypes.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`h-10 w-10 rounded-xl ${report.bgColor} flex items-center justify-center`}>
                        <report.icon className={`h-5 w-5 ${report.color}`} />
                      </div>
                      <Badge variant="outline" className="border-border text-xs">
                        {report.format}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{report.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{report.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t("admin_reports.generate_real_time")}
                      </span>
                      <Button 
                        size="sm" 
                        className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => handleGenerateReport(report.id)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {t("admin_reports.generate")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </div>
  )
}
