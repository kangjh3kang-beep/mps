/**
 * Points Spend API - Redeem points in the Mall
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPoints, addTransaction } from "@/lib/server/points-db";
import { spendPoints, REDEMPTION_CATALOG, TIERS, type TierId } from "@/lib/h2e-engine";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? "demo-user";

    const body = await request.json();
    const { itemId, amount, description } = body as {
      itemId?: string;
      amount?: number;
      description?: string;
    };

    // Get current points
    const currentPoints = await getUserPoints(userId);

    let pointsToSpend = amount ?? 0;
    let spendDescription = description ?? "Mall Purchase";
    let metadata: Record<string, unknown> = {};

    // If itemId provided, look up from catalog
    if (itemId) {
      const item = REDEMPTION_CATALOG.find(i => i.id === itemId);
      if (!item) {
        return NextResponse.json(
          { success: false, error: "Item not found" },
          { status: 404 }
        );
      }

      // Check tier requirement
      if (item.minTier) {
        const tierOrder: TierId[] = ["bronze", "silver", "gold", "diamond"];
        const userTierIndex = tierOrder.indexOf(currentPoints.tierId);
        const requiredTierIndex = tierOrder.indexOf(item.minTier);
        if (userTierIndex < requiredTierIndex) {
          return NextResponse.json(
            { success: false, error: `Requires ${TIERS[item.minTier].name} tier or higher` },
            { status: 403 }
          );
        }
      }

      pointsToSpend = item.pointsCost;
      spendDescription = `Redeemed: ${item.name}`;
      metadata = { itemId: item.id, itemName: item.name, category: item.category };
    }

    if (pointsToSpend <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Attempt to spend points
    const result = spendPoints(
      userId,
      pointsToSpend,
      currentPoints.currentBalance,
      spendDescription,
      metadata
    );

    if (!result.success || !result.transaction) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Failed to spend points" },
        { status: 400 }
      );
    }

    // Add transaction to DB
    const updatedPoints = await addTransaction(userId, result.transaction);

    return NextResponse.json({
      success: true,
      spent: Math.abs(result.transaction.finalPoints),
      newBalance: updatedPoints.currentBalance,
      item: itemId ? REDEMPTION_CATALOG.find(i => i.id === itemId) : undefined
    });
  } catch (error) {
    console.error("[Points Spend API] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to spend points" },
      { status: 500 }
    );
  }
}






