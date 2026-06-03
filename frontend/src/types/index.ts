// ===== User =====
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  emailVerified: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

// ===== Auth =====
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ===== URL =====
export interface Url {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title?: string;
  description?: string;
  customAlias?: string;
  password?: string;
  expiresAt?: string;
  isActive: boolean;
  clickCount: number;
  userId: string;
  teamId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface UrlClick {
  id: string;
  urlId: string;
  ip: string;
  userAgent: string;
  referer?: string;
  browser: string;
  os: string;
  device: string;
  country?: string;
  city?: string;
  createdAt: string;
}

export interface CreateUrlRequest {
  originalUrl: string;
  customAlias?: string;
  title?: string;
  description?: string;
  expiresAt?: string;
  password?: string;
  teamId?: string;
  tags?: string[];
}

export interface UpdateUrlRequest {
  title?: string;
  description?: string;
  originalUrl?: string;
  expiresAt?: string;
  password?: string;
  isActive?: boolean;
  tags?: string[];
}

// ===== Analytics =====
export interface AnalyticsData {
  totalClicks: number;
  uniqueClicks: number;
  clickTrends: ClickTrend[];
  browsers: BrowserStat[];
  devices: DeviceStat[];
  countries: CountryStat[];
  referrers: ReferrerStat[];
}

export interface ClickTrend {
  date: string;
  clicks: number;
  uniqueClicks: number;
}

export interface BrowserStat {
  browser: string;
  count: number;
  percentage: number;
}

export interface DeviceStat {
  device: string;
  count: number;
  percentage: number;
}

export interface CountryStat {
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
}

export interface ReferrerStat {
  referrer: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  avgCtr: number;
  clickTrends: ClickTrend[];
  recentLinks: Url[];
  topLinks: Url[];
}

// ===== Team =====
export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  members?: TeamMember[];
  urlCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  user?: User;
  name?: string;
  email?: string;
  joinedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

// ===== API Key =====
export interface ApiKey {
  id: string;
  name: string;
  key?: string; // only shown once on creation
  prefix: string;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  expiresAt?: string;
}

// ===== API Responses =====
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiPaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: 'active' | 'expired' | 'all';
}
