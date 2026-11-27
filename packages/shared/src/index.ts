export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  tenantId: string;
  name: string;
}

export interface Contact {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  tags: string[];
  consentStatus: 'PENDING' | 'GRANTED' | 'REVOKED';
}

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  status: 'DRAFT' | 'QUEUED' | 'SENDING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}
