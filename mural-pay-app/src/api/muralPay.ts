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
    throw new Error(`${method} ${path} failed: ${res.status} ${errorText}`);
  }
  
  // Only try to parse JSON if the response was OK
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


export interface amount {
  tokenAmount: number;
  tokenSymbol: string;
} 

export interface payoutDetails {
  type: string;
  bankName?: string;
  bankAccountOwner?: string;
  fiatAndRailDetails?: fiatAndRailDetails;
  blockchainPayoutDetails?: blockchainPayoutDetails; // Keep this for backward compatibility
}

export interface fiatAndRailDetails {
  type: string;
  symbol: string;
  accountType: string;
  phoneNumber: string;
  bankAccountNumber: string;
  documentNumber: string;
  documentType: string;
}

export interface blockchainPayoutDetails {
  type: string;
  walletDetails: walletDetails;
}

export interface walletDetails {
  walletAddress: string;
  blockchain: string; // Must be either ethereum, polygon, base, or celo
}

// Updated to match the API example
export interface recipientInfo {
  type: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
  physicalAddress?: {
    address1: string;
    country: string;
    state: string;
    city: string;
    zip: string;
  };
  // Keep these for backward compatibility
  individualRecipientInfo?: individualRecipientInfo | null;
  businessRecipientInfo?: businessRecipientInfo | null;
}

// Keep these for backward compatibility
export interface individualRecipientInfo {
  type: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | Date;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

// Keep these for backward compatibility
export interface businessRecipientInfo {
  type: string;
  name: string;
  email: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface payouts {
  amount: amount;
  payoutDetails: payoutDetails;
  recipientInfo: recipientInfo;
}

export interface PayoutRequest {
  id: string;
  createdAt: string;
  sourceAccountId: string;
  memo: string;
  amount: number;
  status: string;
  payouts: payouts[];
  // …other fields as returned by the API
}

/**
 * Create a Payout Request.
 */
export function createPayoutRequest(input: {
  sourceAccountId: string;
  payouts: payouts[];
  memo?:      string;
}): Promise<PayoutRequest> {
  return request<PayoutRequest>({ method: 'POST', path: '/api/payouts/payout', body: input });
}

/**
 * Search (list) Payout Requests.
 */
export function searchPayoutRequests(filter: {
  organization_id: string;
  status?:         string[];
}): Promise<PayoutRequest[]> {
  return request<PayoutRequest[]>({ method: 'POST', path: '/api/payouts/search', body: filter });
}

/**
 * Get one Payout Request by ID.
 */
export function getPayoutRequest(id: string): Promise<PayoutRequest> {
  return request<PayoutRequest>({ method: 'GET', path: `/api/payouts/payout/${id}` });
}

/**
 * Execute a Payout Request.
 */
export function executePayoutRequest(id: string): Promise<PayoutRequest> {
  return request<PayoutRequest>({ method: 'POST', path: `/api/payouts/payout/${id}/execute` });
}

/**
 * Cancel a Payout Request.
 */
export function cancelPayoutRequest(id: string): Promise<void> {
  return request<void>({ method: 'POST', path: `/api/payouts/payout/${id}/cancel` });
}