import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase";
import {
  createContract,
  getContractsByUser,
  getContract,
  updateContract,
  deleteContract,
  activateContract,
  getContractSummary,
} from "@/lib/contracts";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const contract = await createContract({ ...body, userId: user.id });
    const summary = getContractSummary(contract);

    return NextResponse.json({ contract, summary }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");

    if (contractId) {
      const contract = await getContract(contractId);
      if (!contract || contract.userId !== user.id) {
        return NextResponse.json({ error: "Contract not found" }, { status: 404 });
      }
      const summary = getContractSummary(contract);
      return NextResponse.json({ contract, summary });
    }

    const contracts = await getContractsByUser(user.id);
    const contractsWithSummary = contracts.map((c) => ({
      contract: c,
      summary: getContractSummary(c),
    }));

    return NextResponse.json({ contracts: contractsWithSummary });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { contractId, action, ...updateData } = body;

    if (!contractId) {
      return NextResponse.json({ error: "contractId is required" }, { status: 400 });
    }

    const existing = await getContract(contractId);
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (action === "activate") {
      const contract = await activateContract(contractId);
      if (!contract) {
        return NextResponse.json({ error: "Contract not found" }, { status: 404 });
      }
      return NextResponse.json({ contract, summary: getContractSummary(contract) });
    }

    const contract = await updateContract(contractId, updateData);
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json({ contract, summary: getContractSummary(contract) });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");

    if (!contractId) {
      return NextResponse.json({ error: "contractId is required" }, { status: 400 });
    }

    const existing = await getContract(contractId);
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const deleted = await deleteContract(contractId);
    if (!deleted) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
