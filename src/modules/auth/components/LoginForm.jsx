import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/useAuthContext";
import { isSuperUser } from "../../../utils/roles";

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
      const targetRoute = isSuperUser(data?.me?.role) ? "/condominiums" : "/dashboard";
      navigate(targetRoute, { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "No fue posible iniciar sesion.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-base font-semibold text-slate-600 sm:text-[1.05rem]">Email</span>
        <input
          type="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-[#f4f7fb] px-3.5 text-base text-slate-600 outline-none transition placeholder:text-slate-300 focus:border-[#2e64df] focus:ring-2 focus:ring-[#2e64df]/15 sm:h-12"
          required
        />
      </label>

      <div>
        <label htmlFor="password" className="mb-2 block text-base font-semibold text-slate-600 sm:text-[1.05rem]">
          Contrasena
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-[#f4f7fb] px-3.5 pr-11 text-base text-slate-600 outline-none transition placeholder:text-slate-300 focus:border-[#2e64df] focus:ring-2 focus:ring-[#2e64df]/15 sm:h-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <label className="inline-flex w-full cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-[#2e64df] focus:ring-[#2e64df]/30"
        />
        <span className="text-[0.95rem] font-medium text-slate-400 sm:text-base">Recordar sesion</span>
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2e64df] text-lg font-semibold text-white shadow-[0_10px_18px_rgba(46,100,223,0.32)] transition hover:bg-[#2453bf] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span>{loading ? "Ingresando..." : "Iniciar sesion"}</span>
        <ArrowRightIcon />
      </button>
    </form>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M13.3 4.3a1 1 0 0 1 1.4 0l7 7a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4-1.4l5.3-5.3H3a1 1 0 1 1 0-2h15.6l-5.3-5.3a1 1 0 0 1 0-1.4Z" />
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

export default LoginForm;
