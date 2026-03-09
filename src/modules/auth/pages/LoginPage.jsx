import LoginForm from "../components/LoginForm";

function LoginPage() {
  return (
    <main className="min-h-screen min-h-[100svh] min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#e9edf2] px-3 py-3 sm:px-6 sm:py-6">
      {/* 100dvh + scroll evita cortes del login en moviles con barra del navegador/teclado */}
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-[400px] flex-col sm:min-h-[calc(100dvh-3rem)]">
        <section className="flex flex-1 items-center justify-center">
          <div className="w-full rounded-[24px] bg-[#f8fafc] px-4 py-5 shadow-[0_14px_36px_rgba(15,23,42,0.12)] sm:px-6 sm:py-7">
            <div className="mb-6 flex w-full flex-col items-center text-center sm:mb-7">
            <img
              src="/image/isotipo1.png"
              alt="genAccess"
              className="mb-3 block h-11 w-11 rounded-xl object-contain sm:mb-4 sm:h-12 sm:w-12"
            />
            <h1 className="text-[2rem] font-extrabold leading-none tracking-tight text-slate-900 sm:text-[2.2rem]">
              genAccess
            </h1>
            <p className="mx-auto mt-2 max-w-[260px] text-[0.98rem] leading-snug text-slate-400 sm:text-[1.02rem]">
              Plataforma Inteligente de Gestión para Propiedad Horizontal
            </p>
            </div>

            <LoginForm />
          </div>
        </section>

        <footer className="mt-4 pb-1">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <img
              src="/docs/GEN VERDE (2).png"
              alt="Organización Gen"
              className="h-6 w-auto opacity-80 sm:h-7"
            />
            <span className="text-xs font-semibold text-slate-500">Por Organización Gen</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default LoginPage;
