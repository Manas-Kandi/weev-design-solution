type Level = 'debug' | 'info' | 'warn' | 'error';

function isDebugEnabled(): boolean {
  try {
    if (typeof process !== 'undefined' && process.env) {
      const v = process.env.DEBUG || process.env.NEXT_PUBLIC_DEBUG;
      if (v && /^(1|true|yes|on)$/i.test(String(v))) return true;
    }
    if (typeof window !== 'undefined') {
      const v = (window as any).DEBUG ?? (window as any).NEXT_PUBLIC_DEBUG ?? localStorage.getItem('DEBUG');
      if (v && /^(1|true|yes|on)$/i.test(String(v))) return true;
    }
  } catch {}
  return false;
}

function log(level: Level, ...args: any[]) {
  if (level === 'debug' && !isDebugEnabled()) return;
  // eslint-disable-next-line no-console
  (console as any)[level] ? (console as any)[level](...args) : console.log(...args);
}

export const logger = {
  debug: (...args: any[]) => log('debug', ...args),
  info: (...args: any[]) => log('info', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  error: (...args: any[]) => log('error', ...args),
};

