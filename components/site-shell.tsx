'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X, Home, ArrowUpRight, Globe, Camera, BriefcaseBusiness } from 'lucide-react'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Find a House', href: '/properties' },
  { label: 'List Your Property', href: '/list-property' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="Rent Easy home" className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark" aria-hidden="true"><Home size={21} strokeWidth={2.1} /><i /></span>
      <span className="brand-lockup"><strong>rent<span>easy</span></strong><small>Find Your Place. Live With Ease.</small></span>
    </Link>
  )
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { document.body.classList.toggle('menu-open', menuOpen); return () => document.body.classList.remove('menu-open') }, [menuOpen])
  return (
    <header className={`site-header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="header-inner site-container">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="header-actions"><Link className="login-link" href="/login">Login</Link><Link className="header-cta" href="/register">Get Started <ArrowUpRight size={15} /></Link></div>
        <button className="menu-toggle" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
      <div id="mobile-nav" className={`mobile-nav ${menuOpen ? 'mobile-nav-open' : ''}`} aria-hidden={!menuOpen}>
        <nav aria-label="Mobile navigation">{links.map((link) => <Link tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} key={link.href} href={link.href}>{link.label}</Link>)}</nav>
        <div className="mobile-actions"><Link className="btn-secondary" href="/login" onClick={() => setMenuOpen(false)}>Login</Link><Link className="btn-primary" href="/register" onClick={() => setMenuOpen(false)}>Get Started <ArrowUpRight size={16} /></Link></div>
        <p>Find Your Place. Live With Ease.</p>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="site-container"><div className="footer-main"><div className="footer-brand"><Brand light /><p>A clearer way to find a home and manage a rental in Kenya.</p><div className="social-links" aria-label="Social media"><a href="/contact" aria-label="Facebook"><Globe size={17} /></a><a href="/contact" aria-label="Instagram"><Camera size={17} /></a><a href="/contact" aria-label="LinkedIn"><BriefcaseBusiness size={17} /></a></div></div><div className="footer-column"><h2>Rent Easy</h2><Link href="/about">About Us</Link><Link href="/how-it-works">How It Works</Link><Link href="/contact">Contact</Link></div><div className="footer-column"><h2>Properties</h2><Link href="/properties">Find a House</Link><Link href="/list-property">List Your Property</Link><Link href="/properties">Available Properties</Link></div><div className="footer-column"><h2>Support</h2><Link href="/faq">Frequently Asked Questions</Link><Link href="/contact">Tenant Support</Link><Link href="/contact">Landlord Support</Link></div><div className="footer-column"><h2>Legal</h2><Link href="/terms">Terms &amp; Conditions</Link><Link href="/privacy">Privacy Policy</Link><Link href="/terms#tenancy">Tenancy Terms</Link></div></div><div className="footer-bottom"><p>© 2026 Rent Easy. All rights reserved.</p><span>Find Your Place. Live With Ease.</span></div></div></footer>
}

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return <><a href="#main-content" className="skip-link">Skip to content</a><SiteHeader /><div id="main-content">{children}</div><SiteFooter /></>
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="page-intro"><div className="site-container"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div></section>
}

export function DemoNotice({ children = 'Demonstration interface — details shown are illustrative and should be confirmed before making decisions.' }: { children?: React.ReactNode }) {
  return <p className="demo-notice"><span aria-hidden="true" />{children}</p>
}
