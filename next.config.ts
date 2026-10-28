import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cabeceras de seguridad: nadie puede meter el admin dentro de otra página (clickjacking),
  // el enlace secreto de una entrada no viaja como "referer" a otros sitios y la cámara
  // solo la usa esta web.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // Rutas del sistema anterior (venta online con sillas) que ahora viven en otro lugar.
  async redirects() {
    return [
      { source: "/escanear", destination: "/puerta", permanent: false },
      { source: "/seminaristas", destination: "/vendedores", permanent: false },
      { source: "/comprar", destination: "/activar", permanent: false },
      { source: "/ticket/:code", destination: "/e/:code", permanent: false },
      { source: "/administracion-interna", destination: "/equipo", permanent: false },
      { source: "/admin/comprobantes", destination: "/admin/verificaciones", permanent: false },
      { source: "/admin/asistentes", destination: "/admin/entradas", permanent: false },
      { source: "/admin/asistencia", destination: "/admin/entradas", permanent: false },
      { source: "/admin/nueva-venta", destination: "/admin/entradas", permanent: false },
      { source: "/admin/reportes", destination: "/admin", permanent: false },
    ];
  },
};

export default nextConfig;
