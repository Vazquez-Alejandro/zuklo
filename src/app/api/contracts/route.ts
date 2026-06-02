import { NextRequest, NextResponse } from "next/server";
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
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const contract = createContract(body);
    const summary = getContractSummary(contract);

    return NextResponse.json({ contract, summary }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const contractId = searchParams.get("contractId");

    if (contractId) {
      const contract = getContract(contractId);
      if (!contract) {
        return NextResponse.json({ error: "Contract not found" }, { status: 404 });
      }
      const summary = getContractSummary(contract);
      return NextResponse.json({ contract, summary });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const contracts = getContractsByUser(userId);
    const contractsWithSummary = contracts.map((c) => ({
      contract: c,
      summary: getContractSummary(c),
    }));

    return NextResponse.json({ contracts: contractsWithSummary });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, action, ...updateData } = body;

    if (!contractId) {
      return NextResponse.json({ error: "contractId is required" }, { status: 400 });
    }

    if (action === "activate") {
      const contract = activateContract(contractId);
      if (!contract) {
        return NextResponse.json({ error: "Contract not found" }, { status: 404 });
      }
      return NextResponse.json({ contract, summary: getContractSummary(contract) });
    }

    const contract = updateContract(contractId, updateData);
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json({ contract, summary: getContractSummary(contract) });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");

    if (!contractId) {
      return NextResponse.json({ error: "contractId is required" }, { status: 400 });
    }

    const deleted = deleteContract(contractId);
    if (!deleted) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
