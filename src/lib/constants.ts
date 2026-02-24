// SAVISHKAR Prant (Division) List - Official organizational divisions
export const PRANT_LIST = [
  "Kerala Prant",
  "North Tamil Nadu Prant",
  "South Tamil Nadu Prant",
  "Andhra Pradesh Prant",
  "Telangana Prant",
  "South Karnataka Prant",
  "North Karnataka Prant",
  "Bangalore Prant",
  "Konkan Prant",
  "Paschim Maharashtra Prant",
  "Deogiri Prant",
  "Vidarbha Prant",
  "Gujarat Prant",
  "Madhya Bharat Prant",
  "Malwa Prant",
  "Mahakaushal Prant",
  "Chhattisgarh Prant",
  "Odisha East Prant",
  "Odisha West Prant",
  "South Bengal Prant",
  "North Bengal Prant",
  "Sikkim - Darjeeling Prant",
  "Assam Prant",
  "Arunachal Pradesh Prant",
  "Meghalaya Prant",
  "Manipur Prant",
  "Mizoram Prant",
  "Tripura Prant",
  "Nagaland Prant",
  "Jharkhand Prant",
  "South Bihar Prant",
  "North Bihar Prant",
  "Kashi Prant",
  "Gorakhsh Prant",
  "Awadh Prant",
  "Kanpur Prant",
  "Braj Prant",
  "Meerut Prant",
  "Uttarakhand Prant",
  "Jaipur Prant",
  "Jodhpur Prant",
  "Chittorgarh Prant",
  "Delhi Prant",
  "Haryana Prant",
  "Punjab Prant",
  "Himachal Pradesh Prant",
  "Jammu & Kashmir Prant"
];

// Prant codes for membership ID generation
export const PRANT_CODES: Record<string, string> = {
  "Kerala Prant": "KER",
  "North Tamil Nadu Prant": "NTN",
  "South Tamil Nadu Prant": "STN",
  "Andhra Pradesh Prant": "APR",
  "Telangana Prant": "TLG",
  "South Karnataka Prant": "SKT",
  "North Karnataka Prant": "NKT",
  "Bangalore Prant": "BLR",
  "Konkan Prant": "KNK",
  "Paschim Maharashtra Prant": "PMH",
  "Deogiri Prant": "DGR",
  "Vidarbha Prant": "VID",
  "Gujarat Prant": "GUJ",
  "Madhya Bharat Prant": "MBH",
  "Malwa Prant": "MLW",
  "Mahakaushal Prant": "MKL",
  "Chhattisgarh Prant": "CHG",
  "Odisha East Prant": "ORE",
  "Odisha West Prant": "ORW",
  "South Bengal Prant": "SBG",
  "North Bengal Prant": "NBG",
  "Sikkim - Darjeeling Prant": "SDK",
  "Assam Prant": "ASM",
  "Arunachal Pradesh Prant": "ARP",
  "Meghalaya Prant": "MGY",
  "Manipur Prant": "MNP",
  "Mizoram Prant": "MZR",
  "Tripura Prant": "TRP",
  "Nagaland Prant": "NGL",
  "Jharkhand Prant": "JHK",
  "South Bihar Prant": "SBH",
  "North Bihar Prant": "NBH",
  "Kashi Prant": "KSH",
  "Gorakhsh Prant": "GRK",
  "Awadh Prant": "AWD",
  "Kanpur Prant": "KNP",
  "Braj Prant": "BRJ",
  "Meerut Prant": "MRT",
  "Uttarakhand Prant": "UTK",
  "Jaipur Prant": "JPR",
  "Jodhpur Prant": "JDH",
  "Chittorgarh Prant": "CHT",
  "Delhi Prant": "DEL",
  "Haryana Prant": "HRY",
  "Punjab Prant": "PNJ",
  "Himachal Pradesh Prant": "HIM",
  "Jammu & Kashmir Prant": "JNK"
};

// Legacy state list for backward compatibility
export const INDIAN_STATES = PRANT_LIST;

// Regional Prant Mapping
export const REGIONS: Record<string, string[]> = {
  "Southern Region": [
    "Kerala Prant", "North Tamil Nadu Prant", "South Tamil Nadu Prant"
  ],
  "South Central Region": [
    "Andhra Pradesh Prant", "Telangana Prant", "South Karnataka Prant",
    "North Karnataka Prant", "Bangalore Prant"
  ],
  "Western Region": [
    "Konkan Prant", "Paschim Maharashtra Prant", "Deogiri Prant",
    "Vidarbha Prant", "Gujarat Prant"
  ],
  "Central Region": [
    "Madhya Bharat Prant", "Malwa Prant", "Mahakaushal Prant", "Chhattisgarh Prant"
  ],
  "Eastern Region": [
    "Odisha East Prant", "Odisha West Prant", "South Bengal Prant",
    "North Bengal Prant", "Sikkim - Darjeeling Prant"
  ],
  "North-Eastern Region": [
    "Assam Prant", "Arunachal Pradesh Prant", "Meghalaya Prant",
    "Manipur Prant", "Mizoram Prant", "Tripura Prant", "Nagaland Prant"
  ],
  "Bihar Region": [
    "Jharkhand Prant", "South Bihar Prant", "North Bihar Prant"
  ],
  "Eastern Uttar Pradesh Region": [
    "Kashi Prant", "Gorakhsh Prant", "Awadh Prant", "Kanpur Prant"
  ],
  "Western Uttar Pradesh Region": [
    "Braj Prant", "Meerut Prant", "Uttarakhand Prant"
  ],
  "North-Western Region": [
    "Jaipur Prant", "Jodhpur Prant", "Chittorgarh Prant", "Delhi Prant"
  ],
  "Northern Region": [
    "Haryana Prant", "Punjab Prant", "Himachal Pradesh Prant", "Jammu & Kashmir Prant"
  ]
};

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
  REGIONAL_CO_CONVENER: "Regional Co-Convener",
  REGIONAL_CONVENER: "Regional Convener",
  NATIONAL_CO_CONVENER: "National Co-Convener",
  NATIONAL_CONVENER: "National Convener",
  INCHARGE: "Incharge",
  CO_INCHARGE: "Co-Incharge",
  EVENT_MANAGER: "Event Manager",
  ADMIN: "Administrator",
  SUPER_CONTROLLER: "Super Controller"
};

export const LEADER_ROLES = [
  "NATIONAL_CONVENER",
  "NATIONAL_CO_CONVENER",
  "REGIONAL_CONVENER",
  "REGIONAL_CO_CONVENER",
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
  "REGIONAL_CONVENER",
  "REGIONAL_CO_CONVENER",
  "STATE_CONVENER",
  "STATE_CO_CONVENER",
  "STATE_INCHARGE",
  "STATE_CO_INCHARGE",
  "DISTRICT_CONVENER",
  "DISTRICT_CO_CONVENER",
  "DISTRICT_INCHARGE",
  "DISTRICT_CO_INCHARGE",
  "EVENT_MANAGER",
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
  | "REGIONAL_CO_CONVENER"
  | "REGIONAL_CONVENER"
  | "NATIONAL_CO_CONVENER"
  | "NATIONAL_CONVENER"
  | "INCHARGE"
  | "CO_INCHARGE"
  | "EVENT_MANAGER"
  | "ADMIN"
  | "SUPER_CONTROLLER";

export type LeaderRole =
  | "NATIONAL_CONVENER"
  | "NATIONAL_CO_CONVENER"
  | "REGIONAL_CONVENER"
  | "REGIONAL_CO_CONVENER"
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
  role === "STATE_CONVENER" || role === "STATE_CO_CONVENER" || role === "STATE_INCHARGE" || role === "STATE_CO_INCHARGE";

// Helper function to check if a role is district-level
export const isDistrictRole = (role: string) =>
  role === "DISTRICT_CONVENER" || role === "DISTRICT_CO_CONVENER" || role === "DISTRICT_INCHARGE" || role === "DISTRICT_CO_INCHARGE";

// Helper function to check if a role is national-level
export const isNationalRole = (role: string) =>
  role === "NATIONAL_CONVENER" || role === "NATIONAL_CO_CONVENER";

// Helper function to check if a role is regional-level
export const isRegionalRole = (role: string) =>
  role === "REGIONAL_CONVENER" || role === "REGIONAL_CO_CONVENER";