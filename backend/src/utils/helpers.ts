import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';
import config from '../configs/index';
import { TokenPayload } from '../types';

const SALT_ROUNDS = 12;

/**
 * Generate a short code using nanoid
 */
export function generateShortCode(length: number = config.shortCode.length): string {
  return nanoid(length);
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
    issuer: config.jwt.issuer,
  } as jwt.SignOptions);
}

/**
 * Generate a JWT refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiry,
    issuer: config.jwt.issuer,
  } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret, {
    issuer: config.jwt.issuer,
  }) as TokenPayload;
}

/**
 * Generate a random token (for email verification, password reset, etc.)
 */
export function generateRandomToken(): string {
  return nanoid(32);
}

/**
 * Parse user agent string
 */
export function parseUserAgent(userAgentString: string): {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
} {
  const parser = new UAParser(userAgentString);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  let deviceType = 'desktop';
  if (device.type) {
    deviceType = device.type;
  } else {
    // Infer desktop if no device type is reported
    const osName = (os.name || '').toLowerCase();
    if (
      osName.includes('android') ||
      osName.includes('ios') ||
      osName.includes('windows phone')
    ) {
      deviceType = 'mobile';
    }
  }

  return {
    browser: browser.name || 'Unknown',
    browserVersion: browser.version || 'Unknown',
    os: os.name || 'Unknown',
    osVersion: os.version || 'Unknown',
    deviceType,
  };
}

/**
 * Get geolocation from IP address using geoip-lite
 */
export function getGeoLocation(ip: string): {
  country: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
} {
  // Normalize IPv6 loopback and private IPs
  const normalizedIp = ip === '::1' || ip === '::ffff:127.0.0.1' ? '127.0.0.1' : ip;

  const geo = geoip.lookup(normalizedIp);

  if (!geo) {
    return {
      country: null,
      city: null,
      region: null,
      latitude: null,
      longitude: null,
    };
  }

  return {
    country: geo.country || null,
    city: geo.city || null,
    region: geo.region || null,
    latitude: geo.ll ? geo.ll[0] : null,
    longitude: geo.ll ? geo.ll[1] : null,
  };
}

/**
 * Extract client IP from request headers
 */
export function extractClientIp(headers: Record<string, string | string[] | undefined>, socketIp?: string): string {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  const realIp = headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  return socketIp || '0.0.0.0';
}

/**
 * Hash a string using SHA-256 (for API keys, tokens stored in DB)
 */
export function hashString(input: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Slugify a string for use in URLs
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Calculate expiry date from a duration string like '7d', '24h', '30m'
 */
export function calculateExpiry(duration: string): Date {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();

  switch (unit) {
    case 's':
      now.setSeconds(now.getSeconds() + value);
      break;
    case 'm':
      now.setMinutes(now.getMinutes() + value);
      break;
    case 'h':
      now.setHours(now.getHours() + value);
      break;
    case 'd':
      now.setDate(now.getDate() + value);
      break;
  }

  return now;
}
