"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Truck,
  MapPin,
  Shield,
  Wallet,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Globe,
  Clock,
  Headphones,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { Footer } from "@/components/footer"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"

export default function Home() {

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Logo size="md" />
            <div className="hidden md:flex items-center gap-8">
              <Link href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Services
              </Link>
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                À propos
              </Link>
              <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <ThemeToggle />
              <Link href="/auth/login">
                <Button variant="ghost" className="text-foreground hover:bg-secondary">
                  Connexion
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">S'inscrire</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm text-primary font-medium">
                  Plateforme logistique digitale #1 en Afrique de l'Ouest
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                Simplifiez votre logistique avec Africa Logistics
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Connectez-vous à un réseau de transporteurs fiables, suivez vos marchandises en temps réel et gérez vos paiements en toute sécurité.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
                  >
                    Commencer maintenant
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#services">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border text-foreground hover:bg-secondary gap-2 w-full sm:w-auto bg-transparent"
                  >
                    Découvrir nos services
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">5000+</div>
                  <div className="text-sm text-muted-foreground">Transporteurs</div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">15K+</div>
                  <div className="text-sm text-muted-foreground">Livraisons</div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">99.5%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />
              <div className="relative bg-card border border-border rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-foreground">Suivi en temps réel</h3>
                  <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">En cours</span>
                </div>
                <div className="aspect-video bg-secondary/50 rounded-xl mb-6 flex items-center justify-center overflow-hidden relative">
                  <img
                    src="/africa-map-with-delivery-routes-and-truck-icons.jpg"
                    alt="Suivi en temps réel"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-primary animate-ping absolute" />
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center relative">
                        <Truck className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">Cotonou → Lomé</div>
                      <div className="text-xs text-muted-foreground">Distance: 165 km • ETA: 2h30</div>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>75% complété</span>
                    <span>Arrivée estimée: 14h30</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Nos services de transport</h2>
            <p className="text-muted-foreground">
              Des solutions adaptées à tous vos besoins logistiques, des particuliers aux grandes entreprises.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Truck,
                title: "Transport de marchandises",
                description: "Transport sécurisé de tous types de marchandises avec des véhicules adaptés à vos besoins.",
              },
              {
                icon: Globe,
                title: "Logistique régionale",
                description: "Couverture étendue en Afrique de l'Ouest avec un réseau de transporteurs locaux fiables.",
              },
              {
                icon: Clock,
                title: "Livraison express",
                description: "Service de livraison rapide pour vos envois urgents avec suivi en temps réel.",
              },
              {
                icon: Wallet,
                title: "Paiement sécurisé",
                description: "Portefeuille électronique intégré avec Mobile Money, cartes bancaires et PayPal.",
              },
              {
                icon: MapPin,
                title: "A-Tracking GPS",
                description: "Suivi GPS en temps réel de vos marchandises avec alertes automatiques.",
              },
              {
                icon: Headphones,
                title: "Support 24/7",
                description: "Équipe de modérateurs disponible pour vous assister à chaque étape.",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="group p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Une plateforme complète pour tous les acteurs
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: Users,
                    title: "Pour les clients",
                    description: "Soumettez vos demandes de transport, suivez vos livraisons et gérez votre portefeuille en toute simplicité.",
                  },
                  {
                    icon: Truck,
                    title: "Pour les transporteurs",
                    description: "Gérez votre flotte, recevez des missions et suivez vos revenus depuis votre espace dédié.",
                  },
                  {
                    icon: Shield,
                    title: "Pour les modérateurs",
                    description: "Interface opérationnelle pour traiter les demandes, affecter les missions et gérer les litiges.",
                  },
                  {
                    icon: BarChart3,
                    title: "Pour les administrateurs",
                    description: "Tableau de bord complet avec KPIs, gestion des utilisateurs et supervision de la plateforme.",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                    <div className="text-sm text-muted-foreground">Disponibilité</div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-2xl font-bold text-success mb-1">99.5%</div>
                    <div className="text-sm text-muted-foreground">SLA garanti</div>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-2xl font-bold text-foreground mb-1">{"<"}300ms</div>
                    <div className="text-sm text-muted-foreground">Temps de réponse</div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="text-2xl font-bold text-warning mb-1">HTTPS</div>
                    <div className="text-sm text-muted-foreground">Chiffrement SSL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Comment ça marche ?</h2>
            <p className="text-muted-foreground">Un processus simple et transparent pour vos expéditions</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Inscription", description: "Créez votre compte et vérifiez votre identité" },
              { step: "02", title: "Créditez", description: "Alimentez votre portefeuille électronique" },
              { step: "03", title: "Demandez", description: "Soumettez votre demande de transport détaillée" },
              { step: "04", title: "Suivez", description: "Suivez votre livraison en temps réel avec A-Tracking" },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                  {item.step}
                </div>
                {index < 3 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-border" />}
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">Vos garanties avec Africa Logistics</h2>
                <ul className="space-y-4">
                  {[
                    "Transporteurs vérifiés et certifiés",
                    "Assurance marchandises incluse",
                    "Paiement sécurisé avec garantie",
                    "Support client disponible 24h/24",
                    "Remboursement en cas de problème",
                    "Données confidentielles protégées (RGPD)",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-secondary/50 rounded-xl p-8 text-center">
                <div className="text-5xl font-bold text-primary mb-2">10%</div>
                <div className="text-lg font-medium text-foreground mb-4">Commission transparente</div>
                <p className="text-sm text-muted-foreground mb-6">
                  Pénalité en cas d'annulation après affectation et début de déplacement du transporteur
                </p>
                <Link href="/auth/register">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Créer un compte gratuit
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Prêt à simplifier votre logistique ?
            </h2>
            <p className="text-muted-foreground mb-8">
              Rejoignez des milliers d'utilisateurs qui font confiance à Africa Logistics pour leurs besoins de transport.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register?role=client">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
                >
                  <Users className="h-5 w-5" />
                  Je suis client
                </Button>
              </Link>
              <Link href="/auth/register?role=transporter">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary gap-2 w-full sm:w-auto bg-transparent"
                >
                  <Truck className="h-5 w-5" />
                  Je suis transporteur
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <Logo size="md" />
              </div>
              <p className="text-sm text-muted-foreground">
                Africa Logistique - La solution digitale pour le transport de marchandises en Afrique de l'Ouest. Fiabilité, rapidité et sécurité.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Plateforme</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/auth/login" className="hover:text-foreground transition-colors">
                    Connexion
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="hover:text-foreground transition-colors">
                    S'inscrire
                  </Link>
                </li>
                <li>
                  <Link href="#services" className="hover:text-foreground transition-colors">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors">
                    Fonctionnalités
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Mentions légales</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/legal/cgu" className="hover:text-foreground transition-colors">
                    CGU
                  </Link>
                </li>
                <li>
                  <Link href="/legal/cgv" className="hover:text-foreground transition-colors">
                    CGV
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/legal/moderator-charter" className="hover:text-foreground transition-colors">
                    Charte modérateurs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contactez-nous</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>contact@a-logistics.africa</li>
                <li>+229 XX XX XX XX</li>
                <li>Cotonou, Bénin</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Africa Logistics. Tous droits réservés.
            </p>
            <p className="text-sm text-muted-foreground">
              Propulsé par <span className="text-primary">AFRI-PRO</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
