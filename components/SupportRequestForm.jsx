"use client";

import { useState } from "react";

export default function SupportRequestForm({ code, campaignName }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(campaignName || "Customer support request");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event) {
    event.preventDefault();
    setStatus("Sending request...");
    const response = await fetch("/api/support-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, email, subject, message }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Could not send the request.");
      return;
    }
    setName("");
    setEmail("");
    setMessage("");
    setStatus("Request sent. The business has your details.");
  }

  return (
    <form className="panel auth-panel support-form" onSubmit={submit}>
      <div>
        <p className="eyebrow">Support request</p>
        <h1>{campaignName || "How can we help?"}</h1>
        <p className="lead">Send a request tied to this QR code so the business can follow up.</p>
      </div>
      <label className="field">
        <span>Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
      </label>
      <label className="field">
        <span>Email</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" />
      </label>
      <label className="field">
        <span>Subject</span>
        <input value={subject} onChange={(event) => setSubject(event.target.value)} required />
      </label>
      <label className="field">
        <span>Message</span>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} required placeholder="Tell us what you need." />
      </label>
      <button className="primary-button" type="submit">Send request</button>
      <p className="form-message">{status}</p>
    </form>
  );
}
