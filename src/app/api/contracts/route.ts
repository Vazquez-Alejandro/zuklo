import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createContract,
  getContractsByUser,
  getContract,
  updateContract,
  deleteContract,
  activateContract,
  getContractSummary,
} from "@/lib/contracts";
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`contracts:post:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();

    const contract = await createContract({ ...body, userId: user.id });
    const summary = getContractSummary(contract);

    const duration = Date.now() - start;
    logRequest("POST", "/api/contracts", 201, duration, user.id);
    return NextResponse.json({ contract, summary }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/contracts", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("POST", "/api/contracts", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`contracts:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");

    if (contractId) {
      const contract = await getContract(contractId);
      if (!contract || contract.userId !== user.id) {
        const duration = Date.now() - start;
        logRequest("GET", "/api/contracts", 404, duration, user.id);
        return NextResponse.json({ error: "Contract not found" }, { status: 404 });
      }
      const summary = getContractSummary(contract);
      const duration = Date.now() - start;
      logRequest("GET", "/api/contracts", 200, duration, user.id);
      return NextResponse.json({ contract, summary });
    }

    const contracts = await getContractsByUser(user.id);
    const contractsWithSummary = contracts.map((c) => ({
      contract: c,
      summary: getContractSummary(c),
    }));

    const duration = Date.now() - start;
    logRequest("GET", "/api/contracts", 200, duration, user.id);
    return NextResponse.json({ contracts: contractsWithSummary });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/contracts", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/contracts", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`contracts:put:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { contractId, action, ...updateData } = body;

    if (!contractId) {
      const duration = Date.now() - start;
      logRequest("PUT", "/api/contracts", 400, duration, user.id);
      return NextResponse.json({ error: "contractId is required" }, { status: 400 });
    }

    const existing = await getContract(contractId);
    if (!existing || existing.userId !== user.id) {
      const duration = Date.now() - start;
      logRequest("PUT", "/api/contracts", 404, duration, user.id);
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (action === "activate") {
      const contract = await activateContract(contractId);
      if (!contract) {
        const duration = Date.now() - start;
        logRequest("PUT", "/api/contracts", 404, duration, user.id);
        return NextResponse.json({ error: "Contract not found" }, { status: 404 });
      }
      const duration = Date.now() - start;
      logRequest("PUT", "/api/contracts", 200, duration, user.id);
      return NextResponse.json({ contract, summary: getContractSummary(contract) });
    }

    const contract = await updateContract(contractId, updateData);
    if (!contract) {
      const duration = Date.now() - start;
      logRequest("PUT", "/api/contracts", 404, duration, user.id);
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const duration = Date.now() - start;
    logRequest("PUT", "/api/contracts", 200, duration, user.id);
    return NextResponse.json({ contract, summary: getContractSummary(contract) });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("PUT", "/api/contracts", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("PUT", "/api/contracts", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`contracts:delete:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");

    if (!contractId) {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/contracts", 400, duration, user.id);
      return NextResponse.json({ error: "contractId is required" }, { status: 400 });
    }

    const existing = await getContract(contractId);
    if (!existing || existing.userId !== user.id) {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/contracts", 404, duration, user.id);
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const deleted = await deleteContract(contractId);
    if (!deleted) {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/contracts", 404, duration, user.id);
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const duration = Date.now() - start;
    logRequest("DELETE", "/api/contracts", 200, duration, user.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/contracts", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("DELETE", "/api/contracts", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
