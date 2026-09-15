export function offerUnavailableMessage(reason: string): string {
  if (reason === 'available') return 'Launch pricing is shown in INR. Your price is locked for your first 3 months.';
  switch (reason) {
    case 'purchased': return 'Your first-purchase offer has been used. Regular pricing applies to additional purchases.';
    case 'trial': return 'Trial accounts qualify for the same 24-hour purchase offer.';
    case 'expired': return 'Your 24-hour offer has ended. Regular pricing now applies.';
    case 'unavailable': return 'We could not check your offer. Please refresh the page before continuing.';
    case 'signup_required': return 'Sign up or sign in to check your welcome offer.';
    default: return 'Your final price is shown before payment.';
  }
}
