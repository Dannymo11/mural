// src/api/muralPay.ts

const BASE_URL = import.meta.env.VITE_MURALPAY_BASE_URL;
const API_KEY  = import.meta.env.VITE_MURALPAY_KEY;
const TRANSFER_KEY = import.meta.env.VITE_MURALPAY_TRANSFER_KEY;

interface RequestOptions {
  method: 'GET' | 'POST';
  path:   string;
  body?:  unknown;
}

async function request<T>({ method, path, body }: RequestOptions): Promise<T> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${BASE_URL}/${cleanPath}`;
  
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'transfer-api-key': TRANSFER_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`API Request Failed:\nURL: ${url}\nMethod: ${method}\nStatus: ${res.status}\nResponse: ${errorText}`);
  }
  return (await res.json()) as T;
}


// ── Accounts ───────────────────────────────────────────────────────────────────
export interface AccountDetails {
  walletDetails: walletDetails;
  balances: balances[];
}

export interface walletDetails {
  blockchain: string;
  walletAddress: string;
}
export interface balances {
  tokenAmount: number;
  tokenSymbol: string;
}

export interface Account {
  id: string;
  name: string;
  createdAt: string;
  isApiEnabled: boolean;
  status: string;
  customer_id: string;
  balance: number;
  currency: string;
}

/**
 * Create a new Account.
 */
export function createAccount(input: { name: string }): Promise<Account> {
  return request<Account>({
    method: 'POST',
    path: '/api/accounts',
    body: input,
  });
}

// ── Payouts ────────────────────────────────────────────────────────────────────

export interface PayoutRequest {
  id:         string;
  account_id: string;
  amount:     number;
  currency:   string;
  status:     string;
  // …other fields as returned by the API
}

/**
 * Create a Payout Request.
 */
export function createPayoutRequest(input: {
  account_id: string;
  amount:     number;
  currency:   string;
  recipients: { amount: number; address: string }[];
  memo?:      string;
}): Promise<PayoutRequest> {
  return request<PayoutRequest>({ method: 'POST', path: '/payouts/payout', body: input });
}

/**
 * Search (list) Payout Requests.
 */
export function searchPayoutRequests(filter: {
  organization_id: string;
  status?:         string[];
}): Promise<PayoutRequest[]> {
  return request<PayoutRequest[]>({ method: 'POST', path: '/payouts/search', body: filter });
}

/**
 * Get one Payout Request by ID.
 */
export function getPayoutRequest(id: string): Promise<PayoutRequest> {
  return request<PayoutRequest>({ method: 'GET', path: `/payouts/payout/${id}` });
}

/**
 * Execute a Payout Request.
 */
export function executePayoutRequest(id: string): Promise<PayoutRequest> {
  return request<PayoutRequest>({ method: 'POST', path: `/payouts/payout/${id}/execute` });
}

/**
 * Cancel a Payout Request.
 */
export function cancelPayoutRequest(id: string): Promise<void> {
  return request<void>({ method: 'POST', path: `/payouts/payout/${id}/cancel` });
}