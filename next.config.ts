import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
