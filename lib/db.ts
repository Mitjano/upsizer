import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
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

function writeJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// User CRUD operations
export function getAllUsers(): User[] {
  return readJSON<User[]>(USERS_FILE, []);
}

export function getUserByEmail(email: string): User | null {
  const users = getAllUsers();
  return users.find(u => u.email === email) || null;
}

export function getUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find(u => u.id === id) || null;
}

export function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
  const users = getAllUsers();
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

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getAllUsers();
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

export function updateUserLogin(email: string): void {
  const users = getAllUsers();
  const index = users.findIndex(u => u.email === email);

  if (index !== -1) {
    users[index].lastLoginAt = new Date().toISOString();
    users[index].updatedAt = new Date().toISOString();
    writeJSON(USERS_FILE, users);
  }
}

// Transactions
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

export function getAllTransactions(): Transaction[] {
  return readJSON<Transaction[]>(TRANSACTIONS_FILE, []);
}

export function getTransactionsByUserId(userId: string): Transaction[] {
  const transactions = getAllTransactions();
  return transactions.filter(t => t.userId === userId);
}

export function createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
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

export function updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
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

// Usage tracking
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

export function getAllUsage(): Usage[] {
  return readJSON<Usage[]>(USAGE_FILE, []);
}

export function getUsageByUserId(userId: string): Usage[] {
  const usage = getAllUsage();
  return usage.filter(u => u.userId === userId);
}

export function createUsage(data: Omit<Usage, 'id' | 'createdAt'>): Usage {
  const usage = getAllUsage();
  const newUsage: Usage = {
    ...data,
    id: nanoid(),
    createdAt: new Date().toISOString(),
  };

  usage.push(newUsage);
  writeJSON(USAGE_FILE, usage);

  // Update user's total usage
  const user = getUserById(data.userId);
  if (user) {
    updateUser(user.id, {
      totalUsage: user.totalUsage + 1,
      credits: Math.max(0, user.credits - data.creditsUsed),
    });
  }

  return newUsage;
}

// Campaigns
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
  return readJSON<Campaign[]>(CAMPAIGNS_FILE, []);
}

export function getCampaignById(id: string): Campaign | null {
  const campaigns = getAllCampaigns();
  return campaigns.find(c => c.id === id) || null;
}

export function createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Campaign {
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
  const campaigns = getAllCampaigns();
  const index = campaigns.findIndex(c => c.id === id);

  if (index === -1) return false;

  campaigns.splice(index, 1);
  writeJSON(CAMPAIGNS_FILE, campaigns);
  return true;
}

// Stats helpers
export function getUserStats() {
  const users = getAllUsers();
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

export function getFinanceStats(days: number = 30) {
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
