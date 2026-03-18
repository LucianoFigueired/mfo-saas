export interface Product {
  id: string;
  name: string;
  provider?: string | null;
  category?: string | null;
  description?: string | null;
  returnRate: string; // decimal string (ex: "0.12")
  createdAt: string;
  updatedAt: string;
}

