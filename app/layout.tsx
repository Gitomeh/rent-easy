import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: { default: "Rent Easy | Find Your Place. Live With Ease.", template: "%s | Rent Easy" },
  description: "Explore rental homes, discover clear rental information and learn how Rent Easy supports tenants and property owners across Kenya.",
  applicationName: "Rent Easy",
  openGraph: { title: "Rent Easy | Find Your Place. Live With Ease.", description: "A more considered way to find a home and manage a rental.", type: "website", locale: "en_KE" },
  twitter: { card: "summary_large_image", title: "Rent Easy | Find Your Place. Live With Ease.", description: "Discover rental homes and manage your rental experience with Rent Easy." },
  robots: { index: true, follow: true },
}
export const viewport: Viewport = { themeColor: "#f7f6f2", width: "device-width", initialScale: 1 }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en-KE" data-scroll-behavior="smooth"><body><Providers><a href="#main-content" className="skip-link">Skip to main content</a>{children}</Providers></body></html> }
