import { Resend } from "resend";

let resend: Resend | null = null;

function getClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM = "Zuklo <onboarding@resend.dev>";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const client = getClient();
  if (!client) {
    console.warn("RESEND_API_KEY not configured — skipping email");
    return false;
  }
  try {
    await client.emails.send({
      from: FROM,
      to: email,
      subject: "Recuperá tu contraseña - Zuklo",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #10b981; margin-bottom: 8px;">Zuklo</h2>
          <h3 style="color: #334155; margin-bottom: 16px;">Recuperá tu contraseña</h3>
          <p style="color: #475569; line-height: 1.6;">
            Recibiste este email porque solicitaste recuperar tu contraseña. Hacé clic en el botón de abajo para crear una nueva:
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Restablecer contraseña
          </a>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
            Este link expira en 1 hora. Si no solicitaste este cambio, ignorá este email.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  const client = getClient();
  if (!client) {
    console.warn("RESEND_API_KEY not configured — skipping email");
    return false;
  }
  try {
    await client.emails.send({
      from: FROM,
      to: email,
      subject: "Verificá tu email - Zuklo",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #10b981; margin-bottom: 8px;">Zuklo</h2>
          <h3 style="color: #334155; margin-bottom: 16px;">Verificá tu email</h3>
          <p style="color: #475569; line-height: 1.6;">
            Bienvenido a Zuklo. Hacé clic en el botón de abajo para verificar tu email y activar tu cuenta:
          </p>
          <a href="${verifyUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Verificar email
          </a>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
            Este link expira en 24 horas. Si no creaste esta cuenta, ignorá este email.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

export async function sendContactEmail(
  landlordEmail: string,
  landlordName: string,
  propertyTitle: string,
  tenantName: string,
  tenantEmail: string,
  message: string
) {
  const client = getClient();
  if (!client) {
    console.warn("RESEND_API_KEY not configured — skipping email");
    return false;
  }
  try {
    await client.emails.send({
      from: FROM,
      to: landlordEmail,
      subject: `Consulta sobre "${propertyTitle}" - Zuklo`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #10b981; margin-bottom: 8px;">Zuklo</h2>
          <h3 style="color: #334155; margin-bottom: 16px;">Nueva consulta sobre tu propiedad</h3>
          <p style="color: #475569; line-height: 1.6;">
            <strong>${tenantName}</strong> (${tenantEmail}) te contactó sobre:
          </p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="color: #334155; font-weight: 600; margin: 0 0 8px 0;">${propertyTitle}</p>
            <p style="color: #475569; margin: 0; line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
            Respondé directamente a ${tenantEmail} para contactar al inquilino.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send contact email:", error);
    return false;
  }
}
