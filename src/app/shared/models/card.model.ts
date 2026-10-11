export interface PaymentCardPayload {
  bankName?: string;
  cardNickname: string;
  cardholderName: string;
  cardNumber: string; // 13-19 digits
  expiryMonth: string; // MM (01-12)
  expiryYear: string; // YYYY (e.g. 2028)
  cvv: string; // 3-4 digits
  pin?: string; // 4-6 digits
  notes?: string;
  cardImageUrl?: string; // Optional custom card face image URL
}
