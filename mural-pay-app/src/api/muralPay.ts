// src/api/muralPay.ts

const BASE_URL = import.meta.env.VITE_MURALPAY_BASE_URL;
const API_KEY  = import.meta.env.VITE_MURALPAY_KEY;
const TRANSFER_KEY = import.meta.env.VITE_MURALPAY_TRANSFER_KEY;

interface RequestOptions {
  method: 'GET' | 'POST';
  path:   string;
  body?:  unknown;
  useTransferKey?: boolean; // Flag to explicitly use the transfer API key
  onBehalfOf?: string; // Customer ID to use for the on-behalf-of header
}

async function request<T>({ method, path, body, useTransferKey, onBehalfOf }: RequestOptions): Promise<T> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${BASE_URL}/${cleanPath}`;

  // Create headers with required fields
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'accept': 'application/json'
  };
  
  // Add transfer API key header only for specific operations like executing payouts
  if (useTransferKey && TRANSFER_KEY) {
    headers['transfer-api-key'] = TRANSFER_KEY;
  }
  
  // Add on-behalf-of header if a customer ID is provided
  if (onBehalfOf) {
    headers['on-behalf-of'] = onBehalfOf;
  }
  
  const res = await fetch(url, {
    method,
    headers,
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
export interface DepositAccount {
  id: string;
  accountId: string;
  status: string;
  currency: string;
  bankBeneficiaryName: string;
  bankBeneficiaryAddress: string;
  bankName: string;
  bankAddress: string;
  bankRoutingNumber: string;
  bankAccountNumber: string;
  paymentRails: string[];
}

export interface AccountDetails {
  balances: Balance[];
  walletDetails: WalletDetails;
  depositAccount?: DepositAccount;
}

export interface WalletDetails {
  walletAddress: string;
  blockchain: string;
}

export interface Balance {
  tokenAmount: number;
  tokenSymbol: string;
}

export interface Account {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  isApiEnabled: boolean;
  status: string;
  accountDetails: AccountDetails;
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

/**
 * Get all accounts.
 */
export function getAccounts(): Promise<Account[]> {
  return request<Account[]>({ method: 'GET', path: '/api/accounts' });
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
  blockchainPayoutDetails?: blockchainPayoutDetails; 
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
  id: string;
  createdAt: string;
  updatedAt: string;
  amount: amount;
  recipientInfo?: recipientInfo;
  payoutDetails?: payoutDetails;
  details?: {
    type: string;
    fiatAndRailCode?: string;
    fiatAmount?: {
      fiatAmount: number;
      fiatCurrencyCode: string;
    };
    transactionFee?: {
      tokenSymbol: string;
      tokenAmount: number;
    };
    exchangeRate?: number;
    exchangeFeePercentage?: number;
    feeTotal?: {
      tokenSymbol: string;
      tokenAmount: number;
    };
    fiatPayoutStatus?: {
      type: string;
    };
  };
}

export interface PayoutRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  sourceAccountId: string;
  memo: string;
  amount: number;
  status: string;
  payouts: payouts[];
  // …other fields as returned by the API
}

/**
 * Payload for creating a payout
 */
export interface PayoutRequestPayload {
  sourceAccountId: string;
  memo?: string;
  payouts: Array<{
    amount: {
      tokenAmount: number;
      tokenSymbol: string;
    };
    payoutDetails: {
      type: string;
      bankName?: string;
      bankAccountOwner?: string;
      fiatAndRailDetails?: {
        type: string;
        symbol: string;
        accountType: string;
        phoneNumber: string;
        bankAccountNumber: string;
        documentNumber: string;
        documentType: string;
      };
      walletAddress?: string;
      blockchain?: string;
    };
    recipientInfo: {
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
    };
  }>;
}

/**
 * Create a Payout Request.
 */
export function createPayoutRequest(input: PayoutRequestPayload): Promise<PayoutRequest> {
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
 * Execute a Payout Request that's in AWAITING_EXECUTION state.
 */
export function executePayoutRequest(id: string, accountId: string): Promise<PayoutRequest> {
  return request<PayoutRequest>({
    method: 'POST', 
    path: `/api/payouts/payout/${id}/execute`,
    useTransferKey: true, // Explicitly use the transfer API key for payout execution
    onBehalfOf: accountId // Use the account ID for the on-behalf-of header
  });
}

/**
 * Cancel a Payout Request.
 */
export function cancelPayoutRequest(id: string): Promise<void> {
  return request<void>({ method: 'POST', path: `/api/payouts/payout/${id}/cancel` });
}