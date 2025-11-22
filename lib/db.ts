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
  return readJSON<Notification[]>(NOTIFICATIONS_FILE, []);
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
  return readJSON<ApiKey[]>(API_KEYS_FILE, []);
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
  return readJSON<FeatureFlag[]>(FEATURE_FLAGS_FILE, []);
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
  const backups = readJSON<Backup[]>(BACKUPS_FILE, []);
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
  return readJSON<EmailTemplate[]>(EMAIL_TEMPLATES_FILE, []);
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
  const data = fs.readFileSync(REPORTS_FILE, 'utf-8');
  return JSON.parse(data);
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
          inactive: users.filter(u => u.status === 'inactive').length,
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
