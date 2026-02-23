
export interface FIRResult {
  crime_category: string;
  ppc_sections: string[];
  crime_severity: string;
  jurisdiction_police_station: string;
  fir_draft_english: string;
  fir_draft_urdu: string;
  documents_required: string[];
  legal_rights: string[];
  steps_to_file: string[];
  important_warnings: string[];
  emergency_contacts: Record<string, string>;
  case_strength: number;
  case_strength_justification: string;
}

export interface FormData {
  incident_text: string;
  complainant_name: string;
  complainant_father_name: string;
  complainant_cnic: string;
  complainant_phone: string;
  complainant_caste: string;
  complainant_occupation: string;
  complainant_address: string;
  city: string;
  incident_date: string;
  incident_location: string;
  accused_info: string;
  language: string;
  crime_hint: string;
}
