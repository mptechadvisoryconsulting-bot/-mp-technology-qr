"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "../../lib/supabase-browser";

export default function SignupPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("Creating account...");
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setMessage("Supabase env vars are missing. Add them in Vercel before customers can sign up.");
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { company_name: company, username } },
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.user) {
      fetch("/api/owner/account-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, email, username }),
      }).catch(() => {});
    }
    if (data.session) {
      router.push("/dashboard");
      return;
    }
    setMessage("Account created. Check your email to confirm, then log in.");
  }

  return (
    <main className="app-shell auth-shell">
      <form className="panel auth-panel" onSubmit={submit}>
        <Link className="brand" href="/">
          <span className="brand-mark">QR</span>
          <span>QR Operations</span>
        </Link>
        <div>
          <p className="eyebrow">New customer</p>
          <h1>Create a branded QR workspace.</h1>
          <p className="lead">Start with a private dashboard for saved QR campaigns and dynamic scan tracking.</p>
        </div>
        <label className="field">
          <span>Company</span>
          <input value={company} onChange={(event) => setCompany(event.target.value)} required />
        </label>
        <label className="field">
          <span>Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value.replace(/[^a-z0-9_.-]/gi, "").toLowerCase())}
            minLength={3}
            placeholder="companyadmin"
            required
          />
        </label>
        <label className="field">
          <span>Private login email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required />
        </label>
        <button className="primary-button" type="submit">Create account</button>
        <p className="form-message">{message || "Already have an account?"} <Link href="/login">Log in</Link></p>
      </form>
    </main>
  );
}
