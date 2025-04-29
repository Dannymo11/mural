import { useState } from 'react'
import './App.css'
import { 
  createAccount, Account, 
  PayoutRequest, createPayoutRequest, executePayoutRequest
} from './api/muralPay.ts';

// Define the application views
type AppView = 'CREATE_ACCOUNT' | 'WELCOME' | 'CREATE_BLOCKCHAIN_PAYOUT' | 'VIEW_PAYOUT';

function App() {
  // View state management
  const [currentView, setCurrentView] = useState<AppView>('CREATE_ACCOUNT');
  
  // Account state
  const [acctName, setAcctName] = useState('');
  const [acctResponse, setAcctResponse] = useState<Account | null>(null);
  const [acctError, setAcctError] = useState<string | null>(null);
  
  // Application state for creating payouts
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutCurrency, setPayoutCurrency] = useState('USDC');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [payoutMemo, setPayoutMemo] = useState('');
  const [blockchain, setBlockchain] = useState('ETHEREUM');
  const [recipientType, setRecipientType] = useState<'individual' | 'business'>('individual');
  const [payoutResponse, setPayoutResponse] = useState<PayoutRequest | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  
  // Handle account creation submit
  const handleCreateAcct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcctError(null);
    try {
      const acct = await createAccount({ 
        name: acctName
      });
      setAcctResponse(acct);
      // Transition to welcome view on success
      setCurrentView('WELCOME');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAcctError(err.message);
      } else {
        setAcctError(String(err));
      }
    }
  }
  
  // Handle payout request creation
  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    
    if (!acctResponse) {
      setPayoutError('No account available to create payout');
      return;
    }
    
    try {
      const amount = parseFloat(payoutAmount);
      if (isNaN(amount) || amount <= 0) {
        setPayoutError('Please enter a valid positive amount');
        return;
      }
      
      // Get form values
      const firstName = (document.getElementById('firstName') as HTMLInputElement)?.value || '';
      const lastName = (document.getElementById('lastName') as HTMLInputElement)?.value || '';
      const emailValue = (document.getElementById('individualEmail') as HTMLInputElement)?.value || 
                      (document.getElementById('businessEmail') as HTMLInputElement)?.value || '';
      const dateOfBirthValue = (document.getElementById('dateOfBirth') as HTMLInputElement)?.value || '';
      const businessNameValue = (document.getElementById('businessName') as HTMLInputElement)?.value || '';
      
      // Get address form values - these are the same IDs for both individual and business
      const street = (document.getElementById('street') as HTMLInputElement)?.value || '';
      const city = (document.getElementById('city') as HTMLInputElement)?.value || '';
      const state = (document.getElementById('state') as HTMLInputElement)?.value || '';
      const postalCode = (document.getElementById('postalCode') as HTMLInputElement)?.value || '';
      const country = (document.getElementById('country') as HTMLInputElement)?.value || '';
      
      // Build payload according to the API example format
      const payloadData = {
        sourceAccountId: acctResponse.id,
        payouts: [
          {
            amount: {
              tokenAmount: amount,
              tokenSymbol: payoutCurrency
            },
            payoutDetails: {
              type: blockchain.toLowerCase() === 'ethereum' ? 'blockchain' : 'blockchain',
              ...(blockchain.toLowerCase() === 'ethereum' ? {
                // Blockchain specific details for Ethereum
                walletAddress: recipientAddress,
                blockchain: blockchain.toLowerCase()
              } : {
                // Other blockchain details
                walletAddress: recipientAddress,
                blockchain: blockchain.toLowerCase()
              })
            },
            recipientInfo: recipientType === 'individual' 
              ? {
                  type: 'individual',
                  firstName: firstName,
                  lastName: lastName,
                  email: emailValue,
                  dateOfBirth: dateOfBirthValue,
                  physicalAddress: {
                    address1: street,
                    country: country,
                    state: state,
                    city: city,
                    zip: postalCode
                  }
                }
              : {
                  type: 'business',
                  firstName: businessNameValue, // Using businessName as firstName for business
                  lastName: '',
                  email: emailValue,
                  physicalAddress: {
                    address1: street,
                    country: country,
                    state: state,
                    city: city,
                    zip: postalCode
                  }
                }
          }
        ],
        memo: payoutMemo || undefined
      };
      
      // Log the payload for debugging
      console.log('Payout request payload:', JSON.stringify(payloadData, null, 2));
      
      const payout = await createPayoutRequest(payloadData);
      
      // Store the response and move to the payout view
      setPayoutResponse(payout);
      navigateTo('VIEW_PAYOUT');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPayoutError(err.message);
      } else {
        setPayoutError(String(err));
      }
    }
  };
  
  // Handle payout execution
  const handleExecutePayout = async () => {
    if (!payoutResponse) return;
    
    setPayoutError(null);
    try {
      const executedPayout = await executePayoutRequest(payoutResponse.id);
      setPayoutResponse(executedPayout);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPayoutError(err.message);
      } else {
        setPayoutError(String(err));
      }
    }
  }
  
  // Reset forms and navigate between views
  const navigateTo = (view: AppView) => {
    if (view === 'CREATE_ACCOUNT') {
      setAcctError(null);
    } else if (view === 'CREATE_BLOCKCHAIN_PAYOUT') {
      setPayoutError(null);
      // Reset payout form
      setPayoutAmount('');
      setPayoutCurrency('USDC');
      setRecipientAddress('');
      setPayoutMemo('');
      setRecipientType('individual');
    }
    setCurrentView(view);
  };

  // Render the account creation view
  const renderAccountCreation = () => (
    <section className="form-container">
      <h2>Create Mural Pay Account</h2>
      <form onSubmit={handleCreateAcct}>
        <div className="form-group">
          <label htmlFor="acctName">Account Name</label>
          <input
            id="acctName"
            type="text"
            placeholder="Enter account name"
            value={acctName}
            onChange={e => setAcctName(e.target.value)}
            required
            className="form-input"
          />
        </div>
        <button type="submit" className="submit-btn">Create Account</button>
      </form>
      {acctError && <p className="error-message">Error: {acctError}</p>}
    </section>
  );
  
  // Render the welcome screen after account creation
  const renderWelcome = () => (
    <section className="welcome-container">
      <h2>Welcome to Mural Pay!</h2>
      
      {acctResponse && (
        <div className="account-details">
          <p><strong>Account ID:</strong> {acctResponse.id}</p>
          <p><strong>Name:</strong> {acctResponse.name}</p>
          <p><strong>Balance:</strong> {acctResponse.balance} {acctResponse.currency}</p>
          <p><strong>Status:</strong> {acctResponse.status}</p>
          <p><strong>Created At:</strong> {new Date(acctResponse.createdAt).toLocaleString()}</p>
        </div>
      )}
      
      <div className="welcome-actions">
        <h3>Create a New Payment</h3>
        <p>Send payments securely on the blockchain</p>
        
        <div className="payment-options">
          <button 
            onClick={() => navigateTo('CREATE_BLOCKCHAIN_PAYOUT')}
            className="primary-btn"
          >
            <span className="payment-icon crypto">₿</span>
            Create Blockchain Payment
          </button>
        </div>
      </div>
    </section>
  );
  
  // Render the blockchain payout creation form
  const renderBlockchainPayoutForm = () => {
    return (
      <section className="form-container">
        <h2>Create Blockchain Payout</h2>
        <p className="account-info">Account: {acctResponse?.name} ({acctResponse?.id})</p>
        
        <form onSubmit={handleCreatePayout}>
          {/* Payment Details Section */}
          <h3 className="form-section-title">Payment Details</h3>
          <div className="form-group">
            <label htmlFor="payoutAmount">Amount</label>
            <input
              id="payoutAmount"
              type="number"
              step="0.001"
              placeholder="Enter amount"
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
              <option value="ETH">Ethereum (ETH)</option>
              <option value="USDT">Tether (USDT)</option>
              <option value="DAI">Dai (DAI)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="blockchain">Blockchain</label>
            <select
              id="blockchain"
              value={blockchain}
              onChange={e => setBlockchain(e.target.value)}
              className="form-select"
              required
            >
              <option value="ETHEREUM">Ethereum</option>
              <option value="POLYGON">Polygon</option>
              <option value="BASE">Base</option>
              <option value="CELO">Celo</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="recipientAddress">Wallet Address</label>
            <input
              id="recipientAddress"
              type="text"
              placeholder="Enter recipient's wallet address"
              value={recipientAddress}
              onChange={e => setRecipientAddress(e.target.value)}
              required
              className="form-input"
            />
          </div>
          
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
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  id="dateOfBirth"
                  type="date"
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
              value={payoutMemo}
              onChange={e => setPayoutMemo(e.target.value)}
              className="form-textarea"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigateTo('WELCOME')}
              className="back-btn"
            >
              Back
            </button>
            <button type="submit" className="submit-btn">Create Blockchain Payout</button>
          </div>
        </form>
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
        <p><strong>Amount:</strong> {payoutResponse?.payouts?.[0]?.amount?.tokenAmount} {payoutResponse?.payouts?.[0]?.amount?.tokenSymbol}</p>
        <p><strong>Status:</strong> {payoutResponse?.status}</p>
      </div>
      
      <div className="payout-actions">
        {payoutResponse?.status === 'PENDING' && (
          <button 
            onClick={handleExecutePayout}
            className="action-btn primary"
          >
            Execute Payout
          </button>
        )}
        
        <button 
          onClick={() => navigateTo('CREATE_BLOCKCHAIN_PAYOUT')}
          className="back-btn"
        >
          Back to Payout Form
        </button>
        
        <button 
          onClick={() => navigateTo('WELCOME')}
          className="action-btn secondary"
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
        {currentView === 'CREATE_ACCOUNT' && renderAccountCreation()}
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
