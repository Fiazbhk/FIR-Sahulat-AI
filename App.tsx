
import React, { useState } from 'react';
import { Shield, FileText, AlertTriangle, ChevronRight, Download, Info, Landmark, MapPin, User, Calendar, Scale, Globe, ArrowRight, Mic } from 'lucide-react';
import { analyzeIncident } from './services/geminiService';
import { FormData, FIRResult } from './types';
import jsPDF from 'jspdf';

const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Gujranwala", "Sialkot", "Hyderabad", "Bahawalpur", "Sargodha", "Sukkur", "Larkana", "Other"];

const CRIME_TYPES = [
  "Let AI Decide Automatically",
  "Theft / چوری (Section 378-382)",
  "Robbery / ڈکیتی (Section 390-402)",
  "Fraud / دھوکہ دہی (Section 420)",
  "Assault / مار پیٹ (Section 351-358)",
  "Kidnapping / اغوا (Section 359-374)",
  "Cybercrime / سائبر کرائم (PECA 2016)",
  "Domestic Violence / گھریلو تشدد",
  "Property Dispute / جائیداد تنازعہ",
  "Murder / Attempt to Murder (Section 299-338)",
  "Sexual Harassment (Section 509 PPC)",
  "Other"
];

const getPoliceStationMap = (city: string) => {
  const stationCoords: Record<string, any> = {
    "Lahore": {
      "default": ["31.5204", "74.3587", "Lahore+Police+Station"],
    },
    "Karachi": {
      "default": ["24.8607", "67.0011", "Karachi+Police+Station"],
    },
    "Islamabad": {
      "default": ["33.6844", "73.0479", "Islamabad+Police+Station"],
    },
    "Rawalpindi": {
      "default": ["33.5651", "73.0169", "Rawalpindi+Police+Station"],
    },
    "Peshawar": {
      "default": ["34.0151", "71.5249", "Peshawar+Police+Station"],
    },
    "Quetta": {
      "default": ["30.1798", "66.9750", "Quetta+Police+Station"],
    },
    "Faisalabad": {
      "default": ["31.4504", "73.1350", "Faisalabad+Police+Station"],
    },
    "Multan": {
      "default": ["30.1575", "71.5249", "Multan+Police+Station"],
    },
  };

  const cityData = stationCoords[city] || stationCoords["Lahore"];
  const [lat, lng, query] = cityData.default;
  const embedUrl = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/search/${query}`;
  return { embedUrl, directionsUrl };
};

const getWhatsAppMessage = (result: FIRResult, formData: FormData) => {
  const name = formData.complainant_name || 'N/A';
  const crime = result.crime_category || 'N/A';
  const sections = result.ppc_sections.join(', ');
  const city = formData.city || 'N/A';
  const strength = result.case_strength || 'N/A';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const message = `*FIR Sahulat AI — FIR Summary*
━━━━━━━━━━━━━━━━━━━━
👤 *Complainant:* ${name}
📅 *Date:* ${date}
🏙️ *City:* ${city}
━━━━━━━━━━━━━━━━━━━━
⚖️ *Crime:* ${crime}
📜 *PPC Sections:* ${sections}
💪 *Case Strength:* ${strength}/10
━━━━━━━━━━━━━━━━━━━━
✅ FIR Draft generated via FIR Sahulat AI
🔗 firsahulat.com
━━━━━━━━━━━━━━━━━━━━
_Yeh message FIR Sahulat AI se generate ki gayi hai. FIR file karne se pehle lawyer se raabta karein._`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    incident_text: '',
    complainant_name: '',
    complainant_father_name: '',
    complainant_cnic: '',
    complainant_phone: '',
    complainant_caste: '',
    complainant_occupation: '',
    complainant_address: '',
    city: 'Lahore',
    incident_date: new Date().toISOString().split('T')[0],
    incident_location: '',
    accused_info: '',
    language: 'Urdu + English (Both)',
    crime_hint: 'Let AI Decide Automatically'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<FIRResult | null>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({
        ...prev,
        incident_text: prev.incident_text ? `${prev.incident_text} ${transcript}` : transcript
      }));
    };

    recognition.start();
  };

  const [activeTab, setActiveTab] = useState<'english' | 'urdu' | 'rights' | 'steps'>('english');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.incident_text.trim()) {
      alert("Please describe the incident.");
      return;
    }
    if (!formData.complainant_name.trim()) {
      alert("Please enter your name.");
      return;
    }

    setIsLoading(true);
    try {
      const analysis = await analyzeIncident(formData);
      setResult(analysis);
      // Scroll to result section
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error(error);
      alert("An error occurred while generating the report. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = (lang: 'en' | 'ur') => {
    if (!result) return;
    const doc = new jsPDF();
    
    // Header background - Deep Forest Green (#1a3d2b)
    doc.setFillColor(26, 61, 43);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('FIR SAHULAT - FIR DRAFT', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('AI-Generated Legal Guidance | Pakistan', 105, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Complainant: ${formData.complainant_name}`, 20, 50);
    doc.text(`City: ${formData.city}`, 100, 50);
    doc.text(`Date: ${formData.incident_date}`, 160, 50);

    doc.setLineWidth(0.5);
    doc.setDrawColor(201, 168, 76); // Accent Gold (#c9a84c)
    doc.line(20, 55, 190, 55);

    doc.setFont("helvetica", "bold");
    doc.text('CRIME ANALYSIS', 20, 65);
    doc.setFont("helvetica", "normal");
    doc.text(`Category: ${result.crime_category}`, 20, 72);
    doc.text(`Severity: ${result.crime_severity}`, 20, 79);
    doc.text(`Sections: ${result.ppc_sections.join(', ')}`, 20, 86);

    doc.setFont("helvetica", "bold");
    const title = lang === 'en' ? 'ENGLISH FIR DRAFT' : 'URDU FIR DRAFT (Translated)';
    doc.text(title, 20, 100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const content = lang === 'en' ? result.fir_draft_english : result.fir_draft_urdu;
    const splitText = doc.splitTextToSize(content, 170);
    doc.text(splitText, 20, 107);

    const fileName = lang === 'en' ? `FIR_English_Draft_${formData.complainant_name.replace(/\s+/g, '_')}.pdf` : `FIR_Urdu_Draft_${formData.complainant_name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const downloadUrduDraft = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result.fir_draft_urdu], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `FIR_Urdu_Draft_${formData.complainant_name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-6 py-2 mb-6">
          <Scale className="w-5 h-5 text-primary" />
          <span className="text-primary font-semibold tracking-wider text-xs uppercase">FIR Sahulat AI</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 tracking-tight text-primary">
          Your <span className="text-accent">FIR Filing</span> Assistant
        </h1>
        <p className="text-legal-gray text-lg md:text-xl max-w-2xl mx-auto mb-2">
          AI-powered FIR drafting in Urdu & English — Know your rights, file with confidence.
        </p>
      </header>

      <hr className="border-legal-border mb-12" />

      {/* Main Form Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Left Column: Input 1 & 2 */}
        <div className="space-y-8">
          <section className="bg-white border border-legal-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">1</div>
              <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-primary"><FileText className="w-5 h-5" /> Describe Incident</h3>
            </div>
            <div className="relative">
              <textarea
                name="incident_text"
                value={formData.incident_text}
                onChange={handleInputChange}
                className="w-full bg-white border border-legal-border rounded-xl p-4 text-charcoal focus:ring-2 focus:ring-primary outline-none transition-all h-48"
                placeholder="Describe what happened in Urdu, Roman Urdu, or English. Example: Yesterday night at 10 PM, thieves entered my home and stole..."
              />
              <button
                type="button"
                onClick={startListening}
                className={`absolute bottom-4 right-4 p-2 rounded-full transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-paper text-primary hover:bg-legal-border'}`}
                title="Voice Input"
              >
                <div className="flex items-center gap-2">
                  {isListening && <span className="text-[10px] font-bold uppercase px-1">Listening...</span>}
                  <Mic className="w-5 h-5" />
                </div>
              </button>
            </div>
          </section>

          <section className="bg-white border border-legal-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">2</div>
              <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-primary"><User className="w-5 h-5" /> Complainant Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">Full Name</label>
                <input
                  name="complainant_name"
                  type="text"
                  value={formData.complainant_name}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-legal-border rounded-xl px-4 py-3 text-charcoal focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Muhammad Ali"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">Father's Name</label>
                <input
                  name="complainant_father_name"
                  type="text"
                  value={formData.complainant_father_name}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-legal-border rounded-xl px-4 py-3 text-charcoal focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Ahmad Khan"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">Phone Number</label>
                  <input
                    name="complainant_phone"
                    type="text"
                    value={formData.complainant_phone}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-legal-border rounded-xl px-4 py-3 text-charcoal focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. 0300-1234567"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">Caste / Qom</label>
                  <input
                    name="complainant_caste"
                    type="text"
                    value={formData.complainant_caste}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-legal-border rounded-xl px-4 py-3 text-charcoal focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. Rajput"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">Occupation</label>
                <input
                  name="complainant_occupation"
                  type="text"
                  value={formData.complainant_occupation}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-legal-border rounded-xl px-4 py-3 text-charcoal focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Businessman / Farmer"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">CNIC (Optional)</label>
                <input
                  name="complainant_cnic"
                  type="text"
                  value={formData.complainant_cnic}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-legal-border rounded-xl px-4 py-3 text-charcoal focus:ring-2 focus:ring-primary outline-none"
                  placeholder="35202-xxxxxxx-x"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">Residential Address</label>
                <textarea
                  name="complainant_address"
                  value={formData.complainant_address}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-legal-border rounded-xl p-4 text-charcoal focus:ring-2 focus:ring-primary outline-none h-24"
                  placeholder="Enter your complete residential address..."
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">Language Preference</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-legal-border rounded-xl px-4 py-3 text-charcoal focus:ring-2 focus:ring-primary outline-none"
                >
                  <option>Urdu + English (Both)</option>
                  <option>English Only</option>
                  <option>Urdu Only</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Input 3 & 4 */}
        <div className="space-y-8">
          <section className="bg-white border border-legal-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">3</div>
              <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-primary"><MapPin className="w-5 h-5" /> Time & Location</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">City</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-legal-border rounded-xl px-4 py-3 text-charcoal focus:ring-2 focus:ring-primary outline-none"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">Incident Date</label>
                <input
                  name="incident_date"
                  type="date"
                  value={formData.incident_date}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-legal-border rounded-xl px-4 py-3 text-charcoal focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">Exact Location</label>
              <input
                name="incident_location"
                type="text"
                value={formData.incident_location}
                onChange={handleInputChange}
                className="w-full bg-white border border-legal-border rounded-xl px-4 py-3 text-charcoal focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. Barkat Market, Lahore"
              />
            </div>
          </section>

          <section className="bg-white border border-legal-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">4</div>
              <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-primary"><Landmark className="w-5 h-5" /> Additional Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">Accused Info (If any)</label>
                <textarea
                  name="accused_info"
                  value={formData.accused_info}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-legal-border rounded-xl p-4 text-charcoal focus:ring-2 focus:ring-primary outline-none h-24"
                  placeholder="Names, descriptions, or vehicle numbers of suspects..."
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-legal-gray mb-1 ml-1">Primary Crime Category</label>
                <select
                  name="crime_hint"
                  value={formData.crime_hint}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-legal-border rounded-xl px-4 py-3 text-charcoal focus:ring-2 focus:ring-primary outline-none"
                >
                  {CRIME_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-center mb-20">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-primary to-primary-light hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed px-12 py-5 rounded-2xl text-xl font-bold transition-all shadow-xl active:scale-95 text-white"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing...</span>
            </div>
          ) : (
            <>
              <Scale className="w-6 h-6" />
              <span>Generate FIR Draft</span>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* Result Section */}
      {result && (
        <div id="result-section" className="space-y-12 animate-in fade-in duration-700">
          <header className="text-center">
            <h2 className="text-3xl font-serif font-bold mb-4 text-primary">Legal Analysis Result</h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
          </header>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-legal-border p-6 rounded-2xl shadow-sm">
              <h4 className="text-legal-gray text-xs font-bold uppercase mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Crime Category
              </h4>
              <div className="inline-block bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg text-primary font-semibold mb-2">
                {result.crime_category}
              </div>
              <p className="text-legal-gray text-sm">Severity: <span className="text-rose-600 font-bold">{result.crime_severity}</span></p>
            </div>

            <div className="bg-white border border-legal-border p-6 rounded-2xl shadow-sm">
              <h4 className="text-legal-gray text-xs font-bold uppercase mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4" /> PPC Sections
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.ppc_sections.map((section, idx) => (
                  <span key={idx} className="bg-primary/10 border border-primary/20 px-2 py-1 rounded text-primary text-xs font-medium">
                    {section}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-legal-border p-6 rounded-2xl shadow-sm">
              <h4 className="text-legal-gray text-xs font-bold uppercase mb-4 flex items-center gap-2">
                <Landmark className="w-4 h-4" /> Jurisdiction
              </h4>
              <p className="text-charcoal font-medium">{result.jurisdiction_police_station}</p>
            </div>

            <div className="bg-white border border-legal-border p-6 rounded-2xl shadow-sm md:col-span-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-legal-gray text-xs font-bold uppercase mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Case Strength Analysis
                  </h4>
                  <p className="text-charcoal text-sm italic">"{result.case_strength_justification}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-grow md:w-48 h-3 bg-paper rounded-full overflow-hidden border border-legal-border">
                    <div 
                      className={`h-full transition-all duration-1000 ${result.case_strength >= 7 ? 'bg-emerald-500' : result.case_strength >= 4 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${result.case_strength * 10}%` }}
                    ></div>
                  </div>
                  <span className="text-2xl font-serif font-bold text-primary">{result.case_strength}/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp + Map Section */}
          <div className="bg-[#f0f7f2] border border-[#c8ddd0] rounded-2xl p-6 shadow-sm">
            <p className="text-primary text-[10px] font-bold tracking-[2px] uppercase mb-6">📤 Share & Navigate</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <a 
                  href={getWhatsAppMessage(result, formData)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 bg-[#25D366] text-white rounded-xl py-4 font-bold text-sm shadow-lg hover:opacity-90 transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Share کریں
                </a>
                <a 
                  href={getPoliceStationMap(formData.city).directionsUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 bg-primary text-white rounded-xl py-4 font-bold text-sm shadow-lg hover:opacity-90 transition-all"
                >
                  📍 Police Station Dhundein
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-legal-border shadow-inner">
                <div className="bg-primary px-4 py-2 flex items-center justify-between">
                  <span className="text-white text-xs font-bold flex items-center gap-2">📍 Nearest Station — {formData.city}</span>
                  <span className="text-accent text-[10px] font-bold uppercase">Google Maps</span>
                </div>
                <iframe 
                  src={getPoliceStationMap(formData.city).embedUrl}
                  width="100%" 
                  height="160" 
                  style={{ border: 0, display: 'block' }} 
                  allowFullScreen 
                  loading="lazy"
                  title="Police Station Map"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Main Draft Tabs */}
          <div className="bg-white border border-legal-border rounded-3xl overflow-hidden shadow-md">
            <div className="flex flex-wrap border-b border-legal-border bg-[#ece8df]">
              <button
                onClick={() => setActiveTab('english')}
                className={`px-8 py-5 font-bold transition-all border-b-2 ${activeTab === 'english' ? 'text-white border-primary bg-primary' : 'text-legal-gray border-transparent hover:text-primary'}`}
              >
                Draft (English)
              </button>
              <button
                onClick={() => setActiveTab('urdu')}
                className={`px-8 py-5 font-bold transition-all border-b-2 ${activeTab === 'urdu' ? 'text-white border-primary bg-primary' : 'text-legal-gray border-transparent hover:text-primary'}`}
              >
                مسودہ (اردو)
              </button>
              <button
                onClick={() => setActiveTab('rights')}
                className={`px-8 py-5 font-bold transition-all border-b-2 ${activeTab === 'rights' ? 'text-white border-primary bg-primary' : 'text-legal-gray border-transparent hover:text-primary'}`}
              >
                Rights & Docs
              </button>
              <button
                onClick={() => setActiveTab('steps')}
                className={`px-8 py-5 font-bold transition-all border-b-2 ${activeTab === 'steps' ? 'text-white border-primary bg-primary' : 'text-legal-gray border-transparent hover:text-primary'}`}
              >
                Step-by-Step Guide
              </button>
            </div>

            <div className="p-8 min-h-[400px]">
              {activeTab === 'english' && (
                <div className="bg-[#fffef9] p-8 rounded-2xl text-charcoal leading-relaxed whitespace-pre-wrap font-mono text-sm border border-legal-border shadow-inner">
                  {result.fir_draft_english}
                </div>
              )}
              {activeTab === 'urdu' && (
                <div className="bg-[#fffef9] p-12 rounded-2xl text-charcoal leading-[2.5] whitespace-pre-wrap urdu-text text-xl border border-legal-border shadow-xl text-right" dir="rtl">
                  {result.fir_draft_urdu}
                </div>
              )}
              {activeTab === 'rights' && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="font-serif font-bold text-lg text-primary flex items-center gap-2"><Scale className="w-5 h-5" /> Your Legal Rights</h5>
                    <ul className="space-y-3">
                      {result.legal_rights.map((right, i) => (
                        <li key={i} className="bg-[#f0f7f2] border border-legal-border p-3 rounded-xl text-[#166534] text-sm flex gap-3">
                          <span className="text-primary font-bold">✓</span> {right}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h5 className="font-serif font-bold text-lg text-primary flex items-center gap-2"><FileText className="w-5 h-5" /> Documents Required</h5>
                    <ul className="space-y-3">
                      {result.documents_required.map((doc, i) => (
                        <li key={i} className="bg-[#f9f7f2] border border-legal-border p-3 rounded-xl text-charcoal text-sm flex gap-3">
                          <span className="text-primary">📎</span> {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {activeTab === 'steps' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  {result.steps_to_file.map((step, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0 mt-1 shadow-lg group-hover:scale-110 transition-transform">
                        {i + 1}
                      </div>
                      <div className="bg-[#f9f7f2] border border-legal-border p-4 rounded-xl flex-grow text-[#374151]">
                        {step}
                      </div>
                    </div>
                  ))}
                  {/* Emergency Contacts */}
                  <div className="mt-12 bg-[#f9f7f2] border border-legal-border p-6 rounded-2xl">
                    <h5 className="font-serif font-bold text-primary mb-4 flex items-center gap-2">📞 Emergency Contacts</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between border-b border-legal-border pb-2">
                        <span className="text-legal-gray">Police</span>
                        <span className="text-primary font-mono font-bold">{result.emergency_contacts.police}</span>
                      </div>
                      <div className="flex justify-between border-b border-legal-border pb-2">
                        <span className="text-legal-gray">Helpline</span>
                        <span className="text-primary font-mono font-bold">{result.emergency_contacts.helpline}</span>
                      </div>
                      <div className="flex justify-between border-b border-legal-border pb-2">
                        <span className="text-legal-gray">Women Helpline</span>
                        <span className="text-primary font-mono font-bold">{result.emergency_contacts.women_helpline}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download & Bottom Actions */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => downloadPDF('en')}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-light hover:opacity-90 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl"
              >
                <Download className="w-5 h-5" /> Download English PDF
              </button>
            </div>
            <p className="text-legal-gray text-sm max-w-lg text-center">
              Note: This is an AI-generated draft. Please verify all details and consult legal counsel before signing or submitting to a police station.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-24 pt-12 border-t border-legal-border text-center text-legal-gray pb-12">
        {/* Warning Box */}
        <div className="bg-[#fef9ec] border border-accent p-4 rounded-xl flex gap-4 items-start mb-8 max-w-4xl mx-auto text-left">
          <AlertTriangle className="w-6 h-6 text-accent shrink-0 mt-1" />
          <div className="text-[#78530a] text-sm">
            <p className="font-bold mb-1">Important Legal Notice:</p>
            <p>This tool generates AI-assisted FIR drafts for guidance only. Always consult a qualified lawyer (وکیل) before filing. This is not a substitute for professional legal advice.</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Scale className="w-5 h-5 text-legal-gray" />
          <span className="font-serif font-bold text-primary">FIR SAHULAT AI</span>
        </div>
        <p className="text-sm mb-2">Empowering Pakistani Citizens Through Legal Awareness</p>
        <p className="text-xs text-legal-gray">Built with React + Gemini AI | Based on Pakistan Penal Code & CrPC</p>
        <div className="mt-8 text-[10px] uppercase tracking-widest text-[#9a9a8a]">
          Educational Purpose Only
        </div>
      </footer>
    </div>
  );
};

export default App;
