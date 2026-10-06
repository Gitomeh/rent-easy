"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, CircleHelp, Check } from "lucide-react"

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isRegister = mode === "register"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (isRegister) {
      const name = formData.get("name") as string
      const phone = formData.get("phone") as string
      const role = formData.get("role") as string

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password, role }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Registration failed")
          setLoading(false)
          return
        }

        setSent(true)
      } catch (err) {
        setError("An error occurred. Please try again.")
        setLoading(false)
      }
    } else {
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError("Invalid email or password")
          setLoading(false)
          return
        }

        // Redirect based on role
        const session = await fetch("/api/auth/session").then((res) => res.json())
        const role = session?.user?.role

        if (role === "SUPER_ADMIN") {
          router.push("/admin")
        } else if (role === "SECRETARY") {
          router.push("/secretary")
        } else if (role === "LANDLORD") {
          router.push("/landlord")
        } else if (role === "TENANT") {
          router.push("/tenant")
        } else {
          router.push("/")
        }
      } catch (err) {
        setError("An error occurred. Please try again.")
        setLoading(false)
      }
    }
  }

  if (sent) {
    return (
      <div className="form-success" role="status">
        <span className="success-check">
          <Check />
        </span>
        <h3>{isRegister ? "Account created successfully" : "Login successful"}</h3>
        <p>
          {isRegister
            ? "You can now log in with your credentials."
            : "Redirecting to your dashboard..."}
        </p>
        <Link className="text-action" href="/">
          Return home <ArrowRight size={15} />
        </Link>
      </div>
    )
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {isRegister && (
        <fieldset style={{ padding: 0, margin: 0, border: 0 }}>
          <legend className="field" style={{ marginBottom: 8 }}>
            I am a
          </legend>
          <div className="role-selector">
            <label className="role-choice">
              <input type="radio" name="role" value="TENANT" defaultChecked />
              <span>
                <strong>Tenant</strong>
                <small>Looking for a home</small>
              </span>
            </label>
            <label className="role-choice">
              <input type="radio" name="role" value="LANDLORD" />
              <span>
                <strong>Landlord</strong>
                <small>Managing a property</small>
              </span>
            </label>
          </div>
        </fieldset>
      )}
      {isRegister && (
        <label className="field">
          <span>Full name</span>
          <input required name="name" autoComplete="name" placeholder="Your full name" />
        </label>
      )}
      {isRegister ? (
        <label className="field">
          <span>Email address</span>
          <input required name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </label>
      ) : (
        <label className="field">
          <span>Email or phone number</span>
          <input required name="email" autoComplete="username" placeholder="you@example.com or +254…" />
        </label>
      )}
      {isRegister && (
        <label className="field">
          <span>Phone number</span>
          <input required name="phone" type="tel" autoComplete="tel" placeholder="+254 7…" />
        </label>
      )}
      <label className="field">
        <span>Password</span>
        <input
          required
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder={isRegister ? "Create a password" : "Enter your password"}
        />
      </label>
      {!isRegister && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -5 }}>
          <Link className="text-action" href="/contact">
            Forgot password?
          </Link>
        </div>
      )}
      {isRegister && (
        <label className="checkbox-row" style={{ border: 0, padding: 0 }}>
          <input type="checkbox" required />
          <span>
            I agree to the <Link href="/terms">Terms & Conditions</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </span>
        </label>
      )}
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <button className="button button-navy form-submit" type="submit" disabled={loading}>
        {loading ? "Processing..." : isRegister ? "Create account" : "Login"}{" "}
        <ArrowRight size={16} />
      </button>
      <div className="auth-demo">
        <CircleHelp /> {isRegister ? "Account creation" : "Authentication"} is now connected to the
        backend.
      </div>
    </form>
  )
}
