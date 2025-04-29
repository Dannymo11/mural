import { useState, useEffect } from 'react'
import './App.css'
import { useAccounts, usePayouts, useFormInitialization } from './hooks';
// Define the application views
type AppView = 'CREATE_ACCOUNT' | 'WELCOME' | 'CREATE_BLOCKCHAIN_PAYOUT' | 'VIEW_PAYOUT' | 'CREATE_FIAT_PAYOUT_COP';

// Constants for view types
const ViewTypes = {
  CREATE_ACCOUNT: 'CREATE_ACCOUNT',
  WELCOME: 'WELCOME',
  CREATE_BLOCKCHAIN_PAYOUT: 'CREATE_BLOCKCHAIN_PAYOUT',
  VIEW_PAYOUT: 'VIEW_PAYOUT',
  CREATE_FIAT_PAYOUT_COP: 'CREATE_FIAT_PAYOUT_COP'
} as const;

// App view type is imported from ViewTypes.ts

function App() {
  // View state management
  const [currentView, setCurrentView] = useState<AppView>(ViewTypes.CREATE_BLOCKCHAIN_PAYOUT);
  
  // Use custom hooks
  const { 
    accounts, 
    selectedAccount, 
    selectedAccountId, 
    loading: loadingAccounts, 
    error: acctError, 
    fetchAccounts, 
    createNewAccount, 
    selectAccount,
    setSelectedAccountId 
  } = useAccounts();
  
  const {
    // Payout state managed by the custom hook
    payoutResponse,
    payoutAmount,
    payoutCurrency,
    payoutMemo,
    recipientType,
    executionStatus,
    error: payoutError,
    // We don't use setPayoutResponse directly as it's handled by createPayout
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setPayoutResponse,
    setPayoutAmount,
    setPayoutCurrency,
    setPayoutMemo,
    setRecipientType,
    resetForm,
    createPayout,
    executePayout
  } = usePayouts();
  
  // Use form initialization hook
  const { extractFormData } = useFormInitialization(currentView);

  // Fetch accounts when component mounts or when navigating to relevant screens
  useEffect(() => {
    if (currentView === ViewTypes.WELCOME || currentView === ViewTypes.CREATE_BLOCKCHAIN_PAYOUT) {
      fetchAccounts();
    }
  }, [currentView, fetchAccounts]);
  
  // Handle account creation submit
  const handleCreateAcct = async () => {
    const nameInput = document.getElementById('acctName') as HTMLInputElement;
    if (!nameInput || !nameInput.value.trim()) {
      console.error('Please enter an account name');
      return;
    }
    
    try {
      await createNewAccount(nameInput.value.trim());
      nameInput.value = ''; // Clear the input field after successful creation
      await fetchAccounts();
      setSelectedAccountId(null); // Reset selected account
      // Navigate to welcome view after account creation
      setCurrentView(ViewTypes.WELCOME);
    } catch (err) {
      console.error('Error creating account:', err);
    }
  }
  
  // Handle creating a new payout
  const handleCreatePayout = async () => {
    if (!selectedAccountId) {
      console.error('No account selected');
      return;
    }
    
    try {
      // Get all form data using our utility function
      const formData = extractFormData();
      
      // Create the payout using our custom hook - this will set payoutResponse internally
      // createPayout function takes in the selected account ID and the form data, 
      // and returns a promise that resolves to the payout response if successful
      const payout = await createPayout(selectedAccountId, formData);
      
      // If successful, navigate to the payout view
      if (payout) {
        navigateTo(ViewTypes.VIEW_PAYOUT);
      }
    } catch (err) {
      // Error is handled by the hook
      console.error('Error creating payout:', err);
    }
  };
  
  // Handle payout execution
  const handleExecutePayout = async () => {
    try {
      // Simply use our custom hook to execute the payout
      await executePayout();
    } catch (err) {
      // Error is handled by the hook
      console.error('Error executing payout:', err);
    }
  }
  
  // Reset forms and navigate between views
  const navigateTo = (view: AppView) => {
    // Reset form state if navigating away from payout views
    if (view !== ViewTypes.VIEW_PAYOUT && view !== ViewTypes.CREATE_BLOCKCHAIN_PAYOUT) {
      resetForm();
    }
    setCurrentView(view);
  };
  
  // Render the welcome screen after account creation
  const renderWelcome = () => (
    <section className="welcome-container">
      <h2>Welcome to Mural Pay!</h2>

      {loadingAccounts ? (
        <p>Loading accounts...</p>
      ) : accounts.length > 0 ? (
        <>
          <div className="account-selection">
            <h3>Select Account</h3>
            <select 
              value={selectedAccountId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedAccountId(e.target.value);
                  selectAccount(e.target.value);
                }
              }}
              className="form-input"
            >
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.id}
                </option>
              ))}
            </select>
          </div>

          {selectedAccount && (
            <div className="account-details">
              <h3>Account Details</h3>
              <p><strong>Account ID:</strong> {selectedAccount.id}</p>
              <p><strong>Name:</strong> {selectedAccount.name}</p>
              <p><strong>Status:</strong> {selectedAccount.status}</p>
              <p><strong>Created At:</strong> {new Date(selectedAccount.createdAt).toLocaleString()}</p>
              <p><strong>API Enabled:</strong> {selectedAccount.isApiEnabled ? 'Yes' : 'No'}</p>
              
              {selectedAccount.accountDetails?.balances && selectedAccount.accountDetails.balances.length > 0 && (
                <div className="balance-details">
                  <h4>Balances</h4>
                  {selectedAccount.accountDetails.balances.map((balance: any, idx: number) => (
                    <p key={idx}><strong>{balance.tokenSymbol}:</strong> {balance.tokenAmount}</p>
                  ))}
                </div>
              )}
              
              {selectedAccount.accountDetails?.walletDetails && (
                <div className="wallet-details">
                  <h4>Wallet Details</h4>
                  <p><strong>Address:</strong> {selectedAccount.accountDetails.walletDetails.walletAddress}</p>
                  <p><strong>Blockchain:</strong> {selectedAccount.accountDetails.walletDetails.blockchain}</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="no-accounts">
          <p>No accounts found. Create a new account to get started.</p>
          <button onClick={() => navigateTo(ViewTypes.CREATE_ACCOUNT)} className="submit-btn">
            Create Account
          </button>
        </div>
      )}
      
      {acctError && <p className="error-message">Error: {acctError}</p>}
      
      {accounts.length > 0 && (
        <div className="welcome-actions">
          <h3>Create a New Payment</h3>
          <p>Send payments securely on the blockchain</p>
          
          <div className="payment-options">
            <button 
              onClick={() => navigateTo(ViewTypes.CREATE_BLOCKCHAIN_PAYOUT)}
              className="primary-btn"
              disabled={!selectedAccountId}
            >
              Create New Payment
            </button>
          </div>
        </div>
      )}
    </section>
  );
  
  // Note: Default values for the Colombian fiat payout are now managed by useFormInitialization hook

  useEffect(() => {
    // Only initialize defaults when switching to the payout creation view
    if (currentView === ViewTypes.CREATE_FIAT_PAYOUT_COP) {
      // Form values are now initialized by the useFormInitialization hook
      
      // Set default values for payout amount and memo
      setPayoutAmount('10');
      setPayoutMemo('Test COP payout');
    }
  }, [currentView, setPayoutAmount, setPayoutMemo]);

  // Render the blockchain payout creation form
  const renderBlockchainPayoutForm = () => {
    
    return (
      <section className="form-container">
        <h2>Cross-Border Payments!</h2>
        
        {/* Account Management Section */}
        <div className="account-management-section">
          <h3 className="form-section-title">Account Management</h3>
          <div className="account-creation">
            <h4>Create a New Account</h4>
            <div className="mini-form">
              <div className="form-group">
                <label htmlFor="acctName">Account Name</label>
                <input
                  id="acctName"
                  type="text"
                  placeholder="Enter account name"
                  className="form-input"
                />
              </div>
              <button 
                type="button" 
                onClick={handleCreateAcct} 
                className="secondary-btn"
              >
                Create Account
              </button>
            </div>
            {acctError && <p className="error-message">Error: {acctError}</p>}
          </div>
          {loadingAccounts ? (
            <p>Loading accounts...</p>
          ) : accounts.length > 0 ? (
            <div className="existing-accounts">
              <label htmlFor="accountSelect">Select an account:</label>
              <select 
                id="account-select"
                value={selectedAccountId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedAccountId(e.target.value);
                    selectAccount(e.target.value);
                  }
                }}
                className="form-input"
              >
                <option value="">-- Select Account --</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.id}
                  </option>
                ))}
              </select>
              
              {selectedAccountId && selectedAccount && (
                <div className="selected-account-details">
                  <p><strong>Selected Account:</strong> {selectedAccount.name}</p>
                  <p><strong>ID:</strong> {selectedAccount.id}</p>
                  {selectedAccount.accountDetails?.balances && selectedAccount.accountDetails.balances.length > 0 ? (
                    <p>
                      <strong>Balance:</strong> 
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {selectedAccount.accountDetails.balances.map((b: any, i: number) => (
                        <span key={i}>{b.tokenAmount} {b.tokenSymbol}{i < selectedAccount.accountDetails.balances.length - 1 ? ', ' : ''}</span>
                      ))}
                    </p>
                  ) : (
                    <p>No balances available</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
          
          
        </div>
        
        <hr className="section-divider" />
        
        {/* Payout Form - Only show if an account is selected */}
        {selectedAccountId ? (
          <form onSubmit={handleCreatePayout}>
          {/* Payment Details Section */}
          <h3 className="form-section-title">Payment Details</h3>
          <div className="form-group">
            <label htmlFor="payoutAmount">Amount</label>
            <input
              id="payoutAmount"
              type="number"
              step="0.001"
              placeholder="100"
              value={payoutAmount}
              onChange={e => setPayoutAmount(e.target.value)}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="payoutCurrency">Token</label>
            <select
              id="payoutCurrency"
              value={payoutCurrency}
              onChange={e => setPayoutCurrency(e.target.value)}
              className="form-select"
            >
              <option value="USDC">USD Coin (USDC)</option>
            </select>
          </div>
          
          <h3 className="form-section-title">Colombian Fiat Payout Details</h3>
          
          <div className="form-row">
            <div className="form-group form-group-half">
              <label htmlFor="bankName">Bank Name</label>
              <input
                id="bankName"
                type="text"
                placeholder="Enter bank name"
                defaultValue="Bancamia S.A."
                className="form-input"
                required
              />
            </div>
            <div className="form-group form-group-half">
              <label htmlFor="bankAccountOwner">Bank Account Owner</label>
              <input
                id="bankAccountOwner"
                type="text"
                placeholder="Enter account owner name"
                defaultValue="test"
                className="form-input"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group form-group-half">
              <label htmlFor="accountType">Account Type</label>
              <select
                id="accountType"
                defaultValue="CHECKING"
                className="form-select"
                required
              >
                <option value="CHECKING">Checking</option>
                <option value="SAVINGS">Savings</option>
              </select>
            </div>
            <div className="form-group form-group-half">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                id="phoneNumber"
                type="tel"
                placeholder="+57 601 555 5555"
                defaultValue="+57 601 555 5555"
                className="form-input"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group form-group-half">
              <label htmlFor="bankAccountNumber">Bank Account Number</label>
              <input
                id="bankAccountNumber"
                type="text"
                placeholder="Enter bank account number"
                defaultValue="1234567890123456"
                className="form-input"
                required
              />
            </div>
            <div className="form-group form-group-half">
              <label htmlFor="documentNumber">Document Number</label>
              <input
                id="documentNumber"
                type="text"
                placeholder="Enter document number"
                defaultValue="1234563"
                className="form-input"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="documentType">Document Type</label>
            <select
              id="documentType"
              defaultValue="NATIONAL_ID"
              className="form-select"
              required
            >
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="DRIVER_LICENSE">Driver's License</option>
            </select>
          </div>
          
          {/* Wallet Address field removed as it's not needed for fiat payments */}
          
          {/* Recipient Information Section */}
          <h3 className="form-section-title">Recipient Information</h3>
          <div className="form-group">
            <label>Recipient Type</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="recipientType"
                  value="individual"
                  checked={recipientType === 'individual'}
                  onChange={() => setRecipientType('individual')}
                />
                Individual
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="recipientType"
                  value="business"
                  checked={recipientType === 'business'}
                  onChange={() => setRecipientType('business')}
                />
                Business
              </label>
            </div>
          </div>
          
          {recipientType === 'individual' ? (
            // Individual recipient fields
            <>
              <div className="form-row">
                <div className="form-group form-group-half">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Enter first name"
                    defaultValue="Javier"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group form-group-half">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Enter last name"
                    defaultValue="Gomez"
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="individualEmail">Email</label>
                <input
                  id="individualEmail"
                  type="email"
                  placeholder="Enter email address"
                  defaultValue="jgomez@gmail.com"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  defaultValue="1980-02-22"
                  className="form-input"
                  required
                />
              </div>
              
              {/* Physical Address Section */}
              <h4 className="form-subsection-title">Physical Address</h4>
              <div className="form-group">
                <label htmlFor="street">Street Address</label>
                <input
                  id="street"
                  type="text"
                  placeholder="Enter street address"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group form-group-half">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    type="text"
                    placeholder="Enter city"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group form-group-half">
                  <label htmlFor="state">State/Province</label>
                  <input
                    id="state"
                    type="text"
                    placeholder="Enter state or province"
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group form-group-half">
                  <label htmlFor="postalCode">Postal Code</label>
                  <input
                    id="postalCode"
                    type="text"
                    placeholder="Enter postal code"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group form-group-half">
                  <label htmlFor="country">Country</label>
                  <input
                    id="country"
                    type="text"
                    placeholder="Enter country"
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            // Business recipient fields
            <>
              <div className="form-group">
                <label htmlFor="businessName">Business Name</label>
                <input
                  id="businessName"
                  type="text"
                  placeholder="Enter business name"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="businessEmail">Business Email</label>
                <input
                  id="businessEmail"
                  type="email"
                  placeholder="Enter business email"
                  className="form-input"
                  required
                />
              </div>
              
              {/* Business Physical Address Section */}
              <h4 className="form-subsection-title">Business Address</h4>
              <div className="form-group">
                <label htmlFor="street">Street Address</label>
                <input
                  id="street"
                  type="text"
                  placeholder="Enter street address"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group form-group-half">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    type="text"
                    placeholder="Enter city"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group form-group-half">
                  <label htmlFor="state">State/Province</label>
                  <input
                    id="state"
                    type="text"
                    placeholder="Enter state or province"
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group form-group-half">
                  <label htmlFor="postalCode">Postal Code</label>
                  <input
                    id="postalCode"
                    type="text"
                    placeholder="Enter postal code"
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group form-group-half">
                  <label htmlFor="country">Country</label>
                  <input
                    id="country"
                    type="text"
                    placeholder="Enter country"
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Memo Field */}
          <div className="form-group">
            <label htmlFor="payoutMemo">Memo (Optional)</label>
            <textarea
              id="payoutMemo"
              placeholder="Add a memo for this payout"
              value={payoutMemo || 'December contract'}
              onChange={e => setPayoutMemo(e.target.value)}
              className="form-textarea"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigateTo(ViewTypes.WELCOME)}
              className="back-btn"
            >
              Back
            </button>
            <button type="submit" className="submit-btn">Create New Payment</button>
          </div>
        </form>
        ) : (
          <div className="no-account-selected">
            <p>Please select or create an account to proceed with creating a payout.</p>
          </div>
        )}
        {payoutError && <p className="error-message">Error: {payoutError}</p>}
      </section>
    );
  };


  // Render the payout details and execution view
  const renderViewPayout = () => (
    <section className="payout-details-container">
      <h2>Payout Request Details</h2>
      
      <div className="payout-details">
        <p><strong>Payout ID:</strong> {payoutResponse?.id}</p>
        <p><strong>Account ID:</strong> {payoutResponse?.sourceAccountId}</p>
        <p><strong>Memo:</strong> {payoutResponse?.memo || 'No memo provided'}</p>
        <p><strong>Amount:</strong> {payoutResponse?.payouts?.[0]?.amount?.tokenAmount} {payoutResponse?.payouts?.[0]?.amount?.tokenSymbol}</p>
        <p><strong>Status:</strong> <span className={`status ${payoutResponse?.status?.toLowerCase()}`}>{payoutResponse?.status}</span></p>
        <p><strong>Created At:</strong> {new Date(payoutResponse?.createdAt || '').toLocaleString()}</p>
        <p><strong>Updated At:</strong> {new Date(payoutResponse?.updatedAt || '').toLocaleString()}</p>
        
        {/* Show additional fiat payout details if available */}
        {payoutResponse?.payouts?.[0]?.details?.type === 'fiat' && (
          <div className="fiat-payout-details">
            <h3>Fiat Payout Details</h3>
            <p><strong>Fiat Rail Code:</strong> {payoutResponse?.payouts?.[0]?.details?.fiatAndRailCode}</p>
            {payoutResponse?.payouts?.[0]?.details?.fiatAmount && (
              <p>
                <strong>Fiat Amount:</strong> 
                {payoutResponse?.payouts?.[0]?.details?.fiatAmount.fiatAmount?.toLocaleString()} {payoutResponse?.payouts?.[0]?.details?.fiatAmount.fiatCurrencyCode}
              </p>
            )}
            {payoutResponse?.payouts?.[0]?.details?.exchangeRate && (
              <p><strong>Exchange Rate:</strong> {payoutResponse?.payouts?.[0]?.details?.exchangeRate}</p>
            )}
            {payoutResponse?.payouts?.[0]?.details?.transactionFee && (
              <p>
                <strong>Transaction Fee:</strong> 
                {payoutResponse?.payouts?.[0]?.details?.transactionFee.tokenAmount} {payoutResponse?.payouts?.[0]?.details?.transactionFee.tokenSymbol}
              </p>
            )}
            {payoutResponse?.payouts?.[0]?.details?.feeTotal && (
              <p>
                <strong>Total Fee:</strong> 
                {payoutResponse?.payouts?.[0]?.details?.feeTotal.tokenAmount} {payoutResponse?.payouts?.[0]?.details?.feeTotal.tokenSymbol}
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="execution-status">
        {executionStatus === 'executing' && (
          <p className="status-message executing">Executing payout request...</p>
        )}
        {executionStatus === 'success' && (
          <p className="status-message success">Payout successfully executed!</p>
        )}
        {executionStatus === 'error' && (
          <p className="status-message error">Failed to execute payout.</p>
        )}
      </div>
      
      <div className="payout-actions">
        {payoutResponse?.status === 'AWAITING_EXECUTION' && (
          <button 
            onClick={handleExecutePayout}
            className="action-btn primary"
            disabled={executionStatus === 'executing'}
          >
            {executionStatus === 'executing' ? 'Executing...' : 'Execute Payout'}
          </button>
        )}
        
        <button 
          onClick={() => navigateTo('CREATE_BLOCKCHAIN_PAYOUT')}
          className="back-btn"
          disabled={executionStatus === 'executing'}
        >
          Create New Payout
        </button>
        
        <button 
          onClick={() => navigateTo('WELCOME')}
          className="action-btn secondary"
          disabled={executionStatus === 'executing'}
        >
          Back to Account
        </button>
      </div>
      
      {payoutError && <p className="error-message">Error: {payoutError}</p>}
    </section>
  );

  // Render the current view based on application state
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Mural Pay App</h1>
      </header>
      
      <main className="app-content">
        {currentView === 'WELCOME' && renderWelcome()}
        {currentView === 'CREATE_BLOCKCHAIN_PAYOUT' && renderBlockchainPayoutForm()}
        {currentView === 'VIEW_PAYOUT' && renderViewPayout()}
      </main>
      
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Mural Pay App</p>
      </footer>
    </div>
  )
}

export default App
