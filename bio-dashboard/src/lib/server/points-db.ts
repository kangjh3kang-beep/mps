/**
 * Server-side Points Ledger Database (File-based for demo)
 */

import { promises as fs } from "fs";
import path from "path";
import type { UserPoints, PointTransaction, TierId } from "@/lib/h2e-engine";
import { getTierForPoints, calculateStreak } from "@/lib/h2e-engine";

const DATA_DIR = path.join(process.cwd(), ".data");
const POINTS_FILE = path.join(DATA_DIR, "points-ledger.json");

interface PointsDB {
  users: Record<string, UserPoints>;
}

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

async function readDB(): Promise<PointsDB> {
  await ensureDir();
  try {
    const raw = await fs.readFile(POINTS_FILE, "utf-8");
    return JSON.parse(raw) as PointsDB;
  } catch {
    return { users: {} };
  }
}

async function writeDB(db: PointsDB): Promise<void> {
  await ensureDir();
  await fs.writeFile(POINTS_FILE, JSON.stringify(db, null, 2), "utf-8");
}

/**
 * Get user points (creates default if not exists)
 */
export async function getUserPoints(userId: string): Promise<UserPoints> {
  const db = await readDB();
  
  if (!db.users[userId]) {
    db.users[userId] = {
      userId,
      currentBalance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      tierId: "bronze",
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: "",
      transactions: []
    };
    await writeDB(db);
  }
  
  return db.users[userId];
}

/**
 * Add a transaction and update balances
 */
export async function addTransaction(
  userId: string,
  transaction: PointTransaction
): Promise<UserPoints> {
  const db = await readDB();
  
  if (!db.users[userId]) {
    db.users[userId] = {
      userId,
      currentBalance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      tierId: "bronze",
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: "",
      transactions: []
    };
  }
  
  const user = db.users[userId];
  
  // Add transaction
  user.transactions.push(transaction);
  
  // Keep only last 500 transactions
  if (user.transactions.length > 500) {
    user.transactions = user.transactions.slice(-500);
  }
  
  // Update balances
  user.currentBalance += transaction.finalPoints;
  if (transaction.finalPoints > 0) {
    user.lifetimeEarned += transaction.finalPoints;
  } else {
    user.lifetimeSpent += Math.abs(transaction.finalPoints);
  }
  
  // Update tier
  const newTier = getTierForPoints(user.lifetimeEarned);
  user.tierId = newTier.id;
  
  // Update streak (for measurement actions)
  if (transaction.actionType === "daily_measurement") {
    const activityDates = user.transactions
      .filter(t => t.actionType === "daily_measurement")
      .map(t => t.createdAt.split("T")[0]);
    const streakInfo = calculateStreak(activityDates, user.tierId);
    user.currentStreak = streakInfo.currentStreak;
    user.longestStreak = Math.max(user.longestStreak, streakInfo.longestStreak);
    user.lastActivityDate = streakInfo.lastActivityDate;
  }
  
  await writeDB(db);
  return user;
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<PointTransaction[]> {
  const user = await getUserPoints(userId);
  const sorted = user.transactions.slice().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sorted.slice(offset, offset + limit);
}

/**
 * Get leaderboard (top users by lifetime points)
 */
export async function getLeaderboard(limit: number = 10): Promise<{ userId: string; lifetimeEarned: number; tierId: TierId }[]> {
  const db = await readDB();
  const users = Object.values(db.users);
  users.sort((a, b) => b.lifetimeEarned - a.lifetimeEarned);
  return users.slice(0, limit).map(u => ({
    userId: u.userId,
    lifetimeEarned: u.lifetimeEarned,
    tierId: u.tierId
  }));
}

/**
 * Award bonus points (admin function)
 */
export async function awardBonus(
  userId: string,
  points: number,
  reason: string
): Promise<UserPoints> {
  const transaction: PointTransaction = {
    id: `bonus_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    usedId: userId,
    actionType: "manual_adjustment",
    points,
    multiplier: 1,
    finalPoints: points,
    description: `Bonus: ${reason}`,
    metadata: { reason },
    createdAt: new Date().toISOString()
  };
  
  return addTransaction(userId, transaction);
}






