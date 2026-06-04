import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const VALID_TIPOS = ["Acceso", "Rectificación", "Cancelación", "Oposición"] as const;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`arco:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intente en un minuto." },
      { status: 429 }
    );
  }

  let body: {
    nombre?: string;
    email?: string;
    dni?: string;
    tipoSolicitud?: string;
    detalle?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const { nombre, email, dni, tipoSolicitud, detalle } = body;

  if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
  if (!dni || typeof dni !== "string" || !/^\d{7,8}$/.test(dni.trim())) {
    return NextResponse.json({ error: "DNI inválido" }, { status: 400 });
  }
  if (!tipoSolicitud || !VALID_TIPOS.includes(tipoSolicitud as (typeof VALID_TIPOS)[number])) {
    return NextResponse.json({ error: "Tipo de solicitud inválido" }, { status: 400 });
  }
  if (!detalle || typeof detalle !== "string" || !detalle.trim()) {
    return NextResponse.json({ error: "El detalle es requerido" }, { status: 400 });
  }

  console.log("[ARCO] Nueva solicitud recibida:", {
    timestamp: new Date().toISOString(),
    ip,
    nombre: nombre.trim(),
    email: email.trim(),
    dni: dni.trim(),
    tipoSolicitud,
    detalle: detalle.trim(),
  });

  return NextResponse.json({
    success: true,
    message: "Solicitud recibida correctamente. Será procesada en un plazo de 10 días hábiles.",
  });
}
