import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase";
import {
  createMaintenanceExpense,
  getMaintenanceExpensesByContract,
  getMaintenanceExpensesByUser,
  updateMaintenanceExpense,
  deleteMaintenanceExpense,
  addPhotoToExpense,
  removePhotoFromExpense,
  getExpenseSummary,
  EXPENSE_CATEGORIES,
} from "@/lib/maintenance";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { contractId } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: "contractId is required" },
        { status: 400 }
      );
    }

    const expense = await createMaintenanceExpense({ ...body, userId: user.id });
    return NextResponse.json({ expense }, { status: 201 });
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
    const action = searchParams.get("action");

    if (action === "categories") {
      return NextResponse.json({ categories: EXPENSE_CATEGORIES });
    }

    if (contractId) {
      const expenses = await getMaintenanceExpensesByContract(contractId);
      const summary = await getExpenseSummary(contractId);
      return NextResponse.json({ expenses, summary });
    }

    const expenses = await getMaintenanceExpensesByUser(user.id);
    return NextResponse.json({ expenses });
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
    const { expenseId, action, photoUrl, ...updateData } = body;

    if (!expenseId) {
      return NextResponse.json({ error: "expenseId is required" }, { status: 400 });
    }

    if (action === "add-photo" && photoUrl) {
      const expense = await addPhotoToExpense(expenseId, photoUrl);
      if (!expense) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      return NextResponse.json({ expense });
    }

    if (action === "remove-photo" && photoUrl) {
      const expense = await removePhotoFromExpense(expenseId, photoUrl);
      if (!expense) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      return NextResponse.json({ expense });
    }

    const expense = await updateMaintenanceExpense(expenseId, { ...updateData, userId: user.id });
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ expense });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get("expenseId");

    if (!expenseId) {
      return NextResponse.json({ error: "expenseId is required" }, { status: 400 });
    }

    const deleted = await deleteMaintenanceExpense(expenseId);
    if (!deleted) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
