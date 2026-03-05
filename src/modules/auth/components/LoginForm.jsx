import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/useAuthContext";
import { isSuperUser } from "../../../utils/roles";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        err?.response?.data?.message || err?.message || "No fue posible iniciar sesión.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6 sm:space-y-7" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2.5 block text-[1.15rem] font-semibold text-slate-600 sm:text-[1.2rem]">Email</span>
        <input
          type="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-[54px] w-full rounded-2xl border border-slate-200 bg-[#f4f7fb] px-4 text-[1.15rem] text-slate-600 outline-none transition placeholder:text-slate-300 focus:border-[#2e64df] focus:ring-2 focus:ring-[#2e64df]/15 sm:h-14 sm:text-[1.2rem]"
          required
        />
      </label>

      <div>
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <label htmlFor="password" className="block text-[1.15rem] font-semibold text-slate-600 sm:text-[1.2rem]">
            Contrasena
          </label>
          <button
            type="button"
            className="shrink-0 text-sm font-semibold text-[#2e64df] hover:text-[#2453bf] sm:text-[1rem]"
          >
            Olvidaste tu contrasena?
          </button>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-[54px] w-full rounded-2xl border border-slate-200 bg-[#f4f7fb] px-4 text-[1.15rem] text-slate-600 outline-none transition placeholder:text-slate-300 focus:border-[#2e64df] focus:ring-2 focus:ring-[#2e64df]/15 sm:h-14 sm:text-[1.2rem]"
          required
        />
      </div>

      <label className="inline-flex w-full cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
          className="h-[18px] w-[18px] rounded border-slate-300 text-[#2e64df] focus:ring-[#2e64df]/30"
        />
        <span className="text-[1.05rem] font-medium text-slate-400 sm:text-[1.08rem]">Recordar sesion</span>
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#2e64df] text-[1.3rem] font-semibold text-white shadow-[0_10px_18px_rgba(46,100,223,0.32)] transition hover:bg-[#2453bf] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[58px]"
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

export default LoginForm;
