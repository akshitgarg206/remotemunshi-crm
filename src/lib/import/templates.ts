export interface CsvColumn {
  header: string
  field: string
  required: boolean
  type: 'string' | 'number' | 'date' | 'email' | 'boolean'
  example: string
}

export interface CsvTemplate {
  module: string
  table: string
  columns: CsvColumn[]
}

export const CSV_TEMPLATES: Record<string, CsvTemplate> = {
  clients: {
    module: 'clients',
    table: 'clients',
    columns: [
      { header: 'Business Name', field: 'business_name', required: true, type: 'string', example: 'Acme Corp' },
      { header: 'Contact Name', field: 'contact_name', required: false, type: 'string', example: 'John Doe' },
      { header: 'Mobile', field: 'mobile', required: false, type: 'string', example: '9876543210' },
      { header: 'Email', field: 'email', required: false, type: 'email', example: 'john@acme.com' },
      { header: 'Business Entity', field: 'business_entity', required: false, type: 'string', example: 'pvt_ltd' },
      { header: 'GSTIN', field: 'gstin', required: false, type: 'string', example: '27AABCU9603R1ZM' },
      { header: 'PAN', field: 'pan', required: false, type: 'string', example: 'AABCU9603R' },
      { header: 'Address', field: 'address', required: false, type: 'string', example: '123 Main St' },
      { header: 'City', field: 'city', required: false, type: 'string', example: 'Mumbai' },
      { header: 'State', field: 'state', required: false, type: 'string', example: 'Maharashtra' },
      { header: 'Pincode', field: 'pincode', required: false, type: 'string', example: '400001' },
    ],
  },
  leads: {
    module: 'leads',
    table: 'leads',
    columns: [
      { header: 'Business Name', field: 'business_name', required: true, type: 'string', example: 'XYZ Ltd' },
      { header: 'Contact Person', field: 'contact_person', required: false, type: 'string', example: 'Jane Smith' },
      { header: 'Contact No', field: 'contact_no', required: false, type: 'string', example: '9876543210' },
      { header: 'Email', field: 'email', required: false, type: 'email', example: 'jane@xyz.com' },
      { header: 'Source', field: 'source', required: false, type: 'string', example: 'referral' },
      { header: 'Notes', field: 'notes', required: false, type: 'string', example: 'Interested in GST services' },
    ],
  },
  services: {
    module: 'services',
    table: 'services',
    columns: [
      { header: 'Name', field: 'name', required: true, type: 'string', example: 'GST Registration' },
      { header: 'SAC Code', field: 'sac_code', required: false, type: 'string', example: '998231' },
      { header: 'Description', field: 'description', required: false, type: 'string', example: 'New GST registration' },
      { header: 'Default Rate', field: 'default_rate', required: false, type: 'number', example: '5000' },
    ],
  },
  tasks: {
    module: 'tasks',
    table: 'tasks',
    columns: [
      { header: 'Task Name', field: 'task_name', required: true, type: 'string', example: 'File GSTR-3B' },
      { header: 'Priority', field: 'priority', required: false, type: 'string', example: 'medium' },
      { header: 'Status', field: 'status', required: false, type: 'string', example: 'pending' },
      { header: 'Due Date', field: 'due_date', required: false, type: 'date', example: '2025-03-31' },
      { header: 'Estimated Hours', field: 'estimated_hours', required: false, type: 'number', example: '2' },
    ],
  },
  team: {
    module: 'team',
    table: 'employees',
    columns: [
      { header: 'Name', field: 'name', required: true, type: 'string', example: 'Rahul Sharma' },
      { header: 'Email', field: 'email', required: true, type: 'email', example: 'rahul@remotemunshi.com' },
      { header: 'Mobile', field: 'mobile', required: false, type: 'string', example: '9876543210' },
      { header: 'Status', field: 'status', required: false, type: 'string', example: 'active' },
      { header: 'Join Date', field: 'join_date', required: false, type: 'date', example: '2024-01-15' },
    ],
  },
  dscs: {
    module: 'dscs',
    table: 'dscs',
    columns: [
      { header: 'Holder Name', field: 'holder_name', required: true, type: 'string', example: 'Amit Patel' },
      { header: 'Class', field: 'class', required: false, type: 'string', example: 'class_3' },
      { header: 'Issued Date', field: 'issued_date', required: false, type: 'date', example: '2024-06-01' },
      { header: 'Expiry Date', field: 'expiry_date', required: false, type: 'date', example: '2026-06-01' },
      { header: 'Location', field: 'location', required: false, type: 'string', example: 'with_us' },
      { header: 'Vendor', field: 'vendor', required: false, type: 'string', example: 'eMudhra' },
    ],
  },
  licenses: {
    module: 'licenses',
    table: 'licenses',
    columns: [
      { header: 'License Name', field: 'license_name', required: true, type: 'string', example: 'Trade License' },
      { header: 'Registration No', field: 'registration_no', required: false, type: 'string', example: 'TL-2024-001' },
      { header: 'Issuing Authority', field: 'issuing_authority', required: false, type: 'string', example: 'BMC' },
      { header: 'Issued Date', field: 'issued_date', required: false, type: 'date', example: '2024-01-01' },
      { header: 'Expiry Date', field: 'expiry_date', required: false, type: 'date', example: '2025-12-31' },
    ],
  },
  compliance: {
    module: 'compliance',
    table: 'compliance_entries',
    columns: [
      { header: 'Compliance Type', field: 'compliance_type', required: true, type: 'string', example: 'gst' },
      { header: 'Form Name', field: 'form_name', required: false, type: 'string', example: 'GSTR-3B' },
      { header: 'Period', field: 'period', required: false, type: 'string', example: 'Jan 2025' },
      { header: 'Due Date', field: 'due_date', required: false, type: 'date', example: '2025-02-20' },
      { header: 'Status', field: 'status', required: false, type: 'string', example: 'pending' },
    ],
  },
  notices: {
    module: 'notices',
    table: 'notices',
    columns: [
      { header: 'Section', field: 'section', required: false, type: 'string', example: '143(1)' },
      { header: 'Assessment Year', field: 'assessment_year', required: false, type: 'string', example: '2024-25' },
      { header: 'Received Date', field: 'received_date', required: false, type: 'date', example: '2025-01-15' },
      { header: 'Due Date', field: 'due_date', required: false, type: 'date', example: '2025-02-15' },
      { header: 'Status', field: 'status', required: false, type: 'string', example: 'open' },
      { header: 'Remarks', field: 'remarks', required: false, type: 'string', example: 'Response pending' },
    ],
  },
}
