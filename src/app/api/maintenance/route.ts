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
import { rateLimit } from "@/lib/rate-limit";
import { logRequest } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`maintenance:post:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { contractId } = body;

    if (!contractId) {
      const duration = Date.now() - start;
      logRequest("POST", "/api/maintenance", 400, duration, user.id);
      return NextResponse.json(
        { error: "contractId is required" },
        { status: 400 }
      );
    }

    const expense = await createMaintenanceExpense({ ...body, userId: user.id });
    const duration = Date.now() - start;
    logRequest("POST", "/api/maintenance", 201, duration, user.id);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("POST", "/api/maintenance", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("POST", "/api/maintenance", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`maintenance:get:${user.id}`, 100, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");
    const action = searchParams.get("action");

    if (action === "categories") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/maintenance", 200, duration, user.id);
      return NextResponse.json({ categories: EXPENSE_CATEGORIES });
    }

    if (contractId) {
      const expenses = await getMaintenanceExpensesByContract(contractId);
      const summary = await getExpenseSummary(contractId);
      const duration = Date.now() - start;
      logRequest("GET", "/api/maintenance", 200, duration, user.id);
      return NextResponse.json({ expenses, summary });
    }

    const expenses = await getMaintenanceExpensesByUser(user.id);
    const duration = Date.now() - start;
    logRequest("GET", "/api/maintenance", 200, duration, user.id);
    return NextResponse.json({ expenses });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("GET", "/api/maintenance", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("GET", "/api/maintenance", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`maintenance:put:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { expenseId, action, photoUrl, ...updateData } = body;

    if (!expenseId) {
      const duration = Date.now() - start;
      logRequest("PUT", "/api/maintenance", 400, duration, user.id);
      return NextResponse.json({ error: "expenseId is required" }, { status: 400 });
    }

    if (action === "add-photo" && photoUrl) {
      const expense = await addPhotoToExpense(expenseId, photoUrl);
      if (!expense) {
        const duration = Date.now() - start;
        logRequest("PUT", "/api/maintenance", 404, duration, user.id);
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      const duration = Date.now() - start;
      logRequest("PUT", "/api/maintenance", 200, duration, user.id);
      return NextResponse.json({ expense });
    }

    if (action === "remove-photo" && photoUrl) {
      const expense = await removePhotoFromExpense(expenseId, photoUrl);
      if (!expense) {
        const duration = Date.now() - start;
        logRequest("PUT", "/api/maintenance", 404, duration, user.id);
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
      const duration = Date.now() - start;
      logRequest("PUT", "/api/maintenance", 200, duration, user.id);
      return NextResponse.json({ expense });
    }

    const expense = await updateMaintenanceExpense(expenseId, { ...updateData, userId: user.id });
    if (!expense) {
      const duration = Date.now() - start;
      logRequest("PUT", "/api/maintenance", 404, duration, user.id);
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const duration = Date.now() - start;
    logRequest("PUT", "/api/maintenance", 200, duration, user.id);
    return NextResponse.json({ expense });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("PUT", "/api/maintenance", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("PUT", "/api/maintenance", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const start = Date.now();
  try {
    const user = await requireAuth(request);
    const rl = rateLimit(`maintenance:delete:${user.id}`, 50, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get("expenseId");

    if (!expenseId) {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/maintenance", 400, duration, user.id);
      return NextResponse.json({ error: "expenseId is required" }, { status: 400 });
    }

    const deleted = await deleteMaintenanceExpense(expenseId);
    if (!deleted) {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/maintenance", 404, duration, user.id);
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const duration = Date.now() - start;
    logRequest("DELETE", "/api/maintenance", 200, duration, user.id);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      const duration = Date.now() - start;
      logRequest("DELETE", "/api/maintenance", 401, duration);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const duration = Date.now() - start;
    logRequest("DELETE", "/api/maintenance", 500, duration);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
