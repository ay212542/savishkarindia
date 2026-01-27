// SAVISHKAR Prant (Division) List - Official organizational divisions
export const PRANT_LIST = [
  "Gujarat Prant",
  "Meerut Prant",
  "Jodhpur Prant",
  "Telangana Prant",
  "North Tamil Nadu Prant",
  "Punjab Prant",
  "Jammu & Kashmir Prant",
  "Chittor Prant",
  "Jaipur Prant",
  "Bangalore Prant",
  "Paschim Maharashtra Prant",
  "Jharkhand Prant",
  "Kashi Prant",
  "Awadh Prant",
  "Konkan Prant",
  "Chhattisgarh Prant",
  "South Bengal Prant",
  "Malwa Prant",
  "Himachal Prant",
  "Kerala Prant",
  "Madhya Bharat Prant",
  "Vidarbha Prant",
  "Haryana Prant",
  "Kanpur Prant",
  "Delhi Prant",
  "South Tamil Nadu Prant",
  "Andhra Pradesh Prant",
  "South Karnataka Prant",
  "North Karnataka Prant",
  "Deogiri Prant",
  "Mahakaushal Prant",
  "Orissa East Prant",
  "Orissa West Prant",
  "North Bengal Prant",
  "Sikkim - Darjeeling Prant",
  "Assam Prant",
  "Arunachal Pradesh Prant",
  "Nagaland Prant",
  "Manipur Prant",
  "Mizoram Prant",
  "Meghalaya Prant",
  "South Bihar Prant",
  "North Bihar Prant",
  "Goraksha Prant",
  "Braj Prant",
  "Uttarakhand Prant"
];

// Prant codes for membership ID generation
export const PRANT_CODES: Record<string, string> = {
  "Gujarat Prant": "GUJ",
  "Meerut Prant": "MRT",
  "Jodhpur Prant": "JDH",
  "Telangana Prant": "TLG",
  "North Tamil Nadu Prant": "NTN",
  "Punjab Prant": "PNJ",
  "Jammu & Kashmir Prant": "JNK",
  "Chittor Prant": "CHT",
  "Jaipur Prant": "JPR",
  "Bangalore Prant": "BLR",
  "Paschim Maharashtra Prant": "PMH",
  "Jharkhand Prant": "JHK",
  "Kashi Prant": "KSH",
  "Awadh Prant": "AWD",
  "Konkan Prant": "KNK",
  "Chhattisgarh Prant": "CHG",
  "South Bengal Prant": "SBG",
  "Malwa Prant": "MLW",
  "Himachal Prant": "HIM",
  "Kerala Prant": "KER",
  "Madhya Bharat Prant": "MBH",
  "Vidarbha Prant": "VID",
  "Haryana Prant": "HRY",
  "Kanpur Prant": "KNP",
  "Delhi Prant": "DEL",
  "South Tamil Nadu Prant": "STN",
  "Andhra Pradesh Prant": "APR",
  "South Karnataka Prant": "SKT",
  "North Karnataka Prant": "NKT",
  "Deogiri Prant": "DGR",
  "Mahakaushal Prant": "MKL",
  "Orissa East Prant": "ORE",
  "Orissa West Prant": "ORW",
  "North Bengal Prant": "NBG",
  "Sikkim - Darjeeling Prant": "SDK",
  "Assam Prant": "ASM",
  "Arunachal Pradesh Prant": "ARP",
  "Nagaland Prant": "NGL",
  "Manipur Prant": "MNP",
  "Mizoram Prant": "MZR",
  "Meghalaya Prant": "MGY",
  "South Bihar Prant": "SBH",
  "North Bihar Prant": "NBH",
  "Goraksha Prant": "GRK",
  "Braj Prant": "BRJ",
  "Uttarakhand Prant": "UTK"
};

// Legacy state list for backward compatibility
export const INDIAN_STATES = PRANT_LIST;

export const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Member",
  STUDENT_LEADER: "Student Leader",
  DESIGNATORY: "Designatory",
  STATE_CO_CONVENER: "State Co-Convener",
  STATE_CONVENER: "State Convener",
  STATE_INCHARGE: "State Incharge",
  STATE_CO_INCHARGE: "State Co-Incharge",
  DISTRICT_CO_CONVENER: "District Co-Convener",
  DISTRICT_CONVENER: "District Convener",
  DISTRICT_INCHARGE: "District Incharge",
  DISTRICT_CO_INCHARGE: "District Co-Incharge",
  NATIONAL_CO_CONVENER: "National Co-Convener",
  NATIONAL_CONVENER: "National Convener",
  INCHARGE: "Incharge",
  CO_INCHARGE: "Co-Incharge",
  ADMIN: "Administrator",
  SUPER_CONTROLLER: "Super Controller"
};

export const LEADER_ROLES = [
  "NATIONAL_CONVENER",
  "NATIONAL_CO_CONVENER",
  "STATE_CONVENER",
  "STATE_CO_CONVENER",
  "STATE_INCHARGE",
  "STATE_CO_INCHARGE",
  "DISTRICT_CONVENER",
  "DISTRICT_CO_CONVENER",
  "DISTRICT_INCHARGE",
  "DISTRICT_CO_INCHARGE"
];

export const ROLE_HIERARCHY = [
  "SUPER_CONTROLLER",
  "ADMIN",
  "NATIONAL_CONVENER",
  "NATIONAL_CO_CONVENER",
  "STATE_CONVENER",
  "STATE_CO_CONVENER",
  "STATE_INCHARGE",
  "STATE_CO_INCHARGE",
  "DISTRICT_CONVENER",
  "DISTRICT_CO_CONVENER",
  "DISTRICT_INCHARGE",
  "DISTRICT_CO_INCHARGE",
  "DESIGNATORY",
  "STUDENT_LEADER",
  "MEMBER"
];

// Roles for application designation dropdown
export const APPLICATION_DESIGNATIONS = [
  "MEMBER",
  "STUDENT_LEADER",
  "STATE_INCHARGE",
  "STATE_CO_INCHARGE",
  "DISTRICT_INCHARGE",
  "DISTRICT_CO_INCHARGE",
  "DISTRICT_CONVENER",
  "DISTRICT_CO_CONVENER",
  "STATE_CONVENER",
  "STATE_CO_CONVENER"
];

export type AppRole = 
  | "MEMBER"
  | "STUDENT_LEADER"
  | "DESIGNATORY"
  | "STATE_CO_CONVENER"
  | "STATE_CONVENER"
  | "STATE_INCHARGE"
  | "STATE_CO_INCHARGE"
  | "DISTRICT_CO_CONVENER"
  | "DISTRICT_CONVENER"
  | "DISTRICT_INCHARGE"
  | "DISTRICT_CO_INCHARGE"
  | "NATIONAL_CO_CONVENER"
  | "NATIONAL_CONVENER"
  | "INCHARGE"
  | "CO_INCHARGE"
  | "ADMIN"
  | "SUPER_CONTROLLER";

export type LeaderRole =
  | "NATIONAL_CONVENER"
  | "NATIONAL_CO_CONVENER"
  | "STATE_CONVENER"
  | "STATE_CO_CONVENER"
  | "STATE_INCHARGE"
  | "STATE_CO_INCHARGE"
  | "DISTRICT_CONVENER"
  | "DISTRICT_CO_CONVENER"
  | "DISTRICT_INCHARGE"
  | "DISTRICT_CO_INCHARGE";

export const ID_TEMPLATES = [
  { id: "modern", name: "Modern", description: "Clean and contemporary design with teal accents" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant with essential information" },
  { id: "premium", name: "Premium", description: "Rich gradient design with orange highlights" },
  { id: "cyber", name: "Cyber", description: "Futuristic neon aesthetic with cyan glow" }
];

export const DESIGNATION_OPTIONS = [
  "Student",
  "Researcher",
  "Entrepreneur",
  "Professional",
  "Educator",
  "Government Official",
  "Social Worker",
  "Other"
];

// Helper function to check if a role is state-level
export const isStateRole = (role: string) => 
  role.startsWith("STATE_") || role === "NATIONAL_CONVENER" || role === "NATIONAL_CO_CONVENER";

// Helper function to check if a role is district-level
export const isDistrictRole = (role: string) => 
  role.startsWith("DISTRICT_");

// Helper function to check if a role is national-level
export const isNationalRole = (role: string) => 
  role === "NATIONAL_CONVENER" || role === "NATIONAL_CO_CONVENER";