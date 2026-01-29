"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export type AuthResult = {
  error?: string
  success?: boolean
  message?: string
}

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email et mot de passe requis" }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Check for invalid credentials
    if (error.message.includes("Invalid login credentials") || error.message.includes("invalid_credentials")) {
      return { error: "Email ou mot de passe incorrect" }
    }
    return { error: error.message }
  }

  // Get user profile to determine redirect
  const { data: profile } = await supabase.from("profiles").select("role, is_verified, is_active").eq("id", data.user.id).single()

  if (!profile) {
    return { error: "Profil utilisateur introuvable" }
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return { error: "Votre compte a été désactivé. Contactez le support." }
  }

  // In demo/mock mode, allow access even if transporter is not verified
  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project")
  
  if (!isMockMode && !profile.is_verified && profile.role === "transporteur") {
    return { error: "Votre compte transporteur est en attente de validation" }
  }

  // Redirect based on role
  const redirectPaths: Record<string, string> = {
    client: "/client",
    transporter: "/transporter",
    transporteur: "/transporter",
    moderator: "/moderator",
    moderateur: "/moderator",
    admin: "/admin",
  }

  revalidatePath("/", "layout")
  redirect(redirectPaths[profile.role] || "/client")
}

export async function register(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const phone = formData.get("phone") as string
  const role = formData.get("role") as "client" | "transporteur"
  const companyName = formData.get("companyName") as string | null

  if (!email || !password || !firstName || !lastName) {
    return { error: "Tous les champs obligatoires doivent être remplis" }
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
        role: role,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: "Erreur lors de la création du compte" }
  }

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    email,
    first_name: firstName,
    last_name: lastName,
    phone,
    role,
    company_name: companyName,
    is_verified: role === "client", // Clients are auto-verified
  })

  if (profileError) {
    console.error("Profile creation error:", profileError)
    return { error: "Erreur lors de la création du profil" }
  }

  // Create wallet for user
  const { error: walletError } = await supabase.from("wallets").insert({
    user_id: authData.user.id,
    balance: 0,
    currency: "XOF",
  })

  if (walletError) {
    console.error("Wallet creation error:", walletError)
  }

  return {
    success: true,
    message:
      role === "transporteur"
        ? "Compte créé. Votre profil est en attente de validation."
        : "Compte créé avec succès. Vérifiez votre email.",
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/auth/login")
}

export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single()

  return {
    ...user,
    profile,
    wallet,
  }
}

export async function updateProfile(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié" }

  const updates: Record<string, unknown> = {}

  const firstName = formData.get("firstName")
  const lastName = formData.get("lastName")
  const phone = formData.get("phone")
  const address = formData.get("address")
  const companyName = formData.get("companyName")

  if (firstName) updates.first_name = firstName
  if (lastName) updates.last_name = lastName
  if (phone) updates.phone = phone
  if (address) updates.address = address
  if (companyName) updates.company_name = companyName

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true, message: "Profil mis à jour" }
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo:
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
      `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: "Email de réinitialisation envoyé" }
}

export async function resendConfirmationEmail(email: string): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: "Email de confirmation renvoyé. Vérifiez votre boîte de réception." }
}
