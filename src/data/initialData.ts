import { User, Donation, Expense, Message, FundRequest, SystemSettings } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Dr. K. Radhakrishnan',
    email: 'aadminngo@gmail.com',
    role: 'Administrator',
    avatar: 'KR',
    kycVerified: true,
    phone: '+91 93915 14815',
    bio: 'Founding Director & Chief Financial Controller at Fund Bridge NGO. Overseeing independent public audits and state welfare disbursements.',
    memberSince: '2021',
    auditsApproved: 42,
    password: 'password123'
  },
  {
    id: 'user-rgukt',
    name: 'University Member',
    email: 'o220786@rguktong.ac.in',
    role: 'Donor Member',
    avatar: 'UM',
    kycVerified: true,
    phone: '+91 91234 56789',
    bio: 'Student & Philanthropy Supporter at RGUKT.',
    memberSince: '2026',
    auditsApproved: 5,
    password: 'password123'
  },
  {
    id: 'user-donor',
    name: 'K. Venkatesh',
    email: 'venkatesh.k@gmail.com',
    role: 'Donor Member',
    avatar: 'KV',
    kycVerified: true,
    phone: '+91 94441 23456',
    bio: 'Philanthropist & Sustaining Healthcare Patron sponsoring pediatric clinic fleets across rural South Indian districts.',
    memberSince: '2023',
    auditsApproved: 18,
    password: 'password123'
  },
  {
    id: 'user-volunteer',
    name: 'Kavitha Lakshmi',
    email: 'kavitha.lakshmi@gmail.com',
    role: 'Volunteer Staff',
    avatar: 'KL',
    kycVerified: true,
    phone: '+91 98401 56789',
    bio: 'Field Logistics Coordinator and certified on-ground emergency relief auditor.',
    memberSince: '2024',
    auditsApproved: 28,
    password: 'password123'
  }
];

export const INITIAL_DONATIONS: Donation[] = [
  {
    id: 'DON-2026-081',
    donorName: 'K. Venkatesh',
    donorEmail: 'venkatesh.k@gmail.com',
    cause: 'Healthcare Camps',
    amount: 1500,
    method: 'UPI / QR Code',
    date: '2026-09-08',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8910',
    isAnonymous: false
  },
  {
    id: 'DON-2026-082',
    donorName: 'Ch. Sai Praneeth',
    donorEmail: 'saipraneeth.ch@gmail.com',
    cause: 'Disaster Relief',
    amount: 3200,
    method: 'UPI / QR Code',
    date: '2026-09-07',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8911',
    isAnonymous: false
  },
  {
    id: 'DON-2026-083',
    donorName: 'S. Meenakshi Sundaram',
    donorEmail: 'meenakshi.sundaram@gmail.com',
    cause: 'Child Education',
    amount: 850,
    method: 'Card / Stripe',
    date: '2026-09-05',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8912',
    isAnonymous: false
  },
  {
    id: 'DON-2026-084',
    donorName: 'T. S. Venkataraman (CSR Trust)',
    donorEmail: 'venkataraman.ts@tcs-csr.org',
    cause: 'General Fund',
    amount: 10000,
    method: 'Bank Wire',
    date: '2026-09-03',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8913',
    isAnonymous: false
  },
  {
    id: 'DON-2026-085',
    donorName: 'R. Balasubramanian',
    donorEmail: 'balasubramanian.r@gmail.com',
    cause: 'Food & Nutrition',
    amount: 450,
    method: 'UPI / QR Code',
    date: '2026-09-01',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8914',
    isAnonymous: false
  },
  {
    id: 'DON-2026-086',
    donorName: 'P. Vani Kumari',
    donorEmail: 'vanikumari.p@gmail.com',
    cause: 'Healthcare Camps',
    amount: 1200,
    method: 'UPI / QR Code',
    date: '2026-08-29',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8915',
    isAnonymous: false
  },
  {
    id: 'DON-2026-087',
    donorName: 'M. Anantha Padmanabhan',
    donorEmail: 'ananthapadmanabhan.m@gmail.com',
    cause: 'Child Education',
    amount: 650,
    method: 'Card / Stripe',
    date: '2026-08-27',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8916',
    isAnonymous: false
  },
  {
    id: 'DON-2026-088',
    donorName: 'G. Vijay Raghavan',
    donorEmail: 'vijayraghavan.g@gmail.com',
    cause: 'Clean Water',
    amount: 2000,
    method: 'Bank Wire',
    date: '2026-08-24',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8917',
    isAnonymous: false
  },
  {
    id: 'DON-2026-089',
    donorName: 'V. Lakshmi Narayana',
    donorEmail: 'lakshminarayana.v@gmail.com',
    cause: 'Disaster Relief',
    amount: 1800,
    method: 'UPI / QR Code',
    date: '2026-08-20',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8918',
    isAnonymous: false
  },
  {
    id: 'DON-2026-090',
    donorName: 'B. Suresh Kumar',
    donorEmail: 'sureshkumar.b@gmail.com',
    cause: 'Food & Nutrition',
    amount: 950,
    method: 'UPI / QR Code',
    date: '2026-08-16',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8919',
    isAnonymous: false
  },
  {
    id: 'DON-2026-091',
    donorName: 'P. Sravani Reddy',
    donorEmail: 'sravani.reddy@gmail.com',
    cause: 'Healthcare Camps',
    amount: 1100,
    method: 'UPI / QR Code',
    date: '2026-08-12',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8920',
    isAnonymous: false
  },
  {
    id: 'DON-2026-092',
    donorName: 'D. Ramachandra Murthy',
    donorEmail: 'ramachandramurthy.d@gmail.com',
    cause: 'Child Education',
    amount: 750,
    method: 'Card / Stripe',
    date: '2026-08-08',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8921',
    isAnonymous: false
  },
  {
    id: 'DON-2026-093',
    donorName: 'N. Srinivasa Rao',
    donorEmail: 'srinivasarao.n@gmail.com',
    cause: 'General Fund',
    amount: 5000,
    method: 'Bank Wire',
    date: '2026-08-04',
    status: 'Completed',
    receiptNumber: '80G-REC-2026-8922',
    isAnonymous: false
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'EXP-2026-101',
    title: 'Pediatric Vaccine & Cold Chain Refrigeration Equipment',
    vendor: 'Sri Venkateswara Medical Supplies',
    category: 'Healthcare Camps',
    amount: 3850,
    date: '2026-09-06',
    auditedBy: 'Dr. K. Radhakrishnan',
    status: 'Approved'
  },
  {
    id: 'EXP-2026-102',
    title: 'Emergency Flood Relief Dry Ration Kits',
    vendor: 'Annapurna Food Wholesalers Co.',
    category: 'Disaster Relief',
    amount: 5200,
    date: '2026-09-04',
    auditedBy: 'Kavitha Lakshmi',
    status: 'Approved'
  },
  {
    id: 'EXP-2026-103',
    title: 'Digital Tablets & Learning Software Licenses',
    vendor: 'Saraswathi Vidya Mandir Press',
    category: 'Child Education',
    amount: 2400,
    date: '2026-09-02',
    auditedBy: 'Dr. K. Radhakrishnan',
    status: 'Approved'
  },
  {
    id: 'EXP-2026-104',
    title: 'Q2 Independent Financial Audit & Transparency Filing',
    vendor: 'Audit & Assurance Committee',
    category: 'Administrative & Audit',
    amount: 1800,
    date: '2026-08-28',
    auditedBy: 'Audit Committee',
    status: 'Approved'
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    senderName: 'T. S. Venkataraman (CSR Director, TechVentures)',
    email: 'venkataraman.ts@tcs-csr.org',
    subject: 'Corporate Grant Matching & Healthcare Sponsorship Inquiry',
    message: 'Hello Fund Bridge leadership team, our company is approving Q3 matching grants for mobile health camps. We would like to allocate funds for remote primary clinics. Please send our corporate relations desk the compliance packet and bank routing numbers.',
    date: 'Today, 09:30 AM',
    read: false,
    replies: []
  },
  {
    id: 'msg-2',
    senderName: 'Dr. P. Ramesh Babu (Sanjivani Community Clinic)',
    email: 'rameshbabu.clinic@sanjivani.org',
    subject: 'Acknowledgement of Emergency Pediatric Medicine Stock',
    message: 'We received the 350 vaccine doses and sterile equipment disbursed through Fund Bridge grant REQ-2026-8941 yesterday. The field team has already treated 180 children in rural cluster 4. Photographic proof attached in report.',
    date: 'Yesterday, 4:15 PM',
    read: false,
    replies: []
  }
];

export const INITIAL_REQUESTS: FundRequest[] = [
  {
    id: 'REQ-2026-9305',
    applicantName: 'S. Bhuvaneshwari',
    org: 'Annapurna Community Food Network',
    category: 'Food & Nutrition',
    urgency: 'Emergency',
    amount: 1950,
    purpose: 'Emergency grain kits, infant milk formula, and clean drinking water for 120 flood-displaced families.',
    date: '2026-09-16',
    status: 'Under Review',
    remarks: 'Urgent relief request flagged by district coordinator. Awaiting batch disbursement.'
  },
  {
    id: 'REQ-2026-9230',
    applicantName: 'Prof. K. Sundaram (Student Aid Cell)',
    org: 'RGUKT Rural Scholars Outreach',
    category: 'Education & Health',
    urgency: 'Urgent',
    amount: 3200,
    purpose: 'Emergency medical aid and digital learning study materials for 45 economically disadvantaged campus scholars.',
    date: '2026-09-15',
    status: 'Under Review',
    remarks: 'Identity credentials validated by university welfare desk. Recommended for field grant.'
  },
  {
    id: 'REQ-2026-9112',
    applicantName: 'C. Ravichandran',
    org: 'Coastal Delta Disaster Relief Committee',
    category: 'Disaster Relief',
    urgency: 'Urgent',
    amount: 4200,
    purpose: 'Water purification filter columns and 500 waterproof tarpaulin sheets for flood-inundated coastal delta villages.',
    date: '2026-09-08',
    status: 'Under Review',
    remarks: 'Initial documents submitted; telephone verification underway with local district authorities.'
  },
  {
    id: 'REQ-2026-9024',
    applicantName: 'M. Saraswathi Ammal',
    org: 'Sri Ramakrishna Children Learning Center',
    category: 'Education',
    urgency: 'Normal',
    amount: 1800,
    purpose: 'Provision of textbooks, digital learning tablets, and uniform kits for 60 primary school orphan students.',
    date: '2026-09-06',
    status: 'Field Audited',
    remarks: 'Field audit complete by Kavitha Lakshmi. Recommended for 100% board approval.'
  },
  {
    id: 'REQ-2026-8941',
    applicantName: 'Dr. P. Ramesh Babu',
    org: 'Sanjivani Community Pediatric Clinic',
    category: 'Healthcare',
    urgency: 'Emergency',
    amount: 2500,
    purpose: 'Emergency vaccine refrigeration and antibiotics for 350 rural infants affected by sudden seasonal waterborne epidemic.',
    date: '2026-09-02',
    status: 'Disbursed',
    remarks: 'Disbursed via direct vendor payment to Sri Venkateswara Medical Supplies. Receipt verified by Dr. K. Radhakrishnan.'
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  ngoName: 'FUND BRIDGE NGO',
  regNumber: 'NGO-REG-2018-941',
  tax80G: '80G-DEL-2021-AA90',
  currency: '₹',
  upiId: '9391514815@pthdfc',
  upiGatewayEnabled: true,
  cardGatewayEnabled: true,
  autoInvoicing: true
};
