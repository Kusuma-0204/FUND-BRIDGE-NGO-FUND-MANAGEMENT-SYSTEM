export type UserRole = 'Administrator' | 'Donor Member' | 'Volunteer Staff' | 'Beneficiary Partner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  kycVerified: boolean;
  phone?: string;
  bio?: string;
  memberSince?: string;
  auditsApproved?: number;
  password?: string;
}

export interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  cause: string;
  amount: number;
  method: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Refunded';
  receiptNumber: string;
  isAnonymous: boolean;
}

export interface Expense {
  id: string;
  title: string;
  vendor: string;
  category: string;
  amount: number;
  date: string;
  auditedBy: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface Message {
  id: string;
  senderName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
  replies?: { text: string; date: string; author: string }[];
}

export interface FundRequest {
  id: string;
  applicantName: string;
  org: string;
  category: string;
  urgency: 'Normal' | 'Urgent' | 'Emergency';
  amount: number;
  purpose: string;
  date: string;
  status: 'Under Review' | 'Field Audited' | 'Disbursed' | 'Declined';
  remarks?: string;
}

export interface ResetToken {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export interface SystemSettings {
  ngoName: string;
  regNumber: string;
  tax80G: string;
  currency: string;
  upiId: string;
  upiGatewayEnabled: boolean;
  cardGatewayEnabled: boolean;
  autoInvoicing: boolean;
}
