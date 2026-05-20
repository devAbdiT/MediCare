export function formatPhoneNumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 0 (e.g., 0912345678)
  if (cleaned.startsWith('0')) {
    cleaned = '+251' + cleaned.slice(1);
  }
  // If starts with 251 (e.g., 251912345678)
  else if (cleaned.startsWith('251')) {
    cleaned = '+' + cleaned;
  }
  // If already starts with +251, keep as is
  else if (!cleaned.startsWith('+251')) {
    throw new Error('Invalid phone number format');
  }
  
  // Validate final format: +251 followed by 9 digits (starting with 7 or 9)
  const phoneRegex = /^\+251[79]\d{8}$/;
  if (!phoneRegex.test(cleaned)) {
    throw new Error('Phone number must be valid Ethiopian number');
  }
  
  return cleaned;
}
