import type { Metadata } from "next"
import Link from "next/link"
import { Footer, Header, BrandMark } from "@/components/site"
import { AuthForm } from "@/components/auth-form"
export const metadata:Metadata={title:"Login",description:"Rent Easy account login."}
export default function LoginPage(){return <><Header/><main id="main-content" className="auth-page"><section className="auth-art"><div className="auth-art-content"><BrandMark light/><h1>Home should feel <em>like yours.</em></h1><p>A more considered rental experience starts with clarity and support at every step.</p></div></section><section className="auth-form-side"><div className="auth-form"><BrandMark/><h2>Welcome back</h2><p>Log in to your Rent Easy account.</p><AuthForm mode="login"/><div className="auth-switch">New to Rent Easy? <Link href="/register">Create account</Link></div></div></section></main><Footer/></>}
