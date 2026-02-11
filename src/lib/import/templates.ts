export interface CsvColumn {
  header: string
  field: string
  required: boolean
  type: 'string' | 'number' | 'date' | 'email' | 'boolean'
  example: string
  enum?: readonly string[]
  lookup?: 'client_id'
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
      { header: 'Business Entity', field: 'business_entity', required: false, type: 'string', example: 'pvt_ltd', enum: ['proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd', 'opc', 'trust', 'society', 'huf', 'individual', 'other'] },
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
      { header: 'Source', field: 'source', required: false, type: 'string', example: 'referral', enum: ['website', 'referral', 'social_media', 'cold_call', 'walk_in', 'other'] },
      { header: 'Notes', field: 'notes', required: false, type: 'string', example: 'Interested in GST services' },
    ],
  },
  services: {
    module: 'services',
    table: 'services',
    columns: [
      { header: 'Name', field: 'name', required: true, type: 'string', example: 'GST Registration' },
      { header: 'Description', field: 'description', required: false, type: 'string', example: 'New GST registration' },
      { header: 'Frequency', field: 'frequency', required: false, type: 'string', example: 'monthly', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly'] },
      { header: 'Due Day of Month', field: 'due_day_of_month', required: false, type: 'number', example: '15' },
      { header: 'Target Days Before Due', field: 'target_days_before_due', required: false, type: 'number', example: '7' },
    ],
  },
  tasks: {
    module: 'tasks',
    table: 'tasks',
    columns: [
      { header: 'Task Name', field: 'task_name', required: true, type: 'string', example: 'File GSTR-3B' },
      { header: 'Client Name', field: 'client_id', required: false, type: 'string', example: 'Acme Corp', lookup: 'client_id' },
      { header: 'Priority', field: 'priority', required: false, type: 'string', example: 'medium', enum: ['low', 'medium', 'high', 'urgent'] },
      { header: 'Status', field: 'status', required: false, type: 'string', example: 'pending', enum: ['pending', 'in_progress', 'in_review', 'request_changes', 'completed', 'on_hold', 'cancelled'] },
      { header: 'Start Date', field: 'start_date', required: false, type: 'date', example: '2025-03-01' },
      { header: 'Target Date', field: 'target_date', required: false, type: 'date', example: '2025-03-25' },
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
      { header: 'Status', field: 'status', required: false, type: 'string', example: 'active', enum: ['active', 'inactive', 'on_leave', 'terminated'] },
      { header: 'Join Date', field: 'join_date', required: false, type: 'date', example: '2024-01-15' },
    ],
  },
  dscs: {
    module: 'dscs',
    table: 'dscs',
    columns: [
      { header: 'Client Name', field: 'client_id', required: true, type: 'string', example: 'Acme Corp', lookup: 'client_id' },
      { header: 'Holder Name', field: 'holder_name', required: true, type: 'string', example: 'Amit Patel' },
      { header: 'Class', field: 'class', required: false, type: 'string', example: 'class_3', enum: ['class_2', 'class_3'] },
      { header: 'Issued Date', field: 'issued_date', required: false, type: 'date', example: '2024-06-01' },
      { header: 'Expiry Date', field: 'expiry_date', required: false, type: 'date', example: '2026-06-01' },
      { header: 'Location', field: 'location', required: false, type: 'string', example: 'with_us', enum: ['with_us', 'with_client', 'with_vendor', 'other'] },
      { header: 'Vendor', field: 'vendor', required: false, type: 'string', example: 'eMudhra' },
    ],
  },
  licenses: {
    module: 'licenses',
    table: 'licenses',
    columns: [
      { header: 'Client Name', field: 'client_id', required: true, type: 'string', example: 'Acme Corp', lookup: 'client_id' },
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
      { header: 'Client Name', field: 'client_id', required: true, type: 'string', example: 'Acme Corp', lookup: 'client_id' },
      { header: 'Compliance Type', field: 'compliance_type', required: true, type: 'string', example: 'gst', enum: ['gst', 'income_tax', 'mca', 'tds', 'other'] },
      { header: 'Form Name', field: 'form_name', required: false, type: 'string', example: 'GSTR-3B' },
      { header: 'Period', field: 'period', required: false, type: 'string', example: 'Jan 2025' },
      { header: 'Due Date', field: 'due_date', required: false, type: 'date', example: '2025-02-20' },
      { header: 'Status', field: 'status', required: false, type: 'string', example: 'pending', enum: ['pending', 'in_progress', 'filed', 'not_applicable'] },
    ],
  },
  notices: {
    module: 'notices',
    table: 'notices',
    columns: [
      { header: 'Client Name', field: 'client_id', required: true, type: 'string', example: 'Acme Corp', lookup: 'client_id' },
      { header: 'Section', field: 'section', required: false, type: 'string', example: '143(1)' },
      { header: 'Assessment Year', field: 'assessment_year', required: false, type: 'string', example: '2024-25' },
      { header: 'Received Date', field: 'received_date', required: false, type: 'date', example: '2025-01-15' },
      { header: 'Due Date', field: 'due_date', required: false, type: 'date', example: '2025-02-15' },
      { header: 'Status', field: 'status', required: false, type: 'string', example: 'open', enum: ['open', 'in_progress', 'resolved', 'closed'] },
      { header: 'Remarks', field: 'remarks', required: false, type: 'string', example: 'Response pending' },
    ],
  },
}
