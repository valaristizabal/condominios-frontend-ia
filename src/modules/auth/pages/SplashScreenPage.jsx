import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/useAuthContext";
import { isSuperUser } from "../../../utils/roles";

const MIN_SPLASH_DURATION_MS = 2400;
const FADE_OUT_DURATION_MS = 420;

function SplashScreenPage() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuthContext();
  const startedAtRef = useRef(Date.now());
  const [isExiting, setIsExiting] = useState(false);

  const destination = user ? (isSuperUser(user?.role) ? "/condominiums" : "/dashboard") : "/login";

  useEffect(() => {
    if (authLoading) return undefined;

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_SPLASH_DURATION_MS - elapsed);
    const exitDelay = Math.max(0, remaining - FADE_OUT_DURATION_MS);

    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, exitDelay);

    const navigateTimer = window.setTimeout(() => {
      navigate(destination, {
        replace: true,
        state: user ? undefined : { fromSplash: true },
      });
    }, remaining);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(navigateTimer);
    };
  }, [authLoading, destination, navigate]);

  return (
    <main
      className={[
        "relative flex min-h-screen min-h-[100svh] min-h-[100dvh] items-center justify-center overflow-hidden px-6 py-8 transition-opacity duration-500",
        isExiting ? "opacity-0" : "opacity-100",
      ].join(" ")}
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 44%, rgba(15,23,42,0.035) 0%, transparent 30%), radial-gradient(circle at 50% 58%, rgba(15,23,42,0.02) 0%, transparent 38%)",
        }}
      />

      <section className="relative z-10 flex w-full max-w-xl flex-col items-center justify-center text-center">
        <div className="animate-[splash-fade-in_900ms_ease-out_forwards] px-6 py-10 sm:px-8">
          <div className="mx-auto flex flex-col items-center">
            <img
              src="/docs/organizacion-gen-negro.png"
              alt="Organizacion Gen"
              className="w-[min(82vw,22rem)] max-w-[360px] min-w-[190px] object-contain opacity-0 [animation:logo-float_2.8s_ease-in-out_infinite,logo-fade_800ms_ease-out_180ms_forwards]"
            />
          </div>

          <div className="mt-7 flex flex-col items-center gap-4">
            <span
              className="relative block h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: "rgba(15,23,42,0.14)",
                borderTopColor: "#111111",
              }}
              aria-hidden="true"
            >
              <span
                className="absolute inset-[5px] rounded-full border border-transparent"
                style={{ borderTopColor: "#2f2f2f", opacity: 0.3 }}
              />
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default SplashScreenPage;
