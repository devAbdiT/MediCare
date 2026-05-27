// lib/chapa.ts

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_INITIALIZE_URL = "https://api.chapa.co/v1/transaction/initialize";
const CHAPA_VERIFY_URL = "https://api.chapa.co/v1/transaction/verify";

export interface ChapaInitializeInput {
  amount: number;
  currency?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tx_ref: string;
  callback_url?: string;
  return_url?: string;
  customization?: {
    title: string;
    description: string;
  };
}

export async function initializeChapaPayment(input: ChapaInitializeInput) {
  if (!CHAPA_SECRET_KEY) {
    throw new Error("CHAPA_SECRET_KEY is not set in environment variables");
  }

  const payload = {
    amount: input.amount.toString(),
    currency: input.currency || "ETB",
    email: input.email,
    first_name: input.first_name,
    last_name: input.last_name,
    phone_number: input.phone_number,
    tx_ref: input.tx_ref,
    callback_url: input.callback_url,
    return_url: input.return_url,
    customization: input.customization,
  };

  const response = await fetch(CHAPA_INITIALIZE_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CHAPA_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  
  if (!response.ok || data.status !== "success") {
    const errorMsg = typeof data.message === "object" ? JSON.stringify(data.message) : (data.message || response.statusText);
    throw new Error(`Chapa Initialization Failed: ${errorMsg}. Full response: ${JSON.stringify(data)}`);
  }

  return data;
}

export async function verifyChapaPayment(tx_ref: string) {
  if (!CHAPA_SECRET_KEY) {
    throw new Error("CHAPA_SECRET_KEY is not set in environment variables");
  }

  const response = await fetch(`${CHAPA_VERIFY_URL}/${tx_ref}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${CHAPA_SECRET_KEY}`,
    },
  });

  const data = await response.json();
  return data;
}
