"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "../../lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("Signing in...");
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setMessage("Supabase env vars are missing. Add them in Vercel before customers can log in.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="app-shell auth-shell">
      <form className="panel auth-panel" onSubmit={submit}>
        <Link className="brand" href="/">
          <span className="brand-mark">QR</span>
          <span>QR Operations</span>
        </Link>
        <div>
          <p className="eyebrow">Customer login</p>
          <h1>Welcome back.</h1>
          <p className="lead">Open your customer workspace, manage campaigns, and review scan activity. Email is used privately for secure login.</p>
        </div>
        <label className="field">
          <span>Private login email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
        </label>
        <button className="primary-button" type="submit">Log in</button>
        <p className="form-message">{message || "Need an account?"} <Link href="/signup">Sign up</Link></p>
      </form>
    </main>
  );
}
