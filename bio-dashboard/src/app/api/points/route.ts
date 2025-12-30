/**
 * Points API - Health-to-Earn (H2E) System
 * GET: Get user points and stats
 * POST: Earn points for an action
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserPoints,
  addTransaction,
  getTransactionHistory
} from "@/lib/server/points-db";
import {
  calculateEarnedPoints,
  POINT_ACTIONS,
  type ActionType
} from "@/lib/h2e-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? "demo-user";

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get("history") === "true";
    const historyLimit = parseInt(searchParams.get("limit") ?? "20");

    const userPoints = await getUserPoints(userId);

    let transactions: any[] | undefined;
    if (includeHistory) {
      transactions = await getTransactionHistory(userId, historyLimit);
    }

    return NextResponse.json({
      success: true,
      points: {
        currentBalance: userPoints.currentBalance,
        lifetimeEarned: userPoints.lifetimeEarned,
        lifetimeSpent: userPoints.lifetimeSpent,
        tierId: userPoints.tierId,
        currentStreak: userPoints.currentStreak,
        longestStreak: userPoints.longestStreak,
        lastActivityDate: userPoints.lastActivityDate
      },
      transactions
    });
  } catch (error) {
    console.error("[Points API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get points" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? "demo-user";

    const body = await request.json();
    const { actionType, metadata, pointsOverride } = body as {
      actionType: ActionType;
      metadata?: Record<string, unknown>;
      pointsOverride?: number;
    };

    if (!actionType || !POINT_ACTIONS[actionType]) {
      return NextResponse.json(
        { success: false, error: "Invalid action type" },
        { status: 400 }
      );
    }

    // Get current points
    const currentPoints = await getUserPoints(userId);

    // Calculate points to earn
    const result = calculateEarnedPoints({
      actionType,
      userId,
      currentPoints,
      metadata,
      pointsOverride
    });

    if (!result.success || !result.transaction) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Failed to earn points" },
        { status: 400 }
      );
    }

    // Add transaction to DB
    const updatedPoints = await addTransaction(userId, result.transaction);

    return NextResponse.json({
      success: true,
      earned: result.transaction.finalPoints,
      multiplier: result.transaction.multiplier,
      newBalance: updatedPoints.currentBalance,
      tierId: updatedPoints.tierId,
      tierUpgraded: result.tierUpgraded,
      newTier: result.newTier,
      currentStreak: updatedPoints.currentStreak
    });
  } catch (error) {
    console.error("[Points API] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to earn points" },
      { status: 500 }
    );
  }
}






