import { useState, useCallback } from 'react';
import { Account, createAccount, getAccounts } from '../api/muralPay';

/**
 * Custom hook for managing accounts
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all accounts
   */
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const accountsList = await getAccounts();
      setAccounts(accountsList);
      
      // If we have accounts but no selected account, select the first one
      if (accountsList.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accountsList[0].id);
        setSelectedAccount(accountsList[0]);
      }
      return accountsList;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  /**
   * Create a new account
   */
  const createNewAccount = async (name: string) => {
    setError(null);
    try {
      const newAccount = await createAccount({ name });
      setSelectedAccount(newAccount);
      setSelectedAccountId(newAccount.id);
      // Refresh the accounts list
      await fetchAccounts();
      return newAccount;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Select an account by ID
   */
  const selectAccount = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setSelectedAccount(account);
      setSelectedAccountId(accountId);
    }
  };

  return {
    accounts,
    selectedAccount,
    selectedAccountId,
    loading,
    error,
    fetchAccounts,
    createNewAccount,
    selectAccount,
    setSelectedAccountId
  };
}
