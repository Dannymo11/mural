import { useState } from 'react'
import './App.css'
import { 
  createAccount, Account, 
  PayoutRequest, createPayoutRequest, executePayoutRequest
} from './api/muralPay.ts';

// Define the application views
type AppView = 'CREATE_ACCOUNT' | 'WELCOME' | 'CREATE_PAYOUT' | 'VIEW_PAYOUT';

function App() {
  // View state management
  const [currentView, setCurrentView] = useState<AppView>('CREATE_ACCOUNT');
  
  // Account state
  const [acctName, setAcctName] = useState('');
  const [acctResponse, setAcctResponse] = useState<Account | null>(null);
  const [acctError, setAcctError] = useState<string | null>(null);
  
  // Payout state
  const [payoutAmount, setPayoutAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [payoutCurrency, setPayoutCurrency] = useState('EUR');
  const [payoutMemo, setPayoutMemo] = useState('');
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
      
      const payout = await createPayoutRequest({
        account_id: acctResponse.id,
        amount: amount,
        currency: payoutCurrency,
        recipients: [{
          amount: amount,
          address: recipientAddress
        }],
        memo: payoutMemo || undefined
      });
      
      setPayoutResponse(payout);
      setCurrentView('VIEW_PAYOUT');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPayoutError(err.message);
      } else {
        setPayoutError(String(err));
      }
    }
  }
  
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
    // Reset form-specific errors when changing views
    if (view === 'CREATE_ACCOUNT') setAcctError(null);
    if (view === 'CREATE_PAYOUT') setPayoutError(null);
    
    setCurrentView(view);
  }

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
  
  // Render the welcome view after account creation
  const renderWelcome = () => (
    <section className="welcome-container">
      <h2>Welcome to Mural Pay!</h2>
      <div className="account-details">
        <h3>Your Account Has Been Created</h3>
        <p><strong>Account ID:</strong> {acctResponse?.id}</p>
        <p><strong>Name:</strong> {acctResponse?.name}</p>
        <p><strong>Status:</strong> {acctResponse?.status}</p>
        <p><strong>API Enabled:</strong> {acctResponse?.isApiEnabled ? 'Yes' : 'No'}</p>
        <p><strong>Balance:</strong> {acctResponse?.balance} {acctResponse?.currency}</p>
        <p><strong>Created At:</strong> {new Date(acctResponse?.createdAt || '').toLocaleString()}</p>
      </div>
      
      <div className="welcome-actions">
        <button 
          onClick={() => navigateTo('CREATE_PAYOUT')} 
          className="action-btn primary"
        >
          Create a Payout Request
        </button>
      </div>
    </section>
  );
  
  // Render the payout creation form
  const renderCreatePayout = () => (
    <section className="form-container">
      <h2>Create Payout Request</h2>
      <p className="account-info">Account: {acctResponse?.name} ({acctResponse?.id})</p>
      
      <form onSubmit={handleCreatePayout}>
        <div className="form-group">
          <label htmlFor="payoutAmount">Amount</label>
          <input
            id="payoutAmount"
            type="number"
            step="0.01"
            placeholder="Enter amount"
            value={payoutAmount}
            onChange={e => setPayoutAmount(e.target.value)}
            required
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="payoutCurrency">Currency</label>
          <select
            id="payoutCurrency"
            value={payoutCurrency}
            onChange={e => setPayoutCurrency(e.target.value)}
            className="form-select"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="recipientAddress">Recipient Address</label>
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
          <button type="submit" className="submit-btn">Create Payout Request</button>
        </div>
      </form>
      {payoutError && <p className="error-message">Error: {payoutError}</p>}
    </section>
  );
  
  // Render the payout details and execution view
  const renderViewPayout = () => (
    <section className="payout-details-container">
      <h2>Payout Request Details</h2>
      
      <div className="payout-details">
        <p><strong>Payout ID:</strong> {payoutResponse?.id}</p>
        <p><strong>Account ID:</strong> {payoutResponse?.account_id}</p>
        <p><strong>Amount:</strong> {payoutResponse?.amount} {payoutResponse?.currency}</p>
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
          onClick={() => navigateTo('CREATE_PAYOUT')}
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
        {currentView === 'CREATE_PAYOUT' && renderCreatePayout()}
        {currentView === 'VIEW_PAYOUT' && renderViewPayout()}
      </main>
      
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Mural Pay App</p>
      </footer>
    </div>
  )
}

export default App
