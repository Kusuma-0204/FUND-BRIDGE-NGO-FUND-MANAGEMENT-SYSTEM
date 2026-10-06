import mysql, { Pool } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const STORAGE_FILE_PATH = path.resolve(process.cwd(), 'database', 'storage.json');

export interface DBUser {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  kyc_verified: number;
  status: 'active' | 'suspended' | 'pending';
  member_since: string;
  audits_approved: number;
  created_at?: string;
  updated_at?: string;
}

export interface DBDonation {
  id: string;
  donor_id?: string | null;
  donor_name: string;
  donor_email: string;
  amount: number;
  category: string;
  payment_method: string;
  payment_reference?: string;
  tax_exemption_80g: number;
  is_anonymous: number;
  status: 'Completed' | 'Pending' | 'Failed';
  donation_date: string;
  notes?: string;
  created_at?: string;
}

export interface DBExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  vendor: string;
  expense_date: string;
  submitted_by?: string;
  audited_by: string;
  status: 'Verified & Paid' | 'Pending Audit' | 'Rejected';
  receipt_url?: string;
  notes?: string;
  created_at?: string;
}

export interface DBRequest {
  id: string;
  requester_id?: string | null;
  tracking_code: string;
  applicant_name: string;
  organization?: string;
  category: string;
  urgency: 'Normal' | 'Urgent' | 'Emergency';
  amount: number;
  purpose: string;
  status: 'Pending Review' | 'Field Verified' | 'Approved & Disbursed' | 'Rejected';
  reviewed_by?: string;
  audit_remarks?: string;
  created_at?: string;
}

export interface DBNotification {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at?: string;
}

export interface DBMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  phone?: string;
  subject: string;
  message: string;
  is_read: number;
  created_at?: string;
}

export interface DBOtp {
  id: number;
  email: string;
  otp_hash: string;
  expires_at: Date;
  attempts: number;
  used: number;
  created_at?: string;
}

export interface DBResetToken {
  id: number;
  email: string;
  token_hash: string;
  expires_at: Date;
  used: number;
  created_at?: string;
}

export interface DBAuditLog {
  id: number;
  user_id?: string | null;
  action: string;
  description: string;
  ip_address?: string;
  created_at: string;
}

// In-memory persistent database store initialized with seed records
class DataStore {
  users: DBUser[] = [];
  donations: DBDonation[] = [];
  expenses: DBExpense[] = [];
  requests: DBRequest[] = [];
  notifications: DBNotification[] = [];
  messages: DBMessage[] = [];
  otps: DBOtp[] = [];
  resetTokens: DBResetToken[] = [];
  auditLogs: DBAuditLog[] = [];
  otpIdCounter = 1;
  tokenIdCounter = 1;
  auditIdCounter = 1;

  constructor() {
    this.seed();
    this.loadFromDisk();
    this.enableAutoSave();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(STORAGE_FILE_PATH)) {
        const raw = fs.readFileSync(STORAGE_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.users = parsed.users.map((u: DBUser) => {
            if (u.id === 'user-admin' || u.email.toLowerCase() === 'admin@ngofunds.org') {
              return { ...u, email: 'aadminngo@gmail.com', role: 'Administrator' };
            }
            if (u.role === 'Administrator' && u.email.toLowerCase() !== 'aadminngo@gmail.com') {
              return { ...u, role: 'Donor Member' };
            }
            return u;
          });

          // Ensure aadminngo@gmail.com is present as Administrator
          const hasAdmin = this.users.some(u => u.email.toLowerCase() === 'aadminngo@gmail.com' && u.role === 'Administrator');
          if (!hasAdmin) {
            this.users.unshift({
              id: 'user-admin',
              full_name: 'Dr. Sarah Jenkins',
              email: 'aadminngo@gmail.com',
              password_hash: bcrypt.hashSync('password123', 10),
              role: 'Administrator',
              phone: '+1 (555) 019-2834',
              bio: 'Certified Public Accountant & Non-Profit Governance Director with 14 years field experience.',
              avatar: 'AN',
              kyc_verified: 1,
              status: 'active',
              member_since: '2021',
              audits_approved: 42,
              created_at: new Date().toISOString()
            });
          }
        }
        if (Array.isArray(parsed.donations)) this.donations = parsed.donations;
        if (Array.isArray(parsed.expenses)) this.expenses = parsed.expenses;
        if (Array.isArray(parsed.requests)) this.requests = parsed.requests;
        if (Array.isArray(parsed.notifications)) this.notifications = parsed.notifications;
        if (Array.isArray(parsed.messages)) this.messages = parsed.messages;
        if (Array.isArray(parsed.otps)) this.otps = parsed.otps;
        if (Array.isArray(parsed.resetTokens)) this.resetTokens = parsed.resetTokens;
        if (Array.isArray(parsed.auditLogs)) this.auditLogs = parsed.auditLogs;
        if (typeof parsed.otpIdCounter === 'number') this.otpIdCounter = parsed.otpIdCounter;
        if (typeof parsed.tokenIdCounter === 'number') this.tokenIdCounter = parsed.tokenIdCounter;
        if (typeof parsed.auditIdCounter === 'number') this.auditIdCounter = parsed.auditIdCounter;
      } else {
        this.saveToDisk();
      }
    } catch (err) {
      console.warn('[Database] Could not read storage.json, using default seed data.');
    }
  }

  saveToDisk() {
    try {
      const dir = path.dirname(STORAGE_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const payload = {
        users: this.users,
        donations: this.donations,
        expenses: this.expenses,
        requests: this.requests,
        notifications: this.notifications,
        messages: this.messages,
        otps: this.otps,
        resetTokens: this.resetTokens,
        auditLogs: this.auditLogs,
        otpIdCounter: this.otpIdCounter,
        tokenIdCounter: this.tokenIdCounter,
        auditIdCounter: this.auditIdCounter,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(STORAGE_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      // Ignore write errors in read-only environments
    }
  }

  enableAutoSave() {
    let lastSnapshot = '';
    setInterval(() => {
      try {
        const currentSnapshot = JSON.stringify({
          u: this.users,
          d: this.donations,
          e: this.expenses,
          r: this.requests,
          n: this.notifications,
          m: this.messages,
          o: this.otps,
          t: this.resetTokens
        });
        if (lastSnapshot && currentSnapshot !== lastSnapshot) {
          this.saveToDisk();
        }
        lastSnapshot = currentSnapshot;
      } catch {
        // Ignore serialization issues
      }
    }, 1500);
  }

  seed() {
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);

    this.users = [
      {
        id: 'user-admin',
        full_name: 'Dr. Sarah Jenkins',
        email: 'aadminngo@gmail.com',
        password_hash: defaultPasswordHash,
        role: 'Administrator',
        phone: '+1 (555) 019-2834',
        bio: 'Certified Public Accountant & Non-Profit Governance Director with 14 years field experience.',
        avatar: 'SJ',
        kyc_verified: 1,
        status: 'active',
        member_since: '2021',
        audits_approved: 42,
        created_at: new Date().toISOString()
      },
      {
        id: 'user-rgukt',
        full_name: 'University Member',
        email: 'o220786@rguktong.ac.in',
        password_hash: defaultPasswordHash,
        role: 'Donor Member',
        phone: '+91 91234 56789',
        bio: 'Student & Philanthropy Supporter at RGUKT.',
        avatar: 'UM',
        kyc_verified: 1,
        status: 'active',
        member_since: '2026',
        audits_approved: 5,
        created_at: new Date().toISOString()
      },
      {
        id: 'user-donor-1',
        full_name: 'Aarav Sharma',
        email: 'donor.aarav@example.com',
        password_hash: defaultPasswordHash,
        role: 'Donor Member',
        phone: '+1 (555) 728-1920',
        bio: 'Angel philanthropist & clean water access supporter.',
        avatar: 'AS',
        kyc_verified: 1,
        status: 'active',
        member_since: '2023',
        audits_approved: 12,
        created_at: new Date().toISOString()
      },
      {
        id: 'user-volunteer-1',
        full_name: 'Elena Rostova',
        email: 'volunteer.elena@example.org',
        password_hash: defaultPasswordHash,
        role: 'Volunteer Staff',
        phone: '+1 (555) 349-2018',
        bio: 'Emergency disaster response coordinator & medic.',
        avatar: 'ER',
        kyc_verified: 1,
        status: 'active',
        member_since: '2024',
        audits_approved: 28,
        created_at: new Date().toISOString()
      },
      {
        id: 'user-beneficiary-1',
        full_name: 'Sister Mary Teresa Clinic',
        email: 'partner.clinic@example.org',
        password_hash: defaultPasswordHash,
        role: 'Beneficiary Partner',
        phone: '+1 (555) 441-2911',
        bio: 'Rural pediatric healthcare dispensary.',
        avatar: 'SM',
        kyc_verified: 1,
        status: 'active',
        member_since: '2025',
        audits_approved: 4,
        created_at: new Date().toISOString()
      }
    ];

    this.donations = [
      {
        id: 'DON-2026-001',
        donor_id: 'user-donor-1',
        donor_name: 'Aarav Sharma',
        donor_email: 'donor.aarav@example.com',
        amount: 500,
        category: 'Healthcare Camps',
        payment_method: 'UPI / QR Code',
        payment_reference: 'UPI-TXN-984210',
        tax_exemption_80g: 1,
        is_anonymous: 0,
        status: 'Completed',
        donation_date: '2026-09-12',
        notes: 'Pediatric clinic supplies fund',
        created_at: new Date().toISOString()
      },
      {
        id: 'DON-2026-002',
        donor_id: null,
        donor_name: 'Global Health Trust',
        donor_email: 'donations@ghtrust.org',
        amount: 2500,
        category: 'Disaster Relief',
        payment_method: 'Bank Wire',
        payment_reference: 'WIRE-B94102-US',
        tax_exemption_80g: 1,
        is_anonymous: 0,
        status: 'Completed',
        donation_date: '2026-09-13',
        notes: 'Flood relief shelters',
        created_at: new Date().toISOString()
      },
      {
        id: 'DON-2026-003',
        donor_id: null,
        donor_name: 'Miriam Al-Mansoor',
        donor_email: 'miriam.m@example.com',
        amount: 250,
        category: 'Child Education',
        payment_method: 'Card / Stripe',
        payment_reference: 'STRIPE-CH-38910',
        tax_exemption_80g: 1,
        is_anonymous: 0,
        status: 'Completed',
        donation_date: '2026-09-14',
        notes: 'Textbook and digital learning sponsorship',
        created_at: new Date().toISOString()
      },
      {
        id: 'DON-2026-004',
        donor_id: null,
        donor_name: 'Anonymous Well-Wisher',
        donor_email: 'anon@securemail.org',
        amount: 1000,
        category: 'Food & Nutrition',
        payment_method: 'UPI / QR Code',
        payment_reference: 'UPI-TXN-881920',
        tax_exemption_80g: 1,
        is_anonymous: 1,
        status: 'Completed',
        donation_date: '2026-09-15',
        notes: 'Community dry kitchen rations',
        created_at: new Date().toISOString()
      },
      {
        id: 'DON-2026-005',
        donor_id: 'user-donor-1',
        donor_name: 'Aarav Sharma',
        donor_email: 'donor.aarav@example.com',
        amount: 100,
        category: 'General Fund',
        payment_method: 'UPI / QR Code',
        payment_reference: 'UPI-TXN-772109',
        tax_exemption_80g: 1,
        is_anonymous: 0,
        status: 'Completed',
        donation_date: '2026-09-16',
        notes: 'Monthly recurrent contribution',
        created_at: new Date().toISOString()
      }
    ];

    this.expenses = [
      {
        id: 'EXP-2026-001',
        title: 'Emergency Insulin & Vaccine Cold Storage Units',
        category: 'Healthcare Camps',
        amount: 1450,
        vendor: 'Apex Med Logistics Ltd',
        expense_date: '2026-09-10',
        submitted_by: 'user-volunteer-1',
        audited_by: 'Dr. Sarah Jenkins',
        status: 'Verified & Paid',
        notes: 'Dispatched to Greenfield Mobile Clinic',
        created_at: new Date().toISOString()
      },
      {
        id: 'EXP-2026-002',
        title: '500 Sets High-School STEM Workbooks & Geometry Kits',
        category: 'Child Education',
        amount: 880,
        vendor: 'Scholastic Direct Press',
        expense_date: '2026-09-11',
        submitted_by: 'user-admin',
        audited_by: 'Internal Audit Desk',
        status: 'Verified & Paid',
        notes: 'Delivered to district school zones',
        created_at: new Date().toISOString()
      },
      {
        id: 'EXP-2026-003',
        title: '100 Waterproof All-Weather Relief Family Tents',
        category: 'Disaster Relief',
        amount: 3200,
        vendor: 'ShelterCraft Industries',
        expense_date: '2026-09-13',
        submitted_by: 'user-volunteer-1',
        audited_by: 'Dr. Sarah Jenkins',
        status: 'Verified & Paid',
        notes: 'Cyclone aftermath emergency shelter',
        created_at: new Date().toISOString()
      },
      {
        id: 'EXP-2026-004',
        title: 'Clean Drinking Water RO Filtration Modules (5 units)',
        category: 'Clean Water',
        amount: 1750,
        vendor: 'AquaPure Engineering',
        expense_date: '2026-09-15',
        submitted_by: 'user-volunteer-1',
        audited_by: 'Dr. Sarah Jenkins',
        status: 'Verified & Paid',
        notes: 'Village community bore-wells',
        created_at: new Date().toISOString()
      }
    ];

    this.requests = [
      {
        id: 'REQ-2026-8941',
        requester_id: 'user-beneficiary-1',
        tracking_code: 'REQ-2026-8941',
        applicant_name: 'Sister Mary Teresa',
        organization: 'St. Jude Rural Dispensary',
        category: 'Healthcare',
        urgency: 'Emergency',
        amount: 2400,
        purpose: 'Immediate replenishment of asthma respirators and anti-venom vials for monsoon season in remote tribal hamlets.',
        status: 'Approved & Disbursed',
        reviewed_by: 'Dr. Sarah Jenkins',
        audit_remarks: 'Field verified by volunteer Elena. Invoice paid via Bank Wire on Sept 14.',
        created_at: new Date().toISOString()
      },
      {
        id: 'REQ-2026-9022',
        requester_id: null,
        tracking_code: 'REQ-2026-9022',
        applicant_name: 'Principal Rajesh Kothari',
        organization: 'Adarsh Primary School',
        category: 'Education',
        urgency: 'Normal',
        amount: 1200,
        purpose: 'Setup of solar-powered digital tablets for 60 primary students lacking electricity.',
        status: 'Field Verified',
        reviewed_by: 'Elena Rostova',
        audit_remarks: 'Audit in progress; supplier quotation received and validated.',
        created_at: new Date().toISOString()
      },
      {
        id: 'REQ-2026-9104',
        requester_id: null,
        tracking_code: 'REQ-2026-9104',
        applicant_name: 'Maria Gonzalez',
        organization: 'Hope Community Food Bank',
        category: 'Food & Nutrition',
        urgency: 'Urgent',
        amount: 1850,
        purpose: 'Procurement of staple rice, lentils, and clean cooking oil for 300 displaced migrant laborer households.',
        status: 'Pending Review',
        reviewed_by: undefined,
        audit_remarks: 'Awaiting document upload.',
        created_at: new Date().toISOString()
      },
      {
        id: 'REQ-2026-9230',
        requester_id: null,
        tracking_code: 'REQ-2026-9230',
        applicant_name: 'Prof. K. Sundaram (Student Aid Desk)',
        organization: 'RGUKT Rural Scholars Outreach',
        category: 'Education & Health',
        urgency: 'Urgent',
        amount: 3200,
        purpose: 'Emergency healthcare stipend and digital study kits for 45 underserved university scholars.',
        status: 'Pending Review',
        reviewed_by: 'Elena Rostova',
        audit_remarks: 'Identity credentials validated by university welfare desk.',
        created_at: new Date().toISOString()
      }
    ];

    this.notifications = [
      {
        id: 'notif-1',
        user_id: null,
        title: 'Mobile Clinic Deployed',
        message: 'Free pediatric health camp active in Greenfield sector.',
        type: 'success',
        is_read: 0,
        created_at: new Date().toISOString()
      },
      {
        id: 'notif-2',
        user_id: null,
        title: 'Aid Disbursed: $2,400',
        message: 'Emergency medication fund for St. Jude Dispensary delivered.',
        type: 'info',
        is_read: 0,
        created_at: new Date().toISOString()
      },
      {
        id: 'notif-3',
        user_id: 'user-admin',
        title: 'Audit Report Verified',
        message: 'Q2 2026 100% transparent financial audit published.',
        type: 'warning',
        is_read: 0,
        created_at: new Date().toISOString()
      }
    ];

    this.messages = [
      {
        id: 'msg-1',
        sender_name: 'Arthur Pendelton',
        sender_email: 'arthur.p@crestview.org',
        subject: 'Corporate CSR Matching Inquiry',
        message: 'Our corporate foundation matches employee gifts up to $50,000 per year. We would like to initiate an institutional partnership for child digital literacy programs in 2026-2027.',
        is_read: 0,
        created_at: new Date().toISOString()
      },
      {
        id: 'msg-2',
        sender_name: 'Siddharth Rao',
        sender_email: 'siddharth@greencities.in',
        subject: 'Volunteer Doctor Network',
        message: 'I am an emergency room surgeon willing to offer pro bono consultation hours at your upcoming mobile camps. Please send the volunteer roster.',
        is_read: 0,
        created_at: new Date().toISOString()
      }
    ];
  }
}

export const store = new DataStore();

let mysqlPool: Pool | null = null;
let isConnectedToMySQL = false;

export async function initDatabase(): Promise<boolean> {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'fund_bridge';
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  if (!host) {
    console.log('[Database] DB_HOST not specified. Using high-performance integrated memory/SQL store.');
    return false;
  }

  try {
    mysqlPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000
    });

    // Test connection and ensure OTP / Reset Token tables exist
    const conn = await mysqlPool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS password_reset_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(191) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        attempts INT DEFAULT 0,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
    await conn.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(191) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});
    console.log(`[Database] Successfully connected to MySQL at ${host}:${port}/${database}`);
    conn.release();
    isConnectedToMySQL = true;
    return true;
  } catch (err: any) {
    console.warn(`[Database] MySQL connection notice: ${err.message}. Seamlessly falling back to integrated data store.`);
    mysqlPool = null;
    isConnectedToMySQL = false;
    return false;
  }
}

export function getPool(): Pool | null {
  return mysqlPool;
}

export function isMySQL(): boolean {
  return isConnectedToMySQL;
}
