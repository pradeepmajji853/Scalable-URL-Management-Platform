import { Request } from 'express';

// ──── Database Models ───────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar_url?: string | null;
  is_verified: boolean;
  verification_token?: string | null;
  reset_password_token?: string | null;
  reset_password_expires?: Date | null;
  role: UserRole;
  is_active: boolean;
  last_login_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type UserRole = 'admin' | 'user';

export interface URL {
  id: string;
  user_id: string;
  original_url: string;
  short_code: string;
  custom_alias?: string | null;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  is_active: boolean;
  is_deleted: boolean;
  expires_at?: Date | null;
  password_hash?: string | null;
  max_clicks?: number | null;
  click_count: number;
  last_clicked_at?: Date | null;
  meta?: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface URLClick {
  id: string;
  url_id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  browser?: string | null;
  browser_version?: string | null;
  os?: string | null;
  os_version?: string | null;
  device_type?: string | null;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  clicked_at: Date;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: Date;
}

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at?: Date | null;
  expires_at?: Date | null;
  created_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  user_agent?: string | null;
  ip_address?: string | null;
  expires_at: Date;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: Date;
}

// ──── Request Types ─────────────────────────────────────────────────────

export interface CreateURLRequest {
  original_url: string;
  custom_alias?: string;
  title?: string;
  description?: string;
  tags?: string[];
  expires_at?: string;
  password?: string;
  max_clicks?: number;
}

export interface UpdateURLRequest {
  original_url?: string;
  title?: string;
  description?: string;
  tags?: string[];
  expires_at?: string | null;
  password?: string | null;
  max_clicks?: number | null;
  is_active?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface InviteMemberRequest {
  email: string;
  role?: TeamRole;
}

export interface UpdateRoleRequest {
  role: TeamRole;
}

export interface CreateApiKeyRequest {
  name: string;
  scopes?: string[];
  expires_at?: string;
}

// ──── Response Types ────────────────────────────────────────────────────

export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ClickStats {
  total_clicks: number;
  unique_clicks: number;
}

export interface DailyStat {
  date: string;
  clicks: number;
}

export interface BrowserStat {
  browser: string;
  count: number;
  percentage: number;
}

export interface DeviceStat {
  device_type: string;
  count: number;
  percentage: number;
}

export interface OsStat {
  os: string;
  count: number;
  percentage: number;
}

export interface CountryStat {
  country: string;
  count: number;
  percentage: number;
}

export interface ReferrerStat {
  referrer: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  total_links: number;
  total_clicks: number;
  active_links: number;
  links_today: number;
  clicks_today: number;
}

export interface URLAnalytics {
  url: URL;
  click_stats: ClickStats;
  daily_stats: DailyStat[];
  browser_stats: BrowserStat[];
  device_stats: DeviceStat[];
  os_stats: OsStat[];
  country_stats: CountryStat[];
  referrer_stats: ReferrerStat[];
}

// ──── Express Extensions ────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  requestId?: string;
}

// ──── Pagination ────────────────────────────────────────────────────────

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

// ──── Queue Job Data ────────────────────────────────────────────────────

export interface ClickJobData {
  url_id: string;
  ip_address: string;
  user_agent: string;
  referrer: string;
  clicked_at: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: 'verification' | 'password_reset' | 'welcome';
  context: Record<string, string>;
}

export interface AnalyticsJobData {
  url_id: string;
  type: 'aggregate' | 'cleanup';
}
