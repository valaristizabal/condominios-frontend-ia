import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/useAuthContext";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);

      if (!data?.token) {
        throw new Error("Token no recibido.");
      }

      localStorage.setItem("remember_device", String(rememberDevice));
      const targetRoute = data?.me?.role === "super_admin" ? "/condominiums" : "/dashboard";
      navigate(targetRoute, { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "No fue posible iniciar sesión.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-7" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2.5 block text-[1.25rem] font-bold text-slate-700">
          Email Address
        </span>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            <MailIcon />
          </span>
          <input
            type="email"
            autoComplete="email"
            placeholder="manager@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 w-full rounded-xl border border-slate-300 bg-slate-100 pl-12 pr-4 text-[1.2rem] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>
      </label>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <label htmlFor="password" className="block text-[1.25rem] font-bold text-slate-700">
            Password
          </label>
          <button
            type="button"
            className="text-[1.05rem] font-semibold text-blue-700 hover:text-blue-800"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            <LockIcon />
          </span>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 w-full rounded-xl border border-slate-300 bg-slate-100 pl-12 pr-12 text-[1.2rem] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center rounded-md px-2 text-slate-500 hover:text-slate-700"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
        />
        <span className="text-[1.1rem] font-medium text-slate-600">Remember this device</span>
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#174abf] text-[1.35rem] font-bold text-white shadow-[0_10px_18px_rgba(23,74,191,0.35)] transition hover:bg-[#123ea3] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span>{loading ? "Signing In..." : "Sign In"}</span>
        <ArrowRightIcon />
      </button>
    </form>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Zm2 .41v.09l7 4.62 7-4.62v-.09H5Zm14 2.49-6.45 4.26a1 1 0 0 1-1.1 0L5 9.4v8.1a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5V9.4Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M7 10V8a5 5 0 1 1 10 0v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1Zm2 0h6V8a3 3 0 0 0-6 0v2Zm3 4a1.5 1.5 0 0 1 1.5 1.5c0 .5-.24.94-.6 1.22V18a.9.9 0 1 1-1.8 0v-1.28a1.5 1.5 0 0 1 .9-2.72Z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M12 5c5.6 0 9.4 4.45 10.7 6.24a1.2 1.2 0 0 1 0 1.52C21.4 14.55 17.6 19 12 19S2.6 14.55 1.3 12.76a1.2 1.2 0 0 1 0-1.52C2.6 9.45 6.4 5 12 5Zm0 2C8 7 4.9 10.07 3.4 12 4.9 13.93 8 17 12 17s7.1-3.07 8.6-5C19.1 10.07 16 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="m2.3 3.7 18 18-1.4 1.4-2.94-2.94A12.5 12.5 0 0 1 12 19c-5.6 0-9.4-4.45-10.7-6.24a1.2 1.2 0 0 1 0-1.52A24.9 24.9 0 0 1 5.06 7.1L.9 2.9 2.3 1.5Zm4.22 4.22A22.9 22.9 0 0 0 3.4 12C4.9 13.93 8 17 12 17c1.04 0 2.03-.21 2.96-.58l-1.7-1.7a2.5 2.5 0 0 1-3.48-3.48l-1.7-1.7A8.6 8.6 0 0 0 12 7c3.28 0 5.99 2.07 7.61 4.04.43.52.76.98.99 1.31a23.8 23.8 0 0 1-2.1 2.42l1.41 1.41a23.7 23.7 0 0 0 2.8-3.42 1.2 1.2 0 0 0 0-1.52C21.4 9.45 17.6 5 12 5c-2.16 0-4.02.66-5.48 1.92Z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M13.3 4.3a1 1 0 0 1 1.4 0l7 7a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4-1.4l5.3-5.3H3a1 1 0 1 1 0-2h15.6l-5.3-5.3a1 1 0 0 1 0-1.4Z" />
    </svg>
  );
}

export default LoginForm;
