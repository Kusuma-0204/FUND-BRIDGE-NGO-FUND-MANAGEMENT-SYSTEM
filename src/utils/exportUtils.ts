import { Donation, Expense, FundRequest, SystemSettings } from '../types';

/**
 * Escapes and formats a field for CSV compliance (RFC 4180).
 * Handles quotes, commas, newlines, and nulls.
 */
function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // If string contains quotes, commas, or line breaks, enclose in quotes and double internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Initiates a browser download of text data as a file.
 * Includes UTF-8 BOM (\uFEFF) for full Excel and international character compatibility.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;'): boolean {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // Safe cleanup
      }
    }, 200);
    return true;
  } catch (err) {
    console.error('Failed to trigger file download:', err);
    return false;
  }
}

/**
 * Exports donations list to CSV.
 */
export function exportDonationsToCSV(donations: Donation[], customFilename?: string): boolean {
  const headers = [
    'Donation ID',
    'Donor Name',
    'Donor Email',
    'Is Anonymous',
    'Amount (INR / ₹)',
    'Payment Method',
    'Cause / Program',
    'Receipt Number',
    'Date',
    'Status'
  ];

  const rows = donations.map((d) => [
    escapeCsvValue(d.id),
    escapeCsvValue(d.isAnonymous ? 'Anonymous' : d.donorName),
    escapeCsvValue(d.donorEmail),
    escapeCsvValue(d.isAnonymous ? 'Yes' : 'No'),
    escapeCsvValue(d.amount),
    escapeCsvValue(d.method),
    escapeCsvValue(d.cause),
    escapeCsvValue(d.receiptNumber),
    escapeCsvValue(d.date),
    escapeCsvValue(d.status)
  ]);

  const csvContent = '\uFEFF' + [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  const filename = customFilename || `fundbridge-donations-${today}.csv`;

  return downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports program expenses list to CSV.
 */
export function exportExpensesToCSV(expenses: Expense[], customFilename?: string): boolean {
  const headers = [
    'Claim ID',
    'Title',
    'Vendor / Payee',
    'Program Category',
    'Amount (INR / ₹)',
    'Date',
    'Audited By',
    'Status'
  ];

  const rows = expenses.map((e) => [
    escapeCsvValue(e.id),
    escapeCsvValue(e.title),
    escapeCsvValue(e.vendor),
    escapeCsvValue(e.category),
    escapeCsvValue(e.amount),
    escapeCsvValue(e.date),
    escapeCsvValue(e.auditedBy),
    escapeCsvValue(e.status)
  ]);

  const csvContent = '\uFEFF' + [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  const filename = customFilename || `fundbridge-expenses-${today}.csv`;

  return downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports aid and grant applications to CSV.
 */
export function exportRequestsToCSV(requests: FundRequest[], customFilename?: string): boolean {
  const headers = [
    'Application ID',
    'Applicant Name',
    'Organization',
    'Category',
    'Urgency Level',
    'Requested Amount (INR / ₹)',
    'Application Date',
    'Status',
    'Purpose / Justification',
    'Audit Remarks'
  ];

  const rows = requests.map((r) => [
    escapeCsvValue(r.id),
    escapeCsvValue(r.applicantName),
    escapeCsvValue(r.org),
    escapeCsvValue(r.category),
    escapeCsvValue(r.urgency),
    escapeCsvValue(r.amount),
    escapeCsvValue(r.date),
    escapeCsvValue(r.status),
    escapeCsvValue(r.purpose),
    escapeCsvValue(r.remarks)
  ]);

  const csvContent = '\uFEFF' + [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  const filename = customFilename || `fundbridge-aid-requests-${today}.csv`;

  return downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports unified financial check ledger (donations + expenses + disbursed aid) to CSV.
 */
export function exportCombinedFinancialLedgerCSV(
  donations: Donation[], 
  expenses: Expense[], 
  requests: FundRequest[], 
  customFilename?: string
): boolean {
  const transactions: {
    id: string;
    date: string;
    type: 'Donation Inflow' | 'Program Expense' | 'Aid Grant Disbursed';
    party: string;
    category: string;
    ref: string;
    inflow: number;
    outflow: number;
    status: string;
  }[] = [];

  // Add all donations
  for (const d of donations) {
    transactions.push({
      id: d.id,
      date: d.date,
      type: 'Donation Inflow',
      party: d.isAnonymous ? 'Anonymous Donor' : d.donorName,
      category: d.cause,
      ref: d.receiptNumber,
      inflow: d.amount,
      outflow: 0,
      status: d.status
    });
  }

  // Add all expenses
  for (const e of expenses) {
    transactions.push({
      id: e.id,
      date: e.date,
      type: 'Program Expense',
      party: e.vendor || 'Program Supplier',
      category: e.category,
      ref: e.id,
      inflow: 0,
      outflow: e.amount,
      status: e.status
    });
  }

  // Add all disbursed requests
  for (const r of requests) {
    if (r.status === 'Disbursed') {
      transactions.push({
        id: r.id,
        date: r.date,
        type: 'Aid Grant Disbursed',
        party: `${r.applicantName} (${r.org || 'Beneficiary'})`,
        category: r.category,
        ref: r.id,
        inflow: 0,
        outflow: r.amount,
        status: 'Disbursed'
      });
    }
  }

  // Sort ascending by date for chronological financial check
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const rows = transactions.map(t => {
    runningBalance += (t.inflow - t.outflow);
    return [
      escapeCsvValue(t.id),
      escapeCsvValue(t.date),
      escapeCsvValue(t.type),
      escapeCsvValue(t.category),
      escapeCsvValue(t.party),
      escapeCsvValue(t.ref),
      escapeCsvValue(t.inflow > 0 ? t.inflow : 0),
      escapeCsvValue(t.outflow > 0 ? t.outflow : 0),
      escapeCsvValue(runningBalance),
      escapeCsvValue(t.status)
    ];
  });

  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Category / Cause',
    'Party / Beneficiary',
    'Reference / Receipt #',
    'Inflow Amount (INR / ₹)',
    'Outflow Amount (INR / ₹)',
    'Running Treasury Balance (INR / ₹)',
    'Audit Status'
  ];

  const csvContent = '\uFEFF' + [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const today = new Date().toISOString().split('T')[0];
  const filename = customFilename || `fundbridge-financial-audit-ledger-${today}.csv`;

  return downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports complete portal database backup to a formatted JSON file.
 */
export function exportDatabaseBackupJSON(data: {
  donations: Donation[];
  expenses: Expense[];
  requests: FundRequest[];
  settings?: SystemSettings;
}, customFilename?: string): boolean {
  const backupObject = {
    exportedAt: new Date().toISOString(),
    system: 'Fund Bridge Transparency Portal',
    version: '2.4.0',
    recordCounts: {
      donations: data.donations.length,
      expenses: data.expenses.length,
      requests: data.requests.length
    },
    donations: data.donations,
    expenses: data.expenses,
    requests: data.requests,
    settings: data.settings
  };

  const jsonString = JSON.stringify(backupObject, null, 2);
  const today = new Date().toISOString().split('T')[0];
  const filename = customFilename || `fundbridge-backup-${today}.json`;

  return downloadFile(jsonString, filename, 'application/json;charset=utf-8;');
}
