"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CircleHelp, Check } from "lucide-react"

export function AuthDemoForm({mode}:{mode:"login"|"register"}) {
 const [sent,setSent]=useState(false)
 const isRegister=mode==="register"
 if(sent)return <div className="form-success" role="status"><span className="success-check"><Check/></span><h3>{isRegister?"Account preview complete":"Login preview complete"}</h3><p>No account was created and you are not signed in. Authentication will be connected during backend development.</p><Link className="text-action" href="/">Return home <ArrowRight size={15}/></Link></div>
 return <form className="form-stack" onSubmit={e=>{e.preventDefault();setSent(true)}}>
  {isRegister&&<fieldset style={{padding:0,margin:0,border:0}}><legend className="field" style={{marginBottom:8}}>I am a</legend><div className="role-selector"><label className="role-choice"><input type="radio" name="role" defaultChecked/><span><strong>Tenant</strong><small>Looking for a home</small></span></label><label className="role-choice"><input type="radio" name="role"/><span><strong>Landlord</strong><small>Managing a property</small></span></label></div></fieldset>}
  {isRegister&&<label className="field"><span>Full name</span><input required autoComplete="name" placeholder="Your full name"/></label>}
  {isRegister?<label className="field"><span>Email address</span><input required type="email" autoComplete="email" placeholder="you@example.com"/></label>:<label className="field"><span>Email or phone number</span><input required autoComplete="username" placeholder="you@example.com or +254…"/></label>}
  {isRegister&&<label className="field"><span>Phone number</span><input required type="tel" autoComplete="tel" placeholder="+254 7…"/></label>}
  <label className="field"><span>Password</span><input required type="password" autoComplete={isRegister?"new-password":"current-password"} placeholder={isRegister?"Create a password":"Enter your password"}/></label>
  {!isRegister&&<div style={{display:"flex",justifyContent:"flex-end",marginTop:-5}}><Link className="text-action" href="/contact">Forgot password?</Link></div>}
  {isRegister&&<label className="checkbox-row" style={{border:0,padding:0}}><input type="checkbox" required/><span>I agree to the <Link href="/terms">Terms & Conditions</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label>}
  <button className="button button-navy form-submit" type="submit">{isRegister?"Create account":"Login"} <ArrowRight size={16}/></button>
  <div className="auth-demo"><CircleHelp/> UI preview only. {isRegister?"Accounts and authentication":"Authentication and password recovery"} are not connected yet.</div>
 </form>
}
