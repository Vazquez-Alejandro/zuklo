import { NextRequest, NextResponse } from "next/server";
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
    const body = await request.json();
    const { contractId, userId } = body;

    if (!contractId || !userId) {
      return NextResponse.json(
        { error: "contractId and userId are required" },
        { status: 400 }
      );
    }

    const expense = createMaintenanceExpense(body);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");

    if (action === "categories") {
      return NextResponse.json({ categories: EXPENSE_CATEGORIES });
    }

    if (contractId) {
      const expenses = getMaintenanceExpensesByContract(contractId);
      const summary = getExpenseSummary(contractId);
      return NextResponse.json({ expenses, summary });
    }

    if (userId) {
      const expenses = getMaintenanceExpensesByUser(userId);
      return NextResponse.json({ expenses });
    }

    return NextResponse.json(
      { error: "contractId or userId is required" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { expenseId, action, photoUrl, ...updateData } = body;

    if (!expenseId) {
      return NextResponse.json({ error: "expenseId is required" }, { status: 400 });
    }

    if (action === "add-photo" && photoUrl) {
      const expense = addPhotoToExpense(expenseId, photoUrl);
      if (!expense) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      return NextResponse.json({ expense });
    }

    if (action === "remove-photo" && photoUrl) {
      const expense = removePhotoFromExpense(expenseId, photoUrl);
      if (!expense) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      return NextResponse.json({ expense });
    }

    const expense = updateMaintenanceExpense(expenseId, updateData);
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get("expenseId");

    if (!expenseId) {
      return NextResponse.json({ error: "expenseId is required" }, { status: 400 });
    }

    const deleted = deleteMaintenanceExpense(expenseId);
    if (!deleted) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
