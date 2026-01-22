"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Verify password with API
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store password in sessionStorage
        sessionStorage.setItem("demo_password", password);
        router.push("/");
      } else {
        setError(data.error || "Invalid password");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Label Visualizer Demo
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className={`
                w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200
                ${
                  password && !loading
                    ? "bg-primary text-white hover:bg-primary-600 shadow-lg hover:shadow-xl"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {loading ? "Verifying..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Contact marketing for demo access
          </p>
        </div>
      </div>
    </main>
  );
}
