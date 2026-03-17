export interface ScenarioTemplate {
  id: string;
  name: string;
  description?: string | null;
  baseTax: string; // decimal string (ex: "0.04")
  inflation: string; // decimal string (ex: "0.04")
  realEstateRate: string; // decimal string (ex: "0.05")
  successionTax: string; // decimal string (ex: "0.15")
  createdAt: string;
  updatedAt: string;
}

