"use client";

import { useState } from "react";

const quickQuestions = [
  "How do I make a dynamic QR code?",
  "Why does a QR code go to /r first?",
  "How do I add Stripe payments?",
  "How do I test scan history?",
];

export default function SetupAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("Ask about setup, billing, QR testing, scan history, or customer onboarding.");
  const [loading, setLoading] = useState(false);

  async function askAssistant(nextQuestion = question) {
    if (!nextQuestion.trim()) return;
    setQuestion(nextQuestion);
    setLoading(true);
    setAnswer("Thinking...");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: nextQuestion }),
      });
      const data = await response.json();
      setAnswer(data.answer || data.error || "I could not answer that yet.");
    } catch (error) {
      setAnswer(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel assistant-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Setup assistant</p>
          <h2>Help for customers and operators</h2>
        </div>
        <span className="status">{loading ? "Answering" : "Ready"}</span>
      </div>
      <div className="assistant-quick">
        {quickQuestions.map((item) => (
          <button key={item} type="button" onClick={() => askAssistant(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="assistant-chat">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a setup question..."
        />
        <button className="primary-button" type="button" onClick={() => askAssistant()} disabled={loading}>
          Ask
        </button>
      </div>
      <p className="assistant-answer">{answer}</p>
    </section>
  );
}
