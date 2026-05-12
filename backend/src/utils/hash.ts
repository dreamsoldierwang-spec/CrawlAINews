import crypto from 'crypto';

export function generateNewsHash(source: string, url: string): string {
  return crypto.createHash('md5').update(`${source}:${url}`).digest('hex');
}

export function generateDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}
