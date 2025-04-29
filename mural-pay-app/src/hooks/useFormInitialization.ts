import { useEffect, useMemo } from 'react';

/**
 * Custom hook for form initialization with Colombian payout default values
 */
export function useFormInitialization(currentView: string) {
  // Default values for the Colombian fiat payout
  const defaultCopFiatValues = useMemo(() => ({
    // Fiat payment details
    bankName: "Bancamia S.A.",
    bankAccountOwner: "test",
    accountType: "CHECKING",
    phoneNumber: "+57 601 555 5555",
    bankAccountNumber: "1234567890123456",
    documentNumber: "1234563",
    documentType: "NATIONAL_ID",
    
    // Recipient details
    firstName: "Javier",
    lastName: "Gomez",
    email: "jgomez@gmail.com",
    dateOfBirth: "1980-02-22",
    
    // Address details
    street: "Cra. 37 #10A 29",
    city: "Medellin",
    state: "Antioquia",
    postalCode: "050015",
    country: "CO"
  }), []);

  // Initialize form values when the view changes to payout creation
  useEffect(() => {
    // Only initialize defaults when switching to the payout creation view
    if (currentView === 'CREATE_BLOCKCHAIN_PAYOUT') {
      // Use setTimeout to ensure the DOM is ready before setting form field values
      setTimeout(() => {
        // Set form field defaults for Colombian payout
        Object.entries(defaultCopFiatValues).forEach(([key, value]) => {
          const element = document.getElementById(key) as HTMLInputElement | HTMLSelectElement;
          if (element) {
            element.value = String(value);
          }
        });
        
        // Make sure address fields are initialized
        const addressFields = ['street', 'city', 'state', 'postalCode', 'country'];
        addressFields.forEach(field => {
          const element = document.getElementById(field) as HTMLInputElement;
          if (element) {
            // Type assertion to avoid TypeScript error
            const values = defaultCopFiatValues as Record<string, string>;
            if (values[field]) {
              element.value = values[field];
            }
          }
        });
      }, 100);
    }
  }, [currentView, defaultCopFiatValues]);

  // Function to extract all form data
  const extractFormData = () => {
    const formData: Record<string, string> = {};
    
    // Extract all form fields
    Object.keys(defaultCopFiatValues).forEach(key => {
      const element = document.getElementById(key) as HTMLInputElement | HTMLSelectElement;
      if (element) {
        formData[key] = element.value;
      }
    });
    
    // Get additional fields that might not be in defaultCopFiatValues
    const individualEmail = document.getElementById('individualEmail') as HTMLInputElement;
    const businessEmail = document.getElementById('businessEmail') as HTMLInputElement;
    const businessName = document.getElementById('businessName') as HTMLInputElement;
    
    if (individualEmail) formData.email = individualEmail.value;
    else if (businessEmail) formData.email = businessEmail.value;
    
    if (businessName) formData.businessName = businessName.value;
    
    return formData;
  };

  return {
    defaultCopFiatValues,
    extractFormData
  };
}
