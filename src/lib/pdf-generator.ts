import type { TenantProfile } from "./tenant-profile";
import { generateProfileSummary } from "./tenant-profile";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getVerificationBadge(score: number): { color: string; label: string } {
  if (score >= 90) return { color: "#10B981", label: "VERIFICADO" };
  if (score >= 70) return { color: "#3B82F6", label: "PREMIUM" };
  if (score >= 50) return { color: "#F59E0B", label: "ESTÁNDAR" };
  return { color: "#6B7280", label: "BÁSICO" };
}

export function generateProfileHTML(profile: TenantProfile): string {
  const badge = getVerificationBadge(profile.metadata.verificationScore);
  const summary = generateProfileSummary(profile);
  const totalIncome =
    profile.income.primaryIncome + profile.income.secondaryIncome;
  const displayName = `${escapeHtml(profile.personalInfo.firstName)} ${escapeHtml(profile.personalInfo.lastName)}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ficha de Inquilino - ${escapeHtml(profile.personalInfo.firstName)} ${escapeHtml(profile.personalInfo.lastName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
    }

    .page {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 3px solid #0ea5e9;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 20px;
    }

    .brand-name {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
    }

    .brand-tagline {
      font-size: 12px;
      color: #64748b;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .verification-badge {
      background: ${badge.color};
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .profile-header {
      display: flex;
      gap: 24px;
      margin-bottom: 32px;
      padding: 24px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 16px;
      border: 1px solid #bae6fd;
    }

    .avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 32px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .profile-info h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .profile-info .subtitle {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 12px;
    }

    .quick-stats {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
    }

    .section {
      margin-bottom: 28px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #0ea5e9;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .field-value {
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .field-value.highlight {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
    }

    .income-card {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }

    .income-label {
      font-size: 12px;
      color: #065f46;
      margin-bottom: 4px;
    }

    .income-amount {
      font-size: 28px;
      font-weight: 700;
      color: #065f46;
    }

    .income-sub {
      font-size: 12px;
      color: #059669;
      margin-top: 4px;
    }

    .guarantor-card {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 12px;
      padding: 16px;
    }

    .guarantor-card.no-guarantor {
      background: #fef2f2;
      border-color: #fca5a5;
    }

    .person-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .person-card h4 {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .person-card .detail {
      font-size: 12px;
      color: #64748b;
    }

    .pet-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      color: #92400e;
      margin: 4px;
    }

    .reference-card {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
    }

    .history-card {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
    }

    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-brand {
      font-size: 12px;
      color: #94a3b8;
    }

    .footer-date {
      font-size: 12px;
      color: #94a3b8;
    }

    .qr-placeholder {
      width: 80px;
      height: 80px;
      background: #f1f5f9;
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }

    @media print {
      body { background: white; }
      .page { padding: 20px; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="brand-logo">Z</div>
        <div>
          <div class="brand-name">Zuklo</div>
          <div class="brand-tagline">Ficha Verificada de Inquilino</div>
        </div>
      </div>
      <div class="verification-badge">${badge.label} • ${profile.metadata.verificationScore}%</div>
    </div>

    <div class="profile-header">
      <div class="avatar">${escapeHtml(profile.personalInfo.firstName[0])}${escapeHtml(profile.personalInfo.lastName[0])}</div>
      <div class="profile-info">
        <h1>${displayName}</h1>
        <div class="subtitle">DNI: ${escapeHtml(profile.personalInfo.dni)} • CUIL: ${escapeHtml(profile.personalInfo.cuil)}</div>
        <div class="quick-stats">
          <div class="stat">
            <span class="stat-label">Ingreso Mensual</span>
            <span class="stat-value">${summary.monthlyIncomeFormatted}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Garantía</span>
            <span class="stat-value">${summary.guarantorStatus}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Mascotas</span>
            <span class="stat-value">${summary.petCount > 0 ? summary.petCount + " registrada(s)" : "Sin mascotas"}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Co-habitantes</span>
            <span class="stat-value">${summary.coHabitantCount > 0 ? summary.coHabitantCount : "Ninguno"}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Datos Personales</div>
      <div class="grid-2">
        <div class="field">
          <span class="field-label">Nombre Completo</span>
          <div class="field-value">${escapeHtml(summary.displayName)}</div>
        </div>
        <div class="field">
          <span class="field-label">Fecha de Nacimiento</span>
          <div class="field-value">${escapeHtml(profile.personalInfo.dateOfBirth)}</div>
        </div>
        <div class="field">
          <span class="field-label">Nacionalidad</span>
          <div class="field-value">${escapeHtml(profile.personalInfo.nationality)}</div>
        </div>
        <div class="field">
          <span class="field-label">Estado Civil</span>
          <div class="field-value">${escapeHtml(profile.personalInfo.maritalStatus)}</div>
        </div>
        <div class="field">
          <span class="field-label">Teléfono</span>
          <div class="field-value">${escapeHtml(profile.personalInfo.phone)}</div>
        </div>
        <div class="field">
          <span class="field-label">Email</span>
          <div class="field-value">${escapeHtml(profile.personalInfo.email)}</div>
        </div>
        <div class="field" style="grid-column: span 2">
          <span class="field-label">Domicilio Actual</span>
          <div class="field-value">${escapeHtml(profile.personalInfo.currentAddress)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Situación Laboral e Ingresos</div>
      <div class="income-card">
        <div class="income-label">INGRESO MENSUAL TOTAL</div>
        <div class="income-amount">${formatCurrency(totalIncome)}</div>
        <div class="income-sub">Ingreso principal: ${formatCurrency(profile.income.primaryIncome)} • Secundario: ${formatCurrency(profile.income.secondaryIncome)}</div>
      </div>
      <div class="grid-2" style="margin-top: 16px">
        <div class="field">
          <span class="field-label">Situación Laboral</span>
          <div class="field-value">${profile.employment.situation === "employed" ? "Empleado" : profile.employment.situation === "self-employed" ? "Autónomo" : profile.employment.situation === "retired" ? "Jubilado" : profile.employment.situation === "student" ? "Estudiante" : "Desempleado"}</div>
        </div>
        <div class="field">
          <span class="field-label">Empresa / Razón Social</span>
          <div class="field-value">${escapeHtml(profile.employment.companyName)}</div>
        </div>
        <div class="field">
          <span class="field-label">Puesto</span>
          <div class="field-value">${escapeHtml(profile.employment.position)}</div>
        </div>
        <div class="field">
          <span class="field-label">Antigüedad</span>
          <div class="field-value">${escapeHtml(profile.employment.seniority)}</div>
        </div>
        <div class="field">
          <span class="field-label">Tipo de Contrato</span>
          <div class="field-value">${escapeHtml(profile.employment.contractType)}</div>
        </div>
        <div class="field">
          <span class="field-label">Recibos de Sueldo</span>
          <div class="field-value">${profile.employment.payslipAvailable ? "Disponibles" : "No disponibles"}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Garantía</div>
      ${profile.guarantor.hasGuarantor ? `
      <div class="guarantor-card">
        <div class="grid-2">
          <div class="field">
            <span class="field-label">${profile.guarantor.isCorporate ? "Empresa Garante" : "Nombre del Garante"}</span>
            <div class="field-value">${escapeHtml(profile.guarantor.isCorporate ? profile.guarantor.corporateName : profile.guarantor.name)}</div>
          </div>
          <div class="field">
            <span class="field-label">${profile.guarantor.isCorporate ? "CUIT" : "DNI"}</span>
            <div class="field-value">${escapeHtml(profile.guarantor.isCorporate ? profile.guarantor.corporateCuit : profile.guarantor.dni)}</div>
          </div>
          <div class="field">
            <span class="field-label">Ingreso Mensual</span>
            <div class="field-value highlight">${formatCurrency(profile.guarantor.monthlyIncome)}</div>
          </div>
          <div class="field">
            <span class="field-label">Relación</span>
            <div class="field-value">${escapeHtml(profile.guarantor.relationship)}</div>
          </div>
        </div>
      </div>
      ` : `
      <div class="guarantor-card no-guarantor">
        <p style="color: #dc2626; font-weight: 500;">No se ha registrado garantía</p>
      </div>
      `}
    </div>

    ${profile.pets.length > 0 ? `
    <div class="section">
      <div class="section-title">Mascotas (${profile.pets.length})</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${profile.pets.map(pet => `
          <div class="pet-tag">
            ${pet.type === "dog" ? "🐕" : pet.type === "cat" ? "🐈" : "🐦"}
            ${escapeHtml(pet.name)} — ${escapeHtml(pet.breed)} (${pet.weight}kg)
            ${pet.vaccinated ? "• Vacunada" : ""}
            ${pet.sterilized ? "• Esterilizada" : ""}
          </div>
        `).join("")}
      </div>
    </div>
    ` : ""}

    ${profile.coHabitants.length > 0 ? `
    <div class="section">
      <div class="section-title">Co-habitantes (${profile.coHabitants.length})</div>
      ${profile.coHabitants.map(person => `
        <div class="person-card">
          <h4>${escapeHtml(person.name)}</h4>
          <div class="detail">DNI: ${escapeHtml(person.dni)} • ${escapeHtml(person.relationship)} • ${person.age} años • ${escapeHtml(person.occupation)}</div>
        </div>
      `).join("")}
    </div>
    ` : ""}

    ${profile.references.length > 0 ? `
    <div class="section">
      <div class="section-title">Referencias (${profile.references.length})</div>
      ${profile.references.map(ref => `
        <div class="reference-card">
          <strong>${escapeHtml(ref.name)}</strong> — ${escapeHtml(ref.relationship)}<br>
          <span style="font-size: 12px; color: #64748b;">${escapeHtml(ref.phone)} • ${escapeHtml(ref.email)} • Conocido desde ${escapeHtml(ref.knownSince)}</span>
        </div>
      `).join("")}
    </div>
    ` : ""}

    ${profile.rentalHistory.length > 0 ? `
    <div class="section">
      <div class="section-title">Historial de Alquileres</div>
      ${profile.rentalHistory.map(hist => `
        <div class="history-card">
          <strong>${escapeHtml(hist.address)}</strong><br>
          <span style="font-size: 12px; color: #64748b;">
            Propietario: ${escapeHtml(hist.landlord)} • ${escapeHtml(hist.landlordPhone)}<br>
            Duración: ${escapeHtml(hist.duration)} • Alquiler: ${formatCurrency(hist.rentAmount)}<br>
            Motivo de salida: ${escapeHtml(hist.reasonForLeaving)}
          </span>
        </div>
      `).join("")}
    </div>
    ` : ""}

    <div class="footer">
      <div>
        <div class="footer-brand">Zuklo • Ficha Verificada de Inquilino</div>
        <div class="footer-date">Generada el ${new Date().toLocaleDateString("es-AR")} a las ${new Date().toLocaleTimeString("es-AR")}</div>
      </div>
      <div class="qr-placeholder">Código QR<br>de verificación</div>
    </div>
  </div>
</body>
</html>`;
}

export async function generateProfilePDF(
  profile: TenantProfile
): Promise<Buffer | null> {
  try {
    const puppeteer = await import("puppeteer-core");
    const browser = await puppeteer.default.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    const html = generateProfileHTML(profile);

    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
}
