import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoMediflow from "../../assets/logo-mediflow.png";
import logoCsjd from "../../assets/logo-csjd.png";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Alterna entre los dos logos
  const [logoActivo, setLogoActivo] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const intervalo = setInterval(() => {
      // Fade out
      setFadeIn(false);
      setTimeout(() => {
        setLogoActivo((prev) => (prev === 0 ? 1 : 0));
        setFadeIn(true);
      }, 600);
    }, 4000);
    return () => clearInterval(intervalo);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const data = await login(email, password);
      if (data.rol === "director") navigate("/director");
      else if (data.rol === "admision") navigate("/admision");
      else if (data.rol === "archivos") navigate("/archivos");
      else navigate("/coordinador");
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setCargando(false);
    }
  };

  const logos = [
    { src: logoMediflow, alt: "MediFlow", label: "Gestión Médica Digital" },
    {
      src: logoCsjd,
      alt: "Clínica San Juan de Dios",
      label: "Clínica San Juan de Dios",
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — animación de logos */}
      <div
        className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0f2044 0%, #1a3a6b 50%, #0e6e8a 100%)",
        }}
      >
        {/* Círculos decorativos de fondo */}
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: 400,
            height: 400,
            background: "radial-gradient(circle, #378ADD, transparent)",
            top: -100,
            left: -100,
          }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: 300,
            height: 300,
            background: "radial-gradient(circle, #1D9E75, transparent)",
            bottom: -80,
            right: -80,
          }}
        />

        {/* Logo animado */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            style={{
              opacity: fadeIn ? 1 : 0,
              transform: fadeIn
                ? "scale(1) translateY(0)"
                : "scale(0.95) translateY(10px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
            className="flex flex-col items-center"
          >
            <img
              src={logos[logoActivo].src}
              alt={logos[logoActivo].alt}
              style={{
                width: 280,
                height: "auto",
                filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.3))",
              }}
            />
          </div>

          {/* Indicadores de logo activo */}
          <div className="flex gap-2 mt-10">
            {logos.map((_, i) => (
              <div
                key={i}
                onClick={() => setLogoActivo(i)}
                className="rounded-full cursor-pointer transition-all"
                style={{
                  width: i === logoActivo ? 24 : 8,
                  height: 8,
                  background:
                    i === logoActivo ? "#1D9E75" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>

          {/* Texto inferior */}
          <div className="mt-8 text-center">
            <div
              className="text-white text-opacity-60 text-sm"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Sistema de gestión de productividad médica
            </div>
            <div
              className="text-white text-opacity-40 text-xs mt-2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Clínica San Juan de Dios — Cusco, Perú
            </div>
          </div>
        </div>

        {/* Línea de pulso decorativa */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-20">
          <svg width="320" height="40" viewBox="0 0 320 40">
            <polyline
              points="0,20 40,20 60,5 80,35 100,20 140,20 160,2 180,38 200,20 240,20 260,10 280,30 300,20 320,20"
              fill="none"
              stroke="#1D9E75"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-col items-center justify-center w-full lg:w-96 xl:w-[420px] px-8 bg-white">
        {/* Logo pequeño en mobile */}
        <div className="lg:hidden mb-8">
          <img
            src={logoMediflow}
            alt="MediFlow"
            style={{ width: 160, height: "auto" }}
          />
        </div>

        <div className="w-full max-w-sm">
          {/* Título */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-gray-900">Bienvenido</h1>
            <p className="text-sm text-gray-500 mt-1">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@csjd.com"
                required
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #1a3a6b, #0e6e8a)",
              }}
            >
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="text-xs text-gray-400">
              MediFlow v1.0 · Clínica San Juan de Dios
            </div>
            <div className="text-xs text-gray-300 mt-1">Cusco, Perú · 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
