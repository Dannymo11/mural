import { useState } from 'react';
import { PayoutRequest, createPayoutRequest, executePayoutRequest } from '../api/muralPay';

type ExecutionStatus = 'idle' | 'executing' | 'success' | 'error';
type RecipientType = 'individual' | 'business';

/**
 * Custom hook for managing payout operations
 */
export function usePayouts() {
  const [payoutResponse, setPayoutResponse] = useState<PayoutRequest | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutCurrency, setPayoutCurrency] = useState<string>('USDC');
  const [payoutMemo, setPayoutMemo] = useState<string>('');
  const [recipientType, setRecipientType] = useState<RecipientType>('individual');
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  /**
   * Reset payout form values
   */
  const resetForm = () => {
    setPayoutAmount('');
    setPayoutCurrency('USDC');
    setPayoutMemo('');
    setRecipientType('individual');
    setError(null);
  };

  /**
   * Set default values for the payout form
   */
  const setDefaultValues = () => {
    setPayoutAmount('100');
    setPayoutMemo('December contract');
  };

  /**
   * Create a new payout request
   */
  /**
   * Create a new payout request
   * @param sourceAccountId - ID of the source account
   * @param formData - Form data for the payout (using any as the API may expect different types)
   */
  const createPayout = async (
    sourceAccountId: string, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: Record<string, any>
  ) => {
    setError(null);
    
    try {
      const amount = parseFloat(payoutAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid positive amount');
        return null;
      }
      
      // Extract form values
      const {
        firstName, lastName, email, dateOfBirth, businessName,
        street, city, state, postalCode, country,
        bankName, bankAccountOwner, accountType, phoneNumber,
        bankAccountNumber, documentNumber, documentType
      } = formData;
      
      // Build payload for COP fiat payment
      const payloadData = {
        sourceAccountId,
        payouts: [
          {
            amount: {
              tokenAmount: amount,
              tokenSymbol: payoutCurrency
            },
            payoutDetails: {
              type: 'fiat',
              bankName,
              bankAccountOwner,
              fiatAndRailDetails: {
                type: 'cop',  // Colombian Peso
                symbol: 'COP',
                accountType,
                phoneNumber,
                bankAccountNumber,
                documentNumber,
                documentType
              }
            },
            recipientInfo: recipientType === 'individual' 
              ? {
                  type: 'individual',
                  firstName,
                  lastName,
                  email,
                  dateOfBirth,
                  physicalAddress: {
                    address1: street,
                    country: country || 'CO',
                    state,
                    city,
                    zip: postalCode
                  }
                }
              : {
                  type: 'business',
                  firstName: businessName,
                  lastName: '',
                  email,
                  physicalAddress: {
                    address1: street,
                    country: country || 'CO',
                    state,
                    city,
                    zip: postalCode
                  }
                }
          }
        ],
        memo: payoutMemo || 'December contract'
      };
      
      const payout = await createPayoutRequest(payloadData);
      setPayoutResponse(payout);
      return payout;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    }
  };

  /**
   * Execute a payout request
   */
  const executePayout = async () => {
    if (!payoutResponse) return null;
    
    setError(null);
    setExecutionStatus('executing');
    
    try {
      const executedPayout = await executePayoutRequest(
        payoutResponse.id, 
        payoutResponse.sourceAccountId
      );
      
      setExecutionStatus('success');
      setPayoutResponse(executedPayout);
      return executedPayout;
    } catch (err: unknown) {
      setExecutionStatus('error');
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    }
  };

  return {
    payoutResponse,
    payoutAmount,
    payoutCurrency,
    payoutMemo,
    recipientType,
    executionStatus,
    error,
    setPayoutResponse,
    setPayoutAmount,
    setPayoutCurrency,
    setPayoutMemo,
    setRecipientType,
    resetForm,
    setDefaultValues,
    createPayout,
    executePayout
  };
}
