import type { Metadata } from "next"
import Link from "next/link"
import { Footer, Header, BrandMark } from "@/components/site"
import { AuthForm } from "@/components/auth-form"
export const metadata:Metadata={title:"Create an Account",description:"Create a Rent Easy tenant or landlord account."}
export default function RegisterPage(){return <><Header/><main id="main-content" className="auth-page"><section className="auth-art"><div className="auth-art-content"><BrandMark light/><h1>Make your next move <em>with ease.</em></h1><p>Create an account to explore a future tenant and landlord experience.</p></div></section><section className="auth-form-side"><div className="auth-form"><BrandMark/><h2>Create your account</h2><p>Choose how you would like to use Rent Easy.</p><AuthForm mode="register"/><div className="auth-switch">Already have an account? <Link href="/login">Login</Link></div></div></section></main><Footer/></>}
