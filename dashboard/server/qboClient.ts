export interface QBOStoreMetrics {
  storeExternalId: string;
  expenses: number;
}

export interface QBOSyncResult {
  startDate: string;
  endDate: string;
  stores: QBOStoreMetrics[];
}

interface ProfitAndLoss {
  Header: { StartPeriod: string; EndPeriod: string };
  Rows: {
    Row: Array<{
      type: string;
      group?: string;
      ColData?: Array<{ value: string }>;
      Rows?: { Row: Array<{ ColData: Array<{ value: string }> }> };
      Summary?: { ColData: Array<{ value: string }> };
    }>;
  };
  Columns?: {
    Column: Array<{ ColTitle?: string; MetaData?: Array<{ Name: string; Value: string }> }>;
  };
}

export class QuickBooksClient {
  private baseUrl = "https://quickbooks.api.intuit.com/v3";

  constructor(
    private accessToken: string,
    private realmId: string
  ) {}

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}/company/${this.realmId}${path}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`QuickBooks API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async validate(): Promise<boolean> {
    try {
      await this.request<unknown>("/query?query=SELECT * FROM CompanyInfo");
      return true;
    } catch {
      return false;
    }
  }

  async getStoreMetrics(startDate: string, endDate: string): Promise<QBOSyncResult> {
    const data = await this.request<ProfitAndLoss>(
      `/reports/ProfitAndLossByClass?start_date=${startDate}&end_date=${endDate}&accounting_method=Accrual`
    );

    const cols = data.Columns?.Column ?? [];
    const colMap: Record<number, string> = {};
    cols.forEach((c, i) => {
      colMap[i] = c.ColTitle ?? "";
    });

    const groupValues: Record<string, Record<string, number>> = {};
    for (const row of data.Rows?.Row ?? []) {
      if (!row.group || !row.Summary?.ColData) continue;
      groupValues[row.group] = {};
      row.Summary.ColData.forEach((cell, i) => {
        const colName = colMap[i] ?? "";
        groupValues[row.group!]![colName] = parseFloat(cell.value) || 0;
      });
    }

    // Class names in QBO should match pattern like "PC 80237" or "SE 60039"
    // If your QBO classes are named differently, update this pattern
    const storeClassPattern = /(?:PC|SE)\s+(\d+)/;
    const stores: QBOStoreMetrics[] = [];

    for (const [, colName] of Object.entries(colMap)) {
      const match = colName.match(storeClassPattern);
      if (!match) continue;
      const externalId = match[1]!;
      const get = (group: string) => groupValues[group]?.[colName] ?? 0;
      stores.push({
        storeExternalId: externalId,
        expenses: get("Expenses"),
      });
    }

    return { startDate, endDate, stores };
  }
}
