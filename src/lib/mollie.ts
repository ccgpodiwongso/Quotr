import createMollieClient from '@mollie/api-client';

let _mollie: ReturnType<typeof createMollieClient> | null = null;

export function getMollie() {
  if (!_mollie) {
    _mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY! });
  }
  return _mollie;
}

// Keep backward-compatible export for existing code
export const mollie = new Proxy({} as ReturnType<typeof createMollieClient>, {
  get(_target, prop) {
    return (getMollie() as any)[prop];
  },
});
