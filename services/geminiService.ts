
import { GoogleGenAI, Type } from "@google/genai";
import { FormData, FIRResult } from "../types";

export const analyzeIncident = async (formData: FormData): Promise<FIRResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    You are an expert Pakistani legal assistant specializing in FIR (First Information Report) filing under Pakistan Penal Code (PPC) and Code of Criminal Procedure (CrPC). 
    A citizen needs help filing an FIR. Analyze their complaint and provide a complete, structured response.

    **INCIDENT DESCRIPTION (as told by complainant):** ${formData.incident_text}
    **DETAILS:**
    - Complainant Name: ${formData.complainant_name || 'Not provided'}
    - Father's Name: ${formData.complainant_father_name || 'Not provided'}
    - Phone Number: ${formData.complainant_phone || 'Not provided'}
    - Caste/Qom: ${formData.complainant_caste || 'Not provided'}
    - Occupation: ${formData.complainant_occupation || 'Not provided'}
    - Complainant CNIC: ${formData.complainant_cnic || 'Not provided'}
    - Residential Address: ${formData.complainant_address || 'Not provided'}
    - City/District: ${formData.city}
    - Accused Information: ${formData.accused_info || 'Unknown'}
    - Date of Incident: ${formData.incident_date}
    - Location of Incident: ${formData.incident_location || 'Not specified'}
    - Category Hint: ${formData.crime_hint}

    **YOUR TASK — Generate the output according to the requested schema.**
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          crime_category: { type: Type.STRING },
          ppc_sections: { type: Type.ARRAY, items: { type: Type.STRING } },
          crime_severity: { type: Type.STRING },
          jurisdiction_police_station: { type: Type.STRING },
          fir_draft_english: { type: Type.STRING, description: "A 300-400 word formal FIR draft in English." },
          fir_draft_urdu: { type: Type.STRING, description: "A formal FIR draft in Urdu starting with 'Bakhidmat Janab SHO Sahib'." },
          documents_required: { type: Type.ARRAY, items: { type: Type.STRING } },
          legal_rights: { type: Type.ARRAY, items: { type: Type.STRING } },
          steps_to_file: { type: Type.ARRAY, items: { type: Type.STRING } },
          important_warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          case_strength: { type: Type.NUMBER, description: "A score from 1-10 based on the evidence and details provided." },
          case_strength_justification: { type: Type.STRING, description: "A brief 1-sentence explanation of why this score was given." },
          emergency_contacts: {
            type: Type.OBJECT,
            properties: {
              police: { type: Type.STRING },
              helpline: { type: Type.STRING },
              women_helpline: { type: Type.STRING }
            }
          }
        },
        required: [
          "crime_category", "ppc_sections", "crime_severity", "jurisdiction_police_station",
          "fir_draft_english", "fir_draft_urdu", "documents_required", "legal_rights",
          "steps_to_file", "important_warnings", "emergency_contacts"
        ]
      }
    }
  });

  return JSON.parse(response.text || '{}') as FIRResult;
};
