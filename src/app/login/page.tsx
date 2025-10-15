"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Login fehlgeschlagen. Bitte Zugangsdaten prüfen.");
    } else {
      window.location.href = "/dashboard";
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 via-white to-green-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-semibold text-gray-900">
          Anmelden
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Melde dich mit deinem PhenoHub-Konto an. Falls du noch keinen Zugang hast,
          kannst du dich unten registrieren.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              required
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:cursor-not-allowed disabled:bg-green-400"
          >
            {isLoading ? "Anmelden..." : "Login"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Noch kein Konto? {" "}
          <a
            className="font-semibold text-green-700 underline transition hover:text-green-800"
            href="/register"
          >
            Jetzt registrieren
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
