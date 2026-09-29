import React, { useState, useEffect } from 'react';
import { getGovernanceStats } from '../services/api';
import { Card, Badge, Button } from '../components/ui/components';
import { 
  Building2, MapPin, Globe, ShieldAlert, Users, Award, 
  TrendingUp, AlertTriangle, CheckCircle, RefreshCw, IndianRupee,
  Shield, Scale, HeartHandshake, PhoneCall, ArrowUpRight, Search, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Complete India States & Union Territories with Districts ────────────────
const INDIA_STATES_AND_UTS = {
  // ── 28 States ──
  "Andhra Pradesh": {
    type: "State", capital: "Amaravati",
    districts: ["Anantapur","Chittoor","East Godavari","Guntur","Kadapa","Krishna","Kurnool","Nellore","Prakasam","Srikakulam","Visakhapatnam","Vizianagaram","West Godavari","Alluri Sitharama Raju","Anakapalli","Bapatla","Eluru","Kakinada","Konaseema","Nandyal","NTR","Palnadu","Parvathipuram Manyam","Sri Sathya Sai","Tirupati"]
  },
  "Arunachal Pradesh": {
    type: "State", capital: "Itanagar",
    districts: ["Anjaw","Changlang","Dibang Valley","East Kameng","East Siang","Kamle","Kra Daadi","Kurung Kumey","Lepa Rada","Lohit","Longding","Lower Dibang Valley","Lower Siang","Lower Subansiri","Namsai","Pakke Kessang","Papum Pare","Shi Yomi","Siang","Tawang","Tirap","Upper Siang","Upper Subansiri","West Kameng","West Siang"]
  },
  "Assam": {
    type: "State", capital: "Dispur",
    districts: ["Baksa","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang","Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi","Hojai","Jorhat","Kamrup","Kamrup Metropolitan","Karbi Anglong","Karimganj","Kokrajhar","Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Sivasagar","Sonitpur","South Salmara-Mankachar","Tinsukia","Udalguri","West Karbi Anglong"]
  },
  "Bihar": {
    type: "State", capital: "Patna",
    districts: ["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"]
  },
  "Chhattisgarh": {
    type: "State", capital: "Raipur",
    districts: ["Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada","Dhamtari","Durg","Gariaband","Gaurela-Pendra-Marwahi","Janjgir-Champa","Jashpur","Kanker","Kawardha","Kondagaon","Korba","Koriya","Mahasamund","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sukma","Surajpur","Surguja"]
  },
  "Goa": {
    type: "State", capital: "Panaji",
    districts: ["North Goa","South Goa"]
  },
  "Gujarat": {
    type: "State", capital: "Gandhinagar",
    districts: ["Ahmedabad","Amreli","Anand","Aravalli","Banaskantha","Bharuch","Bhavnagar","Botad","Chhota Udaipur","Dahod","Dang","Devbhoomi Dwarka","Gandhinagar","Gir Somnath","Jamnagar","Junagadh","Kachchh","Kheda","Mahisagar","Mehsana","Morbi","Narmada","Navsari","Panchmahal","Patan","Porbandar","Rajkot","Sabarkantha","Surat","Surendranagar","Tapi","Vadodara","Valsad"]
  },
  "Haryana": {
    type: "State", capital: "Chandigarh",
    districts: ["Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram","Hisar","Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Nuh","Palwal","Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"]
  },
  "Himachal Pradesh": {
    type: "State", capital: "Shimla",
    districts: ["Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul and Spiti","Mandi","Shimla","Sirmaur","Solan","Una"]
  },
  "Jharkhand": {
    type: "State", capital: "Ranchi",
    districts: ["Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih","Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahebganj","Seraikela-Kharsawan","Simdega","West Singhbhum"]
  },
  "Karnataka": {
    type: "State", capital: "Bengaluru",
    districts: ["Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban","Bidar","Chamarajanagar","Chikkaballapur","Chikkamagaluru","Chitradurga","Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal","Mandya","Mysuru","Raichur","Ramanagara","Shivamogga","Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir"]
  },
  "Kerala": {
    type: "State", capital: "Thiruvananthapuram",
    districts: ["Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"]
  },
  "Madhya Pradesh": {
    type: "State", capital: "Bhopal",
    districts: ["Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Hoshangabad","Indore","Jabalpur","Jhabua","Katni","Khandwa","Khargone","Mandla","Mandsaur","Morena","Narsinghpur","Neemuch","Niwari","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha"]
  },
  "Maharashtra": {
    type: "State", capital: "Mumbai",
    districts: ["Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"]
  },
  "Manipur": {
    type: "State", capital: "Imphal",
    districts: ["Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching","Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul"]
  },
  "Meghalaya": {
    type: "State", capital: "Shillong",
    districts: ["East Garo Hills","East Jaintia Hills","East Khasi Hills","North Garo Hills","Ri Bhoi","South Garo Hills","South West Garo Hills","South West Khasi Hills","West Garo Hills","West Jaintia Hills","West Khasi Hills"]
  },
  "Mizoram": {
    type: "State", capital: "Aizawl",
    districts: ["Aizawl","Champhai","Hnahthial","Khawzawl","Kolasib","Lawngtlai","Lunglei","Mamit","Saiha","Saitual","Serchhip"]
  },
  "Nagaland": {
    type: "State", capital: "Kohima",
    districts: ["Chümoukedima","Dimapur","Kiphire","Kohima","Longleng","Mokokchung","Mon","Niuland","Noklak","Peren","Phek","Shamator","Tseminyü","Tuensang","Wokha","Zunheboto"]
  },
  "Odisha": {
    type: "State", capital: "Bhubaneswar",
    districts: ["Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh","Dhenkanal","Gajapati","Ganjam","Jagatsinghpur","Jajpur","Jharsuguda","Kalahandi","Kandhamal","Kendrapara","Kendujhar","Khordha","Koraput","Malkangiri","Mayurbhanj","Nabarangpur","Nayagarh","Nuapada","Puri","Rayagada","Sambalpur","Subarnapur","Sundargarh"]
  },
  "Punjab": {
    type: "State", capital: "Chandigarh",
    districts: ["Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur","Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Malerkotla","Mansa","Moga","Mohali","Muktsar","Pathankot","Patiala","Rupnagar","Sangrur","Shaheed Bhagat Singh Nagar","Tarn Taran"]
  },
  "Rajasthan": {
    type: "State", capital: "Jaipur",
    districts: ["Ajmer","Alwar","Banswara","Baran","Barmer","Bharatpur","Bhilwara","Bikaner","Bundi","Chittorgarh","Churu","Dausa","Dholpur","Dungarpur","Hanumangarh","Jaipur","Jaisalmer","Jalore","Jhalawar","Jhunjhunu","Jodhpur","Karauli","Kota","Nagaur","Pali","Pratapgarh","Rajsamand","Sawai Madhopur","Sikar","Sirohi","Sri Ganganagar","Tonk","Udaipur"]
  },
  "Sikkim": {
    type: "State", capital: "Gangtok",
    districts: ["East Sikkim","North Sikkim","South Sikkim","West Sikkim","Pakyong","Soreng"]
  },
  "Tamil Nadu": {
    type: "State", capital: "Chennai",
    districts: ["Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kancheepuram","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar"]
  },
  "Telangana": {
    type: "State", capital: "Hyderabad",
    districts: ["Adilabad","Bhadradri Kothagudem","Hyderabad","Jagtial","Jangaon","Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam","Kumuram Bheem","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal–Malkajgiri","Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal","Nizamabad","Peddapalli","Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy","Warangal Rural","Warangal Urban","Yadadri Bhuvanagiri"]
  },
  "Tripura": {
    type: "State", capital: "Agartala",
    districts: ["Dhalai","Gomati","Khowai","North Tripura","Sepahijala","South Tripura","Unakoti","West Tripura"]
  },
  "Uttar Pradesh": {
    type: "State", capital: "Lucknow",
    districts: ["Agra","Aligarh","Ambedkar Nagar","Amethi","Amroha","Auraiya","Ayodhya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti","Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Farrukhabad","Fatehpur","Firozabad","Gautam Buddh Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi","Kushinagar","Lakhimpur Kheri","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","Prayagraj","Rae Bareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur","Shamli","Shravasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"]
  },
  "Uttarakhand": {
    type: "State", capital: "Dehradun",
    districts: ["Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital","Pauri Garhwal","Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar","Uttarkashi"]
  },
  "West Bengal": {
    type: "State", capital: "Kolkata",
    districts: ["Alipurduar","Bankura","Birbhum","Cooch Behar","Dakshin Dinajpur","Darjeeling","Hooghly","Howrah","Jalpaiguri","Jhargram","Kalimpong","Kolkata","Malda","Murshidabad","Nadia","North 24 Parganas","Paschim Bardhaman","Paschim Medinipur","Purba Bardhaman","Purba Medinipur","Purulia","South 24 Parganas","Uttar Dinajpur"]
  },
  // ── 8 Union Territories ──
  "Andaman and Nicobar Islands": {
    type: "Union Territory", capital: "Port Blair",
    districts: ["Nicobar","North and Middle Andaman","South Andaman"]
  },
  "Chandigarh": {
    type: "Union Territory", capital: "Chandigarh",
    districts: ["Chandigarh"]
  },
  "Dadra and Nagar Haveli and Daman and Diu": {
    type: "Union Territory", capital: "Daman",
    districts: ["Dadra and Nagar Haveli","Daman","Diu"]
  },
  "Delhi": {
    type: "Union Territory", capital: "New Delhi",
    districts: ["Central Delhi","East Delhi","New Delhi","North Delhi","North East Delhi","North West Delhi","Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"]
  },
  "Jammu and Kashmir": {
    type: "Union Territory", capital: "Srinagar / Jammu",
    districts: ["Anantnag","Bandipora","Baramulla","Budgam","Doda","Ganderbal","Jammu","Kathua","Kishtwar","Kulgam","Kupwara","Poonch","Pulwama","Rajouri","Ramban","Reasi","Samba","Shopian","Srinagar","Udhampur"]
  },
  "Ladakh": {
    type: "Union Territory", capital: "Leh",
    districts: ["Kargil","Leh"]
  },
  "Lakshadweep": {
    type: "Union Territory", capital: "Kavaratti",
    districts: ["Lakshadweep"]
  },
  "Puducherry": {
    type: "Union Territory", capital: "Puducherry",
    districts: ["Karaikal","Mahe","Puducherry","Yanam"]
  }
};

const ALL_STATE_NAMES = Object.keys(INDIA_STATES_AND_UTS).sort();
const STATE_NAMES = ALL_STATE_NAMES.filter(s => INDIA_STATES_AND_UTS[s].type === "State");
const UT_NAMES = ALL_STATE_NAMES.filter(s => INDIA_STATES_AND_UTS[s].type === "Union Territory");

const GovernanceDashboard = () => {
  const navigate = useNavigate();
  const [level, setLevel] = useState('national');
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState('Varanasi');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');

  // Get districts for the selected state
  const currentDistricts = INDIA_STATES_AND_UTS[selectedState]?.districts || [];

  // When state changes, auto-select first district
  useEffect(() => {
    if (currentDistricts.length > 0 && !currentDistricts.includes(selectedDistrict)) {
      setSelectedDistrict(currentDistricts[0]);
    }
  }, [selectedState]);

  useEffect(() => {
    loadData();
  }, [level, selectedDistrict, selectedState]);

  const loadData = async () => {
    setLoading(true);
    const param = level === 'district' ? selectedDistrict : (level === 'state' ? selectedState : null);
    const res = await getGovernanceStats(level, param);
    if (res?.data) {
      setStats(res.data);
    }
    setLoading(false);
  };

  // Filter helpers for search
  const filteredStates = stateSearch
    ? STATE_NAMES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
    : STATE_NAMES;
  const filteredUTs = stateSearch
    ? UT_NAMES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
    : UT_NAMES;
  const filteredDistricts = districtSearch
    ? currentDistricts.filter(d => d.toLowerCase().includes(districtSearch.toLowerCase()))
    : currentDistricts;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>NHAA 14566 National Atrocity Monitoring Framework</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1.5 flex items-center space-x-2">
            <span>Multi-Level Governance Command Center</span>
          </h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
            Continuous psychological distress surveillance, witness protection tracking, and relief disbursement oversight across District, State, and National tiers under the PoA Act.
          </p>
        </div>

        {/* Level Switcher Tabs */}
        <div className="bg-white/10 p-1.5 rounded-xl flex items-center space-x-1 border border-white/15 shrink-0">
          <button
            onClick={() => setLevel('district')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              level === 'district' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>District Tier (DM/SP)</span>
          </button>
          <button
            onClick={() => setLevel('state')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              level === 'state' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>State Tier (DGP/Secy)</span>
          </button>
          <button
            onClick={() => setLevel('national')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              level === 'national' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>National (NHAA 14566)</span>
          </button>
        </div>
      </div>

      {/* ─── State & District Information Section ─── */}
      {(level === 'state' || level === 'district') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">
                {level === 'state' ? 'Select State / Union Territory' : 'Select State & District'}
              </h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                {STATE_NAMES.length} States + {UT_NAMES.length} Union Territories
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-slate-500">
              <Globe className="w-3 h-3" />
              <span>Republic of India — All Jurisdictions</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* State/UT Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>State / Union Territory</span>
                {INDIA_STATES_AND_UTS[selectedState] && (
                  <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    INDIA_STATES_AND_UTS[selectedState].type === 'State'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-violet-100 text-violet-700 border border-violet-200'
                  }`}>
                    {INDIA_STATES_AND_UTS[selectedState].type} • Capital: {INDIA_STATES_AND_UTS[selectedState].capital}
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => { setSelectedState(e.target.value); setStateSearch(''); }}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer pr-10"
                >
                  <optgroup label="── 28 States ──">
                    {STATE_NAMES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── 8 Union Territories ──">
                    {UT_NAMES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* District Selector — only visible in district level */}
            {level === 'district' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>District in {selectedState}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold ml-2">
                    {currentDistricts.length} Districts
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 appearance-none cursor-pointer pr-10"
                  >
                    {currentDistricts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Quick Info Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100 text-center">
                <p className="text-[10px] text-indigo-600 font-bold uppercase">Type</p>
                <p className="text-xs font-bold text-indigo-900 mt-0.5">{INDIA_STATES_AND_UTS[selectedState]?.type}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 text-center">
                <p className="text-[10px] text-emerald-600 font-bold uppercase">Capital</p>
                <p className="text-xs font-bold text-emerald-900 mt-0.5">{INDIA_STATES_AND_UTS[selectedState]?.capital}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 text-center">
                <p className="text-[10px] text-amber-600 font-bold uppercase">Total Districts</p>
                <p className="text-xs font-bold text-amber-900 mt-0.5">{currentDistricts.length}</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-3 border border-rose-100 text-center">
                <p className="text-[10px] text-rose-600 font-bold uppercase">Selected Level</p>
                <p className="text-xs font-bold text-rose-900 mt-0.5">{level === 'district' ? selectedDistrict : selectedState}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scope Sub-Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium">Active Jurisdiction Scope:</span>
          <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            {stats?.scope_name || 'Loading Scope...'}
          </span>
        </div>

        <button 
          onClick={loadData}
          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer self-end sm:self-auto"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 5 High-Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Monitored Victims</p>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_monitored_victims || 15}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Registered via NHAA 14566</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500 bg-rose-50/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-rose-700 font-bold">Critical Distress Alerts</p>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats?.critical_distress_cases || 6}</p>
          <p className="text-[10px] text-rose-500 font-medium mt-0.5">Urgent Triage Required</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-amber-800 font-bold">7-Day Crisis Surge Forecast</p>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats?.predictive_7d_crisis_surges || 5}</p>
          <p className="text-[10px] text-amber-600 mt-0.5">Pre-Trial Court Dread</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-800 font-bold">Witness Protection</p>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats?.witnesses_under_protection || 8}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Active Armed Sec 15A</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Relief Disbursed (DBT)</p>
            <IndianRupee className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-slate-800 mt-1">{stats?.relief_compensation_disbursed_inr || '₹ 57.75 Lakhs'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Pending: {stats?.relief_compensation_pending_inr || '₹ 81.0 Lakhs'}</p>
        </Card>

      </div>

      {/* Grid: Priority Use Cases & Legal Lifecycle Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Priority Use Cases Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Priority Atrocity Use Cases Surveillance</span>
              </h3>
              <p className="text-xs text-slate-500">Mandatory high-scrutiny categories under Central PoA Rules</p>
            </div>
            <Badge variant="rose">100% Tracking</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-rose-900 block">Victims of Rape & Gang Rape (IPC 376DA / PoA Sec 3(2)(v))</span>
                <span className="text-[10px] text-rose-600">Acute trauma, court intimidation & social stigma tracking</span>
              </div>
              <span className="text-base font-extrabold text-rose-700 bg-white px-3 py-1 rounded-lg shadow-xs border border-rose-200">
                {stats?.priority_use_cases?.rape_gang_rape || 4}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900 block">Murder, Grievous Hurt & Arson (IPC 302/326/436)</span>
                <span className="text-[10px] text-amber-700">Homestead destruction, safe house shelter & urgent relief</span>
              </div>
              <span className="text-base font-extrabold text-amber-700 bg-white px-3 py-1 rounded-lg shadow-xs border border-amber-200">
                {stats?.priority_use_cases?.murder_arson_grievous || 4}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-indigo-900 block">Witnesses Facing Intimidation or Threats (Sec 15A)</span>
                <span className="text-[10px] text-indigo-600">24/7 Armed protection escort & bail cancellation monitoring</span>
              </div>
              <span className="text-base font-extrabold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-xs border border-indigo-200">
                {stats?.priority_use_cases?.witness_intimidation || 4}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Caste-Based Violence & Social Boycott (PoA Sec 3)</span>
                <span className="text-[10px] text-slate-500">Economic hardship, water access & community rehabilitation</span>
              </div>
              <span className="text-base font-extrabold text-slate-700 bg-white px-3 py-1 rounded-lg shadow-xs border border-slate-200">
                {stats?.priority_use_cases?.caste_violence_boycott || 3}
              </span>
            </div>
          </div>
        </Card>

        {/* Legal Lifecycle Stage Distribution */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>4-Stage Legal Lifecycle Distribution</span>
              </h3>
              <p className="text-xs text-slate-500">Monitoring psychological distress at each procedural bottleneck</p>
            </div>
            <Badge variant="default">All Stages Active</Badge>
          </div>

          <div className="space-y-3.5 text-xs">
            
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-slate-700">1. Investigation (FIR & Forensics)</span>
                <span className="text-indigo-600">{stats?.legal_lifecycle_distribution?.investigation || 4} Cases (27%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '27%' }}></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Distress focus: Delay in arrest of perpetrators & forensic anxiety</p>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-rose-700 font-bold">2. Trial (Court Hearings & Deposition)</span>
                <span className="text-rose-600 font-bold">{stats?.legal_lifecycle_distribution?.trial || 6} Cases (40%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '40%' }}></div>
              </div>
              <p className="text-[10px] text-rose-500 font-medium mt-1">Distress focus: Anticipatory courtroom terror & hostile cross-examination</p>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-slate-700">3. Rehabilitation & Resettlement</span>
                <span className="text-indigo-600">{stats?.legal_lifecycle_distribution?.rehabilitation || 2} Cases (13%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '13%' }}></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Distress focus: Social ostracism, safe house relocation & livelihood loss</p>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span className="text-slate-700">4. Compensation & Relief Disbursement</span>
                <span className="text-indigo-600">{stats?.legal_lifecycle_distribution?.compensation || 3} Cases (20%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '20%' }}></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Distress focus: Bureaucratic documentation bottlenecks & financial survival</p>
            </div>

          </div>
        </Card>

      </div>

      {/* Inter-Agency Coordination & Action Table */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span>Inter-Agency Multi-Tier Action Protocol Status</span>
            </h3>
            <p className="text-xs text-slate-500">Coordination index: {stats?.inter_agency_coordination_index || 94.2}% efficiency</p>
          </div>
          <Button onClick={() => navigate('/cases')} className="text-xs px-3.5 py-1.5">
            Open Atrocity Cases Triage Table &rarr;
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-800 font-bold">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>👨‍⚕️ Clinical Psychological Lead</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Deploys trauma stabilization, 4-7-8 breathing pacing, and desensitization for pre-trial courtroom panic.
            </p>
            <div className="flex items-center text-[10px] text-emerald-600 font-semibold space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>15 Active Therapy Sessions Active</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center space-x-2 text-rose-800 font-bold">
              <Shield className="w-4 h-4 text-rose-600" />
              <span>👮 District Police SP / Nodal Cell</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Enforces Section 15A witness protection, static armed security guards, and pre-trial travel escort.
            </p>
            <div className="flex items-center text-[10px] text-rose-600 font-semibold space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>8 Armed Escort Details Deployed</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center space-x-2 text-blue-800 font-bold">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>🏛️ District Magistrate & Social Welfare</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Authorizes Direct Benefit Transfer (DBT) relief compensation tranches and safe house accommodations.
            </p>
            <div className="flex items-center text-[10px] text-blue-600 font-semibold space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>₹ 57.75 Lakhs Disbursed to Date</span>
            </div>
          </div>

        </div>
      </Card>

    </div>
  );
};

export default GovernanceDashboard;
