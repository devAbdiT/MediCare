/**
 * Validates an Ethiopian phone number.
 *
 * Valid formats:
 *   +2519XXXXXXXX  (12 chars: +2519 + 8 digits)
 *   +2517XXXXXXXX  (12 chars: +2517 + 8 digits)
 *   09XXXXXXXX     (10 chars: 09 + 8 digits)
 *   07XXXXXXXX     (10 chars: 07 + 8 digits)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  if (cleaned.startsWith("+2519")) {
    return /^\+2519\d{8}$/.test(cleaned); // +2519 + exactly 8 digits
  }
  if (cleaned.startsWith("+2517")) {
    return /^\+2517\d{8}$/.test(cleaned); // +2517 + exactly 8 digits
  }
  if (cleaned.startsWith("09")) {
    return /^09\d{8}$/.test(cleaned); // 09 + exactly 8 digits
  }
  if (cleaned.startsWith("07")) {
    return /^07\d{8}$/.test(cleaned); // 07 + exactly 8 digits
  }

  return false;
}

/**
 * Formats a valid Ethiopian phone number to the +251XXXXXXXXX format.
 * Throws an error if the phone number is invalid.
 */
export function formatPhoneNumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  if (!validatePhoneNumber(cleaned)) {
    throw new Error(
      "Phone number must be a valid Ethiopian number (+2519/+2517 or 09/07 followed by exactly 8 digits)"
    );
  }

  // Normalize 09/07 → +2519/+2517
  if (cleaned.startsWith("09") || cleaned.startsWith("07")) {
    return "+251" + cleaned.slice(1);
  }

  return cleaned;
}
