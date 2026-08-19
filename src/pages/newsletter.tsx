import Head from "next/head";
import { useState } from "react";

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Subscribing...");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to subscribe");
      }

      setStatus("Subscribed successfully! 🎉");
      setEmail("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Subscription failed");
    }
  };

  return (
    <>
      <Head>
        <title>Newsletter | Vida Brown</title>
        <meta name="description" content="Join the Vida Brown community for music, videos, and exclusive updates." />
      </Head>

      <main className="container" style={{ paddingTop: 140, paddingBottom: 96 }}>
        <section className="glass-card" style={{ padding: 48, maxWidth: 720, margin: "0 auto" }}>
          <span className="section-tag">Stay Connected</span>
          <h1 style={{ marginBottom: 16 }}>Join the Vida Brown community</h1>
          <p style={{ marginBottom: 32 }}>
            Subscribe for new releases, show announcements, and behind-the-scenes updates from the studio.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16, maxWidth: 520 }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="admin-input"
            />
            <button type="submit" className="btn btn-primary" style={{ justifySelf: "start" }}>
              Subscribe Now
            </button>
          </form>

          {status && <p style={{ marginTop: 16, color: status.includes("success") ? "var(--secondary)" : "#f87171" }}>{status}</p>}
        </section>
      </main>
    </>
  );
}