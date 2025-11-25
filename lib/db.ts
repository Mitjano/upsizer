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
  firstUploadAt?: string; // Track first image upload for email automation
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

// Helper for reading with cache
function readJSONWithCache<T>(filePath: string, cacheKey: string, defaultData: T): T {
  // Check cache first
  const cached = dbCache.get<T>(cacheKey);
  if (cached !== null) return cached;

  // Read from disk and cache
  const data = readJSON<T>(filePath, defaultData);
  dbCache.set(cacheKey, data);
  return data;
}

function writeJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  // Auto-invalidate cache based on file path
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

// User CRUD operations
export function getAllUsers(): User[] {
  return readJSONWithCache<User[]>(USERS_FILE, CacheKeys.USERS, []);
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

  console.log(`[updateUser] Before update:`, { id, oldCredits: users[index].credits, newCredits: updates.credits });

  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  console.log(`[updateUser] After update:`, { id, credits: users[index].credits });
  writeJSON(USERS_FILE, users);
  console.log(`[updateUser] Written to disk, cache invalidated`);
  return users[index];
}

export function updateUserLogin(email: string): void {
  const users = getAllUsers();
  const index = users.findIndex(u => u.email === email);

  if (index !== -1) {
    console.log(`[updateUserLogin] Updating login for ${email}, credits: ${users[index].credits}`);
    users[index].lastLoginAt = new Date().toISOString();
    users[index].updatedAt = new Date().toISOString();
    writeJSON(USERS_FILE, users);
    console.log(`[updateUserLogin] Login updated, credits unchanged: ${users[index].credits}`);
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
  return readJSONWithCache<Transaction[]>(TRANSACTIONS_FILE, CacheKeys.TRANSACTIONS, []);
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
  return readJSONWithCache<Usage[]>(USAGE_FILE, CacheKeys.USAGE, []);
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
  console.log(`[createUsage] User before update:`, { id: user?.id, credits: user?.credits, creditsUsed: data.creditsUsed });
  if (user) {
    const newCredits = Math.max(0, user.credits - data.creditsUsed);
    console.log(`[createUsage] Deducting ${data.creditsUsed} credits: ${user.credits} -> ${newCredits}`);
    updateUser(user.id, {
      totalUsage: user.totalUsage + 1,
      credits: newCredits,
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
  return readJSONWithCache<Campaign[]>(CAMPAIGNS_FILE, CacheKeys.CAMPAIGNS, []);
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

// Notifications
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
  return readJSONWithCache<Notification[]>(NOTIFICATIONS_FILE, CacheKeys.NOTIFICATIONS, []);
}

export function getUnreadNotifications(): Notification[] {
  return getAllNotifications().filter(n => !n.read);
}

export function createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
  const notifications = getAllNotifications();
  const newNotification: Notification = {
    ...data,
    id: nanoid(),
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.unshift(newNotification); // Add to beginning
  writeJSON(NOTIFICATIONS_FILE, notifications);
  return newNotification;
}

export function markNotificationAsRead(id: string): Notification | null {
  const notifications = getAllNotifications();
  const index = notifications.findIndex(n => n.id === id);

  if (index === -1) return null;

  notifications[index].read = true;
  writeJSON(NOTIFICATIONS_FILE, notifications);
  return notifications[index];
}

export function markAllNotificationsAsRead(): void {
  const notifications = getAllNotifications();
  notifications.forEach(n => n.read = true);
  writeJSON(NOTIFICATIONS_FILE, notifications);
}

export function deleteNotification(id: string): boolean {
  const notifications = getAllNotifications();
  const index = notifications.findIndex(n => n.id === id);

  if (index === -1) return false;

  notifications.splice(index, 1);
  writeJSON(NOTIFICATIONS_FILE, notifications);
  return true;
}

// API Keys
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  status: 'active' | 'revoked';
  rateLimit: number; // requests per hour
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

const API_KEYS_FILE = path.join(DATA_DIR, 'api_keys.json');

export function getAllApiKeys(): ApiKey[] {
  return readJSONWithCache<ApiKey[]>(API_KEYS_FILE, CacheKeys.API_KEYS, []);
}

export function getApiKeysByUserId(userId: string): ApiKey[] {
  return getAllApiKeys().filter(k => k.userId === userId);
}

export function getApiKeyByKey(key: string): ApiKey | null {
  return getAllApiKeys().find(k => k.key === key) || null;
}

export function createApiKey(data: Omit<ApiKey, 'id' | 'key' | 'createdAt' | 'usageCount'>): ApiKey {
  const apiKeys = getAllApiKeys();

  // Generate secure API key
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
  return updateApiKey(id, { status: 'revoked' }) !== null;
}

export function deleteApiKey(id: string): boolean {
  const apiKeys = getAllApiKeys();
  const index = apiKeys.findIndex(k => k.id === id);

  if (index === -1) return false;

  apiKeys.splice(index, 1);
  writeJSON(API_KEYS_FILE, apiKeys);
  return true;
}

export function incrementApiKeyUsage(key: string): void {
  const apiKeys = getAllApiKeys();
  const index = apiKeys.findIndex(k => k.key === key);

  if (index !== -1) {
    apiKeys[index].usageCount++;
    apiKeys[index].lastUsedAt = new Date().toISOString();
    writeJSON(API_KEYS_FILE, apiKeys);
  }
}

// Feature Flags
export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  targetUsers?: string[]; // user IDs
  createdAt: string;
  updatedAt: string;
}

const FEATURE_FLAGS_FILE = path.join(DATA_DIR, 'feature_flags.json');

export function getAllFeatureFlags(): FeatureFlag[] {
  return readJSONWithCache<FeatureFlag[]>(FEATURE_FLAGS_FILE, CacheKeys.FEATURE_FLAGS, []);
}

export function getFeatureFlagByKey(key: string): FeatureFlag | null {
  return getAllFeatureFlags().find(f => f.key === key) || null;
}

export function isFeatureEnabled(key: string, userId?: string): boolean {
  const flag = getFeatureFlagByKey(key);
  if (!flag) return false;
  if (!flag.enabled) return false;

  // Check if user is specifically targeted
  if (userId && flag.targetUsers && flag.targetUsers.includes(userId)) {
    return true;
  }

  // Check rollout percentage
  if (flag.rolloutPercentage === 100) return true;
  if (flag.rolloutPercentage === 0) return false;

  // Simple hash-based rollout
  if (userId) {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 100) < flag.rolloutPercentage;
  }

  return false;
}

export function createFeatureFlag(data: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): FeatureFlag {
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
  const flags = getAllFeatureFlags();
  const index = flags.findIndex(f => f.id === id);

  if (index === -1) return false;

  flags.splice(index, 1);
  writeJSON(FEATURE_FLAGS_FILE, flags);
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

// Backup & Recovery
export interface Backup {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automatic';
  size: number; // in bytes
  createdAt: string;
  createdBy: string;
  data: {
    users: User[];
    usage: Usage[];
    transactions: Transaction[];
    campaigns: Campaign[];
    notifications: Notification[];
    apiKeys: ApiKey[];
    featureFlags: FeatureFlag[];
  };
}

const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const BACKUPS_FILE = path.join(DATA_DIR, 'backups.json');

// Ensure backups directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export function getAllBackups(): Omit<Backup, 'data'>[] {
  const backups = readJSONWithCache<Backup[]>(BACKUPS_FILE, CacheKeys.BACKUPS, []);
  // Return without data to reduce memory usage
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

export function createBackup(name: string, description: string, createdBy: string, type: 'manual' | 'automatic' = 'manual'): Backup {
  const backupData = {
    users: getAllUsers(),
    usage: getAllUsage(),
    transactions: getAllTransactions(),
    campaigns: getAllCampaigns(),
    notifications: getAllNotifications(),
    apiKeys: getAllApiKeys(),
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

  // Save full backup to file
  const backupPath = path.join(BACKUPS_DIR, `${backup.id}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

  // Save metadata to backups list
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
    // Restore all data
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
    // Delete backup file
    const backupPath = path.join(BACKUPS_DIR, `${id}.json`);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }

    // Remove from metadata
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
  variables: string[]; // e.g., ['{{name}}', '{{email}}', '{{link}}']
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
  const templates = getAllEmailTemplates();
  return templates.find(t => t.id === id) || null;
}

export function getEmailTemplateBySlug(slug: string): EmailTemplate | null {
  const templates = getAllEmailTemplates();
  return templates.find(t => t.slug === slug) || null;
}

export function createEmailTemplate(data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): EmailTemplate {
  const templates = getAllEmailTemplates();

  // Check if slug already exists
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

// ===================
// Reports
// ===================

export interface Report {
  id: string;
  name: string;
  type: 'users' | 'usage' | 'revenue' | 'campaigns' | 'custom';
  format: 'pdf' | 'csv' | 'json';
  dateRange: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
  createdAt: string;
  createdBy: string;
  fileSize?: number;
  downloadCount: number;
  lastDownloadedAt?: string;
}

const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

function ensureReportsFile() {
  if (!fs.existsSync(REPORTS_FILE)) {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify([], null, 2));
  }
}

export function getAllReports(): Report[] {
  ensureReportsFile();
  return readJSONWithCache<Report[]>(REPORTS_FILE, CacheKeys.REPORTS, []);
}

export function getReportById(id: string): Report | null {
  const reports = getAllReports();
  return reports.find(r => r.id === id) || null;
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

// Generate report data based on type
export function generateReportData(type: Report['type'], dateRange: Report['dateRange'], filters?: Record<string, any>) {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);

  switch (type) {
    case 'users': {
      let users = getAllUsers().filter(u => {
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
      let usage = getAllUsage().filter(u => {
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
      let transactions = getAllTransactions().filter(t => {
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

// ===================
// Webhooks
// ===================

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[]; // e.g., ['user.created', 'transaction.completed', 'usage.recorded']
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
  const webhooks = getAllWebhooks();
  return webhooks.find(w => w.id === id) || null;
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

  // Sort by triggered time (newest first)
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

  // Keep only last 1000 logs
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }

  writeJSON(WEBHOOK_LOGS_FILE, logs);

  // Update webhook stats
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

// Trigger a webhook (async)
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

// ===================
// A/B Tests
// ===================

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
    traffic: number; // Percentage 0-100
    conversions: number;
    visitors: number;
  }[];
  targetMetric: string;
  targetUrl?: string;
  startDate?: string;
  endDate?: string;
  winner?: string; // variant id
  confidence?: number; // 0-100
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const ABTESTS_FILE = path.join(DATA_DIR, 'abtests.json');

export function getAllABTests(): ABTest[] {
  return readJSONWithCache<ABTest[]>(ABTESTS_FILE, CacheKeys.ABTESTS, []);
}

export function getABTestById(id: string): ABTest | null {
  const tests = getAllABTests();
  return tests.find(t => t.id === id) || null;
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

// Calculate statistical significance
export function calculateABTestWinner(testId: string): { winner: string; confidence: number } | null {
  const test = getABTestById(testId);
  if (!test || test.variants.length < 2) return null;

  const variants = test.variants.filter(v => v.visitors > 0);
  if (variants.length < 2) return null;

  // Find variant with highest conversion rate
  const variantsWithRates = variants.map(v => ({
    ...v,
    conversionRate: v.visitors > 0 ? v.conversions / v.visitors : 0,
  }));

  variantsWithRates.sort((a, b) => b.conversionRate - a.conversionRate);

  const winner = variantsWithRates[0];
  const runnerUp = variantsWithRates[1];

  // Simple confidence calculation (for demo purposes)
  // In production, use proper statistical significance testing (chi-square, z-test, etc.)
  const winnerRate = winner.conversionRate;
  const runnerUpRate = runnerUp.conversionRate;

  if (winnerRate === 0 || runnerUpRate === 0) {
    return { winner: winner.id, confidence: 50 };
  }

  const improvement = ((winnerRate - runnerUpRate) / runnerUpRate) * 100;
  const minSampleSize = Math.max(winner.visitors, runnerUp.visitors);

  // Simplified confidence score based on improvement and sample size
  let confidence = Math.min(95, (improvement * minSampleSize) / 100);
  confidence = Math.max(50, confidence);

  return {
    winner: winner.id,
    confidence: Math.round(confidence),
  };
}

// ===================
// Content Moderation
// ===================

export interface ModerationRule {
  id: string;
  name: string;
  type: 'keyword' | 'pattern' | 'ai' | 'custom';
  target: 'post' | 'comment' | 'user_profile' | 'all';
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'flag' | 'auto_approve' | 'auto_reject' | 'quarantine';
  keywords?: string[];
  pattern?: string; // regex
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
  const rules = getAllModerationRules();
  return rules.find(r => r.id === id) || null;
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

  // Sort by creation date (newest first)
  queue.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return queue.slice(0, limit);
}

export function getModerationQueueById(id: string): ModerationQueue | null {
  const queue = getAllModerationQueue();
  return queue.find(q => q.id === id) || null;
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

// Check content against moderation rules
export function moderateContent(
  contentType: ModerationQueue['contentType'],
  contentId: string,
  content: string,
  author: string
): ModerationQueue {
  const rules = getAllModerationRules().filter(r => r.enabled && (r.target === contentType || r.target === 'all'));
  const flags: ModerationQueue['flags'] = [];

  for (const rule of rules) {
    let flagged = false;

    if (rule.type === 'keyword' && rule.keywords) {
      const lowerContent = content.toLowerCase();
      for (const keyword of rule.keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          flagged = true;
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
          flagged = true;
          flags.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            reason: `Matches pattern: ${rule.pattern}`,
            confidence: 95,
          });
        }
      } catch (e) {
        // Invalid regex, skip
      }
    }
  }

  // Determine status based on flags and actions
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

// ===================
// Support Tickets
// ===================

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
  const tickets = getAllTickets();
  return tickets.find(t => t.id === id) || null;
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

// ===================
// Referral Program
// ===================

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
  const referrals = getAllReferrals();
  return referrals.find(r => r.id === id) || null;
}

export function getReferralByCode(code: string): Referral | null {
  const referrals = getAllReferrals();
  return referrals.find(r => r.code === code) || null;
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
