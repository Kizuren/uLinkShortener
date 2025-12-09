import { NextRequest } from 'next/server';
import { UAParser } from 'ua-parser-js';
import { getIPData } from './analyticsdb';

// For accounts
const letterBytes = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const linkLength = 8;
const accountLength = 16;
const authTokenLength = 128;

function randomString(length: number, charset: string): string {
  let result = '';
  const charsetLength = charset.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charsetLength);
    result += charset[randomIndex];
  }

  return result;
}

export function generateLinkID(): string {
  return randomString(linkLength, letterBytes);
}

export function generateAccountID(): string {
  return randomString(accountLength, '0123456789');
}

export function generateAuthToken(): string {
  return randomString(authTokenLength, letterBytes);
}

// For Links
export function isValidUrl(urlStr: string): boolean {
  if (urlStr.trim() === '') {
    return false;
  }

  try {
    const parsedUrl = new URL(urlStr);
    return parsedUrl.protocol !== '' && parsedUrl.hostname !== '';
  } catch {
    return false;
  }
}

// For Clients
const defaultValue = 'Unknown';
function valueOrDefault(value: string | null): string {
  return !value || value?.trim() === '' ? defaultValue : value;
}

export async function getClientInfo(req: NextRequest) {
  const headers = req.headers;

  // Get the IP address
  let ip_address = headers.get('cf-connecting-ip') || headers.get('x-real-ip') || '';
  if (!ip_address) {
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
      ip_address = forwardedFor.split(',')[0].trim();
    }
  }

  if (!ip_address) {
    ip_address = defaultValue;
  }

  const ipVersion = ip_address.includes(':') ? 'IPv6' : 'IPv4';

  // User-Agent Parsing
  const uaString = headers.get('user-agent') ?? '';
  const ua = new UAParser(uaString);
  const browser = ua.getBrowser().name ?? defaultValue;
  const version = ua.getBrowser().version ?? defaultValue;
  const os = ua.getOS().name ?? defaultValue;

  // Platform
  const platform = headers.get('sec-ch-ua-platform') ?? os;

  // Language
  let language = headers.get('accept-language');
  if (language?.includes(',')) {
    language = language.split(',')[0];
  }
  language = valueOrDefault(language);

  return {
    ip_address,
    user_agent: uaString,
    platform,
    browser,
    version,
    language,
    referrer: valueOrDefault(headers.get('referer')),
    timestamp: new Date(),
    remote_port: valueOrDefault(headers.get('x-forwarded-port')),
    accept: valueOrDefault(headers.get('accept')),
    accept_language: valueOrDefault(headers.get('accept-language')),
    accept_encoding: valueOrDefault(headers.get('accept-encoding')),
    country: valueOrDefault(headers.get('cf-ipcountry')),
    ip_data: await getIPData(ip_address),
    ip_version: ipVersion,
  };
}

// For stats
export function formatOSStrings(os_string: string): string {
  os_string = os_string.trim();
  os_string = os_string.replaceAll('"', ''); // Windows usually reports ""Windows"""
  os_string = os_string.replaceAll('CPU ', ''); // iOS usually reports "CPU ....."
  os_string = os_string.replaceAll(' like Mac OS X', ''); // iOS usually reports at its end " like Mac OS X"

  return os_string;
}

// For MongoDB
export function sanitizeMongoDocument<T>(doc: T & { _id?: unknown }): T {
  if (!doc) return doc;

  const sanitized = { ...doc };
  delete sanitized._id;

  return sanitized;
}
