/**
 * Database Layer
 *
 * This module provides database operations. When USE_POSTGRES=true,
 * it delegates to PostgreSQL via Prisma. Otherwise, it uses JSON file storage.
 *
 * NOTE: All functions are now async to support PostgreSQL operations.
 * Some legacy callers may need to be updated to use await.
 */

import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import {
  dbCache,
  CacheKeys,
  invalidateUserCache,
  invalidateTransactionCache,
  invalidateUsageCache,
  invalidateCampaignCache,
  invalidateNotificationCache,
  invalidateAPIKeyCache,
  invalidateFeatureFlagCache,
  invalidateBackupCache,
  invalidateEmailTemplateCache,
  invalidateReportCache,
  invalidateWebhookCache,
  invalidateABTestCache,
  invalidateModerationCache,
  invalidateTicketCache,
  invalidateReferralCache,
} from './db-cache';

// Check if PostgreSQL should be used
const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

// Lazy import Prisma only when needed to avoid initialization errors
let prismaModule: typeof import('./prisma') | null = null;

async function getPrisma() {
  if (!prismaModule) {
    prismaModule = await import('./prisma');
  }
  return prismaModule.prisma;
}

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists (only for JSON mode)
if (!USE_POSTGRES && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// User Management
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'user' | 'premium' | 'admin';
  status: 'active' | 'banned' | 'suspended';
  credits: number;
  totalUsage: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  firstUploadAt?: string;
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureFile(filePath: string, defaultData: any = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

function readJSON<T>(filePath: string, defaultData: T): T {
  ensureFile(filePath, defaultData);
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return defaultData;
  }
}

function readJSONWithCache<T>(filePath: string, cacheKey: string, defaultData: T): T {
  const cached = dbCache.get<T>(cacheKey);
  if (cached !== null) return cached;

  const data = readJSON<T>(filePath, defaultData);
  dbCache.set(cacheKey, data);
  return data;
}

function writeJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  const fileName = path.basename(filePath, '.json');
  const cacheKeyMap: Record<string, () => void> = {
    'users': () => invalidateUserCache(),
    'transactions': invalidateTransactionCache,
    'usage': invalidateUsageCache,
    'campaigns': invalidateCampaignCache,
    'notifications': invalidateNotificationCache,
    'api_keys': invalidateAPIKeyCache,
    'feature_flags': invalidateFeatureFlagCache,
    'backups': invalidateBackupCache,
    'email_templates': invalidateEmailTemplateCache,
    'reports': invalidateReportCache,
    'webhooks': invalidateWebhookCache,
    'webhook-logs': invalidateWebhookCache,
    'abtests': invalidateABTestCache,
    'moderation-rules': invalidateModerationCache,
    'moderation-queue': invalidateModerationCache,
    'tickets': invalidateTicketCache,
    'referrals': invalidateReferralCache,
  };

  const invalidator = cacheKeyMap[fileName];
  if (invalidator) {
    invalidator();
  }
}

// Helper to convert Prisma User to our User type
function prismaUserToUser(prismaUser: any): User {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    name: prismaUser.name ?? undefined,
    image: prismaUser.image ?? undefined,
    role: prismaUser.role,
    status: prismaUser.status,
    credits: prismaUser.credits,
    totalUsage: prismaUser.totalUsage,
    createdAt: prismaUser.createdAt instanceof Date ? prismaUser.createdAt.toISOString() : prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt instanceof Date ? prismaUser.updatedAt.toISOString() : prismaUser.updatedAt,
    lastLoginAt: prismaUser.lastLoginAt instanceof Date ? prismaUser.lastLoginAt.toISOString() : prismaUser.lastLoginAt ?? undefined,
    firstUploadAt: prismaUser.firstUploadAt instanceof Date ? prismaUser.firstUploadAt.toISOString() : prismaUser.firstUploadAt ?? undefined,
  };
}

// ============================================
// USER OPERATIONS
// ============================================

// getAllUsers - now async to support PostgreSQL
export async function getAllUsers(): Promise<User[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map(prismaUserToUser);
  }
  return readJSONWithCache<User[]>(USERS_FILE, CacheKeys.USERS, []);
}

export async function getAllUsersAsync(): Promise<User[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map(prismaUserToUser);
  }
  return readJSONWithCache<User[]>(USERS_FILE, CacheKeys.USERS, []);
}

// getUserByEmail - now async to support PostgreSQL
// Returns Promise<User | null> - callers must use await
export async function getUserByEmail(email: string): Promise<User | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? prismaUserToUser(user) : null;
  }
  const users = readJSONWithCache<User[]>(USERS_FILE, CacheKeys.USERS, []);
  return users.find(u => u.email === email) || null;
}

export async function getUserByEmailAsync(email: string): Promise<User | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? prismaUserToUser(user) : null;
  }
  const users = await getAllUsers();
  return users.find(u => u.email === email) || null;
}

export function getUserById(id: string): User | null {
  if (USE_POSTGRES) {
    console.warn('getUserById() called in sync mode with PostgreSQL. Use async version.');
    return null;
  }
  // Use cached JSON read directly for sync operation
  const users = readJSONWithCache<User[]>(USERS_FILE, CacheKeys.USERS, []);
  return users.find(u => u.id === id) || null;
}

export async function getUserByIdAsync(id: string): Promise<User | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? prismaUserToUser(user) : null;
  }
  const users = await getAllUsers();
  return users.find(u => u.id === id) || null;
}

// createUser - now async to support PostgreSQL
// Returns Promise<User> - callers must use await
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (existing) {
      return prismaUserToUser(existing);
    }

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        image: userData.image,
        role: userData.role || 'user',
        status: userData.status || 'active',
        credits: userData.credits || 0,
        totalUsage: userData.totalUsage || 0,
      },
    });
    return prismaUserToUser(user);
  }

  const users = readJSONWithCache<User[]>(USERS_FILE, CacheKeys.USERS, []);
  const existingUser = users.find(u => u.email === userData.email);

  if (existingUser) {
    return existingUser;
  }

  const newUser: User = {
    ...userData,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);
  return newUser;
}

export async function createUserAsync(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (existing) {
      return prismaUserToUser(existing);
    }

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        image: userData.image,
        role: userData.role || 'user',
        status: userData.status || 'active',
        credits: userData.credits || 0,
        totalUsage: userData.totalUsage || 0,
      },
    });
    return prismaUserToUser(user);
  }
  return createUser(userData);
}

// updateUser - now async to support PostgreSQL
// Returns Promise<User | null> - callers must use await
export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        } as any,
      });
      return prismaUserToUser(user);
    } catch {
      return null;
    }
  }

  const users = readJSONWithCache<User[]>(USERS_FILE, CacheKeys.USERS, []);
  const index = users.findIndex(u => u.id === id);

  if (index === -1) return null;

  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeJSON(USERS_FILE, users);
  return users[index];
}

export async function updateUserAsync(id: string, updates: Partial<User>): Promise<User | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        } as any,
      });
      return prismaUserToUser(user);
    } catch {
      return null;
    }
  }
  return updateUser(id, updates);
}

// updateUserLogin - now async to support PostgreSQL
// Returns Promise<void> - callers must use await
export async function updateUserLogin(email: string): Promise<void> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    await prisma.user.update({
      where: { email },
      data: { lastLoginAt: new Date(), updatedAt: new Date() },
    });
    return;
  }

  const users = readJSONWithCache<User[]>(USERS_FILE, CacheKeys.USERS, []);
  const index = users.findIndex(u => u.email === email);

  if (index !== -1) {
    users[index].lastLoginAt = new Date().toISOString();
    users[index].updatedAt = new Date().toISOString();
    writeJSON(USERS_FILE, users);
  }
}

export async function updateUserLoginAsync(email: string): Promise<void> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    await prisma.user.update({
      where: { email },
      data: { lastLoginAt: new Date(), updatedAt: new Date() },
    });
    return;
  }
  updateUserLogin(email);
}

export function deleteUser(id: string): boolean {
  if (USE_POSTGRES) {
    console.warn('deleteUser() called in sync mode with PostgreSQL. Use async version.');
    return false;
  }
  // Use cached JSON read directly for sync operation
  const users = readJSONWithCache<User[]>(USERS_FILE, CacheKeys.USERS, []);
  const filtered = users.filter(u => u.id !== id);

  if (filtered.length === users.length) return false;

  writeJSON(USERS_FILE, filtered);
  return true;
}

export async function deleteUserAsync(id: string): Promise<boolean> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
  return deleteUser(id);
}

// ============================================
// TRANSACTIONS
// ============================================

export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'refund' | 'subscription';
  plan?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripeId?: string;
  metadata?: string;
  createdAt: string;
  completedAt?: string;
}

const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

function prismaTransactionToTransaction(t: any): Transaction {
  return {
    id: t.id,
    userId: t.userId,
    type: t.type,
    plan: t.plan ?? undefined,
    amount: t.amount,
    currency: t.currency,
    status: t.status,
    stripeId: t.stripeId ?? undefined,
    metadata: t.metadata ?? undefined,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    completedAt: t.completedAt instanceof Date ? t.completedAt.toISOString() : t.completedAt ?? undefined,
  };
}

export function getAllTransactions(): Transaction[] {
  if (USE_POSTGRES) {
    return [];
  }
  return readJSONWithCache<Transaction[]>(TRANSACTIONS_FILE, CacheKeys.TRANSACTIONS, []);
}

export async function getAllTransactionsAsync(): Promise<Transaction[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const transactions = await prisma.transaction.findMany({ orderBy: { createdAt: 'desc' } });
    return transactions.map(prismaTransactionToTransaction);
  }
  return readJSONWithCache<Transaction[]>(TRANSACTIONS_FILE, CacheKeys.TRANSACTIONS, []);
}

// getTransactionsByUserId - now async to support PostgreSQL
export async function getTransactionsByUserId(userId: string): Promise<Transaction[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return transactions.map(prismaTransactionToTransaction);
  }
  const transactions = readJSONWithCache<Transaction[]>(TRANSACTIONS_FILE, CacheKeys.TRANSACTIONS, []);
  return transactions.filter(t => t.userId === userId);
}

export async function getTransactionsByUserIdAsync(userId: string): Promise<Transaction[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return transactions.map(prismaTransactionToTransaction);
  }
  const transactions = getAllTransactions();
  return transactions.filter(t => t.userId === userId);
}

export function createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  if (USE_POSTGRES) {
    throw new Error('Use createTransactionAsync() with PostgreSQL');
  }
  const transactions = getAllTransactions();
  const newTransaction: Transaction = {
    ...data,
    id: nanoid(),
    createdAt: new Date().toISOString(),
  };

  transactions.push(newTransaction);
  writeJSON(TRANSACTIONS_FILE, transactions);
  return newTransaction;
}

export async function createTransactionAsync(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const transaction = await prisma.transaction.create({
      data: {
        userId: data.userId,
        type: data.type,
        plan: data.plan,
        amount: data.amount,
        currency: data.currency || 'PLN',
        status: data.status || 'pending',
        stripeId: data.stripeId,
        metadata: data.metadata,
      },
    });
    return prismaTransactionToTransaction(transaction);
  }
  return createTransaction(data);
}

export function updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
  if (USE_POSTGRES) {
    return null;
  }
  const transactions = getAllTransactions();
  const index = transactions.findIndex(t => t.id === id);

  if (index === -1) return null;

  transactions[index] = {
    ...transactions[index],
    ...updates,
  };

  writeJSON(TRANSACTIONS_FILE, transactions);
  return transactions[index];
}

export async function updateTransactionAsync(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    try {
      const transaction = await prisma.transaction.update({
        where: { id },
        data: updates as any,
      });
      return prismaTransactionToTransaction(transaction);
    } catch {
      return null;
    }
  }
  return updateTransaction(id, updates);
}

export function deleteTransaction(id: string): boolean {
  if (USE_POSTGRES) {
    return false;
  }
  const transactions = getAllTransactions();
  const filtered = transactions.filter(t => t.id !== id);

  if (filtered.length === transactions.length) return false;

  writeJSON(TRANSACTIONS_FILE, filtered);
  return true;
}

// ============================================
// USAGE TRACKING
// ============================================

export interface Usage {
  id: string;
  userId: string;
  type: string;
  creditsUsed: number;
  imageSize?: string;
  model?: string;
  createdAt: string;
}

const USAGE_FILE = path.join(DATA_DIR, 'usage.json');

function prismaUsageToUsage(u: any): Usage {
  return {
    id: u.id,
    userId: u.userId,
    type: u.type,
    creditsUsed: u.creditsUsed,
    imageSize: u.imageSize ?? undefined,
    model: u.model ?? undefined,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  };
}

export function getAllUsage(): Usage[] {
  if (USE_POSTGRES) {
    return [];
  }
  return readJSONWithCache<Usage[]>(USAGE_FILE, CacheKeys.USAGE, []);
}

export async function getAllUsageAsync(): Promise<Usage[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const usages = await prisma.usage.findMany({ orderBy: { createdAt: 'desc' } });
    return usages.map(prismaUsageToUsage);
  }
  return readJSONWithCache<Usage[]>(USAGE_FILE, CacheKeys.USAGE, []);
}

// getUsageByUserId - now async to support PostgreSQL
// Returns Promise<Usage[]> - callers must use await
export async function getUsageByUserId(userId: string): Promise<Usage[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const usages = await prisma.usage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return usages.map(prismaUsageToUsage);
  }
  const usage = readJSONWithCache<Usage[]>(USAGE_FILE, CacheKeys.USAGE, []);
  return usage.filter(u => u.userId === userId);
}

export async function getUsageByUserIdAsync(userId: string): Promise<Usage[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const usages = await prisma.usage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return usages.map(prismaUsageToUsage);
  }
  const usage = getAllUsage();
  return usage.filter(u => u.userId === userId);
}

// createUsage - now async to support PostgreSQL
// Returns Promise<Usage> - callers must use await
export async function createUsage(data: Omit<Usage, 'id' | 'createdAt'>): Promise<Usage> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();

    // Create usage record
    const usage = await prisma.usage.create({
      data: {
        userId: data.userId,
        type: data.type,
        creditsUsed: data.creditsUsed,
        imageSize: data.imageSize,
        model: data.model,
      },
    });

    // Update user's credits and totalUsage
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        credits: { decrement: data.creditsUsed },
        totalUsage: { increment: 1 },
      },
    });

    return prismaUsageToUsage(usage);
  }

  const usageList = readJSONWithCache<Usage[]>(USAGE_FILE, CacheKeys.USAGE, []);
  const newUsage: Usage = {
    ...data,
    id: nanoid(),
    createdAt: new Date().toISOString(),
  };

  usageList.push(newUsage);
  writeJSON(USAGE_FILE, usageList);

  // Update user's total usage (await since updateUser is now async)
  const user = await getUserByIdAsync(data.userId);
  if (user) {
    const newCredits = Math.max(0, user.credits - data.creditsUsed);
    await updateUser(user.id, {
      totalUsage: user.totalUsage + 1,
      credits: newCredits,
    });
  }

  return newUsage;
}

export async function createUsageAsync(data: Omit<Usage, 'id' | 'createdAt'>): Promise<Usage> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();

    // Create usage record
    const usage = await prisma.usage.create({
      data: {
        userId: data.userId,
        type: data.type,
        creditsUsed: data.creditsUsed,
        imageSize: data.imageSize,
        model: data.model,
      },
    });

    // Update user's credits and totalUsage
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        credits: { decrement: data.creditsUsed },
        totalUsage: { increment: 1 },
      },
    });

    return prismaUsageToUsage(usage);
  }
  return createUsage(data);
}

export function deleteUsage(id: string): boolean {
  if (USE_POSTGRES) {
    return false;
  }
  const usage = getAllUsage();
  const filtered = usage.filter(u => u.id !== id);

  if (filtered.length === usage.length) return false;

  writeJSON(USAGE_FILE, filtered);
  return true;
}

// ============================================
// CAMPAIGNS
// ============================================

export interface Campaign {
  id: string;
  name: string;
  type: 'google_ads' | 'facebook_ads' | 'email';
  status: 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');

export function getAllCampaigns(): Campaign[] {
  if (USE_POSTGRES) {
    return [];
  }
  return readJSONWithCache<Campaign[]>(CAMPAIGNS_FILE, CacheKeys.CAMPAIGNS, []);
}

export function getCampaignById(id: string): Campaign | null {
  if (USE_POSTGRES) {
    return null;
  }
  const campaigns = getAllCampaigns();
  return campaigns.find(c => c.id === id) || null;
}

export function createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Campaign {
  if (USE_POSTGRES) {
    throw new Error('Use PostgreSQL version');
  }
  const campaigns = getAllCampaigns();
  const newCampaign: Campaign = {
    ...data,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  campaigns.push(newCampaign);
  writeJSON(CAMPAIGNS_FILE, campaigns);
  return newCampaign;
}

export function updateCampaign(id: string, updates: Partial<Campaign>): Campaign | null {
  if (USE_POSTGRES) {
    return null;
  }
  const campaigns = getAllCampaigns();
  const index = campaigns.findIndex(c => c.id === id);

  if (index === -1) return null;

  campaigns[index] = {
    ...campaigns[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeJSON(CAMPAIGNS_FILE, campaigns);
  return campaigns[index];
}

export function deleteCampaign(id: string): boolean {
  if (USE_POSTGRES) {
    return false;
  }
  const campaigns = getAllCampaigns();
  const index = campaigns.findIndex(c => c.id === id);

  if (index === -1) return false;

  campaigns.splice(index, 1);
  writeJSON(CAMPAIGNS_FILE, campaigns);
  return true;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'user' | 'system' | 'api' | 'marketing' | 'finance';
  title: string;
  message: string;
  read: boolean;
  metadata?: any;
  createdAt: string;
}

const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

export function getAllNotifications(): Notification[] {
  if (USE_POSTGRES) {
    return [];
  }
  return readJSONWithCache<Notification[]>(NOTIFICATIONS_FILE, CacheKeys.NOTIFICATIONS, []);
}

export function getUnreadNotifications(): Notification[] {
  if (USE_POSTGRES) {
    return [];
  }
  return getAllNotifications().filter(n => !n.read);
}

export function createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
  if (USE_POSTGRES) {
    throw new Error('Use PostgreSQL version');
  }
  const notifications = getAllNotifications();
  const newNotification: Notification = {
    ...data,
    id: nanoid(),
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.unshift(newNotification);
  writeJSON(NOTIFICATIONS_FILE, notifications);
  return newNotification;
}

export function markNotificationAsRead(id: string): Notification | null {
  if (USE_POSTGRES) {
    return null;
  }
  const notifications = getAllNotifications();
  const index = notifications.findIndex(n => n.id === id);

  if (index === -1) return null;

  notifications[index].read = true;
  writeJSON(NOTIFICATIONS_FILE, notifications);
  return notifications[index];
}

export function markAllNotificationsAsRead(): void {
  if (USE_POSTGRES) {
    return;
  }
  const notifications = getAllNotifications();
  notifications.forEach(n => n.read = true);
  writeJSON(NOTIFICATIONS_FILE, notifications);
}

export function deleteNotification(id: string): boolean {
  if (USE_POSTGRES) {
    return false;
  }
  const notifications = getAllNotifications();
  const index = notifications.findIndex(n => n.id === id);

  if (index === -1) return false;

  notifications.splice(index, 1);
  writeJSON(NOTIFICATIONS_FILE, notifications);
  return true;
}

// ============================================
// API KEYS
// ============================================

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  status: 'active' | 'revoked';
  rateLimit: number;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

const API_KEYS_FILE = path.join(DATA_DIR, 'api_keys.json');

export function getAllApiKeys(): ApiKey[] {
  if (USE_POSTGRES) {
    return [];
  }
  return readJSONWithCache<ApiKey[]>(API_KEYS_FILE, CacheKeys.API_KEYS, []);
}

export function getApiKeysByUserId(userId: string): ApiKey[] {
  if (USE_POSTGRES) {
    return [];
  }
  return getAllApiKeys().filter(k => k.userId === userId);
}

export function getApiKeyByKey(key: string): ApiKey | null {
  if (USE_POSTGRES) {
    return null;
  }
  return getAllApiKeys().find(k => k.key === key) || null;
}

export function createApiKey(data: Omit<ApiKey, 'id' | 'key' | 'createdAt' | 'usageCount'>): ApiKey {
  if (USE_POSTGRES) {
    throw new Error('Use PostgreSQL version');
  }
  const apiKeys = getAllApiKeys();

  const key = `pk_${nanoid(32)}`;

  const newApiKey: ApiKey = {
    ...data,
    id: nanoid(),
    key,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };

  apiKeys.push(newApiKey);
  writeJSON(API_KEYS_FILE, apiKeys);
  return newApiKey;
}

export function updateApiKey(id: string, updates: Partial<ApiKey>): ApiKey | null {
  if (USE_POSTGRES) {
    return null;
  }
  const apiKeys = getAllApiKeys();
  const index = apiKeys.findIndex(k => k.id === id);

  if (index === -1) return null;

  apiKeys[index] = {
    ...apiKeys[index],
    ...updates,
  };

  writeJSON(API_KEYS_FILE, apiKeys);
  return apiKeys[index];
}

export function revokeApiKey(id: string): boolean {
  if (USE_POSTGRES) {
    return false;
  }
  return updateApiKey(id, { status: 'revoked' }) !== null;
}

export function deleteApiKey(id: string): boolean {
  if (USE_POSTGRES) {
    return false;
  }
  const apiKeys = getAllApiKeys();
  const index = apiKeys.findIndex(k => k.id === id);

  if (index === -1) return false;

  apiKeys.splice(index, 1);
  writeJSON(API_KEYS_FILE, apiKeys);
  return true;
}

export function incrementApiKeyUsage(key: string): void {
  if (USE_POSTGRES) {
    return;
  }
  const apiKeys = getAllApiKeys();
  const index = apiKeys.findIndex(k => k.key === key);

  if (index !== -1) {
    apiKeys[index].usageCount++;
    apiKeys[index].lastUsedAt = new Date().toISOString();
    writeJSON(API_KEYS_FILE, apiKeys);
  }
}

// ============================================
// FEATURE FLAGS
// ============================================

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  createdAt: string;
  updatedAt: string;
}

const FEATURE_FLAGS_FILE = path.join(DATA_DIR, 'feature_flags.json');

export function getAllFeatureFlags(): FeatureFlag[] {
  if (USE_POSTGRES) {
    return [];
  }
  return readJSONWithCache<FeatureFlag[]>(FEATURE_FLAGS_FILE, CacheKeys.FEATURE_FLAGS, []);
}

export function getFeatureFlagByKey(key: string): FeatureFlag | null {
  if (USE_POSTGRES) {
    return null;
  }
  return getAllFeatureFlags().find(f => f.key === key) || null;
}

export function isFeatureEnabled(key: string, userId?: string): boolean {
  if (USE_POSTGRES) {
    return false;
  }
  const flag = getFeatureFlagByKey(key);
  if (!flag) return false;
  if (!flag.enabled) return false;

  if (userId && flag.targetUsers && flag.targetUsers.includes(userId)) {
    return true;
  }

  if (flag.rolloutPercentage === 100) return true;
  if (flag.rolloutPercentage === 0) return false;

  if (userId) {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 100) < flag.rolloutPercentage;
  }

  return false;
}

export function createFeatureFlag(data: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): FeatureFlag {
  if (USE_POSTGRES) {
    throw new Error('Use PostgreSQL version');
  }
  const flags = getAllFeatureFlags();

  const newFlag: FeatureFlag = {
    ...data,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  flags.push(newFlag);
  writeJSON(FEATURE_FLAGS_FILE, flags);
  return newFlag;
}

export function updateFeatureFlag(id: string, updates: Partial<FeatureFlag>): FeatureFlag | null {
  if (USE_POSTGRES) {
    return null;
  }
  const flags = getAllFeatureFlags();
  const index = flags.findIndex(f => f.id === id);

  if (index === -1) return null;

  flags[index] = {
    ...flags[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeJSON(FEATURE_FLAGS_FILE, flags);
  return flags[index];
}

export function deleteFeatureFlag(id: string): boolean {
  if (USE_POSTGRES) {
    return false;
  }
  const flags = getAllFeatureFlags();
  const index = flags.findIndex(f => f.id === id);

  if (index === -1) return false;

  flags.splice(index, 1);
  writeJSON(FEATURE_FLAGS_FILE, flags);
  return true;
}

// ============================================
// STATS HELPERS
// ============================================

// getUserStats - now async to support PostgreSQL
export async function getUserStats(): Promise<{ total: number; active: number; premium: number; newThisMonth: number; admins: number }> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const [total, active, premium, newThisMonth, admins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { role: { in: ['premium', 'admin'] } } }),
      prisma.user.count({ where: { createdAt: { gt: monthAgo } } }),
      prisma.user.count({ where: { role: 'admin' } }),
    ]);

    return { total, active, premium, newThisMonth, admins };
  }
  const users = await getAllUsers();
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  return {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    premium: users.filter(u => u.role === 'premium' || u.role === 'admin').length,
    newThisMonth: users.filter(u => new Date(u.createdAt) > monthAgo).length,
    admins: users.filter(u => u.role === 'admin').length,
  };
}

export async function getUserStatsAsync() {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const [total, active, premium, newThisMonth, admins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { role: { in: ['premium', 'admin'] } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.user.count({ where: { role: 'admin' } }),
    ]);

    return { total, active, premium, newThisMonth, admins };
  }
  return getUserStats();
}

export function getFinanceStats(days: number = 30) {
  if (USE_POSTGRES) {
    return { totalRevenue: 0, totalCount: 0, averageValue: 0, transactions: [] };
  }
  const transactions = getAllTransactions();
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const recentTransactions = transactions.filter(t =>
    new Date(t.createdAt) > startDate && t.status === 'completed'
  );

  const totalRevenue = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCount = recentTransactions.length;

  return {
    totalRevenue,
    totalCount,
    averageValue: totalCount > 0 ? totalRevenue / totalCount : 0,
    transactions: recentTransactions,
  };
}

// ============================================
// REMAINING ENTITIES (simplified - JSON only for now)
// These can be migrated to PostgreSQL async versions as needed
// ============================================

// Backup, EmailTemplate, Report, Webhook, WebhookLog, ABTest,
// ModerationRule, ModerationQueue, Ticket, Referral
// ... keeping original JSON implementations for these less critical entities

export interface Backup {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automatic';
  size: number;
  createdAt: string;
  createdBy: string;
  data: any;
}

const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const BACKUPS_FILE = path.join(DATA_DIR, 'backups.json');

if (!USE_POSTGRES && !fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export function getAllBackups(): Omit<Backup, 'data'>[] {
  const backups = readJSONWithCache<Backup[]>(BACKUPS_FILE, CacheKeys.BACKUPS, []);
  return backups.map(({ data, ...backup }) => backup);
}

export function getBackupById(id: string): Backup | null {
  const backupPath = path.join(BACKUPS_DIR, `${id}.json`);
  if (!fs.existsSync(backupPath)) return null;

  try {
    const data = fs.readFileSync(backupPath, 'utf-8');
    return JSON.parse(data) as Backup;
  } catch {
    return null;
  }
}

export async function createBackup(name: string, description: string, createdBy: string, type: 'manual' | 'automatic' = 'manual'): Promise<Backup> {
  const backupData = {
    users: await getAllUsers(),
    usage: await getAllUsage(),
    transactions: await getAllTransactions(),
    campaigns: getAllCampaigns(),
    notifications: getAllNotifications(),
    apiKeys: await getAllApiKeys(),
    featureFlags: getAllFeatureFlags(),
  };

  const backup: Backup = {
    id: nanoid(),
    name,
    description,
    type,
    size: JSON.stringify(backupData).length,
    createdAt: new Date().toISOString(),
    createdBy,
    data: backupData,
  };

  const backupPath = path.join(BACKUPS_DIR, `${backup.id}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  const backups = readJSON<Omit<Backup, 'data'>[]>(BACKUPS_FILE, []);
  const { data, ...metadata } = backup;
  backups.push(metadata);
  writeJSON(BACKUPS_FILE, backups);

  return backup;
}

export function restoreFromBackup(backupId: string): boolean {
  const backup = getBackupById(backupId);
  if (!backup) return false;

  try {
    writeJSON(USERS_FILE, backup.data.users);
    writeJSON(USAGE_FILE, backup.data.usage);
    writeJSON(TRANSACTIONS_FILE, backup.data.transactions);
    writeJSON(CAMPAIGNS_FILE, backup.data.campaigns);
    writeJSON(NOTIFICATIONS_FILE, backup.data.notifications);
    writeJSON(API_KEYS_FILE, backup.data.apiKeys);
    writeJSON(FEATURE_FLAGS_FILE, backup.data.featureFlags);

    return true;
  } catch {
    return false;
  }
}

export function deleteBackup(id: string): boolean {
  try {
    const backupPath = path.join(BACKUPS_DIR, `${id}.json`);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }

    const backups = readJSON<Omit<Backup, 'data'>[]>(BACKUPS_FILE, []);
    const filtered = backups.filter(b => b.id !== id);
    writeJSON(BACKUPS_FILE, filtered);

    return true;
  } catch {
    return false;
  }
}

export function downloadBackup(id: string): Buffer | null {
  const backupPath = path.join(BACKUPS_DIR, `${id}.json`);
  if (!fs.existsSync(backupPath)) return null;

  try {
    return fs.readFileSync(backupPath);
  } catch {
    return null;
  }
}

// Email Templates
export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: 'transactional' | 'marketing' | 'system';
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

const EMAIL_TEMPLATES_FILE = path.join(DATA_DIR, 'email_templates.json');

export function getAllEmailTemplates(): EmailTemplate[] {
  return readJSONWithCache<EmailTemplate[]>(EMAIL_TEMPLATES_FILE, CacheKeys.EMAIL_TEMPLATES, []);
}

export function getEmailTemplateById(id: string): EmailTemplate | null {
  return getAllEmailTemplates().find(t => t.id === id) || null;
}

export function getEmailTemplateBySlug(slug: string): EmailTemplate | null {
  return getAllEmailTemplates().find(t => t.slug === slug) || null;
}

export function createEmailTemplate(data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): EmailTemplate {
  const templates = getAllEmailTemplates();

  if (templates.some(t => t.slug === data.slug)) {
    throw new Error('Template with this slug already exists');
  }

  const template: EmailTemplate = {
    ...data,
    id: nanoid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  };

  templates.push(template);
  writeJSON(EMAIL_TEMPLATES_FILE, templates);
  return template;
}

export function updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): EmailTemplate | null {
  const templates = getAllEmailTemplates();
  const index = templates.findIndex(t => t.id === id);

  if (index === -1) return null;

  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeJSON(EMAIL_TEMPLATES_FILE, templates);
  return templates[index];
}

export function deleteEmailTemplate(id: string): boolean {
  const templates = getAllEmailTemplates();
  const filtered = templates.filter(t => t.id !== id);

  if (filtered.length === templates.length) return false;

  writeJSON(EMAIL_TEMPLATES_FILE, filtered);
  return true;
}

export function trackEmailTemplateUsage(id: string): void {
  const templates = getAllEmailTemplates();
  const index = templates.findIndex(t => t.id === id);

  if (index !== -1) {
    templates[index].usageCount++;
    templates[index].lastUsedAt = new Date().toISOString();
    writeJSON(EMAIL_TEMPLATES_FILE, templates);
  }
}

// Reports
export interface Report {
  id: string;
  name: string;
  type: 'users' | 'usage' | 'revenue' | 'campaigns' | 'custom';
  format: 'pdf' | 'csv' | 'json';
  dateRange: { start: string; end: string; };
  filters?: Record<string, any>;
  createdAt: string;
  createdBy: string;
  fileSize?: number;
  downloadCount: number;
  lastDownloadedAt?: string;
}

const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

export function getAllReports(): Report[] {
  ensureFile(REPORTS_FILE, []);
  return readJSONWithCache<Report[]>(REPORTS_FILE, CacheKeys.REPORTS, []);
}

export function getReportById(id: string): Report | null {
  return getAllReports().find(r => r.id === id) || null;
}

export function createReport(data: Omit<Report, 'id' | 'createdAt' | 'downloadCount'>): Report {
  const reports = getAllReports();

  const report: Report = {
    id: nanoid(),
    ...data,
    createdAt: new Date().toISOString(),
    downloadCount: 0,
  };

  reports.push(report);
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));

  return report;
}

export function updateReport(id: string, updates: Partial<Report>): Report | null {
  const reports = getAllReports();
  const index = reports.findIndex(r => r.id === id);

  if (index === -1) return null;

  reports[index] = { ...reports[index], ...updates };
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));

  return reports[index];
}

export function deleteReport(id: string): boolean {
  const reports = getAllReports();
  const filtered = reports.filter(r => r.id !== id);

  if (filtered.length === reports.length) return false;

  fs.writeFileSync(REPORTS_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

export function trackReportDownload(id: string): void {
  const reports = getAllReports();
  const index = reports.findIndex(r => r.id === id);

  if (index !== -1) {
    reports[index].downloadCount += 1;
    reports[index].lastDownloadedAt = new Date().toISOString();
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
  }
}

export async function generateReportData(type: Report['type'], dateRange: Report['dateRange'], filters?: Record<string, any>) {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);

  switch (type) {
    case 'users': {
      const allUsers = await getAllUsers();
      let users = allUsers.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      });

      if (filters?.status) {
        users = users.filter(u => u.status === filters.status);
      }

      return {
        summary: {
          total: users.length,
          active: users.filter(u => u.status === 'active').length,
          banned: users.filter(u => u.status === 'banned').length,
          suspended: users.filter(u => u.status === 'suspended').length,
        },
        data: users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          status: u.status,
          createdAt: u.createdAt,
          credits: u.credits,
        })),
      };
    }

    case 'usage': {
      const allUsage = await getAllUsage();
      let usage = allUsage.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      });

      if (filters?.userId) {
        usage = usage.filter(u => u.userId === filters.userId);
      }

      return {
        summary: {
          total: usage.length,
          totalCreditsUsed: usage.reduce((sum, u) => sum + u.creditsUsed, 0),
        },
        data: usage,
      };
    }

    case 'revenue': {
      const allTransactions = await getAllTransactions();
      let transactions = allTransactions.filter(t => {
        const createdAt = new Date(t.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      });

      if (filters?.status) {
        transactions = transactions.filter(t => t.status === filters.status);
      }

      const completed = transactions.filter(t => t.status === 'completed');

      return {
        summary: {
          total: transactions.length,
          completed: completed.length,
          totalRevenue: completed.reduce((sum, t) => sum + t.amount, 0),
          averageTransaction: completed.length > 0
            ? completed.reduce((sum, t) => sum + t.amount, 0) / completed.length
            : 0,
        },
        data: transactions,
      };
    }

    case 'campaigns': {
      let campaigns = getAllCampaigns().filter(c => {
        const createdAt = new Date(c.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
      });

      if (filters?.status) {
        campaigns = campaigns.filter(c => c.status === filters.status);
      }

      return {
        summary: {
          total: campaigns.length,
          active: campaigns.filter(c => c.status === 'active').length,
          paused: campaigns.filter(c => c.status === 'paused').length,
          totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
          totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
          totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
        },
        data: campaigns,
      };
    }

    default:
      return { summary: {}, data: [] };
  }
}

// Webhooks
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryAttempts: number;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  response?: any;
  status: 'success' | 'failed' | 'pending';
  statusCode?: number;
  error?: string;
  attemptNumber: number;
  triggeredAt: string;
}

const WEBHOOKS_FILE = path.join(DATA_DIR, 'webhooks.json');
const WEBHOOK_LOGS_FILE = path.join(DATA_DIR, 'webhook-logs.json');

export function getAllWebhooks(): Webhook[] {
  return readJSONWithCache<Webhook[]>(WEBHOOKS_FILE, CacheKeys.WEBHOOKS, []);
}

export function getWebhookById(id: string): Webhook | null {
  return getAllWebhooks().find(w => w.id === id) || null;
}

export function createWebhook(data: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt' | 'successCount' | 'failureCount'>): Webhook {
  const webhooks = getAllWebhooks();

  const webhook: Webhook = {
    id: nanoid(),
    ...data,
    successCount: 0,
    failureCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  webhooks.push(webhook);
  writeJSON(WEBHOOKS_FILE, webhooks);

  return webhook;
}

export function updateWebhook(id: string, updates: Partial<Webhook>): Webhook | null {
  const webhooks = getAllWebhooks();
  const index = webhooks.findIndex(w => w.id === id);

  if (index === -1) return null;

  webhooks[index] = {
    ...webhooks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeJSON(WEBHOOKS_FILE, webhooks);

  return webhooks[index];
}

export function deleteWebhook(id: string): boolean {
  const webhooks = getAllWebhooks();
  const filtered = webhooks.filter(w => w.id !== id);

  if (filtered.length === webhooks.length) return false;

  writeJSON(WEBHOOKS_FILE, filtered);
  return true;
}

export function getAllWebhookLogs(webhookId?: string, limit: number = 100): WebhookLog[] {
  let logs = readJSON<WebhookLog[]>(WEBHOOK_LOGS_FILE, []);

  if (webhookId) {
    logs = logs.filter(l => l.webhookId === webhookId);
  }

  logs.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());

  return logs.slice(0, limit);
}

export function createWebhookLog(data: Omit<WebhookLog, 'id'>): WebhookLog {
  const logs = readJSON<WebhookLog[]>(WEBHOOK_LOGS_FILE, []);

  const log: WebhookLog = {
    id: nanoid(),
    ...data,
  };

  logs.push(log);

  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }

  writeJSON(WEBHOOK_LOGS_FILE, logs);

  const webhooks = getAllWebhooks();
  const webhookIndex = webhooks.findIndex(w => w.id === data.webhookId);

  if (webhookIndex !== -1) {
    webhooks[webhookIndex].lastTriggered = data.triggeredAt;

    if (data.status === 'success') {
      webhooks[webhookIndex].successCount++;
    } else if (data.status === 'failed') {
      webhooks[webhookIndex].failureCount++;
    }

    writeJSON(WEBHOOKS_FILE, webhooks);
  }

  return log;
}

export async function triggerWebhook(webhookId: string, event: string, payload: any): Promise<void> {
  const webhook = getWebhookById(webhookId);

  if (!webhook || !webhook.enabled) return;
  if (!webhook.events.includes(event)) return;

  const log: Omit<WebhookLog, 'id'> = {
    webhookId,
    event,
    payload,
    status: 'pending',
    attemptNumber: 1,
    triggeredAt: new Date().toISOString(),
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(webhook.headers || {}),
    };

    if (webhook.secret) {
      headers['X-Webhook-Secret'] = webhook.secret;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event,
        data: payload,
        timestamp: new Date().toISOString(),
      }),
    });

    log.status = response.ok ? 'success' : 'failed';
    log.statusCode = response.status;
    log.response = await response.text();

    if (!response.ok) {
      log.error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error: any) {
    log.status = 'failed';
    log.error = error.message;
  }

  createWebhookLog(log);
}

// A/B Tests
export interface ABTest {
  id: string;
  name: string;
  description: string;
  type: 'page' | 'feature' | 'email' | 'cta' | 'custom';
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: {
    id: string;
    name: string;
    description?: string;
    traffic: number;
    conversions: number;
    visitors: number;
  }[];
  targetMetric: string;
  targetUrl?: string;
  startDate?: string;
  endDate?: string;
  winner?: string;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const ABTESTS_FILE = path.join(DATA_DIR, 'abtests.json');

export function getAllABTests(): ABTest[] {
  return readJSONWithCache<ABTest[]>(ABTESTS_FILE, CacheKeys.ABTESTS, []);
}

export function getABTestById(id: string): ABTest | null {
  return getAllABTests().find(t => t.id === id) || null;
}

export function createABTest(data: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): ABTest {
  const tests = getAllABTests();

  const test: ABTest = {
    id: nanoid(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tests.push(test);
  writeJSON(ABTESTS_FILE, tests);

  return test;
}

export function updateABTest(id: string, updates: Partial<ABTest>): ABTest | null {
  const tests = getAllABTests();
  const index = tests.findIndex(t => t.id === id);

  if (index === -1) return null;

  tests[index] = {
    ...tests[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeJSON(ABTESTS_FILE, tests);

  return tests[index];
}

export function deleteABTest(id: string): boolean {
  const tests = getAllABTests();
  const filtered = tests.filter(t => t.id !== id);

  if (filtered.length === tests.length) return false;

  writeJSON(ABTESTS_FILE, filtered);
  return true;
}

export function recordABTestEvent(testId: string, variantId: string, eventType: 'visitor' | 'conversion'): void {
  const tests = getAllABTests();
  const testIndex = tests.findIndex(t => t.id === testId);

  if (testIndex === -1) return;

  const test = tests[testIndex];
  const variantIndex = test.variants.findIndex(v => v.id === variantId);

  if (variantIndex === -1) return;

  if (eventType === 'visitor') {
    test.variants[variantIndex].visitors++;
  } else if (eventType === 'conversion') {
    test.variants[variantIndex].conversions++;
  }

  writeJSON(ABTESTS_FILE, tests);
}

export function calculateABTestWinner(testId: string): { winner: string; confidence: number } | null {
  const test = getABTestById(testId);
  if (!test || test.variants.length < 2) return null;

  const variants = test.variants.filter(v => v.visitors > 0);
  if (variants.length < 2) return null;

  const variantsWithRates = variants.map(v => ({
    ...v,
    conversionRate: v.visitors > 0 ? v.conversions / v.visitors : 0,
  }));

  variantsWithRates.sort((a, b) => b.conversionRate - a.conversionRate);

  const winner = variantsWithRates[0];
  const runnerUp = variantsWithRates[1];

  const winnerRate = winner.conversionRate;
  const runnerUpRate = runnerUp.conversionRate;

  if (winnerRate === 0 || runnerUpRate === 0) {
    return { winner: winner.id, confidence: 50 };
  }

  const improvement = ((winnerRate - runnerUpRate) / runnerUpRate) * 100;
  const minSampleSize = Math.max(winner.visitors, runnerUp.visitors);

  let confidence = Math.min(95, (improvement * minSampleSize) / 100);
  confidence = Math.max(50, confidence);

  return {
    winner: winner.id,
    confidence: Math.round(confidence),
  };
}

// Content Moderation
export interface ModerationRule {
  id: string;
  name: string;
  type: 'keyword' | 'pattern' | 'ai' | 'custom';
  target: 'post' | 'comment' | 'user_profile' | 'all';
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'flag' | 'auto_approve' | 'auto_reject' | 'quarantine';
  keywords?: string[];
  pattern?: string;
  aiPrompt?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationQueue {
  id: string;
  contentType: 'post' | 'comment' | 'user_profile' | 'other';
  contentId: string;
  content: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flags: {
    ruleId: string;
    ruleName: string;
    severity: string;
    reason: string;
    confidence?: number;
  }[];
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
}

const MODERATION_RULES_FILE = path.join(DATA_DIR, 'moderation-rules.json');
const MODERATION_QUEUE_FILE = path.join(DATA_DIR, 'moderation-queue.json');

export function getAllModerationRules(): ModerationRule[] {
  return readJSONWithCache<ModerationRule[]>(MODERATION_RULES_FILE, CacheKeys.MODERATION_RULES, []);
}

export function getModerationRuleById(id: string): ModerationRule | null {
  return getAllModerationRules().find(r => r.id === id) || null;
}

export function createModerationRule(data: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt'>): ModerationRule {
  const rules = getAllModerationRules();

  const rule: ModerationRule = {
    id: nanoid(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  rules.push(rule);
  writeJSON(MODERATION_RULES_FILE, rules);

  return rule;
}

export function updateModerationRule(id: string, updates: Partial<ModerationRule>): ModerationRule | null {
  const rules = getAllModerationRules();
  const index = rules.findIndex(r => r.id === id);

  if (index === -1) return null;

  rules[index] = {
    ...rules[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeJSON(MODERATION_RULES_FILE, rules);

  return rules[index];
}

export function deleteModerationRule(id: string): boolean {
  const rules = getAllModerationRules();
  const filtered = rules.filter(r => r.id !== id);

  if (filtered.length === rules.length) return false;

  writeJSON(MODERATION_RULES_FILE, filtered);
  return true;
}

export function getAllModerationQueue(status?: string, limit: number = 100): ModerationQueue[] {
  let queue = readJSON<ModerationQueue[]>(MODERATION_QUEUE_FILE, []);

  if (status) {
    queue = queue.filter(q => q.status === status);
  }

  queue.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return queue.slice(0, limit);
}

export function getModerationQueueById(id: string): ModerationQueue | null {
  return getAllModerationQueue().find(q => q.id === id) || null;
}

export function addToModerationQueue(data: Omit<ModerationQueue, 'id' | 'createdAt'>): ModerationQueue {
  const queue = readJSON<ModerationQueue[]>(MODERATION_QUEUE_FILE, []);

  const item: ModerationQueue = {
    id: nanoid(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  queue.push(item);
  writeJSON(MODERATION_QUEUE_FILE, queue);

  return item;
}

export function updateModerationQueue(id: string, updates: Partial<ModerationQueue>): ModerationQueue | null {
  const queue = readJSON<ModerationQueue[]>(MODERATION_QUEUE_FILE, []);
  const index = queue.findIndex(q => q.id === id);

  if (index === -1) return null;

  queue[index] = {
    ...queue[index],
    ...updates,
  };
  writeJSON(MODERATION_QUEUE_FILE, queue);

  return queue[index];
}

export function deleteModerationQueueItem(id: string): boolean {
  const queue = readJSON<ModerationQueue[]>(MODERATION_QUEUE_FILE, []);
  const filtered = queue.filter(q => q.id !== id);

  if (filtered.length === queue.length) return false;

  writeJSON(MODERATION_QUEUE_FILE, filtered);
  return true;
}

export function moderateContent(
  contentType: ModerationQueue['contentType'],
  contentId: string,
  content: string,
  author: string
): ModerationQueue {
  const rules = getAllModerationRules().filter(r => r.enabled && (r.target === contentType || r.target === 'all'));
  const flags: ModerationQueue['flags'] = [];

  for (const rule of rules) {
    if (rule.type === 'keyword' && rule.keywords) {
      const lowerContent = content.toLowerCase();
      for (const keyword of rule.keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          flags.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            reason: `Contains blocked keyword: "${keyword}"`,
            confidence: 100,
          });
          break;
        }
      }
    }

    if (rule.type === 'pattern' && rule.pattern) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(content)) {
          flags.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            reason: `Matches pattern: ${rule.pattern}`,
            confidence: 95,
          });
        }
      } catch {
        // Invalid regex, skip
      }
    }
  }

  let status: ModerationQueue['status'] = 'approved';

  if (flags.length > 0) {
    const highestSeverity = flags.reduce((max, f) => {
      const severities = { low: 1, medium: 2, high: 3, critical: 4 };
      const current = severities[f.severity as keyof typeof severities] || 0;
      return current > max ? current : max;
    }, 0);

    if (highestSeverity >= 3) {
      status = 'rejected';
    } else if (highestSeverity >= 2) {
      status = 'flagged';
    } else {
      status = 'pending';
    }
  }

  return addToModerationQueue({
    contentType,
    contentId,
    content,
    author,
    status,
    flags,
  });
}

// Support Tickets
export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature_request' | 'bug' | 'other';
  userId: string;
  userName: string;
  userEmail: string;
  assignedTo?: string;
  messages: {
    id: string;
    author: string;
    isStaff: boolean;
    message: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

export function getAllTickets(): Ticket[] {
  return readJSONWithCache<Ticket[]>(TICKETS_FILE, CacheKeys.TICKETS, []);
}

export function getTicketById(id: string): Ticket | null {
  return getAllTickets().find(t => t.id === id) || null;
}

export function createTicket(data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>): Ticket {
  const tickets = getAllTickets();

  const ticket: Ticket = {
    id: nanoid(),
    ...data,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tickets.push(ticket);
  writeJSON(TICKETS_FILE, tickets);

  return ticket;
}

export function updateTicket(id: string, updates: Partial<Ticket>): Ticket | null {
  const tickets = getAllTickets();
  const index = tickets.findIndex(t => t.id === id);

  if (index === -1) return null;

  tickets[index] = {
    ...tickets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.status === 'resolved' && !tickets[index].resolvedAt) {
    tickets[index].resolvedAt = new Date().toISOString();
  }

  writeJSON(TICKETS_FILE, tickets);

  return tickets[index];
}

export function deleteTicket(id: string): boolean {
  const tickets = getAllTickets();
  const filtered = tickets.filter(t => t.id !== id);

  if (filtered.length === tickets.length) return false;

  writeJSON(TICKETS_FILE, filtered);
  return true;
}

export function addTicketMessage(ticketId: string, author: string, message: string, isStaff: boolean): Ticket | null {
  const tickets = getAllTickets();
  const index = tickets.findIndex(t => t.id === ticketId);

  if (index === -1) return null;

  tickets[index].messages.push({
    id: nanoid(),
    author,
    isStaff,
    message,
    createdAt: new Date().toISOString(),
  });

  tickets[index].updatedAt = new Date().toISOString();

  writeJSON(TICKETS_FILE, tickets);

  return tickets[index];
}

// Referral Program
export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referredUserId?: string;
  referredUserName?: string;
  referredEmail?: string;
  code: string;
  status: 'pending' | 'active' | 'converted' | 'expired';
  clicks: number;
  signups: number;
  conversions: number;
  revenue: number;
  commission: number;
  commissionPaid: boolean;
  createdAt: string;
  convertedAt?: string;
  expiresAt?: string;
}

const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');

export function getAllReferrals(): Referral[] {
  return readJSONWithCache<Referral[]>(REFERRALS_FILE, CacheKeys.REFERRALS, []);
}

export function getReferralById(id: string): Referral | null {
  return getAllReferrals().find(r => r.id === id) || null;
}

export function getReferralByCode(code: string): Referral | null {
  return getAllReferrals().find(r => r.code === code) || null;
}

export function createReferral(data: Omit<Referral, 'id' | 'clicks' | 'signups' | 'conversions' | 'revenue' | 'commission' | 'commissionPaid' | 'createdAt'>): Referral {
  const referrals = getAllReferrals();

  const referral: Referral = {
    id: nanoid(),
    ...data,
    clicks: 0,
    signups: 0,
    conversions: 0,
    revenue: 0,
    commission: 0,
    commissionPaid: false,
    createdAt: new Date().toISOString(),
  };

  referrals.push(referral);
  writeJSON(REFERRALS_FILE, referrals);

  return referral;
}

export function updateReferral(id: string, updates: Partial<Referral>): Referral | null {
  const referrals = getAllReferrals();
  const index = referrals.findIndex(r => r.id === id);

  if (index === -1) return null;

  referrals[index] = {
    ...referrals[index],
    ...updates,
  };

  if (updates.status === 'converted' && !referrals[index].convertedAt) {
    referrals[index].convertedAt = new Date().toISOString();
  }

  writeJSON(REFERRALS_FILE, referrals);

  return referrals[index];
}

export function deleteReferral(id: string): boolean {
  const referrals = getAllReferrals();
  const filtered = referrals.filter(r => r.id !== id);

  if (filtered.length === referrals.length) return false;

  writeJSON(REFERRALS_FILE, filtered);
  return true;
}

export function trackReferralClick(code: string): void {
  const referrals = getAllReferrals();
  const index = referrals.findIndex(r => r.code === code);

  if (index !== -1) {
    referrals[index].clicks++;
    writeJSON(REFERRALS_FILE, referrals);
  }
}

export function trackReferralSignup(code: string, userId: string, userName: string): void {
  const referrals = getAllReferrals();
  const index = referrals.findIndex(r => r.code === code);

  if (index !== -1) {
    referrals[index].signups++;
    referrals[index].status = 'active';
    referrals[index].referredUserId = userId;
    referrals[index].referredUserName = userName;
    writeJSON(REFERRALS_FILE, referrals);
  }
}

export function trackReferralConversion(code: string, amount: number, commissionRate: number = 0.2): void {
  const referrals = getAllReferrals();
  const index = referrals.findIndex(r => r.code === code);

  if (index !== -1) {
    referrals[index].conversions++;
    referrals[index].revenue += amount;
    referrals[index].commission += amount * commissionRate;
    referrals[index].status = 'converted';
    writeJSON(REFERRALS_FILE, referrals);
  }
}

// ============================================
// USER SESSION TRACKING
// ============================================

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  fingerprint?: string;

  // Timing
  startedAt: string;
  endedAt?: string;
  lastActivityAt: string;
  duration: number;

  // Device & Technical
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  deviceType?: string;
  screenResolution?: string;
  language?: string;

  // Geographic
  country?: string;
  countryName?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;

  // Traffic source
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPage?: string;
  exitPage?: string;

  // Engagement
  pageViews: number;
  actions: number;
  scrollDepthMax?: number;
  bounced: boolean;
  converted: boolean;
  conversionType?: string;
  conversionValue?: number;
}

function prismaSessionToSession(s: any): UserSession {
  return {
    id: s.id,
    userId: s.userId,
    sessionToken: s.sessionToken,
    fingerprint: s.fingerprint ?? undefined,
    startedAt: s.startedAt instanceof Date ? s.startedAt.toISOString() : s.startedAt,
    endedAt: s.endedAt instanceof Date ? s.endedAt.toISOString() : s.endedAt ?? undefined,
    lastActivityAt: s.lastActivityAt instanceof Date ? s.lastActivityAt.toISOString() : s.lastActivityAt,
    duration: s.duration,
    ipAddress: s.ipAddress ?? undefined,
    userAgent: s.userAgent ?? undefined,
    browser: s.browser ?? undefined,
    browserVersion: s.browserVersion ?? undefined,
    os: s.os ?? undefined,
    osVersion: s.osVersion ?? undefined,
    deviceType: s.deviceType ?? undefined,
    screenResolution: s.screenResolution ?? undefined,
    language: s.language ?? undefined,
    country: s.country ?? undefined,
    countryName: s.countryName ?? undefined,
    region: s.region ?? undefined,
    city: s.city ?? undefined,
    timezone: s.timezone ?? undefined,
    latitude: s.latitude ?? undefined,
    longitude: s.longitude ?? undefined,
    referrer: s.referrer ?? undefined,
    utmSource: s.utmSource ?? undefined,
    utmMedium: s.utmMedium ?? undefined,
    utmCampaign: s.utmCampaign ?? undefined,
    utmTerm: s.utmTerm ?? undefined,
    utmContent: s.utmContent ?? undefined,
    landingPage: s.landingPage ?? undefined,
    exitPage: s.exitPage ?? undefined,
    pageViews: s.pageViews,
    actions: s.actions,
    scrollDepthMax: s.scrollDepthMax ?? undefined,
    bounced: s.bounced,
    converted: s.converted,
    conversionType: s.conversionType ?? undefined,
    conversionValue: s.conversionValue ?? undefined,
  };
}

export async function createUserSession(data: Omit<UserSession, 'id' | 'startedAt' | 'lastActivityAt' | 'duration' | 'pageViews' | 'actions' | 'bounced' | 'converted'>): Promise<UserSession> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const session = await prisma.userSession.create({
      data: {
        userId: data.userId,
        sessionToken: data.sessionToken,
        fingerprint: data.fingerprint,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        browser: data.browser,
        browserVersion: data.browserVersion,
        os: data.os,
        osVersion: data.osVersion,
        deviceType: data.deviceType,
        screenResolution: data.screenResolution,
        language: data.language,
        country: data.country,
        countryName: data.countryName,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        latitude: data.latitude,
        longitude: data.longitude,
        referrer: data.referrer,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmTerm: data.utmTerm,
        utmContent: data.utmContent,
        landingPage: data.landingPage,
      },
    });

    // Update user's session count
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        totalSessions: { increment: 1 },
        lastActiveAt: new Date(),
      },
    });

    return prismaSessionToSession(session);
  }
  throw new Error('User session tracking requires PostgreSQL');
}

export async function updateUserSession(sessionToken: string, updates: Partial<UserSession>): Promise<UserSession | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    try {
      const session = await prisma.userSession.update({
        where: { sessionToken },
        data: {
          ...updates,
          lastActivityAt: new Date(),
        } as any,
      });
      return prismaSessionToSession(session);
    } catch {
      return null;
    }
  }
  return null;
}

export async function endUserSession(sessionToken: string): Promise<UserSession | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    try {
      const existing = await prisma.userSession.findUnique({ where: { sessionToken } });
      if (!existing) return null;

      const duration = Math.floor((Date.now() - existing.startedAt.getTime()) / 1000);

      const session = await prisma.userSession.update({
        where: { sessionToken },
        data: {
          endedAt: new Date(),
          duration,
          bounced: existing.pageViews <= 1,
        },
      });

      // Update user's average session time
      const allSessions = await prisma.userSession.findMany({
        where: { userId: existing.userId, endedAt: { not: null } },
        select: { duration: true },
      });

      const avgTime = allSessions.length > 0
        ? Math.floor(allSessions.reduce((sum, s) => sum + s.duration, 0) / allSessions.length)
        : 0;

      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          avgSessionTime: avgTime,
          totalTimeSpent: { increment: duration },
        },
      });

      return prismaSessionToSession(session);
    } catch {
      return null;
    }
  }
  return null;
}

export async function getUserSessions(userId: string, limit: number = 50): Promise<UserSession[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const sessions = await prisma.userSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
    return sessions.map(prismaSessionToSession);
  }
  return [];
}

export async function getSessionByToken(token: string): Promise<UserSession | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const session = await prisma.userSession.findUnique({ where: { sessionToken: token } });
    return session ? prismaSessionToSession(session) : null;
  }
  return null;
}

// ============================================
// USER EVENT TRACKING
// ============================================

export interface UserEvent {
  id: string;
  userId: string;
  sessionId?: string;

  // Event identification
  eventName: string;
  eventCategory: 'navigation' | 'engagement' | 'conversion' | 'tool_usage' | 'error' | 'authentication' | 'account' | 'payment' | 'api' | 'custom';
  eventLabel?: string;
  eventValue?: number;

  // Context
  pageUrl?: string;
  pageTitle?: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;

  // Technical
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  deviceType?: string;

  // Geographic
  country?: string;
  city?: string;

  // Tool-specific
  toolType?: string;
  toolPreset?: string;
  toolSettings?: any;
  inputSize?: number;
  outputSize?: number;
  processingTime?: number;
  creditsUsed?: number;

  // Error tracking
  errorMessage?: string;
  errorStack?: string;
  errorCode?: string;

  // Custom data
  metadata?: any;

  // Timing
  timestamp: string;
  clientTimestamp?: string;
}

function prismaEventToEvent(e: any): UserEvent {
  return {
    id: e.id,
    userId: e.userId,
    sessionId: e.sessionId ?? undefined,
    eventName: e.eventName,
    eventCategory: e.eventCategory,
    eventLabel: e.eventLabel ?? undefined,
    eventValue: e.eventValue ?? undefined,
    pageUrl: e.pageUrl ?? undefined,
    pageTitle: e.pageTitle ?? undefined,
    elementId: e.elementId ?? undefined,
    elementClass: e.elementClass ?? undefined,
    elementText: e.elementText ?? undefined,
    ipAddress: e.ipAddress ?? undefined,
    userAgent: e.userAgent ?? undefined,
    browser: e.browser ?? undefined,
    os: e.os ?? undefined,
    deviceType: e.deviceType ?? undefined,
    country: e.country ?? undefined,
    city: e.city ?? undefined,
    toolType: e.toolType ?? undefined,
    toolPreset: e.toolPreset ?? undefined,
    toolSettings: e.toolSettings ?? undefined,
    inputSize: e.inputSize ?? undefined,
    outputSize: e.outputSize ?? undefined,
    processingTime: e.processingTime ?? undefined,
    creditsUsed: e.creditsUsed ?? undefined,
    errorMessage: e.errorMessage ?? undefined,
    errorStack: e.errorStack ?? undefined,
    errorCode: e.errorCode ?? undefined,
    metadata: e.metadata ?? undefined,
    timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : e.timestamp,
    clientTimestamp: e.clientTimestamp instanceof Date ? e.clientTimestamp.toISOString() : e.clientTimestamp ?? undefined,
  };
}

export async function trackUserEvent(data: Omit<UserEvent, 'id' | 'timestamp'>): Promise<UserEvent> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const event = await prisma.userEvent.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        eventName: data.eventName,
        eventCategory: data.eventCategory,
        eventLabel: data.eventLabel,
        eventValue: data.eventValue,
        pageUrl: data.pageUrl,
        pageTitle: data.pageTitle,
        elementId: data.elementId,
        elementClass: data.elementClass,
        elementText: data.elementText,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        browser: data.browser,
        os: data.os,
        deviceType: data.deviceType,
        country: data.country,
        city: data.city,
        toolType: data.toolType,
        toolPreset: data.toolPreset,
        toolSettings: data.toolSettings,
        inputSize: data.inputSize,
        outputSize: data.outputSize,
        processingTime: data.processingTime,
        creditsUsed: data.creditsUsed,
        errorMessage: data.errorMessage,
        errorStack: data.errorStack,
        errorCode: data.errorCode,
        metadata: data.metadata,
        clientTimestamp: data.clientTimestamp ? new Date(data.clientTimestamp) : undefined,
      },
    });

    // Update session actions count if session exists
    if (data.sessionId) {
      await prisma.userSession.update({
        where: { id: data.sessionId },
        data: {
          actions: { increment: 1 },
          lastActivityAt: new Date(),
        },
      }).catch(() => {});
    }

    // Update user's last activity
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        lastActiveAt: new Date(),
        lastToolUsed: data.toolType || undefined,
      },
    }).catch(() => {});

    return prismaEventToEvent(event);
  }
  throw new Error('User event tracking requires PostgreSQL');
}

export async function getUserEvents(userId: string, options?: {
  limit?: number;
  eventCategory?: string;
  eventName?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<UserEvent[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const events = await prisma.userEvent.findMany({
      where: {
        userId,
        ...(options?.eventCategory && { eventCategory: options.eventCategory as any }),
        ...(options?.eventName && { eventName: options.eventName }),
        ...(options?.startDate && { timestamp: { gte: options.startDate } }),
        ...(options?.endDate && { timestamp: { lte: options.endDate } }),
      },
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 100,
    });
    return events.map(prismaEventToEvent);
  }
  return [];
}

export async function getEventsBySession(sessionId: string): Promise<UserEvent[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const events = await prisma.userEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
    return events.map(prismaEventToEvent);
  }
  return [];
}

// ============================================
// PAGE VIEW TRACKING
// ============================================

export interface PageView {
  id: string;
  userId: string;
  sessionId?: string;

  // Page identification
  pageUrl: string;
  pagePath: string;
  pageTitle?: string;
  pageType?: string;

  // Referrer
  referrer?: string;
  referrerDomain?: string;

  // Technical
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  screenResolution?: string;
  viewportSize?: string;

  // Geographic
  country?: string;
  city?: string;

  // Engagement
  timeOnPage?: number;
  scrollDepth?: number;
  scrollEvents: number;
  clickEvents: number;
  formInteractions: number;

  // Content engagement
  readTime?: number;
  contentLength?: number;
  imagesViewed: number;
  videosPlayed: number;
  videoWatchTime: number;

  // Exit behavior
  exitType?: string;
  nextPage?: string;

  // Timing
  enteredAt: string;
  exitedAt?: string;

  // Performance
  loadTime?: number;
  timeToFirstByte?: number;
  domContentLoaded?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;

  // Custom
  metadata?: any;
}

function prismaPageViewToPageView(p: any): PageView {
  return {
    id: p.id,
    userId: p.userId,
    sessionId: p.sessionId ?? undefined,
    pageUrl: p.pageUrl,
    pagePath: p.pagePath,
    pageTitle: p.pageTitle ?? undefined,
    pageType: p.pageType ?? undefined,
    referrer: p.referrer ?? undefined,
    referrerDomain: p.referrerDomain ?? undefined,
    ipAddress: p.ipAddress ?? undefined,
    userAgent: p.userAgent ?? undefined,
    browser: p.browser ?? undefined,
    os: p.os ?? undefined,
    deviceType: p.deviceType ?? undefined,
    screenResolution: p.screenResolution ?? undefined,
    viewportSize: p.viewportSize ?? undefined,
    country: p.country ?? undefined,
    city: p.city ?? undefined,
    timeOnPage: p.timeOnPage ?? undefined,
    scrollDepth: p.scrollDepth ?? undefined,
    scrollEvents: p.scrollEvents,
    clickEvents: p.clickEvents,
    formInteractions: p.formInteractions,
    readTime: p.readTime ?? undefined,
    contentLength: p.contentLength ?? undefined,
    imagesViewed: p.imagesViewed,
    videosPlayed: p.videosPlayed,
    videoWatchTime: p.videoWatchTime,
    exitType: p.exitType ?? undefined,
    nextPage: p.nextPage ?? undefined,
    enteredAt: p.enteredAt instanceof Date ? p.enteredAt.toISOString() : p.enteredAt,
    exitedAt: p.exitedAt instanceof Date ? p.exitedAt.toISOString() : p.exitedAt ?? undefined,
    loadTime: p.loadTime ?? undefined,
    timeToFirstByte: p.timeToFirstByte ?? undefined,
    domContentLoaded: p.domContentLoaded ?? undefined,
    largestContentfulPaint: p.largestContentfulPaint ?? undefined,
    firstInputDelay: p.firstInputDelay ?? undefined,
    cumulativeLayoutShift: p.cumulativeLayoutShift ?? undefined,
    metadata: p.metadata ?? undefined,
  };
}

export async function trackPageView(data: Omit<PageView, 'id' | 'enteredAt' | 'scrollEvents' | 'clickEvents' | 'formInteractions' | 'imagesViewed' | 'videosPlayed' | 'videoWatchTime'>): Promise<PageView> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const pageView = await prisma.pageView.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        pageUrl: data.pageUrl,
        pagePath: data.pagePath,
        pageTitle: data.pageTitle,
        pageType: data.pageType,
        referrer: data.referrer,
        referrerDomain: data.referrerDomain,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        browser: data.browser,
        os: data.os,
        deviceType: data.deviceType,
        screenResolution: data.screenResolution,
        viewportSize: data.viewportSize,
        country: data.country,
        city: data.city,
        loadTime: data.loadTime,
        timeToFirstByte: data.timeToFirstByte,
        domContentLoaded: data.domContentLoaded,
        largestContentfulPaint: data.largestContentfulPaint,
        firstInputDelay: data.firstInputDelay,
        cumulativeLayoutShift: data.cumulativeLayoutShift,
        metadata: data.metadata,
      },
    });

    // Update session page view count
    if (data.sessionId) {
      await prisma.userSession.update({
        where: { id: data.sessionId },
        data: {
          pageViews: { increment: 1 },
          lastActivityAt: new Date(),
        },
      }).catch(() => {});
    }

    // Update user's total page views
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        totalPageViews: { increment: 1 },
        lastActiveAt: new Date(),
        lastPageViewed: data.pagePath,
      },
    }).catch(() => {});

    return prismaPageViewToPageView(pageView);
  }
  throw new Error('Page view tracking requires PostgreSQL');
}

export async function updatePageView(id: string, updates: Partial<PageView>): Promise<PageView | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    try {
      const pageView = await prisma.pageView.update({
        where: { id },
        data: updates as any,
      });
      return prismaPageViewToPageView(pageView);
    } catch {
      return null;
    }
  }
  return null;
}

export async function getUserPageViews(userId: string, options?: {
  limit?: number;
  pageType?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<PageView[]> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const pageViews = await prisma.pageView.findMany({
      where: {
        userId,
        ...(options?.pageType && { pageType: options.pageType }),
        ...(options?.startDate && { enteredAt: { gte: options.startDate } }),
        ...(options?.endDate && { enteredAt: { lte: options.endDate } }),
      },
      orderBy: { enteredAt: 'desc' },
      take: options?.limit || 100,
    });
    return pageViews.map(prismaPageViewToPageView);
  }
  return [];
}

// ============================================
// EXTENDED USER DATA UPDATES
// ============================================

export interface ExtendedUserData {
  // Geographic
  country?: string;
  countryName?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;

  // Device
  lastIpAddress?: string;
  signupIpAddress?: string;
  userAgent?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  screenResolution?: string;
  language?: string;
  languages?: string[];

  // Marketing
  referralSource?: string;
  referralMedium?: string;
  referralCampaign?: string;
  referralTerm?: string;
  referralContent?: string;
  landingPage?: string;
  signupPage?: string;
  referrerUrl?: string;
  gclid?: string;
  fbclid?: string;
  affiliateId?: string;
  promoCode?: string;

  // Business
  subscriptionTier?: string;
  subscriptionStatus?: string;
  customerSegment?: string;

  // Communication
  emailVerified?: boolean;
  phoneNumber?: string;
  marketingConsent?: boolean;
  newsletterSubscribed?: boolean;

  // Company (B2B)
  companyName?: string;
  companySize?: string;
  companyIndustry?: string;
  jobTitle?: string;

  // Auth
  googleId?: string;
  authProvider?: string;
}

export async function updateUserExtendedData(userId: string, data: ExtendedUserData): Promise<User | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          updatedAt: new Date(),
          ...(data.marketingConsent !== undefined && { marketingConsentAt: data.marketingConsent ? new Date() : null }),
          ...(data.emailVerified !== undefined && data.emailVerified && { emailVerifiedAt: new Date() }),
        } as any,
      });
      return prismaUserToUser(user);
    } catch {
      return null;
    }
  }
  return null;
}

export async function updateUserOnSignup(userId: string, data: {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  landingPage?: string;
  signupPage?: string;
  gclid?: string;
  fbclid?: string;
  promoCode?: string;
  authProvider?: string;
  googleId?: string;
}): Promise<void> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    await prisma.user.update({
      where: { id: userId },
      data: {
        signupIpAddress: data.ipAddress,
        lastIpAddress: data.ipAddress,
        userAgent: data.userAgent,
        referrerUrl: data.referrer,
        referralSource: data.utmSource,
        referralMedium: data.utmMedium,
        referralCampaign: data.utmCampaign,
        referralTerm: data.utmTerm,
        referralContent: data.utmContent,
        landingPage: data.landingPage,
        signupPage: data.signupPage,
        gclid: data.gclid,
        fbclid: data.fbclid,
        promoCode: data.promoCode,
        authProvider: data.authProvider,
        googleId: data.googleId,
      },
    });
  }
}

export async function updateUserOnLogin(userId: string, data: {
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  country?: string;
  city?: string;
}): Promise<void> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastIpAddress: data.ipAddress,
        userAgent: data.userAgent,
        browser: data.browser,
        os: data.os,
        deviceType: data.deviceType,
        country: data.country,
        city: data.city,
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
      },
    });
  }
}

export async function updateUserToolUsage(userId: string, toolType: string, preset?: string): Promise<void> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredTools: true },
    });

    // Update preferred tools (keep last 5 most used)
    let preferredTools = user?.preferredTools || [];
    if (!preferredTools.includes(toolType)) {
      preferredTools = [toolType, ...preferredTools].slice(0, 5);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastToolUsed: toolType,
        favoritePreset: preset,
        totalImagesProcessed: { increment: 1 },
        preferredTools,
        lastActiveAt: new Date(),
      },
    });
  }
}

export async function updateUserPurchase(userId: string, amount: number): Promise<void> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalPurchases: true, totalSpent: true, firstPurchaseAt: true },
    });

    const newTotalPurchases = (user?.totalPurchases || 0) + 1;
    const newTotalSpent = (user?.totalSpent || 0) + amount;

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPurchases: newTotalPurchases,
        totalSpent: newTotalSpent,
        lifetimeValue: newTotalSpent,
        avgPurchaseValue: newTotalSpent / newTotalPurchases,
        lastPurchaseAt: new Date(),
        ...(!user?.firstPurchaseAt && { firstPurchaseAt: new Date() }),
      },
    });
  }
}

// ============================================
// ANALYTICS AGGREGATION
// ============================================

export async function getUserAnalytics(userId: string): Promise<{
  totalSessions: number;
  totalPageViews: number;
  totalEvents: number;
  avgSessionDuration: number;
  lastActive: string | null;
  topPages: { path: string; views: number }[];
  topEvents: { name: string; count: number }[];
  deviceBreakdown: { type: string; count: number }[];
  countryBreakdown: { country: string; count: number }[];
} | null> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();

    const [
      user,
      topPages,
      topEvents,
      devices,
      countries,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          totalSessions: true,
          totalPageViews: true,
          avgSessionTime: true,
          lastActiveAt: true,
        },
      }),
      prisma.pageView.groupBy({
        by: ['pagePath'],
        where: { userId },
        _count: { pagePath: true },
        orderBy: { _count: { pagePath: 'desc' } },
        take: 10,
      }),
      prisma.userEvent.groupBy({
        by: ['eventName'],
        where: { userId },
        _count: { eventName: true },
        orderBy: { _count: { eventName: 'desc' } },
        take: 10,
      }),
      prisma.userSession.groupBy({
        by: ['deviceType'],
        where: { userId, deviceType: { not: null } },
        _count: { deviceType: true },
      }),
      prisma.userSession.groupBy({
        by: ['country'],
        where: { userId, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
    ]);

    if (!user) return null;

    const totalEvents = await prisma.userEvent.count({ where: { userId } });

    return {
      totalSessions: user.totalSessions,
      totalPageViews: user.totalPageViews,
      totalEvents,
      avgSessionDuration: user.avgSessionTime,
      lastActive: user.lastActiveAt?.toISOString() || null,
      topPages: topPages.map(p => ({ path: p.pagePath, views: p._count.pagePath })),
      topEvents: topEvents.map(e => ({ name: e.eventName, count: e._count.eventName })),
      deviceBreakdown: devices.map(d => ({ type: d.deviceType || 'unknown', count: d._count.deviceType })),
      countryBreakdown: countries.map(c => ({ country: c.country || 'unknown', count: c._count.country })),
    };
  }
  return null;
}

export async function getGlobalAnalytics(days: number = 30): Promise<{
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  totalPageViews: number;
  totalEvents: number;
  avgSessionDuration: number;
  topCountries: { country: string; users: number }[];
  topReferrers: { source: string; users: number }[];
  userGrowth: { date: string; count: number }[];
}> {
  if (USE_POSTGRES) {
    const prisma = await getPrisma();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalUsers,
      activeUsers,
      totalSessions,
      totalPageViews,
      totalEvents,
      avgSession,
      topCountries,
      topReferrers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastActiveAt: { gte: startDate } } }),
      prisma.userSession.count({ where: { startedAt: { gte: startDate } } }),
      prisma.pageView.count({ where: { enteredAt: { gte: startDate } } }),
      prisma.userEvent.count({ where: { timestamp: { gte: startDate } } }),
      prisma.userSession.aggregate({
        where: { startedAt: { gte: startDate }, endedAt: { not: null } },
        _avg: { duration: true },
      }),
      prisma.user.groupBy({
        by: ['country'],
        where: { country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
      prisma.user.groupBy({
        by: ['referralSource'],
        where: { referralSource: { not: null } },
        _count: { referralSource: true },
        orderBy: { _count: { referralSource: 'desc' } },
        take: 10,
      }),
    ]);

    // Get daily user growth
    const userGrowth: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.user.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
        },
      });
      userGrowth.push({ date: dateStr, count });
    }

    return {
      totalUsers,
      activeUsers,
      totalSessions,
      totalPageViews,
      totalEvents,
      avgSessionDuration: Math.floor(avgSession._avg?.duration || 0),
      topCountries: topCountries.map(c => ({ country: c.country || 'unknown', users: c._count.country })),
      topReferrers: topReferrers.map(r => ({ source: r.referralSource || 'direct', users: r._count.referralSource })),
      userGrowth,
    };
  }

  return {
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    totalPageViews: 0,
    totalEvents: 0,
    avgSessionDuration: 0,
    topCountries: [],
    topReferrers: [],
    userGrowth: [],
  };
}
