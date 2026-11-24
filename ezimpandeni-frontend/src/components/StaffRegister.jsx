import React, { useState } from "react";

export default function StaffRegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");

    if (!email.trim()) {
      setStatus("Email address is required.");
      return;
    }

    const res = await fetch("http://127.0.0.1:8000/staff/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        passcode,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(data.detail || "Registration failed.");
      return;
    }

    setStatus(`Registered ${data.email} successfully!`);
    setFullName("");
    setEmail("");
    setPasscode("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Full Name *</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Email Address * (Required for Login OTP)</label>
        <input
          type="email"
          placeholder="staff@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label>6-Digit Passcode *</label>
        <input
          type="password"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          required
        />
      </div>

      <button type="submit">Register Staff</button>
      {status && <p>{status}</p>}
    </form>
  );
}