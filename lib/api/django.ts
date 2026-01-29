/**
 * Service API pour communiquer avec le backend Django
 */

const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/africa_logistic'

interface ApiResponse<T> {
  message?: string
  error?: string
  data?: T
  [key: string]: any
}

class DjangoApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Récupérer le token depuis le localStorage si disponible
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('django_token') || null
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('django_token', token)
      } else {
        localStorage.removeItem('django_token')
      }
    }
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Ajouter le token d'authentification si disponible
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: data.error || `HTTP error! status: ${response.status}`,
          ...data
        }
      }

      return data
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // ==================== AUTHENTIFICATION ====================

  async register(data: {
    firstname: string
    lastname: string
    telephone?: string
    email: string
    password: string
    role: string
    address?: string
    vehicles?: Array<{
      type: string
      brand: string
      model: string
      plate_number: string
      capacity_kg: number
      insurance_expiry?: string
      inspection_expiry?: string
      description?: string
      photo?: string
      ext?: string
    }>
    documents?: Array<{
      type_doc: string
      file: string
      description?: string
      ext?: string
    }>
  }) {
    const response = await this.request<{ user: any; is_approved?: boolean }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response
  }

  async login(data: { email?: string; telephone?: string; password: string }) {
    const response = await this.request<{ token: string; user: any }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    if (response.token) {
      this.setToken(response.token)
    }
    
    return response
  }

  async logout() {
    const response = await this.request('/auth/logout/', {
      method: 'DELETE',
    })
    
    this.setToken(null)
    return response
  }

  async verifyAccount(data: { user_slug: string; code: string }) {
    return this.request('/auth/verify-account/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async resendVerificationCode(data: { user_slug: string }) {
    return this.request('/auth/resend-verification/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCurrentUser() {
    const response = await this.request<{ user: any }>('/user/me/')
    // Vérifier si le transporteur est approuvé
    if (response.user && response.user.role === 'TRANSPORTEUR' && !response.user.is_approved) {
      // Le transporteur n'est pas approuvé
      response.user.pending_approval = true
    }
    return response
  }

  // ==================== WALLET ====================

  async getMyWallet() {
    return this.request<{ wallet: any }>('/wallet/me/')
  }

  async getMyWalletTransactions() {
    return this.request<{ transactions: any[] }>('/wallet/transactions/')
  }

  async topupWallet(data: { amount: number; description?: string; reference?: string }) {
    return this.request<{ wallet: any }>('/wallet/topup/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // ==================== VÉHICULES ====================

  async getVehicles() {
    return this.request<{ vehicles: any[] }>('/vehicles/')
  }

  async getVehicle(vehicleSlug: string) {
    return this.request<{ vehicle: any }>(`/vehicles/${vehicleSlug}/`)
  }

  async createVehicle(data: {
    type: string
    brand: string
    model: string
    plate_number: string
    capacity_kg: number
    insurance_expiry?: string
    inspection_expiry?: string
    description?: string
    photo?: string
    ext?: string
  }) {
    return this.request<{ vehicle: any }>('/vehicles/create/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateVehicle(vehicleSlug: string, data: Partial<{
    type: string
    brand: string
    model: string
    plate_number: string
    capacity_kg: number
    insurance_expiry?: string
    inspection_expiry?: string
    description?: string
    status?: string
    photo?: string
    ext?: string
  }>) {
    return this.request<{ vehicle: any }>(`/vehicles/${vehicleSlug}/update/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteVehicle(vehicleSlug: string) {
    return this.request(`/vehicles/${vehicleSlug}/delete/`, {
      method: 'DELETE',
    })
  }

  // ==================== DOCUMENTS VÉHICULES ====================

  async getVehicleDocuments(vehicleSlug: string) {
    return this.request<{ documents: any[] }>(`/vehicles/${vehicleSlug}/documents/`)
  }

  async addVehicleDocument(
    vehicleSlug: string,
    data: {
      file: string // base64
      document_type: string
      name?: string
      description?: string
      expiry_date?: string
      ext?: string
    }
  ) {
    return this.request<{ document: any }>(`/vehicles/${vehicleSlug}/documents/add/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateVehicleDocument(
    docSlug: string,
    data: Partial<{
      file: string
      document_type: string
      name: string
      description: string
      expiry_date: string
      ext: string
    }>
  ) {
    return this.request<{ document: any }>(`/vehicles/documents/${docSlug}/update/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteVehicleDocument(docSlug: string) {
    return this.request(`/vehicles/documents/${docSlug}/delete/`, {
      method: 'DELETE',
    })
  }

  // ==================== VALIDATION TRANSPORTEURS (ADMIN) ====================

  async getPendingTransporters() {
    return this.request<{ transporters: any[]; count: number }>('/admin/transporters/pending/')
  }

  async approveTransporter(transporterSlug: string) {
    return this.request<{ transporter: any }>(`/admin/transporters/${transporterSlug}/approve/`, {
      method: 'PATCH',
    })
  }

  async rejectTransporter(transporterSlug: string, reason?: string) {
    return this.request(`/admin/transporters/${transporterSlug}/reject/`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  }

  async getTransporterDetails(transporterSlug: string) {
    return this.request<{ transporter: any }>(`/admin/transporters/${transporterSlug}/`)
  }

  async getPublicDocumentTypes() {
    return this.request<{ types: any[] }>('/public/document-types/')
  }

  // ==================== DOCUMENTS LÉGAUX ====================

  async getMyLegalDocuments() {
    return this.request<{ documents: any[] }>('/legal-document/me/')
  }

  async addLegalDocument(data: FormData) {
    const url = `${this.baseUrl}/legal-document/add/`
    
    const headers: HeadersInit = {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`)
    }

    return result
  }

  async updateLegalDocument(docSlug: string, data: Partial<{
    type_doc: string
    description: string
    file?: string
    ext?: string
  }>) {
    return this.request<{ document: any }>(`/legal-document/${docSlug}/alter/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteLegalDocument(docSlug: string) {
    return this.request(`/legal-document/${docSlug}/delete/`, {
      method: 'DELETE',
    })
  }

  // ==================== ADMIN / DATA ADMIN ====================

  async getAdminKPIs() {
    return this.request<{
      total_clients: number
      total_transporters: number
      total_moderators: number
      total_requests: number
      completed_requests: number
      pending_requests: number
      in_progress_requests: number
      total_revenue: number
      open_disputes: number
      total_client_balance: number
      total_transporter_balance: number
      today_transactions: number
      delivery_rate: string
    }>('/admin/kpis/')
  }

  async getAdminUsers(role?: string) {
    let endpoint = '/data-admin/users/'
    if (role && role !== 'all') {
      endpoint += `?role=${role}`
    }
    return this.request<{ users: any[]; nb: number }>(endpoint)
  }

  async getAdminRequests(params?: { limit?: number; include_deleted?: boolean }) {
    let endpoint = '/admin/demandes/'
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.include_deleted) queryParams.append('include_deleted', 'true')
    
    const queryString = queryParams.toString()
    if (queryString) endpoint += `?${queryString}`
    
    return this.request<{ requests: any[]; count: number }>(endpoint)
  }

  async suspendUser(userSlug: string) {
    return this.request(`/data-admin/user/${userSlug}/desactivate/`, {
      method: 'PATCH',
    })
  }

  async activateUser(userSlug: string) {
    return this.request(`/data-admin/user/${userSlug}/activate/`, {
      method: 'PATCH',
    })
  }

  async deleteUser(userSlug: string) {
    return this.request(`/data-admin/user/${userSlug}/delete/`, {
      method: 'DELETE',
    })
  }

  async updateUserRole(userSlug: string, role: string) {
    return this.request(`/data-admin/user/${userSlug}/alter/`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  }

  // ==================== DEMANDES CLIENT / TRANSPORTEUR ====================

  async getMyRequests() {
    return this.request<{ transport_requests: any[] }>('/demandes/mes-demandes/')
  }

  async getMyAssignedRequests() {
    return this.request<{ transport_requests: any[] }>('/demandes/mes-demandes-assignees/')
  }

  async createTransportRequest(data: any) {
    return this.request<{ transport_request: any }>('/demandes/create/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getTransportRequests(params?: { status?: string }) {
    let endpoint = '/demandes/'
    if (params?.status) {
      const qs = new URLSearchParams()
      qs.append('status', params.status)
      endpoint += `?${qs.toString()}`
    }
    return this.request<{ transport_requests: any[] }>(endpoint)
  }

  // ==================== ADMIN DEMANDES ====================

  async adminAssignTransporter(requestSlug: string, transporterSlug: string) {
    return this.request<{ transport_request: any }>(`/admin/demandes/${requestSlug}/assign/`, {
      method: 'PATCH',
      body: JSON.stringify({ transporter_slug: transporterSlug }),
    })
  }

  async adminUpdateRequestStatus(requestSlug: string, status: string, comment?: string) {
    return this.request<{ transport_request: any }>(`/admin/demandes/${requestSlug}/statut/`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment }),
    })
  }

  async getTransportRequestDetail(slug: string) {
    return this.request<{ transport_request: any }>(`/demandes/${slug}/`)
  }

  // ==================== NOTIFICATIONS ====================

  async getMyNotifications() {
    return this.request<{ notifications: any[] }>('/notifications/')
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all/', {
      method: 'POST',
    })
  }
}

// Instance singleton
export const djangoApi = new DjangoApiClient(DJANGO_API_URL)
