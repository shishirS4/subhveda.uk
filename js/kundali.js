(function () {
  'use strict';

  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;
  const norm360 = d => ((d % 360) + 360) % 360;
  const YEAR_DAYS = 365.25;
  const YEAR_MS = YEAR_DAYS * 86400000;
  const LS_KEY = 'shubhveda_kundali_inputs';

  const SIGNS = {
    en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    hi: ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन'],
    ne: ['मेष', 'वृषभ', 'मिथुन', 'कर्कट', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन']
  };

  const NAKSHATRAS = {
    en: ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'],
    hi: ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती'],
    ne: ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढा', 'उत्तराषाढा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती']
  };

  const PLANETS = {
    en: { sun: 'Sun', moon: 'Moon', mars: 'Mars', mercury: 'Mercury', jupiter: 'Jupiter', venus: 'Venus', saturn: 'Saturn', rahu: 'Rahu', ketu: 'Ketu' },
    hi: { sun: 'सूर्य', moon: 'चन्द्र', mars: 'मंगल', mercury: 'बुध', jupiter: 'गुरु', venus: 'शुक्र', saturn: 'शनि', rahu: 'राहु', ketu: 'केतु' },
    ne: { sun: 'सूर्य', moon: 'चन्द्र', mars: 'मंगल', mercury: 'बुध', jupiter: 'गुरु', venus: 'शुक्र', saturn: 'शनि', rahu: 'राहु', ketu: 'केतु' }
  };

  const ABBR = {
    en: { sun: 'Su', moon: 'Mo', mars: 'Ma', mercury: 'Me', jupiter: 'Ju', venus: 'Ve', saturn: 'Sa', rahu: 'Ra', ketu: 'Ke' },
    hi: { sun: 'सू', moon: 'चं', mars: 'मं', mercury: 'बु', jupiter: 'गु', venus: 'शु', saturn: 'श', rahu: 'रा', ketu: 'के' },
    ne: { sun: 'सू', moon: 'चं', mars: 'मं', mercury: 'बु', jupiter: 'गु', venus: 'शु', saturn: 'श', rahu: 'रा', ketu: 'के' }
  };

  const DASHA_ORDER = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];
  const DASHA_YEARS = { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 };

  const VARGA_NAMES = {
    en: ['Rashi', 'Hora', 'Drekkana', 'Chaturthamsha', 'Panchamsha', 'Shashthamsha', 'Saptamsha', 'Ashtamsha', 'Navamsha', 'Dashamsha', 'Rudramsha', 'Dwadashamsha'],
    hi: ['राशि', 'होरा', 'द्रेष्काण', 'चतुर्थांश', 'पंचमांश', 'षष्ठांश', 'सप्तमांश', 'अष्टमांश', 'नवमांश', 'दशमांश', 'रुद्रांश', 'द्वादशांश'],
    ne: ['राशि', 'होरा', 'द्रेष्काण', 'चतुर्थांश', 'पञ्चमांश', 'षष्ठांश', 'सप्तमांश', 'अष्टमांश', 'नवांश', 'दशांश', 'रुद्रांश', 'द्वादशांश']
  };

  const VARGA_PURPOSE = {
    en: [
      'Body, self and overall life',
      'Wealth, earnings and financial potential',
      'Siblings, courage and self-effort',
      'Property, home and fortune',
      'Authority, fame and spiritual merit',
      'Health, enemies and litigation',
      'Children, progeny and creativity',
      'Longevity, sudden events and inheritance',
      'Marriage, dharma and inner strength',
      'Career, profession and public status',
      'Gains, networks and fulfilment of desires',
      'Parents, ancestry and lineage'
    ],
    hi: [
      'शरीर, स्वयं और समग्र जीवन',
      'धन, आय और आर्थिक क्षमता',
      'भाई-बहन, साहस और पुरुषार्थ',
      'संपत्ति, घर और भाग्य',
      'अधिकार, यश और पुण्य',
      'स्वास्थ्य, शत्रु और मुकदमे',
      'संतान, प्रजनन और सृजनात्मकता',
      'आयु, आकस्मिक घटनाएँ और विरासत',
      'विवाह, धर्म और आंतरिक शक्ति',
      'करियर, पेशा और सार्वजनिक प्रतिष्ठा',
      'लाभ, नेटवर्क और इच्छापूर्ति',
      'माता-पिता, वंश और पूर्वज'
    ],
    ne: [
      'शरीर, आफ्नो र समग्र जीवन',
      'धन, आय र आर्थिक क्षमता',
      'दाजुभाइ-दिदीबहिनी, साहस र पुरुषार्थ',
      'सम्पत्ति, घर र भाग्य',
      'अधिकार, यश र पुण्य',
      'स्वास्थ्य, शत्रु र मुद्दा',
      'सन्तान, प्रजनन र सिर्जनशीलता',
      'आयु, अचानक घटना र उत्तराधिकार',
      'विवाह, धर्म र आन्तरिक शक्ति',
      'करियर, पेशा र सार्वजनिक प्रतिष्ठा',
      'लाभ, सञ्जाल र इच्छापूर्ति',
      'आमाबाबु, वंश र पूर्वज'
    ]
  };

  const SIGN_LORDS = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];
  const BENEFICS = ['jupiter', 'venus', 'mercury', 'moon'];
  const MALEFICS = ['sun', 'mars', 'saturn', 'rahu', 'ketu'];
  const VARGA_KEY_HOUSE = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 5, 8: 8, 9: 7, 10: 10, 11: 11, 12: 4 };

  const TIMEZONES = [
    'Asia/Kolkata', 'Asia/Kathmandu', 'Asia/Colombo', 'Asia/Karachi', 'Asia/Dhaka',
    'Asia/Dubai', 'Asia/Riyadh', 'Asia/Tehran', 'Asia/Kabul', 'Asia/Tashkent',
    'Asia/Singapore', 'Asia/Kuala_Lumpur', 'Asia/Bangkok', 'Asia/Jakarta',
    'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
    'Europe/London', 'Europe/Dublin', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
    'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Zurich', 'Europe/Stockholm',
    'Europe/Warsaw', 'Europe/Athens', 'Europe/Istanbul', 'Europe/Moscow',
    'Africa/Cairo', 'Africa/Nairobi', 'Africa/Johannesburg', 'Africa/Lagos',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix',
    'America/Los_Angeles', 'America/Anchorage', 'America/Toronto', 'America/Vancouver',
    'America/Mexico_City', 'America/Sao_Paulo', 'America/Argentina/Buenos_Aires',
    'Australia/Perth', 'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Sydney',
    'Australia/Melbourne', 'Pacific/Auckland', 'Pacific/Fiji', 'UTC'
  ];

  const VARGA_GUIDANCE = {
    en: [
      'Protect sleep, food and daily routine; a steady body keeps the mind clear. Take important decisions when you are calm rather than rushed.',
      'Track income, savings and expenses with discipline. Avoid impulsive lending or speculation, and let wealth grow through reliable sources.',
      'Courage grows through small, repeated efforts. Keep speech clear and verify commitments before promising more.',
      'Create a calm home and keep property documents in order. Decisions about family and property improve when the family is consulted.',
      'Use influence and recognition responsibly. Study deeply, teach what you know, and avoid shortcuts for status.',
      'Do not ignore health signals; regular routine and timely treatment matter. Resolve conflicts early and keep records of service and agreements.',
      'Nurture children and creative projects with patience. Avoid forcing outcomes; consistency matters more than speed.',
      'Keep financial, legal and inheritance papers clear. Stay calm in sudden changes and avoid risk without proper advice.',
      'Marriage and partnership need honesty and shared values. Choose commitment after clear discussion, not under pressure.',
      'Build skills and reputation steadily. Reliable work and public integrity bring better results than shortcuts.',
      'Choose networks and advisers carefully. Fair dealings and gratitude strengthen gains and long-term support.',
      'Honour parents and family traditions without ignoring practical boundaries. Keep family records and important stories safe.'
    ],
    hi: [
      'नींद, भोजन और दैनिक दिनचर्या का ध्यान रखें; शरीर स्थिर रहेगा तो मन स्पष्ट रहेगा। महत्वपूर्ण निर्णय शांत मन से लें, जल्दबाजी में नहीं।',
      'आय, बचत और खर्च का हिसाब अनुशासन से रखें। बिना सोचे उधार या सट्टा-निवेश से बचें और धन को भरोसेमंद स्रोतों से बढ़ने दें।',
      'साहस छोटे-छोटे निरंतर प्रयासों से बढ़ता है। वाणी स्पष्ट रखें और वादा करने से पहले जिम्मेदारी जाँचें।',
      'घर को शांत रखें और संपत्ति के दस्तावेज व्यवस्थित रखें। परिवार और संपत्ति के निर्णय परिवार से चर्चा करके लें।',
      'अधिकार और प्रतिष्ठा का जिम्मेदारी से उपयोग करें। गहराई से अध्ययन करें, जो जानते हैं वह सिखाएँ और दिखावे के लिए शॉर्टकट से बचें।',
      'स्वास्थ्य के संकेतों को नजरअंदाज न करें; नियमित दिनचर्या और समय पर इलाज जरूरी है। विवाद जल्दी सुलझाएँ और सेवा-समझौतों के रिकॉर्ड रखें।',
      'संतान और रचनात्मक कामों को धैर्य से पोषित करें। परिणाम जबरदस्ती न करें; निरंतरता गति से अधिक महत्वपूर्ण है।',
      'आर्थिक, कानूनी और विरासत के कागजात स्पष्ट रखें। अचानक बदलावों में शांत रहें और सही सलाह के बिना जोखिम न लें।',
      'विवाह और साझेदारी में ईमानदारी और साझा मूल्य जरूरी हैं। दबाव में नहीं, स्पष्ट चर्चा के बाद प्रतिबद्धता चुनें।',
      'कौशल और प्रतिष्ठा धीरे-धीरे बनाएँ। भरोसेमंद काम और सार्वजनिक ईमानदारी शॉर्टकट से बेहतर परिणाम देते हैं।',
      'सलाहकार और नेटवर्क सोच-समझकर चुनें। निष्पक्ष व्यवहार और कृतज्ञता लाभ तथा दीर्घकालिक सहयोग मजबूत करते हैं।',
      'माता-पिता और पारिवारिक परंपरा का सम्मान करें, पर व्यावहारिक सीमाएँ भी रखें। पारिवारिक रिकॉर्ड और महत्वपूर्ण बातें सुरक्षित रखें।'
    ],
    ne: [
      'निद्रा, खानपान र दैनिक दिनचर्याको ध्यान राख्नुहोस्; शरीर स्थिर भए मन स्पष्ट रहन्छ। महत्वपूर्ण निर्णय शान्त मनले लिनुहोस्, हतारमा होइन।',
      'आय, बचत र खर्चको हिसाब अनुशासनसँग राख्नुहोस्। नसोची ऋण वा सट्टा-लगानीबाट बच्नुहोस् र धन भरपर्दो स्रोतबाट बढाउनुहोस्।',
      'साहस साना निरन्तर प्रयासबाट बढ्छ। बोली स्पष्ट राख्नुहोस् र वाचा गर्नुअघि जिम्मेवारी जाँच्नुहोस्।',
      'घर शान्त राख्नुहोस् र सम्पत्तिका कागजात व्यवस्थित राख्नुहोस्। परिवार र सम्पत्तिका निर्णय परिवारसँग छलफल गरेर लिनुहोस्।',
      'अधिकार र प्रतिष्ठा जिम्मेवारीसाथ प्रयोग गर्नुहोस्। गहिरो अध्ययन गर्नुहोस्, जानेको कुरा सिकाउनुहोस् र देखावटका लागि सर्टकटबाट बच्नुहोस्।',
      'स्वास्थ्यका संकेत बेवास्ता नगर्नुहोस्; नियमित दिनचर्या र समयमै उपचार आवश्यक छ। विवाद चाँडै सुल्झाउनुहोस् र सेवा-सम्झौताका रेकर्ड राख्नुहोस्।',
      'सन्तान र सिर्जनात्मक कामलाई धैर्यसँग पोषण गर्नुहोस्। परिणाम जबरजस्ती नगर्नुहोस्; निरन्तरता गतिभन्दा महत्वपूर्ण छ।',
      'आर्थिक, कानुनी र उत्तराधिकारका कागजात स्पष्ट राख्नुहोस्। अचानक परिवर्तनमा शान्त रहनुहोस् र उचित सल्लाहबिना जोखिम नलिनुहोस्।',
      'विवाह र साझेदारीमा इमानदारी र साझा मूल्य आवश्यक छ। दबाबमा होइन, स्पष्ट छलफलपछि प्रतिबद्धता छान्नुहोस्।',
      'सीप र प्रतिष्ठा बिस्तारै बनाउनुहोस्। भरपर्दो काम र सार्वजनिक इमानदारीले सर्टकटभन्दा राम्रो परिणाम दिन्छ।',
      'सल्लाहकार र सञ्जाल सोचविचार गरेर छान्नुहोस्। निष्पक्ष व्यवहार र कृतज्ञताले लाभ र दीर्घकालीन सहयोग बलियो बनाउँछ।',
      'आमाबाबु र पारिवारिक परम्पराको सम्मान गर्नुहोस्, तर व्यावहारिक सीमा पनि राख्नुहोस्। पारिवारिक रेकर्ड र महत्वपूर्ण कुरा सुरक्षित राख्नुहोस्।'
    ]
  };

  const VARGA_CAUTION = {
    en: [
      'Avoid ignoring health or stress signals while chasing goals.',
      'Avoid unsupported speculation and unclear loans.',
      'Avoid harsh words and overcommitting your time.',
      'Avoid emotional decisions about property and home.',
      'Avoid ego-driven risks and false claims.',
      'Avoid delaying treatment or letting disputes grow.',
      'Avoid pressuring children or rushing creative work.',
      'Avoid concealment in legal or financial matters.',
      'Avoid rushing marriage or ignoring core value differences.',
      'Avoid shortcuts that damage long-term reputation.',
      'Avoid trusting every opportunity or contact blindly.',
      'Avoid family disputes over inheritance and old records.'
    ],
    hi: [
      'लक्ष्यों के पीछे स्वास्थ्य या तनाव के संकेतों को नजरअंदाज न करें।',
      'बिना आधार के सट्टा और अस्पष्ट उधार से बचें।',
      'कठोर वचन और समय से अधिक वादे न करें।',
      'संपत्ति और घर के बारे में भावुक निर्णय न लें।',
      'अहंकार से प्रेरित जोखिम और झूठे दावों से बचें।',
      'इलाज में देरी और विवाद बढ़ने से बचें।',
      'संतान पर दबाव और रचनात्मक काम में जल्दबाजी से बचें।',
      'कानूनी या आर्थिक मामलों में छिपाव से बचें।',
      'जल्दी विवाह या मूल मूल्यों के अंतर को अनदेखा करने से बचें।',
      'ऐसे शॉर्टकट से बचें जो दीर्घकालिक प्रतिष्ठा को नुकसान पहुँचाएँ।',
      'हर अवसर या संपर्क पर आँख मूँदकर भरोसा न करें।',
      'विरासत और पुराने रिकॉर्ड पर पारिवारिक विवाद से बचें।'
    ],
    ne: [
      'लक्ष्यपछि दौडिँदा स्वास्थ्य वा तनावका संकेत बेवास्ता नगर्नुहोस्।',
      'आधारहीन सट्टा र अस्पष्ट ऋणबाट बच्नुहोस्।',
      'कठोर बोली र समयभन्दा बढी वाचाबाट बच्नुहोस्।',
      'सम्पत्ति र घरबारे भावुक निर्णय नगर्नुहोस्।',
      'अहंकारले लिने जोखिम र झुटा दाबीबाट बच्नुहोस्।',
      'उपचारमा ढिलाइ र विवाद बढ्नबाट बच्नुहोस्।',
      'सन्तानमाथि दबाब र सिर्जनात्मक काममा हतारबाट बच्नुहोस्।',
      'कानुनी वा आर्थिक विषयमा लुकाउने कामबाट बच्नुहोस्।',
      'हतारमा विवाह वा मूल मूल्यको फरक बेवास्ता गर्नबाट बच्नुहोस्।',
      'दीर्घकालीन प्रतिष्ठालाई हानि पुर्‍याउने सर्टकटबाट बच्नुहोस्।',
      'हरेक अवसर वा सम्पर्कमाथि आँखा चिम्लिएर विश्वास नगर्नुहोस्।',
      'उत्तराधिकार र पुराना रेकर्डबारे पारिवारिक विवादबाट बच्नुहोस्।'
    ]
  };

  // Plain-language vocabulary for the phaladesh. Everything below is written
  // for a reader who knows no Jyotish terms, so the generated reading can be
  // followed without a glossary.
  const PHAL_HOUSE_THEME = {
    en: [
      'your body, personality and confidence',
      'money, savings, family and speech',
      'courage, siblings and communication',
      'home, property, mother and inner peace',
      'children, studies and creative work',
      'health, service, rivals and debts',
      'marriage, partnership and public dealings',
      'sudden changes, inheritance and hidden matters',
      'fortune, dharma, mentors and father',
      'career, status and public responsibility',
      'income, networks and fulfilment of wishes',
      'expenses, foreign connections and rest'
    ],
    hi: [
      'शरीर, व्यक्तित्व और आत्मविश्वास',
      'धन, बचत, परिवार और वाणी',
      'साहस, भाई-बहन और संवाद',
      'घर, संपत्ति, माता और मन की शांति',
      'संतान, पढ़ाई और रचनात्मक काम',
      'स्वास्थ्य, सेवा, प्रतिस्पर्धी और कर्ज़',
      'विवाह, साझेदारी और सार्वजनिक व्यवहार',
      'अचानक बदलाव, विरासत और छिपे मामले',
      'भाग्य, धर्म, गुरुजन और पिता',
      'करियर, पद और सार्वजनिक जिम्मेदारी',
      'आमदनी, संपर्क और इच्छापूर्ति',
      'खर्च, विदेश संबंध और विश्राम'
    ],
    ne: [
      'शरीर, व्यक्तित्व र आत्मविश्वास',
      'धन, बचत, परिवार र बोली',
      'साहस, दाजुभाइ-दिदीबहिनी र सञ्चार',
      'घर, सम्पत्ति, आमा र मनको शान्ति',
      'सन्तान, पढाइ र सिर्जनात्मक काम',
      'स्वास्थ्य, सेवा, प्रतिस्पर्धी र ऋण',
      'विवाह, साझेदारी र सार्वजनिक व्यवहार',
      'अचानक परिवर्तन, उत्तराधिकार र लुकेका विषय',
      'भाग्य, धर्म, गुरुजन र पिता',
      'करियर, पद र सार्वजनिक जिम्मेवारी',
      'आय, सञ्जाल र इच्छापूर्ति',
      'खर्च, विदेश सम्बन्ध र विश्राम'
    ]
  };

  const PHAL_SIGN_TRAIT = {
    en: [
      'quick, direct and ready to start things',
      'steady, patient and fond of comfort',
      'curious, talkative and quick to adapt',
      'protective, emotional and home-loving',
      'confident, dignified and eager for respect',
      'detail-oriented, practical and service-minded',
      'balanced, fair and relationship-focused',
      'intense, private and deeply determined',
      'optimistic, principled and fond of learning',
      'disciplined, ambitious and long-term',
      'unconventional, social and idea-driven',
      'compassionate, imaginative and inward-looking'
    ],
    hi: [
      'फुर्तीला, सीधा और पहल करने वाला',
      'स्थिर, धैर्यवान और सुख-सुविधा पसंद',
      'जिज्ञासु, बातूनी और जल्दी ढलने वाला',
      'रक्षात्मक, भावुक और घर से जुड़ा',
      'आत्मविश्वासी, गरिमामय और सम्मान चाहने वाला',
      'बारीकी देखने वाला, व्यावहारिक और सेवाभावी',
      'संतुलित, न्यायप्रिय और संबंधों पर केंद्रित',
      'गहरा, गोपनीय और दृढ़ संकल्प वाला',
      'आशावादी, सिद्धांतवादी और सीखने का शौकीन',
      'अनुशासित, महत्वाकांक्षी और दीर्घकालिक सोच वाला',
      'अनोखा, सामाजिक और विचारों से चलने वाला',
      'करुणामय, कल्पनाशील और भीतर की ओर देखने वाला'
    ],
    ne: [
      'फुर्तिलो, सोझो र पहल गर्ने',
      'स्थिर, धैर्यवान् र सुख-सुविधा मन पराउने',
      'जिज्ञासु, बोल्ने र चाँडै अनुकूल हुने',
      'रक्षात्मक, भावुक र घरसँग जोडिएको',
      'आत्मविश्वासी, गरिमामय र सम्मान चाहने',
      'सूक्ष्म हेर्ने, व्यावहारिक र सेवाभावी',
      'सन्तुलित, न्यायप्रिय र सम्बन्धमा केन्द्रित',
      'गहिरो, गोप्य र दृढ संकल्प भएको',
      'आशावादी, सिद्धान्तवादी र सिक्न रुचाउने',
      'अनुशासित, महत्वाकांक्षी र दीर्घकालीन सोच',
      'फरक, सामाजिक र विचारले चल्ने',
      'करुणामय, कल्पनाशील र भित्रीतिर हेर्ने'
    ]
  };

  // Effect of a planet sitting in, or aspecting, the key house.
  const PHAL_PLANET_EFFECT = {
    en: {
      sun: 'The Sun adds authority, confidence and a wish to be seen; the caution is ego clashes and pride.',
      moon: 'The Moon makes this area emotional and caring, so the mind feels every small change here.',
      mars: 'Mars adds speed, courage and a competitive edge; hurry and anger are the main risks.',
      mercury: 'Mercury brings communication, trade and quick learning; keeping facts and papers clear helps.',
      jupiter: 'Jupiter protects and expands this area and brings good advice, teachers and fair dealing.',
      venus: 'Venus adds comfort, charm, art and relationship sense; over-indulgence is the only warning.',
      saturn: 'Saturn slows results but makes them durable; patience, duty and honesty pay here.',
      rahu: 'Rahu brings ambition, unusual opportunities and a pull toward shortcuts that needs watching.',
      ketu: 'Ketu creates detachment and inner questioning; results arrive after letting go of expectations.'
    },
    hi: {
      sun: 'सूर्य आत्मविश्वास, अधिकार और पहचान जोड़ता है; सावधानी सिर्फ अहंकार और दिखावे की है।',
      moon: 'चंद्र इस क्षेत्र को भावुक और परवाह करने वाला बनाता है, इसलिए मन हर छोटे बदलाव को महसूस करता है।',
      mars: 'मंगल गति, साहस और प्रतिस्पर्धा जोड़ता है; जल्दबाजी और क्रोध मुख्य जोखिम हैं।',
      mercury: 'बुध संवाद, व्यापार और तेज़ सीखने की शक्ति देता है; तथ्य और कागजात साफ रखने से लाभ होता है।',
      jupiter: 'गुरु इस क्षेत्र की रक्षा करता है और बढ़ाता है; अच्छी सलाह, गुरुजन और निष्पक्ष व्यवहार साथ आते हैं।',
      venus: 'शुक्र सुख, आकर्षण, कला और संबंधों की समझ जोड़ता है; केवल अति-भोग से बचना है।',
      saturn: 'शनि परिणाम धीमे देता है पर टिकाऊ बनाता है; धैर्य, कर्तव्य और ईमानदारी यहाँ फल देती है।',
      rahu: 'राहु महत्वाकांक्षा और अनोखे अवसर देता है, पर शॉर्टकट की ओर खिंचाव पर नजर रखनी है।',
      ketu: 'केतु वैराग्य और भीतर के सवाल पैदा करता है; अपेक्षाएँ छोड़ने के बाद परिणाम साफ होते हैं।'
    },
    ne: {
      sun: 'सूर्यले आत्मविश्वास, अधिकार र पहिचान थप्छ; सावधानी अहंकार र देखावटको मात्र हो।',
      moon: 'चन्द्रमाले यो क्षेत्रलाई भावुक र हेरचाह गर्ने बनाउँछ, त्यसैले मनले हरेक सानो परिवर्तन महसुस गर्छ।',
      mars: 'मंगलले गति, साहस र प्रतिस्पर्धा थप्छ; हतार र क्रोध मुख्य जोखिम हुन्।',
      mercury: 'बुधले सञ्चार, व्यापार र छिटो सिक्ने शक्ति दिन्छ; तथ्य र कागजात स्पष्ट राख्दा लाभ हुन्छ।',
      jupiter: 'गुरुले यो क्षेत्रको रक्षा र विस्तार गर्छ; राम्रो सल्लाह, गुरुजन र निष्पक्ष व्यवहार सँगै आउँछन्।',
      venus: 'शुक्रले सुख, आकर्षण, कला र सम्बन्धबोध थप्छ; अति-भोगबाट मात्र बच्नुपर्छ।',
      saturn: 'शनिले नतिजा ढिलो दिन्छ तर टिकाउ बनाउँछ; धैर्य, कर्तव्य र इमानदारीले यहाँ फल दिन्छ।',
      rahu: 'राहुले महत्वाकांक्षा र फरक अवसर दिन्छ, तर सर्टकटतिरको तानमा ध्यान राख्नुपर्छ।',
      ketu: 'केतुले वैराग्य र भित्री प्रश्न जगाउँछ; अपेक्षा छोडेपछि नतिजा स्पष्ट हुन्छ।'
    }
  };

  // The lord placed N houses away from the key house (counted inclusively).
  const PHAL_LORD_DISTANCE = {
    en: [
      'The lord sits in its own house, so this area gets direct strength and responds quickly to effort.',
      'The lord sits in the house of money and family, so income, savings and close family affect this area strongly.',
      'The lord sits in the house of effort and communication, so courage, initiative and clear speech move things forward.',
      'The lord sits in the house of home and stability, so property, family peace and emotional security matter here.',
      'The lord sits in the house of creativity and children, so studies, creative work and younger ones influence this area.',
      'The lord sits in the house of service and obstacles, so progress comes through discipline, health care and calm conflict handling.',
      'The lord sits in the house of partnership, so relationships, agreements and public dealings shape this area.',
      'The lord sits in the house of sudden change, so this area may see shifts; careful paperwork and planning protect you.',
      'The lord sits in the house of fortune and dharma, so good guidance, mentors and ethical choices support this area.',
      'The lord sits in the house of career, so work, status and public responsibility are closely tied to this area.',
      'The lord sits in the house of gains, so income, networks and fulfilled wishes feed this area.',
      'The lord sits in the house of expenses and foreign lands, so travel, letting go or quiet effort may shape this area.'
    ],
    hi: [
      'स्वामी अपने ही भाव में है — यह क्षेत्र सीधी शक्ति पाता है और प्रयास का जवाब जल्दी देता है।',
      'स्वामी धन और परिवार के भाव में है — आमदनी, बचत और परिवार का सुख-दुख इस क्षेत्र को सीधे प्रभावित करते हैं।',
      'स्वामी साहस और संवाद के भाव में है — पहल, स्पष्ट बोली और निरंतर प्रयास से काम आगे बढ़ता है।',
      'स्वामी घर और स्थिरता के भाव में है — संपत्ति, परिवार की शांति और मन की सुरक्षा यहाँ अहम हैं।',
      'स्वामी संतान और सृजन के भाव में है — पढ़ाई, रचनात्मक काम और बच्चों की जिम्मेदारी इस क्षेत्र से जुड़ती है।',
      'स्वामी सेवा और बाधाओं के भाव में है — सफलता अनुशासन, स्वास्थ्य-ध्यान और विवादों को शांति से सुलझाने से आती है।',
      'स्वामी साझेदारी के भाव में है — रिश्ते, समझौते और सार्वजनिक व्यवहार इस क्षेत्र की दिशा तय करते हैं।',
      'स्वामी परिवर्तन के भाव में है — अचानक बदलाव आ सकते हैं, इसलिए कागजात और योजना साफ रखें।',
      'स्वामी भाग्य और धर्म के भाव में है — सही मार्गदर्शन, गुरुजनों की सलाह और ईमानदारी इस क्षेत्र को सहारा देती है।',
      'स्वामी करियर के भाव में है — काम, पद और जिम्मेदारी का इस क्षेत्र से गहरा संबंध है।',
      'स्वामी लाभ के भाव में है — आमदनी, संपर्क और इच्छाओं की पूर्ति इस क्षेत्र को ऊर्जा देती है।',
      'स्वामी खर्च और विदेश के भाव में है — यात्रा, त्याग या शांत परिश्रम इस क्षेत्र की पहचान बन सकते हैं।'
    ],
    ne: [
      'स्वामी आफ्नै भावमा छ — यो क्षेत्रले सिधा बल पाउँछ र प्रयासको जवाफ चाँडै दिन्छ।',
      'स्वामी धन र परिवारको भावमा छ — आय, बचत र परिवारको सुख-दुःखले यो क्षेत्रलाई सिधै असर गर्छ।',
      'स्वामी साहस र सञ्चारको भावमा छ — पहल, स्पष्ट बोली र निरन्तर प्रयासले काम अघि बढ्छ।',
      'स्वामी घर र स्थिरताको भावमा छ — सम्पत्ति, परिवारको शान्ति र मनको सुरक्षा यहाँ महत्वपूर्ण छन्।',
      'स्वामी सन्तान र सिर्जनाको भावमा छ — पढाइ, सिर्जनात्मक काम र बालबालिकाको जिम्मेवारी यो क्षेत्रसँग जोडिन्छ।',
      'स्वामी सेवा र बाधाको भावमा छ — सफलता अनुशासन, स्वास्थ्य-ध्यान र विवाद शान्तिसँग सुल्झाउँदा आउँछ।',
      'स्वामी साझेदारीको भावमा छ — सम्बन्ध, सम्झौता र सार्वजनिक व्यवहारले यो क्षेत्रको दिशा तय गर्छन्।',
      'स्वामी परिवर्तनको भावमा छ — अचानक बदलाव आउन सक्छन्, त्यसैले कागजात र योजना स्पष्ट राख्नुहोस्।',
      'स्वामी भाग्य र धर्मको भावमा छ — सही मार्गदर्शन, गुरुजनको सल्लाह र इमानदारीले यो क्षेत्रलाई सहारा दिन्छ।',
      'स्वामी करियरको भावमा छ — काम, पद र जिम्मेवारीको यो क्षेत्रसँग गहिरो सम्बन्ध छ।',
      'स्वामी लाभको भावमा छ — आय, सम्पर्क र इच्छापूर्तिले यो क्षेत्रलाई ऊर्जा दिन्छ।',
      'स्वामी खर्च र विदेशको भावमा छ — यात्रा, त्याग वा शान्त परिश्रम यो क्षेत्रको पहिचान बन्न सक्छ।'
    ]
  };

  const PHAL_NEXT_STEPS = {
    en: [
      'Read this varga together with your D1 birth chart: D1 shows the base promise, this chart shows how deep and in what form it can appear.',
      'Use the dates in the timing section: begin new efforts for this area during the periods of ',
      'For marriage, career, property or health decisions, confirm this reading in a personal consultation instead of depending on one chart.'
    ],
    hi: [
      'इस वर्ग को D1 (जन्म) कुंडली के साथ पढ़ें: D1 मूल संभावना दिखाती है और यह वर्ग बताता है कि वह कितनी गहरी और किस रूप में आएगी।',
      'समय वाले भाग में दी गई तिथियों का उपयोग करें: इस क्षेत्र की नई कोशिश ',
      'विवाह, करियर, संपत्ति या स्वास्थ्य के बड़े फैसलों के लिए एक कुंडली पर निर्भर न रहें; व्यक्तिगत परामर्श से पुष्टि करें।'
    ],
    ne: [
      'यो वर्गलाई D1 (जन्म) कुण्डलीसँगै पढ्नुहोस्: D1 ले मूल सम्भावना देखाउँछ र यो वर्गले त्यो कति गहिरो र कुन रूपमा आउँछ भन्ने बताउँछ।',
      'समय खण्डमा दिइएका मिति प्रयोग गर्नुहोस्: यस क्षेत्रका नयाँ प्रयास ',
      'विवाह, करियर, सम्पत्ति वा स्वास्थ्यका ठूला निर्णयका लागि एउटै कुण्डलीमा भर नपर्नुहोस्; व्यक्तिगत परामर्शबाट पुष्टि गर्नुहोस्।'
    ]
  };

  const PHAL_TONE = {
    en: { supportive: 'Supportive', mixed: 'Mixed', demanding: 'Demanding', dasha: 'Dasha-led' },
    hi: { supportive: 'सहायक', mixed: 'मिश्रित', demanding: 'प्रयास मांगता', dasha: 'दशा-आधारित' },
    ne: { supportive: 'सहयोगी', mixed: 'मिश्रित', demanding: 'प्रयास माग्ने', dasha: 'दशा-आधारित' }
  };

  const ELEMENTS = {
    mercury: { a: 0.38709927, e: 0.20563593, I: 7.00497902, L: 252.25032350, P: 77.45779628, N: 48.33076593, ra: 0.00000037, re: 0.00001906, rI: -0.00594749, rL: 149472.67411175, rP: 0.16047689, rN: -0.12534081 },
    venus: { a: 0.72333566, e: 0.00677672, I: 3.39467605, L: 181.97909950, P: 131.60246718, N: 76.67984255, ra: 0.00000390, re: -0.00004107, rI: -0.00078890, rL: 58517.81538729, rP: 0.00268329, rN: -0.27769418 },
    earth: { a: 1.00000261, e: 0.01671123, I: -0.00001531, L: 100.46457166, P: 102.93768193, N: 0.0, ra: 0.00000562, re: -0.00004392, rI: -0.01294668, rL: 35999.37244981, rP: 0.32327364, rN: 0.0 },
    mars: { a: 1.52371034, e: 0.09339410, I: 1.84969142, L: -4.55343205, P: -23.94362959, N: 49.55953891, ra: 0.00001847, re: 0.00007882, rI: -0.00813131, rL: 19140.30268499, rP: 0.44441088, rN: -0.29257343 },
    jupiter: { a: 5.20288700, e: 0.04838624, I: 1.30439695, L: 34.39644051, P: 14.72847983, N: 100.47390909, ra: -0.00011607, re: -0.00013253, rI: -0.00183714, rL: 3034.74612775, rP: 0.21252668, rN: 0.20469106 },
    saturn: { a: 9.53667594, e: 0.05386179, I: 2.48599187, L: 49.95424423, P: 92.59887831, N: 113.66242448, ra: -0.00125060, re: -0.00050991, rI: 0.00193609, rL: 1222.49362201, rP: -0.41897216, rN: -0.28867794 }
  };

  const HOUSE_POLYGONS = [
    '200,0 300,100 200,200 100,100',
    '0,0 200,0 100,100',
    '0,0 100,100 0,200',
    '0,200 100,100 200,200 100,300',
    '0,200 100,300 0,400',
    '0,400 100,300 200,400',
    '200,400 100,300 200,200 300,300',
    '200,400 300,300 400,400',
    '400,400 300,300 400,200',
    '400,200 300,300 200,200 300,100',
    '400,200 300,100 400,0',
    '400,0 300,100 200,0'
  ];

  // nx/ny place the house-number badge; planets stack away from it so the
  // number never collides with planet abbreviations. dir -1 stacks upward.
  const HOUSE_TEXT = [
    { nx: 200, ny: 78, dir: 1 },
    { nx: 100, ny: 22, dir: 1 },
    { nx: 36, ny: 48, dir: 1 },
    { nx: 100, ny: 178, dir: 1 },
    { nx: 36, ny: 278, dir: 1 },
    { nx: 100, ny: 380, dir: -1 },
    { nx: 200, ny: 278, dir: 1 },
    { nx: 300, ny: 380, dir: -1 },
    { nx: 364, ny: 278, dir: 1 },
    { nx: 300, ny: 178, dir: 1 },
    { nx: 364, ny: 48, dir: 1 },
    { nx: 300, ny: 22, dir: 1 }
  ];

  const HOUSE_SHAPES = HOUSE_POLYGONS.map(function (poly) {
    return poly.split(' ').map(function (pair) {
      const xy = pair.split(',').map(Number);
      return [xy[0], xy[1]];
    });
  });

  // Devanagari abbreviations carry much taller glyph boxes than Latin ones
  // (matras above and below the baseline), so spacing must follow the script.
  const CHART_TEXT = {
    en: { up: 0.8, down: 0.2, wide: true },
    hi: { up: 1.26, down: 0.4, wide: false },
    ne: { up: 1.26, down: 0.4, wide: false }
  };

  const DEV_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

  let lang = 'en';
  let state = null;
  let vargaSel = 9;
  let phalSel = 9;
  let placeResolution = null;
  let placeRegion = '';
  let placeSearchTimer = null;
  let placeSearchSeq = 0;
  let placeSearchAbort = null;
  let manualPlaceEdited = false;
  let detectSeq = 0;
  const tzCache = Object.create(null);

  function el(id) { return document.getElementById(id); }

  function currentLang() {
    try {
      if (window.ShubhVedaI18n && window.ShubhVedaI18n.getCurrentLang) {
        const l = String(window.ShubhVedaI18n.getCurrentLang() || '').slice(0, 2);
        if (['en', 'hi', 'ne'].indexOf(l) !== -1) return l;
      }
      const dl = String(document.documentElement.lang || '').slice(0, 2);
      if (['en', 'hi', 'ne'].indexOf(dl) !== -1) return dl;
    } catch (e) {}
    return 'en';
  }

  function t(key, fallback) {
    try {
      const dict = TRANSLATIONS[lang];
      if (dict && dict[key]) return dict[key];
    } catch (e) {}
    return fallback || key;
  }

  function tAll(key, fallback) {
    const out = {};
    ['en', 'hi', 'ne'].forEach(l => {
      try {
        const dict = TRANSLATIONS[l];
        out[l] = (dict && dict[key]) || fallback;
      } catch (e) {
        out[l] = fallback;
      }
    });
    return out;
  }

  function localNum(n) {
    const s = String(n);
    if (lang === 'en') return s;
    return s.split('').map(c => (c >= '0' && c <= '9') ? DEV_DIGITS[+c] : c).join('');
  }

  function dms(deg) {
    const d = Math.floor(deg);
    const m = Math.floor((deg - d) * 60);
    return localNum(d) + '\u00B0' + localNum(String(m).padStart(2, '0')) + '\u2032';
  }

  function fmtDate(date) {
    const loc = lang === 'hi' ? 'hi-IN' : (lang === 'ne' ? 'ne-NP' : 'en-GB');
    try {
      return new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    } catch (e) {
      return date.toISOString().slice(0, 10);
    }
  }

  function fmtYears(ms) {
    const totalMonths = Math.max(0, Math.round(ms / (YEAR_MS / 12)));
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    const yl = t('kundali_years_short', 'y');
    const ml = t('kundali_months_short', 'm');
    const parts = [];
    if (y > 0) parts.push(localNum(y) + ' ' + yl);
    if (m > 0 || y === 0) parts.push(localNum(m) + ' ' + ml);
    return parts.join(' ');
  }

  function fmtRemaining(ms) {
    const days = Math.max(0, Math.round(ms / 86400000));
    if (days < 60) return localNum(days) + ' ' + t('kundali_days_short', 'd');
    return fmtYears(ms);
  }

  function helio(id, T) {
    const elm = ELEMENTS[id];
    const a = elm.a + elm.ra * T;
    const e = elm.e + elm.re * T;
    const I = (elm.I + elm.rI * T) * D2R;
    const L = elm.L + elm.rL * T;
    const P = elm.P + elm.rP * T;
    const N = (elm.N + elm.rN * T) * D2R;
    const w = P * D2R - N;
    const M = (norm360(L - P + 180) - 180) * D2R;
    let E = M;
    for (let i = 0; i < 6; i++) {
      E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    const xv = a * (Math.cos(E) - e);
    const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cosN = Math.cos(N), sinN = Math.sin(N);
    const cosw = Math.cos(w), sinw = Math.sin(w);
    const cosI = Math.cos(I), sinI = Math.sin(I);
    return {
      x: xv * (cosN * cosw - sinN * sinw * cosI) - yv * (sinN * cosw + cosN * sinw * cosI),
      y: xv * (cosN * sinw + sinN * cosw * cosI) + yv * (cosN * cosw * cosI - sinN * sinw),
      z: xv * sinw * sinI + yv * cosw * sinI
    };
  }

  function planetTropical(id, jd, T) {
    const p = helio(id, T);
    const b = helio('earth', T);
    const lonJ2000 = Math.atan2(p.y - b.y, p.x - b.x) * R2D;
    const precession = 1.396971 * T + 0.0003086 * T * T;
    return norm360(lonJ2000 + precession);
  }

  function meanNode(jd) {
    const T = (jd - 2451545.0) / 36525;
    return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441 - T * T * T * T / 60616000);
  }

  function gmst(jd) {
    const T = (jd - 2451545.0) / 36525;
    return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000);
  }

  function ascendant(jd, lat, lon, ay) {
    const T = (jd - 2451545.0) / 36525;
    const eps = (23.4392911 - 0.0130042 * T) * D2R;
    const lst = (gmst(jd) + lon) * D2R;
    const phi = lat * D2R;
    const asc = Math.atan2(Math.cos(lst), -(Math.sin(lst) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * R2D;
    return norm360(asc - ay);
  }

  function tzOffsetMs(date, tz) {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const p = {};
    dtf.formatToParts(date).forEach(x => { p[x.type] = x.value; });
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return asUTC - Math.floor(date.getTime() / 1000) * 1000;
  }

  function zonedToUtc(y, mo, d, h, mi, tz) {
    const base = Date.UTC(y, mo - 1, d, h, mi);
    let ts = base;
    for (let i = 0; i < 4; i++) {
      const next = base - tzOffsetMs(new Date(ts), tz);
      if (next === ts) break;
      ts = next;
    }
    return new Date(ts);
  }

  function buildDasha(moonS, birth) {
    const nak = Math.floor(moonS / (360 / 27));
    const frac = (moonS % (360 / 27)) / (360 / 27);
    const startIdx = nak % 9;
    const periodStart = birth.getTime() - DASHA_YEARS[DASHA_ORDER[startIdx]] * frac * YEAR_MS;
    const list = [];
    let t0 = periodStart;
    for (let i = 0; i < 9; i++) {
      const li = (startIdx + i) % 9;
      const id = DASHA_ORDER[li];
      const years = DASHA_YEARS[id];
      const start = t0;
      const end = t0 + years * YEAR_MS;
      const antars = [];
      let at = start;
      for (let j = 0; j < 9; j++) {
        const ai = (li + j) % 9;
        const aid = DASHA_ORDER[ai];
        const antDur = years * DASHA_YEARS[aid] / 120 * YEAR_MS;
        const antStart = at;
        const antEnd = at + antDur;
        const pratyantars = [];
        let pt = antStart;
        for (let q = 0; q < 9; q++) {
          const pi = (ai + q) % 9;
          const pid = DASHA_ORDER[pi];
          const pDur = antDur * DASHA_YEARS[pid] / 120;
          pratyantars.push({ id: pid, start: new Date(pt), end: new Date(pt + pDur) });
          pt += pDur;
        }
        antars.push({ id: aid, start: new Date(antStart), end: new Date(antEnd), pratyantars: pratyantars });
        at = antEnd;
      }
      list.push({ id: id, years: years, start: new Date(start), end: new Date(end), antars: antars });
      t0 = end;
    }
    return { list: list, balance: { id: list[0].id, ms: list[0].end.getTime() - birth.getTime() } };
  }

  function vargaSign(lon, n) {
    const L = norm360(lon);
    const sign = Math.floor(L / 30);
    const deg = L % 30;
    const part = Math.min(n - 1, Math.floor(deg / (30 / n)));
    const odd = sign % 2 === 0;
    let start = sign;
    switch (n) {
      case 1: return sign;
      case 2: return odd ? (part === 0 ? 4 : 3) : (part === 0 ? 3 : 4);
      case 3: start = sign + part * 4; break;
      case 4: start = sign + part * 3; break;
      case 5: return (odd ? [0, 10, 8, 2, 6] : [1, 5, 11, 9, 7])[part];
      case 6: start = (odd ? 0 : 6) + part; break;
      case 7: start = (odd ? sign : sign + 6) + part; break;
      case 8: start = (sign % 3 === 0 ? 0 : (sign % 3 === 1 ? 8 : 4)) + part; break;
      case 9: start = (sign % 3 === 0 ? sign : (sign % 3 === 1 ? sign + 8 : sign + 4)) + part; break;
      case 10: start = (odd ? sign : sign + 8) + part; break;
      case 11: start = ((12 - sign) % 12) + part; break;
      case 12: start = sign + part; break;
      default: return sign;
    }
    return ((start % 12) + 12) % 12;
  }

  function buildVargas(items, asc) {
    const out = [];
    for (let n = 1; n <= 12; n++) {
      const ascSign = vargaSign(asc, n);
      const planets = items.map(p => {
        const sign = vargaSign(p.lon, n);
        return { id: p.id, lon: p.lon, retro: p.retro, sign: sign, house: 1 + ((sign - ascSign + 12) % 12) };
      });
      out.push({ n: n, ascSign: ascSign, planets: planets });
    }
    return out;
  }

  function compute(input) {
    const utc = zonedToUtc(input.y, input.mo, input.d, input.h, input.mi, input.city.tz);
    const jd = utc.getTime() / 86400000 + 2440587.5;
    const T = (jd - 2451545.0) / 36525;
    const ay = window.ShubhPanchang.ayanamsa(jd);
    const items = [];

    function add(id, lon, retro) {
      const L = norm360(lon);
      items.push({ id: id, lon: L, retro: retro, sign: Math.floor(L / 30), deg: L % 30 });
    }

    add('sun', window.ShubhPanchang.sunLongitude(jd) - ay, false);
    const moonS = norm360(window.ShubhPanchang.moonLongitude(jd) - ay);
    add('moon', moonS, false);

    ['mercury', 'venus', 'mars', 'jupiter', 'saturn'].forEach(id => {
      const lon = planetTropical(id, jd, T) - ay;
      const a = planetTropical(id, jd - 0.5, T - 0.5 / 36525);
      const b = planetTropical(id, jd + 0.5, T + 0.5 / 36525);
      const retro = ((b - a + 540) % 360) - 180 < 0;
      add(id, lon, retro);
    });

    const node = meanNode(jd);
    add('rahu', node - ay, true);
    add('ketu', node + 180 - ay, true);

    const asc = ascendant(jd, input.city.lat, input.city.lon, ay);
    items.forEach(p => { p.house = 1 + ((p.sign - Math.floor(asc / 30) + 12) % 12); });

    const nak = Math.floor(moonS / (360 / 27));
    const pada = Math.floor((moonS % (360 / 27)) / (360 / 108)) + 1;

    return {
      input: input,
      utc: utc,
      jd: jd,
      ay: ay,
      asc: asc,
      moonS: moonS,
      nak: nak,
      pada: pada,
      items: items,
      vargas: buildVargas(items, asc),
      dasha: buildDasha(moonS, utc)
    };
  }

  function spanAtX(poly, x) {
    const ys = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      if (a[0] === b[0]) {
        if (a[0] === x) { ys.push(a[1], b[1]); }
      } else if (x >= Math.min(a[0], b[0]) && x <= Math.max(a[0], b[0])) {
        const t = (x - a[0]) / (b[0] - a[0]);
        ys.push(a[1] + t * (b[1] - a[1]));
      }
    }
    return ys.length > 1 ? [Math.min.apply(null, ys), Math.max.apply(null, ys)] : null;
  }

  function spanAtY(poly, y) {
    const xs = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      if (a[1] === b[1]) {
        if (a[1] === y) { xs.push(a[0], b[0]); }
      } else if (y >= Math.min(a[1], b[1]) && y <= Math.max(a[1], b[1])) {
        const t = (y - a[1]) / (b[1] - a[1]);
        xs.push(a[0] + t * (b[0] - a[0]));
      }
    }
    return xs.length > 1 ? [Math.min.apply(null, xs), Math.max.apply(null, xs)] : null;
  }

  // Pick the largest font size (and fewest columns) that keeps the whole
  // planet block inside its own house, clear of the number badge.
  function layoutPlanets(count, h) {
    const pos = HOUSE_TEXT[h];
    const poly = HOUSE_SHAPES[h];
    const m = CHART_TEXT[lang] || CHART_TEXT.en;
    const badge = 9.5;
    const pad = 2.5;
    const maxFs = 12.5;
    const minFs = 8.5;
    let best = null;
    for (let fs = maxFs; fs >= minFs; fs -= 0.5) {
      for (let cols = 1; cols <= count; cols++) {
        const rows = Math.ceil(count / cols);
        const rowStep = fs * (m.up + m.down + 0.14);
        const colStep = fs * (m.wide ? 1.5 : 1.3);
        const halfW = fs * (m.wide ? 0.62 : 0.46);
        const first = pos.dir > 0
          ? pos.ny + badge + pad + m.up * fs
          : pos.ny - badge - pad - m.down * fs;
        const last = first + pos.dir * (rows - 1) * rowStep;
        const top = Math.min(first, last) - m.up * fs;
        const bot = Math.max(first, last) + m.down * fs;
        let ok = true;
        for (let c = 0; c < cols && ok; c++) {
          const cx = pos.nx + (c - (cols - 1) / 2) * colStep;
          const vs = spanAtX(poly, cx);
          if (!vs || top < vs[0] + 2 || bot > vs[1] - 2) { ok = false; break; }
          for (let r = 0; r < rows; r++) {
            const yy = first + pos.dir * r * rowStep;
            const hs = spanAtY(poly, yy);
            if (!hs || cx - halfW < hs[0] + 2 || cx + halfW > hs[1] - 2) { ok = false; break; }
          }
        }
        if (!ok) continue;
        best = { cols: cols, rows: rows, fs: fs, rowStep: rowStep, colStep: colStep, first: first };
        return best;
      }
    }
    return best;
  }

  function chartMarkup(ascSign, planets, label, interactive, markerId) {
    const byHouse = [];
    for (let i = 0; i < 12; i++) byHouse.push([]);
    planets.forEach(p => { byHouse[p.house - 1].push(p); });
    byHouse.forEach(arr => arr.sort((a, b) => a.lon - b.lon));

    const out = [];
    out.push('<svg viewBox="0 0 400 400" role="img" aria-label="' + label + '">');
    if (interactive) {
      out.push('<defs><marker id="' + (markerId || 'k-aspect-arrow') + '" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto">' +
        '<path d="M0,0 L10,5 L0,10 Z"></path></marker></defs>');
    }
    out.push('<rect class="k-chart-bg" x="0.5" y="0.5" width="399" height="399" rx="8"></rect>');
    out.push('<path class="k-chart-fill-first" d="M200,0 L300,100 L200,200 L100,100 Z"></path>');
    out.push('<path class="k-chart-lines" d="M0,0 L400,400 M400,0 L0,400 M200,0 L400,200 L200,400 L0,200 Z"></path>');
    out.push('<rect class="k-chart-frame" x="0.5" y="0.5" width="399" height="399" rx="8"></rect>');

    for (let h = 0; h < 12; h++) {
      const pos = HOUSE_TEXT[h];
      const num = ((ascSign + h) % 12) + 1;
      out.push('<g class="k-house-badge">' +
        '<circle cx="' + pos.nx + '" cy="' + pos.ny + '" r="9.5"></circle>' +
        '<text class="k-house-num" x="' + pos.nx + '" y="' + pos.ny + '" text-anchor="middle" dominant-baseline="central">' + localNum(num) + '</text>' +
      '</g>');
      const ps = byHouse[h];
      if (!ps.length) continue;
      const plan = layoutPlanets(ps.length, h);
      if (!plan) continue;
      ps.forEach((p, i) => {
        const row = Math.floor(i / plan.cols);
        const col = i % plan.cols;
        const inRow = Math.min(plan.cols, ps.length - row * plan.cols);
        const y = plan.first + pos.dir * row * plan.rowStep;
        const x = pos.nx + (col - (inRow - 1) / 2) * plan.colStep;
        const text = '<text class="k-planet" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
          '" font-size="' + plan.fs + '" text-anchor="middle">' + ABBR[lang][p.id] + '</text>';
        if (!interactive) { out.push(text); return; }
        const hitR = Math.max(11, plan.fs * 0.82);
        out.push('<g class="k-planet-hit" role="button" tabindex="0" data-id="' + p.id +
          '" data-house="' + p.house + '" data-x="' + x.toFixed(1) + '" data-y="' + y.toFixed(1) +
          '" aria-label="' + PLANETS[lang][p.id] + '">' +
          '<circle class="k-planet-hit-area" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + hitR.toFixed(1) + '"></circle>' +
          text +
        '</g>');
      });
    }

    if (interactive) out.push('<g class="k-aspect-layer"></g>');
    out.push('</svg>');
    return out.join('');
  }

  function chartSvg(k) {
    return chartMarkup(Math.floor(k.asc / 30), k.items, t('kundali_chart_title', 'Janma Kundali'), true);
  }

  const ASPECT_OFFSETS = {
    sun: [7], moon: [7], mars: [7, 4, 8], mercury: [7], jupiter: [7, 5, 9],
    venus: [7], saturn: [7, 3, 10], rahu: [7, 5, 9], ketu: [7, 5, 9]
  };

  let aspectSelection = null;

  function aspectTargets(planet) {
    const offsets = ASPECT_OFFSETS[planet.id] || [7];
    return offsets.map(d => ((planet.house - 1 + d - 1) % 12) + 1);
  }

  function fillTpl(str, map) {
    return String(str).replace(/\{(\w+)\}/g, (m, key) => (map[key] !== undefined ? map[key] : m));
  }

  function joinHouseList(nums) {
    const items = nums.map(localNum);
    if (items.length < 2) return items.join('');
    const last = lang === 'hi' ? '\u0914\u0930' : (lang === 'ne' ? '\u0930' : 'and');
    return items.slice(0, -1).join(', ') + ' ' + last + ' ' + items[items.length - 1];
  }

  function shorten(fx, fy, tx, ty, dist) {
    const len = Math.hypot(tx - fx, ty - fy) || 1;
    const t = Math.min(1, dist / len);
    return { x: fx + (tx - fx) * t, y: fy + (ty - fy) * t };
  }

  function clearAspects() {
    ['kundali-chart', 'kundali-varga-chart'].forEach(function (id) {
      const chart = el(id);
      if (!chart) return;
      const layer = chart.querySelector('.k-aspect-layer');
      if (layer) layer.replaceChildren();
      Array.prototype.forEach.call(chart.querySelectorAll('.k-planet-hit.is-selected'), g => {
        g.classList.remove('is-selected');
      });
    });
    ['kundali-aspect-note', 'kundali-varga-aspect-note'].forEach(function (id) {
      const note = el(id);
      if (note) { note.textContent = ''; note.hidden = true; }
    });
    aspectSelection = null;
  }

  function showAspects(chartId, planets, planetId, noteId) {
    const chart = el(chartId);
    if (!chart || !planets) return;
    const layer = chart.querySelector('.k-aspect-layer');
    const hit = chart.querySelector('.k-planet-hit[data-id="' + planetId + '"]');
    if (!layer || !hit) return;
    if (aspectSelection && aspectSelection.chart === chartId && aspectSelection.id === planetId) {
      clearAspects();
      return;
    }
    const planet = planets.filter(p => p.id === planetId)[0];
    if (!planet) return;

    clearAspects();
    aspectSelection = { chart: chartId, id: planetId };
    hit.classList.add('is-selected');

    const markerEl = layer.ownerSVGElement ? layer.ownerSVGElement.querySelector('marker') : null;
    const markerId = markerEl ? markerEl.id : 'k-aspect-arrow';
    const sx = Number(hit.getAttribute('data-x'));
    const sy = Number(hit.getAttribute('data-y'));
    const targets = aspectTargets(planet);
    const total = targets.length;
    const NS = 'http://www.w3.org/2000/svg';

    targets.forEach(house => {
      const pos = HOUSE_TEXT[house - 1];
      const poly = document.createElementNS(NS, 'polygon');
      poly.setAttribute('class', 'k-aspect-house');
      poly.setAttribute('points', HOUSE_POLYGONS[house - 1]);
      layer.append(poly);
      const ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('class', 'k-aspect-badge');
      ring.setAttribute('cx', pos.nx);
      ring.setAttribute('cy', pos.ny);
      ring.setAttribute('r', '13.5');
      layer.append(ring);
    });

    targets.forEach((house, i) => {
      const pos = HOUSE_TEXT[house - 1];
      const tx = pos.nx;
      const ty = pos.ny;
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      const len = Math.hypot(tx - sx, ty - sy) || 1;
      const px = -(ty - sy) / len;
      const py = (tx - sx) / len;
      const spread = total > 1 ? (i - (total - 1) / 2) * 18 : 0;
      const cx = mx + (200 - mx) * 0.18 + px * spread;
      const cy = my + (200 - my) * 0.18 + py * spread;
      const start = shorten(sx, sy, cx, cy, Math.min(15, len * 0.22));
      const end = shorten(tx, ty, cx, cy, 15);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('class', 'k-aspect-arrow');
      path.setAttribute('d', 'M' + start.x.toFixed(1) + ',' + start.y.toFixed(1) +
        ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + end.x.toFixed(1) + ',' + end.y.toFixed(1));
      path.setAttribute('marker-end', 'url(#' + markerId + ')');
      if (total > 1) path.style.animationDelay = (i * 70) + 'ms';
      layer.append(path);
    });

    const note = el(noteId);
    if (note) {
      const line = fillTpl(t('kundali_aspect_note', '{p} in house {h} casts drishti on houses {list}.'), {
        p: PLANETS[lang][planet.id],
        h: localNum(planet.house),
        list: joinHouseList(targets)
      });
      note.textContent = line + ' ' + t('kundali_aspect_clear', 'Tap the graha again to clear.');
      note.hidden = false;
    }
  }

  function renderMeta(k) {
    const meta = el('kundali-meta');
    if (!meta) return;
    const city = cityLabel(k.input.city);
    const dstr = fmtDate(new Date(Date.UTC(k.input.y, k.input.mo - 1, k.input.d)));
    const tstr = localNum(String(k.input.h).padStart(2, '0')) + ':' + localNum(String(k.input.mi).padStart(2, '0'));
    const bits = [];
    if (k.input.name) bits.push(k.input.name);
    bits.push(dstr, tstr, city);
    meta.textContent = bits.join(' \u00B7 ');
  }

  function renderSummary(k) {
    const wrap = el('kundali-summary');
    if (!wrap) return;
    const cards = [
      { label: t('kundali_lagna', 'Lagna (Ascendant)'), value: SIGNS[lang][Math.floor(k.asc / 30)], sub: dms(k.asc % 30) },
      { label: t('kundali_moon_sign', 'Chandra Rashi'), value: SIGNS[lang][Math.floor(k.moonS / 30)], sub: NAKSHATRAS[lang][k.nak] },
      { label: t('kundali_nakshatra', 'Nakshatra'), value: NAKSHATRAS[lang][k.nak], sub: t('kundali_pada', 'Pada') + ' ' + localNum(k.pada) },
      { label: t('kundali_dasha_birth', 'Dasha at Birth'), value: PLANETS[lang][k.dasha.balance.id], sub: fmtYears(k.dasha.balance.ms) }
    ];
    wrap.innerHTML = cards.map(c =>
      '<div class="kundali-summary-card">' +
        '<span class="k-summary-label">' + c.label + '</span>' +
        '<span class="k-summary-value">' + c.value + '</span>' +
        '<span class="k-summary-sub">' + c.sub + '</span>' +
      '</div>'
    ).join('');
  }

  function renderPositions(k) {
    const body = el('kundali-positions');
    if (!body) return;
    body.innerHTML = k.items.map(p => {
      const direct = t('kundali_direct', 'Direct');
      const motion = p.retro ? t('kundali_retro', 'Retro') : direct;
      return '<tr>' +
        '<td><span class="k-dot k-dot-' + p.id + '"></span>' + PLANETS[lang][p.id] + '</td>' +
        '<td>' + SIGNS[lang][p.sign] + '</td>' +
        '<td>' + dms(p.deg) + '</td>' +
        '<td>' + localNum(p.house) + '</td>' +
        '<td class="' + (p.retro ? 'is-retro' : '') + '">' + motion + '</td>' +
      '</tr>';
    }).join('');
  }

  function ordinal(n) {
    if (lang === 'hi') return localNum(n) + '\u0935\u093E\u0901';
    if (lang === 'ne') return localNum(n) + '\u0914\u0901';
    const v = n % 100;
    const s = ['th', 'st', 'nd', 'rd'];
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function currentPeriods(k) {
    const now = Date.now();
    const list = k.dasha.list;
    let maha = list[list.length - 1];
    for (let i = 0; i < list.length; i++) {
      if (now >= list[i].start.getTime() && now < list[i].end.getTime()) { maha = list[i]; break; }
    }
    let antar = maha.antars[maha.antars.length - 1];
    for (let i = 0; i < maha.antars.length; i++) {
      const a = maha.antars[i];
      if (now >= a.start.getTime() && now < a.end.getTime()) { antar = a; break; }
    }
    let prat = (antar.pratyantars && antar.pratyantars[antar.pratyantars.length - 1]) || null;
    if (antar.pratyantars) {
      for (let i = 0; i < antar.pratyantars.length; i++) {
        const p = antar.pratyantars[i];
        if (now >= p.start.getTime() && now < p.end.getTime()) { prat = p; break; }
      }
    }
    return { maha: maha, antar: antar, prat: prat };
  }

  function dignityOf(id, sign) {
    const EXALT = { sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6 };
    const OWN = { sun: [4], moon: [3], mars: [0, 7], mercury: [2, 5], jupiter: [8, 11], venus: [1, 6], saturn: [9, 10] };
    if (!(id in EXALT)) return 'neutral';
    if (sign === EXALT[id]) return 'exalted';
    if (sign === (EXALT[id] + 6) % 12) return 'debilitated';
    if ((OWN[id] || []).indexOf(sign) !== -1) return 'own';
    return 'neutral';
  }

  function aspectingPlanets(v, targetHouse) {
    const SPECIAL = { mars: [4, 8], jupiter: [5, 9], saturn: [3, 10], rahu: [5, 9], ketu: [5, 9] };
    return v.planets.filter(p => {
      const d = ((targetHouse - p.house + 12) % 12) + 1;
      if (d === 7) return true;
      return (SPECIAL[p.id] || []).indexOf(d) !== -1;
    });
  }

  function phalToneKey(a) {
    return (a.bCount && a.mCount) ? 'mixed' : a.bCount ? 'supportive' : a.mCount ? 'demanding' : 'dasha';
  }

  function vargaAnalysis(k, v) {
    const keyHouse = VARGA_KEY_HOUSE[v.n] || 1;
    const keySign = (v.ascSign + keyHouse - 1) % 12;
    const keyLord = SIGN_LORDS[keySign];
    const lordPlanet = v.planets.filter(p => p.id === keyLord)[0] || null;
    const occupants = v.planets.filter(p => p.house === keyHouse);
    const aspecting = aspectingPlanets(v, keyHouse);
    const ids = [];
    occupants.forEach(p => { if (ids.indexOf(p.id) === -1) ids.push(p.id); });
    aspecting.forEach(p => { if (ids.indexOf(p.id) === -1) ids.push(p.id); });
    const bCount = ids.filter(id => BENEFICS.indexOf(id) !== -1).length;
    const mCount = ids.filter(id => MALEFICS.indexOf(id) !== -1).length;
    const cur = currentPeriods(k);
    const active = [];
    [cur.maha.id, cur.antar.id, cur.prat ? cur.prat.id : ''].forEach(id => {
      if (id && active.indexOf(id) === -1) active.push(id);
    });
    const linkers = active.filter(id => id === keyLord || occupants.some(p => p.id === id));
    const keyMaha = k.dasha.list.filter(m => m.id === keyLord)[0] || null;
    const keyAntar = cur.maha.antars.filter(a => a.id === keyLord)[0] || null;
    const lordDignity = dignityOf(keyLord, lordPlanet ? lordPlanet.sign : keySign);

    return {
      keyHouse: keyHouse,
      keySign: keySign,
      keyLord: keyLord,
      lordPlanet: lordPlanet,
      occupants: occupants,
      aspecting: aspecting,
      bCount: bCount,
      mCount: mCount,
      cur: cur,
      linkers: linkers,
      linked: linkers.length > 0,
      keyMaha: keyMaha,
      keyAntar: keyAntar,
      lordDignity: lordDignity
    };
  }

  function planetList(list, withSource) {
    return list.map(p => {
      const tail = p.retro ? ', ' + t('kundali_retro', 'Retro') : '';
      if (withSource) {
        const src = lang === 'hi' ? ' (भाव ' + localNum(p.house) + ' से)'
          : lang === 'ne' ? ' (भाव ' + localNum(p.house) + ' बाट)'
          : ' from the ' + ordinal(p.house) + ' house';
        return PLANETS[lang][p.id] + src;
      }
      return PLANETS[lang][p.id] + tail;
    }).join(', ');
  }

  function phalDetail(k, v, a) {
    const names = VARGA_NAMES[lang] || VARGA_NAMES.en;
    const purposes = VARGA_PURPOSE[lang] || VARGA_PURPOSE.en;
    const houseThemes = PHAL_HOUSE_THEME[lang] || PHAL_HOUSE_THEME.en;
    const signTraits = PHAL_SIGN_TRAIT[lang] || PHAL_SIGN_TRAIT.en;
    const planetEffects = PHAL_PLANET_EFFECT[lang] || PHAL_PLANET_EFFECT.en;
    const lordNotes = PHAL_LORD_DISTANCE[lang] || PHAL_LORD_DISTANCE.en;
    const nextSteps = PHAL_NEXT_STEPS[lang] || PHAL_NEXT_STEPS.en;
    const toneMap = PHAL_TONE[lang] || PHAL_TONE.en;
    const guide = (VARGA_GUIDANCE[lang] || VARGA_GUIDANCE.en)[v.n - 1];
    const caution = (VARGA_CAUTION[lang] || VARGA_CAUTION.en)[v.n - 1];
    const purposeRaw = purposes[v.n - 1];
    const purposeText = lang === 'en' ? purposeRaw.charAt(0).toLowerCase() + purposeRaw.slice(1) : purposeRaw;
    const keySignName = SIGNS[lang][a.keySign];
    const keyLordName = PLANETS[lang][a.keyLord];
    const lagnaName = SIGNS[lang][v.ascSign];
    const keyTrait = signTraits[a.keySign];
    const lagnaTrait = signTraits[v.ascSign];
    const houseTheme = houseThemes[a.keyHouse - 1];
    const aspNames = a.aspecting.length ? planetList(a.aspecting, true) : '';
    const beneficNames = a.occupants.concat(a.aspecting)
      .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
      .filter(p => BENEFICS.indexOf(p.id) !== -1)
      .map(p => PLANETS[lang][p.id]).join(', ');
    const dignityKey = a.lordDignity;
    const currentDates = t('kundali_maha', 'Mahadasha') + ' (' + fmtDate(a.cur.maha.start) + ' \u2013 ' + fmtDate(a.cur.maha.end) + '), ' +
      t('kundali_antar', 'Antardasha') + ' (' + fmtDate(a.cur.antar.start) + ' \u2013 ' + fmtDate(a.cur.antar.end) + ')' +
      (a.cur.prat ? ', ' + t('kundali_pratyantar', 'Pratyantardasha') + ' (' + fmtDate(a.cur.prat.start) + ' \u2013 ' + fmtDate(a.cur.prat.end) + ')' : '');
    const linkNames = a.linkers.map(id => PLANETS[lang][id]).join(', ');
    const toneKey = phalToneKey(a);
    const lordDistance = a.lordPlanet ? (((a.lordPlanet.house - a.keyHouse + 12) % 12) + 1) : 1;
    const lordNote = lordNotes[lordDistance - 1];
    const finalDates = a.keyMaha ? fmtDate(a.keyMaha.start) + ' \u2013 ' + fmtDate(a.keyMaha.end) : '';
    const nowMs = Date.now();
    const mahaState = a.keyMaha
      ? (a.keyMaha.end.getTime() < nowMs ? 'past' : a.keyMaha.start.getTime() > nowMs ? 'future' : 'now')
      : '';
    const antarState = a.keyAntar
      ? (a.keyAntar.end.getTime() < nowMs ? 'past' : a.keyAntar.start.getTime() > nowMs ? 'future' : 'now')
      : '';

    if (lang === 'hi') {
      const dignity = {
        exalted: 'स्वामी उच्च का है, जिससे इस क्षेत्र की फल देने की क्षमता मजबूत होती है। सही अवसर मिलने पर परिणाम बड़े और टिकाऊ हो सकते हैं।',
        own: 'स्वामी अपनी राशि में है, जिससे स्थिरता मिलती है। यह क्षेत्र आपका साथ देता है, बशर्ते आप निरंतरता बनाए रखें।',
        debilitated: 'स्वामी नीच का है, इसलिए परिणाम सीधे नहीं आते। सचेत प्रयास, सही सलाह और धैर्य से स्थिति धीरे-धीरे सुधरती जाती है।',
        neutral: 'स्वामी सामान्य राशि में है, इसलिए परिणाम उसके भाव और चल रही दशा पर निर्भर करते हैं। दोनों को साथ देखकर ही सही अनुमान बनता है।'
      }[dignityKey];
      const toneText = {
        supportive: 'इस भाव पर शुभ ग्रहों का सीधा सहयोग है, इसलिए नियमित प्रयास का फल अच्छा मिलता है और लोग भी साथ देते हैं।',
        mixed: 'इस भाव पर शुभ और अशुभ दोनों तरह के प्रभाव हैं, इसलिए सफलता संतुलन, धैर्य और सही समय पर निर्णय लेने से आती है।',
        demanding: 'इस भाव पर अशुभ प्रभाव प्रमुख हैं, इसलिए परिणाम जल्दी नहीं मिलते। अनुशासन, स्पष्ट रिकॉर्ड और धैर्य से रास्ता बनता है।',
        dasha: 'इस भाव पर कोई ग्रह सीधा प्रभाव नहीं डाल रहा, इसलिए इसका फल मुख्य रूप से स्वामी ग्रह और चल रही दशा से तय होता है।'
      };
      const activeLine = a.linked
        ? 'अभी ' + linkNames + ' इस भाव से जुड़े हैं, इसलिए यह विषय सक्रिय है और रोजमर्रा में महसूस होगा।'
        : 'अभी कोई चल रहा ग्रह इस भाव को सीधे नहीं छू रहा, इसलिए यह क्षेत्र पृष्ठभूमि में है; ' + keyLordName + ' की दशाओं में यह अधिक दिखेगा।';
      const retro = (a.lordPlanet && a.lordPlanet.retro)
        ? ' ' + keyLordName + ' वक्री है, इसलिए परिणाम थोड़ी देरी से, दोबारा सोच-विचार के बाद या पुराने संबंधों के जरिए आ सकते हैं।'
        : '';
      const tally = (a.bCount || a.mCount)
        ? 'संतुलन: शुभ प्रभाव ' + localNum(a.bCount) + ', अशुभ प्रभाव ' + localNum(a.mCount) + '। ' +
          (a.bCount > a.mCount ? 'शुभ पक्ष भारी है, इसलिए सहयोग अधिक मिलेगा।'
            : a.mCount > a.bCount ? 'अशुभ पक्ष भारी है, इसलिए हर परिणाम के लिए अधिक धैर्य चाहिए।'
            : 'दोनों बराबर हैं, इसलिए संतुलन बनाए रखना सबसे जरूरी है।')
        : 'किसी ग्रह का सीधा प्रभाव नहीं है, इसलिए फल स्वामी ग्रह और दशा पर टिका है।';
      const full = [
        '<strong>यह कुंडली क्या बताती है:</strong> यह फलादेश D' + v.n + ' ' + names[v.n - 1] + ' के जरिए ' + purposeText + ' के बारे में है। इस वर्ग में लग्न ' + lagnaName + ' है और मुख्य भाव ' + ordinal(a.keyHouse) + ' भाव (' + keySignName + ') है। यह भाव ' + houseTheme + ' से जुड़ा है, और ' + keySignName + ' राशि का स्वभाव ' + keyTrait + ' है — इसलिए इस क्षेत्र के मामले भी उसी शैली में आगे बढ़ते हैं।',
        '<strong>इसकी ताकत:</strong> ' + toneText[toneKey],
        '<strong>भाव स्वामी:</strong> ' + keyLordName + (a.lordPlanet ? ' ' + ordinal(a.lordPlanet.house) + ' भाव (' + SIGNS.hi[a.lordPlanet.sign] + ') में बैठा है। ' : ' मुख्य भाव में ही है। ') + lordNote + ' ' + dignity + retro,
        '<strong>ग्रह और दृष्टि:</strong> ' + (a.occupants.length
          ? a.occupants.map(p => '<strong>' + PLANETS.hi[p.id] + ':</strong> ' + planetEffects[p.id]).join(' ')
          : 'इस भाव में कोई ग्रह नहीं बैठा; यह कमजोरी नहीं है, ऐसे में स्वामी और दृष्टि अधिक मायने रखते हैं। ') +
          (a.aspecting.length ? 'दृष्टि देने वाले ग्रह: ' + aspNames + '। ' + a.aspecting.map(p => planetEffects[p.id]).join(' ') : ' कोई सीधी दृष्टि नहीं है।') +
          ' ' + tally,
        '<strong>समय:</strong> अभी ' + PLANETS.hi[a.cur.maha.id] + ' महादशा, ' + PLANETS.hi[a.cur.antar.id] + ' अंतर्दशा' + (a.cur.prat ? ' और ' + PLANETS.hi[a.cur.prat.id] + ' प्रत्यंतर्दशा' : '') + ' चल रही है (' + currentDates + ')। ' + activeLine +
          (a.keyMaha ? ' ' + keyLordName + ' की मुख्य महादशा ' + finalDates + (mahaState === 'past' ? ' बीत चुकी है; अब इसकी छोटी दशाओं में यही विषय लौटकर आते हैं।' : mahaState === 'future' ? ' आगे है; ' + purposeText + ' से जुड़े बड़े कदम उसी दौर के लिए योजना बनाकर रखें।' : ' अभी चल रही है, इसलिए यह क्षेत्र सबसे साफ तौर पर सामने आ रहा है।') : '') +
          (a.keyAntar ? ' इसी महादशा में ' + keyLordName + ' की अंतर्दशा ' + fmtDate(a.keyAntar.start) + ' \u2013 ' + fmtDate(a.keyAntar.end) + (antarState === 'past' ? ' बीत चुकी है; कोई निर्णय छूटा हो तो अगली अंतर्दशा की प्रतीक्षा करें।' : antarState === 'future' ? ' आगे है, और उस समय इस क्षेत्र के फैसले अधिक असरदार होंगे।' : ' अभी चल रही है, इसलिए निर्णय के लिए यह मजबूत समय है।') : '') +
          (a.cur.maha.id === a.keyLord ? ' विशेष रूप से, स्वामी ग्रह की ही महादशा चल रही है — इसका असर रोजमर्रा में सीधे दिखेगा।' : ''),
        '<strong>सहयोग और सावधानी:</strong> ' + guide + ' ' + (a.bCount ? 'सहयोग ' + beneficNames + ' जैसे शुभ ग्रहों से मिलता है। ' : 'सहयोग मुख्य रूप से स्वामी ग्रह ' + keyLordName + ' से मिलता है। ') + 'मुख्य सावधानी: ' + caution + ' ' + (a.mCount ? 'अशुभ दबाव मौजूद है, इसलिए जल्दबाजी, गुस्से और अस्पष्ट समझौतों से बचें।' : 'सीधा अशुभ दबाव नहीं है, पर सहयोग स्वतः नहीं मिलता; तथ्यों और अनुशासन पर टिके रहें।') + ' जब मन अस्थिर हो या दशा कठिन चल रही हो, बड़े फैसले कुछ दिन टालें।',
        '<strong>अंतिम उत्तर और अगला कदम:</strong> कुल मिलाकर यह क्षेत्र ' + toneMap[toneKey] + ' है। ' + nextSteps[0] + ' <strong>दूसरा कदम:</strong> ' + nextSteps[1] + keyLordName + ' की दशा में शुरू करें, जल्दबाजी में नहीं' + (finalDates ? ' (' + finalDates + ')' : '') + '। <strong>तीसरा कदम:</strong> ' + nextSteps[2]
      ];

      return { tone: toneMap[toneKey], full: full };
    }

    if (lang === 'ne') {
      const dignity = {
        exalted: 'स्वामी उच्चको छ, जसले यो क्षेत्रको फल दिने क्षमता बलियो बनाउँछ। सही अवसर पाए परिणाम ठूला र टिकाउ हुन सक्छन्।',
        own: 'स्वामी आफ्नै राशिमा छ, जसले स्थिरता दिन्छ। निरन्तरता राखे यो क्षेत्रले तपाईंलाई साथ दिन्छ।',
        debilitated: 'स्वामी नीचको छ, त्यसैले नतिजा सिधै आउँदैन। सचेत प्रयास, उचित सल्लाह र धैर्यले अवस्था बिस्तारै सुधार्छ।',
        neutral: 'स्वामी सामान्य राशिमा छ, त्यसैले परिणाम यसको भाव र चालु दशामा निर्भर छ। दुवैलाई सँगै हेर्दा यथार्थ अनुमान बन्छ।'
      }[dignityKey];
      const toneText = {
        supportive: 'यो भावमा शुभ ग्रहको सिधा सहयोग छ, त्यसैले नियमित प्रयासको फल राम्रो हुन्छ र मानिसहरूले पनि साथ दिन्छन्।',
        mixed: 'यो भावमा शुभ र अशुभ दुवै प्रभाव छन्, त्यसैले सफलता सन्तुलन, धैर्य र सही समयको निर्णयले आउँछ।',
        demanding: 'यो भावमा अशुभ प्रभाव प्रमुख छन्, त्यसैले नतिजा चाँडै आउँदैन। अनुशासन, स्पष्ट रेकर्ड र धैर्यले बाटो बन्छ।',
        dasha: 'यो भावमा कुनै ग्रहको सिधा प्रभाव छैन, त्यसैले फल मुख्यतः स्वामी ग्रह र चालु दशाले तय गर्छ।'
      };
      const activeLine = a.linked
        ? 'अहिले ' + linkNames + ' यो भावसँग जोडिएका छन्, त्यसैले यो विषय सक्रिय छ र दैनिक जीवनमा महसुस हुन्छ।'
        : 'अहिले कुनै चालु ग्रहले यो भावलाई सिधै छुँदैन, त्यसैले यो क्षेत्र पृष्ठभूमिमा छ; ' + keyLordName + ' का दशाहरूमा यो बढी देखिन्छ।';
      const retro = (a.lordPlanet && a.lordPlanet.retro)
        ? ' ' + keyLordName + ' वक्री छ, त्यसैले नतिजा केही ढिलो, दोबारा सोचविचारपछि वा पुराना सम्पर्कमार्फत आउन सक्छ।'
        : '';
      const tally = (a.bCount || a.mCount)
        ? 'सन्तुलन: शुभ प्रभाव ' + localNum(a.bCount) + ', अशुभ प्रभाव ' + localNum(a.mCount) + '। ' +
          (a.bCount > a.mCount ? 'शुभ पक्ष भारी छ, त्यसैले सहयोग बढी मिल्छ।'
            : a.mCount > a.bCount ? 'अशुभ पक्ष भारी छ, त्यसैले हरेक परिणामका लागि बढी धैर्य चाहिन्छ।'
            : 'दुवै बराबर छन्, त्यसैले सन्तुलन कायम राख्नु सबैभन्दा जरुरी छ।')
        : 'कुनै ग्रहको सिधा प्रभाव छैन, त्यसैले फल स्वामी ग्रह र दशामा टिकेको छ।';
      const full = [
        '<strong>यो कुण्डली के बताउँछ:</strong> यो फलादेश D' + v.n + ' ' + names[v.n - 1] + ' बाट ' + purposeText + ' का बारेमा हो। यो वर्गमा लग्न ' + lagnaName + ' छ र मुख्य भाव ' + ordinal(a.keyHouse) + ' भाव (' + keySignName + ') हो। यो भाव ' + houseTheme + ' सँग जोडिन्छ, र ' + keySignName + ' राशिको स्वभाव ' + keyTrait + ' हुन्छ — त्यसैले यस क्षेत्रका विषय पनि त्यही शैलीमा अघि बढ्छन्।',
        '<strong>यसको बल:</strong> ' + toneText[toneKey],
        '<strong>भाव स्वामी:</strong> ' + keyLordName + (a.lordPlanet ? ' ' + ordinal(a.lordPlanet.house) + ' भाव (' + SIGNS.ne[a.lordPlanet.sign] + ') मा छ। ' : ' मुख्य भावमै छ। ') + lordNote + ' ' + dignity + retro,
        '<strong>ग्रह र दृष्टि:</strong> ' + (a.occupants.length
          ? a.occupants.map(p => '<strong>' + PLANETS.ne[p.id] + ':</strong> ' + planetEffects[p.id]).join(' ')
          : 'यो भावमा कुनै ग्रह छैन; यो कमजोरी होइन, त्यस्तो अवस्थामा स्वामी र दृष्टि बढी महत्वपूर्ण हुन्छन्। ') +
          (a.aspecting.length ? 'दृष्टि दिने ग्रह: ' + aspNames + '। ' + a.aspecting.map(p => planetEffects[p.id]).join(' ') : ' सिधा दृष्टि छैन।') +
          ' ' + tally,
        '<strong>समय:</strong> अहिले ' + PLANETS.ne[a.cur.maha.id] + ' महादशा, ' + PLANETS.ne[a.cur.antar.id] + ' अन्तर्दशा' + (a.cur.prat ? ' र ' + PLANETS.ne[a.cur.prat.id] + ' प्रत्यन्तर्दशा' : '') + ' चलिरहेको छ (' + currentDates + ')। ' + activeLine +
          (a.keyMaha ? ' ' + keyLordName + 'को मुख्य महादशा ' + finalDates + (mahaState === 'past' ? ' बितिसक्यो; अब यसका साना दशाहरूमा यही विषय फर्केर आउँछन्।' : mahaState === 'future' ? ' अगाडि छ; ' + purposeText + ' का ठूला कदम त्यही समयका लागि योजना गरेर राख्नुहोस्।' : ' अहिले चलिरहेको छ, त्यसैले यो क्षेत्र सबैभन्दा स्पष्ट रूपमा सामु आइरहेको छ।') : '') +
          (a.keyAntar ? ' यही महादशाभित्र ' + keyLordName + 'को अन्तर्दशा ' + fmtDate(a.keyAntar.start) + ' \u2013 ' + fmtDate(a.keyAntar.end) + (antarState === 'past' ? ' बितिसक्यो; कुनै निर्णय छुटेको भए अर्को अन्तर्दशा पर्खनुहोस्।' : antarState === 'future' ? ' अगाडि छ, र त्यो समयमा यस क्षेत्रका निर्णय बढी प्रभावकारी हुन्छन्।' : ' अहिले चलिरहेको छ, त्यसैले निर्णयका लागि यो बलियो समय हो।') : '') +
          (a.cur.maha.id === a.keyLord ? ' विशेष गरेर, स्वामी ग्रहको महादशा नै चलिरहेको छ — यसको असर दैनिक जीवनमा सिधै देखिन्छ।' : ''),
        '<strong>सहयोग र सावधानी:</strong> ' + guide + ' ' + (a.bCount ? 'सहयोग ' + beneficNames + ' जस्ता शुभ ग्रहबाट आउँछ। ' : 'सहयोग मुख्यतः स्वामी ग्रह ' + keyLordName + 'बाट आउँछ। ') + 'मुख्य सावधानी: ' + caution + ' ' + (a.mCount ? 'अशुभ दबाब छ, त्यसैले हतार, क्रोध र अस्पष्ट सम्झौताबाट बच्नुहोस्।' : 'सिधा अशुभ दबाब छैन, तर सहयोग स्वतः आउँदैन; तथ्य र अनुशासनमा टिकिरहनुहोस्।') + ' मन अस्थिर हुँदा वा दशा कठिन चल्दा ठूला निर्णय केही दिन पछाडि सार्नुहोस्।',
        '<strong>अन्तिम उत्तर र अर्को कदम:</strong> समग्रमा यो क्षेत्र ' + toneMap[toneKey] + ' छ। ' + nextSteps[0] + ' <strong>दोस्रो कदम:</strong> ' + nextSteps[1] + keyLordName + 'को दशामा सुरु गर्नुहोस्, हतारमा होइन' + (finalDates ? ' (' + finalDates + ')' : '') + '। <strong>तेस्रो कदम:</strong> ' + nextSteps[2]
      ];

      return { tone: toneMap[toneKey], full: full };
    }

    const dignity = {
      exalted: 'The lord is exalted, which strengthens the ability of this area to deliver; when the right opportunity comes, results can be large and lasting.',
      own: 'The lord is in its own sign, which gives stability; this area supports you, provided you stay consistent.',
      debilitated: 'The lord is debilitated, so results do not come easily; conscious effort, sound advice and patience steadily improve the picture.',
      neutral: 'The lord is in a neutral sign, so results depend on its house and the running dasha; read both together for a realistic picture.'
    }[dignityKey];
    const toneText = {
      supportive: 'This house has direct benefic support, so steady effort is usually rewarded and people tend to cooperate.',
      mixed: 'Both support and pressure are present, so results come through balance, patience and well-timed decisions.',
      demanding: 'Malefic pressure dominates this house, so results do not come quickly; discipline, clear records and patience build the way forward.',
      dasha: 'No planet directly influences this house, so its outcome is decided mainly by the key lord and the running dasha.'
    };
    const activeLine = a.linked
      ? 'Right now ' + linkNames + (a.linkers.length > 1 ? ' connect' : ' connects') + ' to this house, so the theme is live and you will notice it in daily life.'
      : 'No running planet touches this house right now, so this area stays in the background; it becomes visible during the periods of ' + keyLordName + '.';
    const retro = (a.lordPlanet && a.lordPlanet.retro)
      ? ' ' + keyLordName + ' is retrograde, so results may come with some delay, after second thoughts, or through old contacts.'
      : '';
    const tally = (a.bCount || a.mCount)
      ? '<strong>Balance:</strong> benefic influences: ' + a.bCount + '; malefic influences: ' + a.mCount + '. ' +
        (a.bCount > a.mCount ? 'The supportive side is stronger, so help is easier to find.'
          : a.mCount > a.bCount ? 'The testing side is stronger, so every result needs more patience.'
          : 'Both sides are equal, so keeping balance is the most important factor.')
      : '<strong>No direct influence:</strong> nothing touches the house, so the outcome rests on the key lord and the dasha.';
    const full = [
      '<strong>What this chart shows:</strong> this reading is about ' + purposeText + ' through D' + v.n + ' ' + names[v.n - 1] + '. In this chart the ascendant is ' + lagnaName + ' and the main house is the ' + ordinal(a.keyHouse) + ' house in ' + keySignName + '. That house is about ' + houseTheme + ', and the nature of ' + keySignName + ' is ' + keyTrait + ', so matters of this area move in the same style.',
      '<strong>How strong it is:</strong> ' + toneText[toneKey],
      '<strong>Lord of the area:</strong> ' + keyLordName + ' rules this house' + (a.lordPlanet ? ' and sits in the ' + ordinal(a.lordPlanet.house) + ' house (' + SIGNS.en[a.lordPlanet.sign] + '). ' : ' and sits in the key house itself. ') + lordNote + ' ' + dignity + retro,
      '<strong>Planets and aspects:</strong> ' + (a.occupants.length
        ? a.occupants.map(p => '<strong>' + PLANETS.en[p.id] + ':</strong> ' + planetEffects[p.id]).join(' ')
        : 'No planet occupies this house, which is not weakness; the lord and the aspects then carry more weight. ') +
        (a.aspecting.length ? 'Aspects come from ' + aspNames + '. ' + a.aspecting.map(p => planetEffects[p.id]).join(' ') : 'No planet aspects this house directly.') +
        ' ' + tally,
      '<strong>Timing:</strong> the running period is ' + PLANETS.en[a.cur.maha.id] + ' Mahadasha and ' + PLANETS.en[a.cur.antar.id] + ' Antardasha' + (a.cur.prat ? ', with ' + PLANETS.en[a.cur.prat.id] + ' Pratyantardasha' : '') + ' (' + currentDates + '). ' + activeLine +
        (a.keyMaha ? ' The main Mahadasha of ' + keyLordName + ' runs ' + finalDates + (mahaState === 'past' ? ', which has passed; its lessons still shape this area and its themes return in the smaller periods of the lord.' : mahaState === 'future' ? ', which is still ahead; plan bigger steps for that window.' : ', which is running now, so this area is at its clearest.') : '') +
        (a.keyAntar ? ' Inside it, the ' + keyLordName + ' Antardasha runs ' + fmtDate(a.keyAntar.start) + ' \u2013 ' + fmtDate(a.keyAntar.end) + (antarState === 'past' ? ' and is already over; if a decision was missed, wait for the next sub-period of the lord.' : antarState === 'future' ? ' and will make decisions in this area carry more weight.' : ' and is active now, making this a strong time for decisions here.') : '') +
        (a.cur.maha.id === a.keyLord ? ' The Mahadasha of the key lord itself is running, so this area is at its strongest.' : ''),
      '<strong>Support and caution:</strong> ' + guide + ' ' + (a.bCount ? 'Support comes from benefic planets such as ' + beneficNames + '. ' : 'Support comes mainly from the lord ' + keyLordName + '. ') + 'Your main caution: ' + caution + ' ' + (a.mCount ? 'Malefic pressure is present, so avoid haste, anger and unclear agreements.' : 'There is no direct malefic pressure, but support is not automatic; stay with facts and discipline.') + ' When the mind is unsettled or the dasha is difficult, postpone big decisions for a few days.',
      '<strong>Final answer and next step:</strong> overall this area is ' + toneMap[toneKey].toLowerCase() + '. ' + nextSteps[0] + ' <strong>Second step:</strong> ' + nextSteps[1] + keyLordName + (finalDates ? ' (' + finalDates + ')' : '') + ' rather than rushing. <strong>Third step:</strong> ' + nextSteps[2]
    ];

    return { tone: toneMap[toneKey], full: full };
  }

  function renderPhalDetail(k) {
    const wrap = el('kundali-phal-detail');
    if (!wrap || !k.vargas) return;
    const n = phalSel || 9;
    const v = k.vargas[n - 1];
    const a = vargaAnalysis(k, v);
    const d = phalDetail(k, v, a);
    const names = VARGA_NAMES[lang] || VARGA_NAMES.en;
    const purposes = VARGA_PURPOSE[lang] || VARGA_PURPOSE.en;
    const lagnaLabel = t('kundali_varga_lagna', 'Lagna');
    const activeLabel = t('kundali_phal_active', 'Active now');

    wrap.innerHTML =
      '<article class="kundali-card k-phal-detail-card">' +
        '<div class="k-phal-detail-head">' +
          '<div class="k-varga-head">' +
            '<span class="k-varga-code">D' + n + '</span>' +
            '<div class="k-varga-title"><h4>' + names[n - 1] + '</h4><p>' + purposes[n - 1] + '</p></div>' +
            '<span class="k-varga-badge k-phal-tone">' + d.tone + '</span>' +
          '</div>' +
          '<p class="k-varga-lagna"><strong>' + lagnaLabel + ':</strong> ' + SIGNS[lang][v.ascSign] + '</p>' +
          (a.linked ? '<div class="k-result-badges k-phal-badges"><span class="k-badge">' + activeLabel + ' <span class="k-now-dot"></span></span></div>' : '') +
        '</div>' +
        '<div class="k-phal-full">' + d.full.map(p => '<p>' + p + '</p>').join('') + '</div>' +
      '</article>';
  }

  function renderPhalSelect(k) {
    const select = el('kundali-phal-select');
    if (!select || !k.vargas) return;
    const names = VARGA_NAMES[lang] || VARGA_NAMES.en;
    if (!phalSel || !k.vargas[phalSel - 1]) phalSel = 9;
    select.innerHTML = k.vargas.map(v =>
      '<option value="' + v.n + '">D' + v.n + ' \u00B7 ' + names[v.n - 1] + '</option>'
    ).join('');
    select.value = String(phalSel);
    renderPhalDetail(k);
  }

  function renderDashaNow(k) {
    const wrap = el('kundali-dasha-now');
    if (!wrap) return;
    const cur = currentPeriods(k);
    const now = Date.now();
    const ageAt = dateMs => Math.max(0, (dateMs - k.utc.getTime()) / YEAR_MS);
    const items = [
      { label: t('kundali_maha', 'Mahadasha'), period: cur.maha },
      { label: t('kundali_antar', 'Antardasha'), period: cur.antar },
      { label: t('kundali_pratyantar', 'Pratyantardasha'), period: cur.prat }
    ].filter(item => item.period);

    const cells = items.map(item => {
      const p = item.period;
      const span = Math.max(1, p.end.getTime() - p.start.getTime());
      const pct = Math.max(2, Math.min(100, ((now - p.start.getTime()) / span) * 100));
      return '<div class="k-dasha-now-item">' +
        '<span class="k-dasha-now-label">' + item.label + '</span>' +
        '<strong class="k-dasha-now-lord">' + PLANETS[lang][p.id] + '</strong>' +
        '<span class="k-dasha-now-range">' + fmtDate(p.start) + ' \u2013 ' + fmtDate(p.end) + '</span>' +
        '<span class="k-dasha-now-meta">' +
          fillTpl(t('kundali_age_at_start', 'Age {a}'), { a: localNum(Math.floor(ageAt(p.start.getTime()))) }) +
          ' \u00B7 ' +
          fillTpl(t('kundali_remaining', '{d} left'), { d: fmtRemaining(Math.max(0, p.end.getTime() - now)) }) +
        '</span>' +
        '<div class="k-dasha-now-track" role="img" aria-label="' + t('kundali_dasha_progress', 'Progress') + ' ' + Math.round(pct) + '%">' +
          '<span style="width:' + pct.toFixed(1) + '%"></span>' +
        '</div>' +
      '</div>';
    }).join('');

    wrap.innerHTML =
      '<div class="k-dasha-now-head">' +
        '<span class="k-dasha-now-title">' + t('kundali_dasha_now_title', 'Running Period') + '</span>' +
        '<p class="k-dasha-now-sub">' + t('kundali_dasha_now_sub', 'Where the Vimshottari sequence stands today.') + '</p>' +
      '</div>' +
      '<div class="k-dasha-now-grid">' + cells + '</div>';
    wrap.hidden = false;
  }

  function renderDasha(k) {
    const balEl = el('kundali-dasha-balance');
    if (balEl) {
      balEl.innerHTML = '<strong>' + t('kundali_balance', 'Balance at birth') + ':</strong> ' +
        PLANETS[lang][k.dasha.balance.id] + ' \u2014 ' + fmtYears(k.dasha.balance.ms);
    }
    renderDashaNow(k);
    const wrap = el('kundali-dasha');
    if (!wrap) return;
    const now = Date.now();
    const curLabel = t('kundali_current', 'Current');
    const lordLabel = t('kundali_th_lord', 'Lord');
    const startLabel = t('kundali_th_start', 'From');
    const endLabel = t('kundali_th_end', 'To');
    wrap.innerHTML = k.dasha.list.map(m => {
      const mCur = now >= m.start.getTime() && now < m.end.getTime();
      const antars = m.antars.map(a => {
        const aCur = now >= a.start.getTime() && now < a.end.getTime();
        const pratyantars = (a.pratyantars || []).map(p => {
          const pCur = now >= p.start.getTime() && now < p.end.getTime();
          return '<tr' + (pCur ? ' class="is-current"' : '') + '>' +
            '<td>' + PLANETS[lang][p.id] + (pCur ? ' <span class="k-now-dot"></span>' : '') + '</td>' +
            '<td>' + fmtDate(p.start) + '</td>' +
            '<td>' + fmtDate(p.end) + '</td>' +
          '</tr>';
        }).join('');
        return '<details class="k-antar-item' + (aCur ? ' is-current' : '') + '"' + (aCur ? ' open' : '') + '>' +
          '<summary>' +
            '<span class="k-antar-lord">' + PLANETS[lang][a.id] + '</span>' +
            '<span class="k-antar-dates">' + fmtDate(a.start) + ' \u2013 ' + fmtDate(a.end) + '</span>' +
            (aCur ? '<span class="k-dasha-badge">' + curLabel + '</span>' : '') +
          '</summary>' +
          '<div class="k-pratyantar-wrap"><table class="k-table k-pratyantar-table">' +
            '<thead><tr><th>' + lordLabel + '</th><th>' + startLabel + '</th><th>' + endLabel + '</th></tr></thead>' +
            '<tbody>' + pratyantars + '</tbody>' +
          '</table></div>' +
        '</details>';
      }).join('');
      return '<details class="k-dasha-item' + (mCur ? ' is-current' : '') + '"' + (mCur ? ' open' : '') + '>' +
        '<summary>' +
          '<span class="k-dasha-lord">' + PLANETS[lang][m.id] + '</span>' +
          '<span class="k-dasha-dates">' + fmtDate(m.start) + ' \u2013 ' + fmtDate(m.end) + '</span>' +
          '<span class="k-dasha-years">' + localNum(m.years) + ' ' + t('kundali_years_short', 'y') + '</span>' +
          (mCur ? '<span class="k-dasha-badge">' + curLabel + '</span>' : '') +
        '</summary>' +
        '<div class="k-antar-wrap">' + antars + '</div>' +
      '</details>';
    }).join('');
  }

  function vargaView(k) {
    const view = el('kundali-varga-view');
    if (!view || !k.vargas) return;
    const n = vargaSel || 9;
    const v = k.vargas[n - 1];
    const names = VARGA_NAMES[lang] || VARGA_NAMES.en;
    const purposes = VARGA_PURPOSE[lang] || VARGA_PURPOSE.en;
    const lagnaLabel = t('kundali_varga_lagna', 'Lagna');
    const chart = chartMarkup(v.ascSign, v.planets, 'D' + n + ' ' + names[n - 1], true, 'k-aspect-arrow-varga');
    const a = vargaAnalysis(k, v);
    const occNames = a.occupants.length ? a.occupants.map(p => PLANETS[lang][p.id]).join(', ') : t('kundali_none', 'None');
    const aspNames = a.aspecting.length ? a.aspecting.map(p => PLANETS[lang][p.id]).join(', ') : t('kundali_none', 'None');
    const lordPos = a.lordPlanet ? ordinal(a.lordPlanet.house) + ' \u00B7 ' + SIGNS[lang][a.lordPlanet.sign] : '\u2014';
    const rows = v.planets.map(p =>
      '<tr>' +
        '<td><span class="k-dot k-dot-' + p.id + '"></span>' + PLANETS[lang][p.id] + '</td>' +
        '<td>' + SIGNS[lang][p.sign] + '</td>' +
        '<td>' + localNum(p.house) + '</td>' +
      '</tr>'
    ).join('');

    view.innerHTML =
      '<article class="kundali-card k-varga-panel' + (n === 9 ? ' is-key' : '') + '">' +
        '<div class="k-varga-panel-head">' +
          '<div class="k-varga-head">' +
            '<span class="k-varga-code">D' + n + '</span>' +
            '<div class="k-varga-title"><h4>' + names[n - 1] + '</h4><p>' + purposes[n - 1] + '</p></div>' +
            (n === 9 ? '<span class="k-varga-badge">' + t('kundali_varga_key', 'Key chart') + '</span>' : '') +
          '</div>' +
          '<p class="k-varga-lagna"><strong>' + lagnaLabel + ':</strong> ' + SIGNS[lang][v.ascSign] + '</p>' +
        '</div>' +
        '<div class="k-varga-panel-body">' +
          '<div class="k-varga-figure">' +
            '<div class="kundali-chart k-varga-chart" id="kundali-varga-chart">' + chart + '</div>' +
            '<p class="k-chart-hint">' + t('kundali_aspect_hint', 'Tap a graha in the chart to see where it casts drishti.') + '</p>' +
            '<p class="k-aspect-note" id="kundali-varga-aspect-note" role="status" aria-live="polite" hidden></p>' +
          '</div>' +
          '<div class="k-varga-side">' +
            '<div class="k-table-wrap"><table class="k-table k-varga-table">' +
              '<thead><tr>' +
                '<th>' + t('kundali_th_planet', 'Graha') + '</th>' +
                '<th>' + t('kundali_th_sign', 'Rashi') + '</th>' +
                '<th>' + t('kundali_th_house', 'Bhava') + '</th>' +
              '</tr></thead>' +
              '<tbody>' +
                '<tr class="k-varga-lagna-row"><td>' + lagnaLabel + '</td><td>' + SIGNS[lang][v.ascSign] + '</td><td>' + localNum(1) + '</td></tr>' +
                rows +
              '</tbody>' +
            '</table></div>' +
            '<div class="k-varga-facts">' +
              '<div class="k-varga-facts-head"><h4>' + t('kundali_at_glance', 'At a glance') + '</h4><span class="k-varga-code">D' + n + '</span></div>' +
              '<dl>' +
                '<div><dt>' + t('kundali_key_house', 'Key house') + '</dt><dd>' + ordinal(a.keyHouse) + ' \u00B7 ' + SIGNS[lang][a.keySign] + '</dd></div>' +
                '<div><dt>' + t('kundali_key_lord', 'Key lord') + '</dt><dd>' + PLANETS[lang][a.keyLord] + ' \u00B7 ' + lordPos + '</dd></div>' +
                '<div><dt>' + t('kundali_occupants', 'Occupants') + '</dt><dd>' + occNames + '</dd></div>' +
                '<div><dt>' + t('kundali_aspecting', 'Aspecting') + '</dt><dd>' + aspNames + '</dd></div>' +
              '</dl>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderVargas(k) {
    const d1 = el('kundali-d1-purpose');
    const names = VARGA_NAMES[lang] || VARGA_NAMES.en;
    const purposes = VARGA_PURPOSE[lang] || VARGA_PURPOSE.en;
    if (d1) d1.textContent = purposes[0];
    const select = el('kundali-varga-select');
    if (!select || !k.vargas) return;
    if (!vargaSel || !k.vargas[vargaSel - 1]) vargaSel = 9;
    select.innerHTML = k.vargas.map(v =>
      '<option value="' + v.n + '">D' + v.n + ' \u00B7 ' + names[v.n - 1] + '</option>'
    ).join('');
    select.value = String(vargaSel);
    vargaView(k);
  }

  function renderAll() {
    if (!state) return;
    lang = currentLang();
    clearAspects();
    renderMeta(state);
    renderSummary(state);
    const chart = el('kundali-chart');
    if (chart) chart.innerHTML = chartSvg(state);
    const legend = el('kundali-legend');
    if (legend) legend.textContent = SIGNS[lang].map((s, i) => localNum(i + 1) + ' ' + s).join(' \u00B7 ');
    const abbr = el('kundali-abbr');
    if (abbr) abbr.textContent = Object.keys(PLANETS[lang]).map(id => ABBR[lang][id] + ' ' + PLANETS[lang][id]).join(' \u00B7 ');
    renderPositions(state);
    renderVargas(state);
    renderPhalSelect(state);
    renderDasha(state);
  }

  function canonicalTz(tz) {
    const map = {
      'Asia/Katmandu': 'Asia/Kathmandu',
      'Asia/Calcutta': 'Asia/Kolkata',
      'Asia/Rangoon': 'Asia/Yangon',
      'Asia/Saigon': 'Asia/Ho_Chi_Minh',
      'Europe/Kiev': 'Europe/Kyiv'
    };
    return map[tz] || tz;
  }

  function tzGeneric(tz) {

    const loc = lang === 'hi' ? 'hi-IN' : (lang === 'ne' ? 'ne-NP' : 'en-GB');
    const read = l => {
      const p = new Intl.DateTimeFormat(l, { timeZone: tz, timeZoneName: 'longGeneric' })
        .formatToParts(new Date()).filter(x => x.type === 'timeZoneName')[0];
      return p ? p.value : '';
    };
    try { return read(loc); } catch (e) {
      try { return read('en-GB'); } catch (e2) { return ''; }
    }
  }

  function fillTimezones() {
    const sel = el('kundali-tz');
    if (!sel) return;
    const prev = canonicalTz(sel.value || '');
    const zones = TIMEZONES.slice();
    try {
      const bz = canonicalTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
      if (bz && zones.indexOf(bz) === -1) zones.push(bz);

    } catch (e) {}
    sel.innerHTML = '<option value="">' + t('kundali_tz_select', 'Select timezone') + '</option>' +
      zones.map(z => {
        const nm = tzGeneric(z);
        return '<option value="' + z + '">' + z + (nm ? ' \u00B7 ' + nm : '') + '</option>';
      }).join('');
    if (prev && zones.indexOf(prev) !== -1) {
      sel.value = prev;
    } else if (prev) {
      const opt = document.createElement('option');
      opt.value = prev;
      opt.textContent = prev;
      sel.appendChild(opt);
      sel.value = prev;
    }
  }

  function normPlace(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function foldPlace(value) {
    return normPlace(value)
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/ph/g, 'f')
      .replace(/gh/g, 'g')
      .replace(/kh/g, 'k')
      .replace(/th/g, 't')
      .replace(/bh/g, 'b')
      .replace(/dh/g, 'd')
      .replace(/jh/g, 'j')
      .replace(/ch/g, 'c')
      .replace(/sh/g, 's')
      .replace(/([bcdfgjklmnpqrstvwxyz])h/g, '$1')
      .replace(/w/g, 'v')
      .replace(/([aeiou])v([aeiou])/g, '$1$2')
      .replace(/aa/g, 'a')
      .replace(/ee/g, 'i')
      .replace(/oo/g, 'u');
  }

  function uniquePlaceParts(parts) {
    const out = [];
    parts.forEach(function (part) {
      const text = String(part || '').trim();
      if (!text) return;
      const key = normPlace(text);
      if (!key) return;
      if (out.some(x => normPlace(x) === key)) return;
      out.push(text);
    });
    return out;
  }

  function placeName(city) {
    if (!city || !city.name) return '';
    return city.name[lang] || city.name.en || '';
  }

  function cityLabel(city) {
    if (!city) return '';
    return uniquePlaceParts([placeName(city), city.admin3, city.admin2, city.admin1, city.country])
      .slice(0, 5).join(', ');
  }

  function placeKind(city) {
    if (!city) return '';
    const raw = normPlace(city.kind || city.featureCode || '');
    if (!raw) return city.admin1 ? '' : 'city';
    if (['village', 'hamlet', 'locality', 'isolated_dwelling', 'suburb', 'neighbourhood', 'quarter', 'ppll'].indexOf(raw) !== -1) return 'village';
    if (['town', 'ppl'].indexOf(raw) !== -1) return 'town';
    if (['city', 'municipality', 'ppla', 'ppla2', 'ppla3', 'ppla4', 'pplc', 'adm3'].indexOf(raw) !== -1) return 'city';
    if (['county', 'district', 'adm2'].indexOf(raw) !== -1) return 'district';
    if (['state', 'province', 'region', 'adm1'].indexOf(raw) !== -1) return 'province';
    if (raw === 'country') return 'country';
    return '';
  }

  function placeKindLabel(city) {
    const kind = placeKind(city);
    const fallback = {
      village: 'Village', town: 'Town', city: 'City',
      district: 'District', province: 'Province', country: 'Country'
    }[kind];
    return kind ? t('kundali_place_kind_' + kind, fallback) : '';
  }

  function placeMeta(city) {
    if (!city) return '';
    const name = placeName(city);
    const parts = [placeKindLabel(city)];
    [city.admin3, city.admin2, city.admin1, city.country, city.postcode].forEach(function (part) {
      if (!part) return;
      if (name && normPlace(part) === normPlace(name)) return;
      parts.push(part);
    });
    if (city.tz) parts.push(city.tz);
    return uniquePlaceParts(parts).join(' \u00B7 ');
  }

  function coordsLabel(city) {
    return Number(city.lat).toFixed(4) + ', ' + Number(city.lon).toFixed(4);
  }

  function areaWarning(city) {
    const kind = placeKind(city);
    return kind === 'district' || kind === 'province' || kind === 'country';
  }

  function resolvedText(city) {
    const bits = [t('kundali_place_resolved', 'Using'), cityLabel(city), coordsLabel(city)];
    if (city.tz) bits.push(city.tz);
    let text = bits.join(' \u00B7 ');
    if (areaWarning(city)) {
      text += '. ' + t('kundali_place_area_warn', 'This is a district or region. Choose a village or town for exact coordinates.');
    }
    return text;
  }

  function placeQueryVariants(query) {
    const raw = String(query || '').trim().replace(/\s+/g, ' ');
    const out = [];
    const add = function (value) {
      const text = String(value || '').trim().replace(/\s+/g, ' ');
      if (!text) return;
      const key = normPlace(text);
      if (!key) return;
      if (out.some(x => normPlace(x) === key)) return;
      out.push(text);
    };
    add(raw);
    if (!/[a-z]/i.test(raw)) return out;
    add(raw.replace(/\bdistrict\b/gi, ' ').replace(/\bjilla\b/gi, ' ').replace(/\s{2,}/g, ' ').trim());
    let variant = raw.replace(/([bcdfgjklmnpqrstvwxyz])h/gi, '$1');
    const softened = variant.replace(/(u)([aeiou])/gi, '$1w$2');
    add(softened);
    add(variant);
    return out.slice(0, 3);

  }

  const PLACE_STOP_WORDS = ['district', 'dist', 'county', 'province', 'state', 'jilla', 'जिल्ला', 'जिला'];

  function placeSearchTokens(query) {
    return normPlace(query).split(/[\s,]+/).map(foldPlace).filter(function (token) {
      return token && PLACE_STOP_WORDS.indexOf(token) === -1;
    });
  }

  function strongPlaceMatch(list, query) {
    const nq = normPlace(query).replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!nq) return false;
    const tokens = nq.split(' ').filter(token => token && PLACE_STOP_WORDS.indexOf(token) === -1);
    if (!tokens.length) return false;
    return list.some(function (city) {
      const name = normPlace(city.name.en).replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
      const text = normPlace([
        city.name.en, city.admin3, city.admin2, city.admin1, city.country, city.postcode
      ].filter(Boolean).join(' ')).replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (tokens.length === 1) {
        const token = tokens[0];
        return name === token || name.indexOf(token) === 0 || (token.length >= 4 && name.indexOf(token) !== -1);
      }
      return tokens.every(token => text.indexOf(token) !== -1);
    });
  }

  function rankPlaces(list, query, keepAll) {

    const source = list.slice();
    if (!/[a-z]/i.test(normPlace(query))) return source.slice(0, 8);
    const q = foldPlace(query);
    const tokens = placeSearchTokens(query);
    const seen = [];
    const scored = [];
    source.forEach(function (city) {
      if (!city || !city.name || !isFinite(city.lat) || !isFinite(city.lon)) return;
      if (seen.some(x => samePlace(x, city))) return;
      seen.push(city);
      const name = foldPlace(city.name.en);
      const text = foldPlace([city.name.en, city.admin3, city.admin2, city.admin1, city.country, city.postcode].filter(Boolean).join(' '));
      const allTokens = tokens.every(token => text.indexOf(token) !== -1);
      let score = 0;
      if (name === q) score += 100;
      else if (name.indexOf(q) === 0) score += 70;
      else if (name.indexOf(q) !== -1) score += 45;
      else if (name.length >= 3 && q.indexOf(name) !== -1) score += 30;
      tokens.forEach(function (token) {
        if (name === token) score += 40;
        else if (name.indexOf(token) === 0) score += 18;
        else if (text.indexOf(token) !== -1) score += 8;
      });
      if (tokens.length > 1 && !allTokens) score -= 35;
      if (score > 0 || keepAll) scored.push({ city: city, score: score, all: allTokens });
    });
    const filtered = (tokens.length > 1 && scored.some(x => x.all)) ? scored.filter(x => x.all) : scored;
    filtered.sort((a, b) => b.score - a.score);
    return filtered.map(x => x.city).slice(0, 8);
  }

  const LOCAL_PLACE_DETAILS = {
    delhi: { admin1: 'Delhi', country: 'India', postcode: '110001', kind: 'city' },
    mumbai: { admin1: 'Maharashtra', country: 'India', postcode: '400001', kind: 'city' },
    kathmandu: { admin2: 'Kathmandu District', admin1: 'Bagmati Province', country: 'Nepal', postcode: '44600', kind: 'city' },
    dubai: { admin1: 'Dubai', country: 'United Arab Emirates', postcode: '', kind: 'city' },
    london: { admin2: 'Greater London', admin1: 'England', country: 'United Kingdom', postcode: 'SW1A', kind: 'city' },
    newyork: { admin1: 'New York', country: 'United States', postcode: '10001', kind: 'city' },
    toronto: { admin1: 'Ontario', country: 'Canada', postcode: 'M5H', kind: 'city' },
    sydney: { admin1: 'New South Wales', country: 'Australia', postcode: '2000', kind: 'city' }
  };

  function withLocalDetails(city) {
    const details = LOCAL_PLACE_DETAILS[city.id];
    return details ? Object.assign({}, city, details) : city;
  }

  function regions() {
    return (window.ShubhPanchang && window.ShubhPanchang.REGIONS) || [];
  }

  function regionById(id) {
    return regions().filter(r => r.id === id)[0] || null;
  }

  function normRegion(value) {
    return normPlace(value).replace(/&/g, ' and ').replace(/\band\b/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function regionForCity(city) {
    if (!city) return null;
    if (city.regionId) {
      const direct = regionById(city.regionId);
      if (direct) return direct;
    }
    if (!city.country) return null;
    const country = normRegion(city.country);
    const admin = normRegion(city.admin1 || '');
    if (!admin) return null;
    return regions().filter(function (r) {
      if (normRegion(r.country) !== country) return false;
      const name = normRegion(r.name.en);
      return admin === name || admin.indexOf(name) !== -1 || name.indexOf(admin) !== -1;
    })[0] || null;
  }

  function regionMatchesCity(city) {
    if (!placeRegion) return true;
    const region = regionById(placeRegion);
    if (!region || !city) return false;
    if (city.regionId) return city.regionId === region.id;
    if (city.country && normRegion(city.country) !== normRegion(region.country)) return false;
    const admin = normRegion(city.admin1 || '');
    if (!admin) return false;
    const name = normRegion(region.name.en);
    return admin === name || admin.indexOf(name) !== -1 || name.indexOf(admin) !== -1;
  }

  function syncRegionFromCity(city) {
    const region = regionForCity(city);
    placeRegion = region ? region.id : '';
  }

  function localPlaceMatches(query) {
    const nq = normPlace(query);
    if (!nq) return [];
    const list = ((window.ShubhPanchang && window.ShubhPanchang.CITIES) || [])
      .concat((window.ShubhPanchang && window.ShubhPanchang.REGION_CITIES) || []);
    const out = [];
    list.forEach(function (c) {
      if (!regionMatchesCity(c)) return;
      if (out.some(x => samePlace(x, c))) return;
      const hit = [c.name.en, c.name.hi, c.name.ne].some(function (n) {
        return normPlace(n).indexOf(nq) !== -1;
      });
      if (hit) out.push(withLocalDetails(c));
    });
    return out;
  }


  function samePlace(a, b) {
    return Math.abs(a.lat - b.lat) < 0.02 && Math.abs(a.lon - b.lon) < 0.02;
  }

  function lookupTimezone(city) {
    if (!city) return Promise.resolve('');
    if (city.tz) return Promise.resolve(city.tz);
    if (typeof fetch !== 'function') return Promise.resolve('');
    const key = Number(city.lat).toFixed(2) + ',' + Number(city.lon).toFixed(2);
    if (tzCache[key]) return tzCache[key];
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(city.lat) +
      '&longitude=' + encodeURIComponent(city.lon) + '&timezone=auto&forecast_days=1';
    const promise = fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      return String(data.timezone || '');
    }).catch(function () {
      return '';
    });
    tzCache[key] = promise;
    promise.then(function (tz) { if (!tz) delete tzCache[key]; });
    return promise;
  }

  function resolveCityTimezone(city) {
    if (!city) return Promise.resolve('');
    if (city.tz) return Promise.resolve(city.tz);
    if (city.tzPromise) return city.tzPromise;
    city.tzPromise = lookupTimezone(city).then(function (tz) {
      if (tz) city.tz = tz;
      city.tzPromise = null;
      return tz;
    }, function () {
      city.tzPromise = null;
      return '';
    });
    return city.tzPromise;
  }

  function ensureTzOption(tz) {
    tz = canonicalTz(tz);
    const tzEl = el('kundali-tz');
    if (!tzEl || !tz) return;

    const exists = Array.prototype.some.call(tzEl.options, o => o.value === tz);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = tz;
      opt.textContent = tz;
      tzEl.appendChild(opt);
    }
    tzEl.value = tz;
  }

  function setPlaceStatus(msg, ok) {
    const status = el('kundali-place-status');
    if (!status) return;
    if (!msg) {
      status.hidden = true;
      status.textContent = '';
      status.className = 'kundali-hint kundali-place-status';
      return;
    }
    status.hidden = false;
    status.textContent = msg;
    status.className = 'kundali-hint kundali-place-status ' + (ok ? 'is-ok' : 'is-err');
  }

  function setSearchBusy(busy) {
    const spinner = el('kundali-place-spinner');
    if (spinner) spinner.hidden = !busy;
  }

  function hidePlaceList() {
    const list = el('kundali-place-list');
    const input = el('kundali-place');
    if (list) {
      list.hidden = true;
      list.replaceChildren();
    }
    if (input) input.setAttribute('aria-expanded', 'false');
  }

  function renderPlaceList(items) {
    const list = el('kundali-place-list');
    const input = el('kundali-place');
    if (!list || !input) return;
    list.replaceChildren();
    if (!items.length) {
      hidePlaceList();
      return;
    }
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    items.forEach((item, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.id = 'kundali-place-opt-' + idx;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kundali-suggestion';
      btn.setAttribute('role', 'option');
      btn.dataset.idx = String(idx);
      const name = document.createElement('span');
      name.className = 'kundali-suggestion-name';
      name.textContent = placeName(item.city);
      const meta = document.createElement('span');
      meta.className = 'kundali-suggestion-meta';
      meta.textContent = item.sub || placeMeta(item.city);
      btn.appendChild(name);
      if (meta.textContent) btn.appendChild(meta);
      btn.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      btn.addEventListener('click', function () { choosePlace(item.city); });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function choosePlace(city) {
    const input = el('kundali-place');
    const latEl = el('kundali-lat');
    const lonEl = el('kundali-lon');
    if (!input || !latEl || !lonEl || !city) return;
    placeSearchSeq++;
    if (placeSearchAbort) {
      try { placeSearchAbort.abort(); } catch (e) {}
      placeSearchAbort = null;
    }
    if (placeSearchTimer) { clearTimeout(placeSearchTimer); placeSearchTimer = null; }
    placeResolution = city;
    manualPlaceEdited = false;
    syncRegionFromCity(city);
    input.value = cityLabel(city);
    latEl.value = Number(city.lat).toFixed(4);
    lonEl.value = Number(city.lon).toFixed(4);
    hidePlaceList();
    if (city.tz) {
      ensureTzOption(city.tz);
      setSearchBusy(false);
      setPlaceStatus(resolvedText(city), true);
      return;
    }
    setSearchBusy(true);
    setPlaceStatus(t('kundali_place_tz', 'Finding timezone\u2026'), true);
    resolveCityTimezone(city).then(function (tz) {
      if (placeResolution !== city) return;
      setSearchBusy(false);
      if (tz) {
        ensureTzOption(tz);
        setPlaceStatus(resolvedText(city), true);
      } else {
        setPlaceStatus(t('kundali_place_tz_fail', 'Timezone could not be detected. Open coordinates and choose it manually.'), false);
      }
    });
  }

  function remoteCity(r) {
    const lat = Number(r.latitude);
    const lon = Number(r.longitude);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    const name = String(r.name || '').trim();
    if (!name) return null;
    const postcode = Array.isArray(r.postcodes) && r.postcodes.length ? r.postcodes[0] : '';
    return {
      id: 'geo',
      lat: lat,
      lon: lon,
      tz: r.timezone || '',
      admin1: r.admin1 || '',
      admin2: r.admin2 || '',
      admin3: r.admin3 || '',
      country: r.country || '',
      postcode: postcode,
      kind: String(r.feature_code || '').toLowerCase(),
      source: 'geonames',
      name: { en: name, hi: name, ne: name }
    };
  }

  function isPhotonPlace(p) {
    if (!p) return false;
    if (p.osm_key === 'place') {
      return ['city', 'town', 'village', 'hamlet', 'locality', 'isolated_dwelling',
        'suburb', 'neighbourhood', 'quarter', 'borough'].indexOf(String(p.osm_value || '').toLowerCase()) !== -1;
    }
    return ['county', 'district', 'state', 'province', 'country'].indexOf(String(p.type || '').toLowerCase()) !== -1;
  }

  function photonCity(feature) {
    const p = feature && feature.properties;
    const coords = feature && feature.geometry && feature.geometry.coordinates;
    if (!p || !coords || coords.length < 2) return null;
    const lat = Number(coords[1]);
    const lon = Number(coords[0]);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    const name = String(p.name || p.street || '').trim();
    if (!name) return null;
    const type = String(p.type || '').toLowerCase();
    const kind = ['county', 'district', 'state', 'province', 'country'].indexOf(type) !== -1
      ? type
      : String(p.osm_key === 'place' ? (p.osm_value || type) : type).toLowerCase();
    return {
      id: 'osm:' + String(p.osm_type || '') + String(p.osm_id || ''),
      lat: lat,
      lon: lon,
      tz: '',
      admin1: p.state || '',
      admin2: p.county || p.district || '',
      admin3: p.city || p.locality || p.municipality || '',
      country: p.country || '',
      postcode: p.postcode || '',
      kind: kind,
      source: 'osm',
      name: { en: name, hi: name, ne: name }
    };
  }

  function fetchPhotonPlaces(query, signal) {
    const url = 'https://photon.komoot.io/api/?q=' + encodeURIComponent(query) + '&limit=10&lang=en';
    return fetch(url, signal ? { signal: signal } : undefined).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      return (data.features || []).filter(f => isPhotonPlace(f.properties)).map(photonCity).filter(Boolean);
    });
  }

  function reversePhotonPlace(lat, lon) {
    if (typeof fetch !== 'function') return Promise.resolve(null);
    const url = 'https://photon.komoot.io/reverse?lon=' + encodeURIComponent(lon) +
      '&lat=' + encodeURIComponent(lat) + '&lang=en';
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      const feature = (data.features || []).filter(f => isPhotonPlace(f.properties))[0];
      return feature ? photonCity(feature) : null;
    }).catch(function () {
      return null;
    });
  }

  function fetchOpenMeteoPlaces(query, signal) {
    const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) +
      '&count=10&language=en&format=json';
    return fetch(url, signal ? { signal: signal } : undefined).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      return (data.results || []).map(remoteCity).filter(Boolean);
    });
  }

  function fetchRemotePlaces(query, signal) {
    if (typeof fetch !== 'function') return Promise.reject(new Error('fetch unavailable'));
    const variants = placeQueryVariants(query);
    let weak = [];
    const tryOpenMeteo = function (index) {
      return fetchOpenMeteoPlaces(variants[index], signal).then(function (list) {
        const ranked = rankPlaces(list, query, true);
        if (!weak.length && ranked.length) weak = ranked;
        if (strongPlaceMatch(list, variants[index])) return ranked.length ? ranked : rankPlaces(list, variants[index], true);
        if (index < variants.length - 1) return tryOpenMeteo(index + 1);
        return weak;
      }).catch(function (err) {
        if (err && err.name === 'AbortError') throw err;
        if (index < variants.length - 1) return tryOpenMeteo(index + 1);
        return weak;
      });
    };
    const tryPhoton = function (index) {
      return fetchPhotonPlaces(variants[index], signal).then(function (list) {
        const ranked = rankPlaces(list, query);
        if (!weak.length && ranked.length) weak = ranked;
        if (strongPlaceMatch(list, variants[index])) return ranked.length ? ranked : rankPlaces(list, variants[index]);
        if (index < variants.length - 1) return tryPhoton(index + 1);
        return tryOpenMeteo(0);
      }).catch(function (err) {
        if (err && err.name === 'AbortError') throw err;
        if (index < variants.length - 1) return tryPhoton(index + 1);
        return tryOpenMeteo(0);
      });
    };
    return tryPhoton(0);
  }


  function searchPlaceSuggestions(query) {
    if (placeSearchAbort) {
      try { placeSearchAbort.abort(); } catch (e) {}
    }
    const seq = ++placeSearchSeq;
    const local = localPlaceMatches(query);
    const localItems = local.map(c => ({ city: c, sub: placeMeta(c) }));
    if (localItems.length) renderPlaceList(localItems);
    setPlaceStatus(t('kundali_place_searching', 'Searching places\u2026'), true);
    setSearchBusy(true);
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    placeSearchAbort = controller;
    const timeout = setTimeout(function () {
      if (controller) controller.abort();
    }, 12000);

    return fetchRemotePlaces(query, controller ? controller.signal : null)
      .then(function (remote) {
        if (seq !== placeSearchSeq) return;
        const items = localItems.slice();
        remote.forEach(function (city) {
          if (!regionMatchesCity(city)) return;
          if (!items.some(function (item) { return samePlace(item.city, city); })) {
            items.push({ city: city, sub: placeMeta(city) });
          }
        });
        if (items.length) {
          renderPlaceList(items);
          setPlaceStatus('', false);
        } else {
          hidePlaceList();
          setPlaceStatus(t('kundali_place_none', 'No matching place found. Try the village or town name alone, or enter coordinates manually.'), false);
        }
      })
      .catch(function (err) {
        if (seq !== placeSearchSeq || (err && err.name === 'AbortError')) return;
        if (localItems.length) {
          renderPlaceList(localItems);
          setPlaceStatus(t('kundali_place_offline', 'Showing saved cities. You can also enter coordinates manually.'), false);
        } else {
          hidePlaceList();
          setPlaceStatus(t('kundali_place_error', 'Could not search places right now. Open coordinates and enter them manually.'), false);
        }
      })
      .then(function () {
        if (seq === placeSearchSeq) {
          setSearchBusy(false);
          clearTimeout(timeout);
          placeSearchAbort = null;
        }
      });
  }

  function resolveTypedPlace(query) {
    const local = localPlaceMatches(query);
    const nq = normPlace(query);
    const exact = local.filter(c => normPlace(c.name.en) === nq || normPlace(c.name[lang]) === nq)[0];
    if (exact) return Promise.resolve(exact);
    return fetchRemotePlaces(query).then(function (remote) {
      const match = remote.filter(regionMatchesCity)[0];
      return match || local[0] || null;
    }).catch(function () {
      return local[0] || null;
    });
  }

  function detectLocation() {
    const status = el('kundali-detect-status');
    const latEl = el('kundali-lat');
    const lonEl = el('kundali-lon');
    const placeEl = el('kundali-place');
    if (!status || !latEl || !lonEl) return;
    const say = (msg, ok) => {
      status.hidden = false;
      status.textContent = msg;
      status.className = 'kundali-hint ' + (ok ? 'is-ok' : 'is-err');
    };
    if (!navigator.geolocation) {
      say(t('kundali_detect_fail', 'Could not detect your location. Please enter the coordinates manually.'), false);
      return;
    }
    say(t('kundali_detect_wait', 'Detecting your current location\u2026'), true);
    const seq = ++detectSeq;
    navigator.geolocation.getCurrentPosition(pos => {
      if (seq !== detectSeq) return;
      const lat = Number(pos.coords.latitude);
      const lon = Number(pos.coords.longitude);
      if (!isFinite(lat) || !isFinite(lon)) {
        say(t('kundali_detect_fail', 'Could not detect your location. Please enter the coordinates manually.'), false);
        return;
      }
      let browserTz = '';
      try { browserTz = canonicalTz(Intl.DateTimeFormat().resolvedOptions().timeZone || ''); } catch (e) {}
      if (browserTz) ensureTzOption(browserTz);
      placeResolution = {
        id: 'detected',
        lat: lat,
        lon: lon,
        tz: browserTz,
        admin1: '', admin2: '', admin3: '', country: '', postcode: '', kind: 'city',
        name: {
          en: t('kundali_current_location', 'Current location'),
          hi: t('kundali_current_location', 'Current location'),
          ne: t('kundali_current_location', 'Current location')
        }
      };
      manualPlaceEdited = false;
      if (placeEl) placeEl.value = t('kundali_current_location', 'Current location');
      latEl.value = lat.toFixed(4);
      lonEl.value = lon.toFixed(4);
      setPlaceStatus(resolvedText(placeResolution), true);
      say(t('kundali_detect_ok', 'Location detected. Check the place name, coordinates and timezone before generating.'), true);
      setSearchBusy(true);
      reversePhotonPlace(lat, lon).then(function (found) {
        if (seq !== detectSeq) return;
        if (!found) {
          setSearchBusy(false);
          return;
        }
        found.lat = lat;
        found.lon = lon;
        found.tz = '';
        placeResolution = found;
        syncRegionFromCity(found);
        if (placeEl) placeEl.value = cityLabel(found);
        setPlaceStatus(t('kundali_place_tz', 'Looking up timezone\u2026'), true);
        resolveCityTimezone(found).then(function (tz) {
          if (seq !== detectSeq) return;
          if (tz) ensureTzOption(tz);
          found.tz = tz || browserTz;
          setSearchBusy(false);
          setPlaceStatus(resolvedText(found), true);
        });
      }, function () {
        if (seq === detectSeq) setSearchBusy(false);
      });

    }, () => {
      say(t('kundali_detect_fail', 'Could not detect your location. Please enter the coordinates manually.'), false);
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 });
  }

  function showError(msg) {
    const box = el('kundali-error');
    if (!box) return;
    box.textContent = msg;
    box.hidden = false;
  }

  function hideError() {
    const box = el('kundali-error');
    if (box) box.hidden = true;
  }

  function saveInputs(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function loadInputs() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) { return null; }
  }

  function openResults() {
    const results = el('kundali-results');
    if (results) results.hidden = false;
    const modal = el('kundali-modal');
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('k-modal-open');
    const body = el('kundali-modal-body');
    if (body) body.scrollTop = 0;
    const panel = modal.querySelector('.k-modal-panel');
    if (panel) { try { panel.focus({ preventScroll: true }); } catch (e) { panel.focus(); } }
  }

  function closeResults() {
    const modal = el('kundali-modal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('k-modal-open');
  }

  function resetKundali() {
    closeResults();
    if (placeSearchTimer) { clearTimeout(placeSearchTimer); placeSearchTimer = null; }
    placeSearchSeq++;
    if (placeSearchAbort) {
      try { placeSearchAbort.abort(); } catch (err) {}
      placeSearchAbort = null;
    }
    detectSeq++;
    placeResolution = null;
    placeRegion = '';
    manualPlaceEdited = false;
    state = null;

    hidePlaceList();
    setSearchBusy(false);
    setPlaceStatus('', true);
    hideError();

    ['kundali-name', 'kundali-gender', 'kundali-dob', 'kundali-tob', 'kundali-place', 'kundali-lat', 'kundali-lon'].forEach(function (id) {
      const field = el(id);
      if (field) field.value = '';
    });
    const tzEl = el('kundali-tz');
    if (tzEl) tzEl.value = '';
    fillTimezones();

    const manual = el('kundali-manual');
    if (manual) manual.open = false;
    const detectStatus = el('kundali-detect-status');
    if (detectStatus) { detectStatus.hidden = true; detectStatus.textContent = ''; }

    const results = el('kundali-results');
    if (results) results.hidden = true;
    ['kundali-summary', 'kundali-chart', 'kundali-dasha', 'kundali-positions',
      'kundali-varga-view', 'kundali-phal-detail'].forEach(function (id) {
      const node = el(id);
      if (node) node.replaceChildren();
    });
    ['kundali-meta', 'kundali-d1-purpose', 'kundali-legend', 'kundali-abbr',
      'kundali-dasha-balance'].forEach(function (id) {
      const node = el(id);
      if (node) node.textContent = '';
    });
    ['kundali-aspect-note', 'kundali-dasha-now'].forEach(function (id) {
      const node = el(id);
      if (!node) return;
      node.textContent = '';
      node.hidden = true;
    });

    try { localStorage.removeItem(LS_KEY); } catch (err) {}

    const form = el('kundali-form');
    if (form) {
      try { form.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (err) {}
    }
    const nameEl = el('kundali-name');
    if (nameEl) { try { nameEl.focus({ preventScroll: true }); } catch (err) {} }
  }

  async function onSubmit(e) {
    e.preventDefault();
    hideError();

    const nameEl = el('kundali-name');
    const genderEl = el('kundali-gender');
    const dobEl = el('kundali-dob');
    const tobEl = el('kundali-tob');
    const placeEl = el('kundali-place');
    if (!dobEl || !tobEl || !placeEl) return;

    const dob = dobEl.value;
    const tob = tobEl.value;
    if (!dob) { showError(t('kundali_err_date', 'Please enter a valid birth date.')); dobEl.focus(); return; }

    const dp = dob.split('-').map(Number);
    const y = dp[0], mo = dp[1], d = dp[2];
    const birthDay = new Date(Date.UTC(y, mo - 1, d));
    if (!y || !mo || !d || isNaN(birthDay.getTime()) || y < 1900 || birthDay.getTime() > Date.now()) {
      showError(t('kundali_err_date', 'Please enter a valid birth date.'));
      dobEl.focus();
      return;
    }

    if (!tob) { showError(t('kundali_err_time', 'Please enter your time of birth.')); tobEl.focus(); return; }
    const tp = tob.split(':').map(Number);
    const h = tp[0], mi = tp[1];
    if (isNaN(h) || isNaN(mi)) { showError(t('kundali_err_time', 'Please enter your time of birth.')); tobEl.focus(); return; }

    if (placeSearchTimer) { clearTimeout(placeSearchTimer); placeSearchTimer = null; }
    placeSearchSeq++;
    if (placeSearchAbort) {
      try { placeSearchAbort.abort(); } catch (err) {}
      placeSearchAbort = null;
    }
    hidePlaceList();

    const placeQuery = placeEl.value.trim();
    if (!placeQuery) {
      showError(t('kundali_err_place', 'Please enter your place of birth.'));
      placeEl.focus();
      return;
    }

    const latEl = el('kundali-lat');
    const lonEl = el('kundali-lon');
    const tzEl = el('kundali-tz');
    let city = null;

    if (placeResolution && !manualPlaceEdited) {
      city = placeResolution;
    } else {
      const latRaw = latEl ? latEl.value.trim() : '';
      const lonRaw = lonEl ? lonEl.value.trim() : '';
      if (latRaw || lonRaw) {
        const lat = parseFloat(latRaw);
        const lon = parseFloat(lonRaw);
        const tz = tzEl ? tzEl.value : '';
        if (!isFinite(lat) || lat < -90 || lat > 90) {
          showError(t('kundali_err_lat', 'Please enter a latitude between -90 and 90.'));
          if (latEl) latEl.focus();
          return;
        }
        if (!isFinite(lon) || lon < -180 || lon > 180) {
          showError(t('kundali_err_lon', 'Please enter a longitude between -180 and 180.'));
          if (lonEl) lonEl.focus();
          return;
        }
        if (!tz) {
          showError(t('kundali_err_tz', 'Please choose the timezone that was in use at the birth place.'));
          if (tzEl) tzEl.focus();
          return;
        }
        city = {
          id: 'custom',
          lat: lat,
          lon: lon,
          tz: tz,
          name: { en: placeQuery, hi: placeQuery, ne: placeQuery }
        };
        placeResolution = city;
        setPlaceStatus(resolvedText(city), true);
      } else {
        const submitBtn = el('kundali-submit');
        if (submitBtn) submitBtn.disabled = true;
        setSearchBusy(true);
        setPlaceStatus(t('kundali_place_searching', 'Searching places\u2026'), true);
        try {
          city = await resolveTypedPlace(placeQuery);
        } finally {
          setSearchBusy(false);
          if (submitBtn) submitBtn.disabled = false;
        }
        if (!city) {
          setPlaceStatus(t('kundali_place_none', 'No matching place found. Try the village or town name alone, or enter coordinates manually.'), false);
          const manual = el('kundali-manual');
          if (manual) manual.open = true;
          showError(t('kundali_err_place_resolve', 'Choose a place from the suggestions, or enter latitude, longitude and timezone manually.'));
          placeEl.focus();
          return;
        }
        choosePlace(city);
      }
    }

    if (!city.tz) {
      const submitBtn = el('kundali-submit');
      if (submitBtn) submitBtn.disabled = true;
      setSearchBusy(true);
      setPlaceStatus(t('kundali_place_tz', 'Finding timezone\u2026'), true);
      try {
        await resolveCityTimezone(city);
      } finally {
        setSearchBusy(false);
        if (submitBtn) submitBtn.disabled = false;
      }
      if (!city.tz) {
        setPlaceStatus(t('kundali_place_tz_fail', 'Timezone could not be detected. Open coordinates and choose it manually.'), false);
        const manual = el('kundali-manual');
        if (manual) manual.open = true;
        showError(t('kundali_err_tz', 'Please choose the timezone that was in use at the birth place.'));
        if (tzEl) tzEl.focus();
        return;
      }
      ensureTzOption(city.tz);
      setPlaceStatus(resolvedText(city), true);
    }

    const input = {
      name: nameEl ? nameEl.value.trim() : '',
      gender: genderEl ? genderEl.value : '',
      y: y, mo: mo, d: d, h: h, mi: mi,
      dob: dob, tob: tob,
      city: city
    };

    const saved = {
      name: input.name,
      gender: input.gender,
      dob: dob,
      tob: tob,
      place: cityLabel(city),
      city: {
        lat: city.lat, lon: city.lon, tz: city.tz, name: city.name,
        admin1: city.admin1 || '', admin2: city.admin2 || '', admin3: city.admin3 || '',
        country: city.country || '', postcode: city.postcode || '', kind: city.kind || ''
      }
    };
    saveInputs(saved);

    try {
      state = compute(input);
    } catch (err) {
      showError(t('kundali_err_generic', 'Something went wrong while calculating. Please check your details and try again.'));
      return;
    }

    renderAll();
    manualPlaceEdited = false;
    openResults();
  }

  function restoreInputs() {
    const saved = loadInputs();
    if (!saved) return;
    const nameEl = el('kundali-name');
    const genderEl = el('kundali-gender');
    const dobEl = el('kundali-dob');
    const tobEl = el('kundali-tob');
    if (nameEl && saved.name) nameEl.value = saved.name;
    if (genderEl && saved.gender) genderEl.value = saved.gender;
    if (dobEl && saved.dob) dobEl.value = saved.dob;
    if (tobEl && saved.tob) tobEl.value = saved.tob;

    const cities = (window.ShubhPanchang && window.ShubhPanchang.CITIES) || [];
    let city = null;

    if (saved.city && isFinite(Number(saved.city.lat)) && isFinite(Number(saved.city.lon))) {
      const nm = saved.city.name && saved.city.name.en ? saved.city.name : {
        en: saved.place || '',
        hi: saved.place || '',
        ne: saved.place || ''
      };
      city = {
        id: 'saved',
        lat: Number(saved.city.lat),
        lon: Number(saved.city.lon),
        tz: saved.city.tz || '',
        admin1: saved.city.admin1 || '',
        admin2: saved.city.admin2 || '',
        admin3: saved.city.admin3 || '',
        country: saved.city.country || '',
        postcode: saved.city.postcode || '',
        kind: saved.city.kind || '',
        name: nm
      };
    } else if (saved.custom && isFinite(Number(saved.custom.lat)) && isFinite(Number(saved.custom.lon))) {
      const nm = saved.custom.name
        ? { en: saved.custom.name, hi: saved.custom.name, ne: saved.custom.name }
        : tAll('kundali_custom_default', 'Custom location');
      city = {
        id: 'saved',
        lat: Number(saved.custom.lat),
        lon: Number(saved.custom.lon),
        tz: saved.custom.tz || '',
        name: nm
      };
    } else if (saved.place && saved.place !== '__custom') {
      city = cities.filter(c => c.id === saved.place || c.name.en === saved.place)[0] || null;
    }

    if (city) choosePlace(city);
  }

  function init() {
    if (!el('kundali-form')) return;
    lang = currentLang();
    const dobEl = el('kundali-dob');
    if (dobEl) {
      const now = new Date();
      dobEl.max = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    }
    fillTimezones();
    restoreInputs();
    el('kundali-form').addEventListener('submit', onSubmit);
    const resetBtn = el('kundali-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetKundali);
    const clearBtn = el('kundali-clear');
    if (clearBtn) clearBtn.addEventListener('click', resetKundali);
    const closeBtn = el('kundali-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeResults);
    const backdrop = document.querySelector('#kundali-modal [data-k-modal-close]');
    if (backdrop) backdrop.addEventListener('click', closeResults);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeResults();
    });

    const placeEl = el('kundali-place');
    const placeList = el('kundali-place-list');
    if (placeEl) {
      placeEl.addEventListener('input', function () {
        const query = placeEl.value.trim();
        placeResolution = null;
        placeRegion = '';
        detectSeq++;
        placeSearchSeq++;
        if (placeSearchAbort) {
          try { placeSearchAbort.abort(); } catch (e) {}
          placeSearchAbort = null;
        }
        if (placeSearchTimer) { clearTimeout(placeSearchTimer); placeSearchTimer = null; }
        setSearchBusy(false);
        if (!manualPlaceEdited) {
          const latEl = el('kundali-lat');
          const lonEl = el('kundali-lon');
          const tzEl = el('kundali-tz');
          if (latEl) latEl.value = '';
          if (lonEl) lonEl.value = '';
          if (tzEl) tzEl.value = '';
        }
        setPlaceStatus('', false);
        hidePlaceList();
        if (query.length >= 2) {
          placeSearchTimer = setTimeout(function () { searchPlaceSuggestions(query); }, 350);
        }
      });
      placeEl.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { hidePlaceList(); return; }
        if (e.key === 'ArrowDown' && placeList && !placeList.hidden) {
          const first = placeList.querySelector('button');
          if (first) { e.preventDefault(); first.focus(); }
        }
      });
    }
    if (placeList) {
      placeList.addEventListener('keydown', function (e) {
        const buttons = Array.prototype.slice.call(placeList.querySelectorAll('button'));
        const idx = buttons.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          if (!buttons.length) return;
          e.preventDefault();
          const next = e.key === 'ArrowDown'
            ? (idx + 1) % buttons.length
            : (idx - 1 + buttons.length) % buttons.length;
          buttons[next].focus();
        } else if (e.key === 'Enter' && idx >= 0) {
          e.preventDefault();
          buttons[idx].click();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          hidePlaceList();
          if (placeEl) placeEl.focus();
        }
      });
    }
    const latInput = el('kundali-lat');
    const lonInput = el('kundali-lon');
    const tzInput = el('kundali-tz');
    [latInput, lonInput].forEach(function (input) {
      if (!input) return;
      input.addEventListener('input', function () {
        manualPlaceEdited = true;
        placeResolution = null;
      });
    });
    if (tzInput) {
      tzInput.addEventListener('change', function () {
        manualPlaceEdited = true;
        placeResolution = null;
      });
    }
    document.addEventListener('click', function (e) {
      const group = placeEl && placeEl.closest ? placeEl.closest('.kundali-place-group') : null;
      if (group && !group.contains(e.target)) hidePlaceList();
    });
    const detectBtn = el('kundali-detect');
    if (detectBtn) detectBtn.addEventListener('click', detectLocation);

    const chartBox = el('kundali-chart');
    if (chartBox) {
      chartBox.addEventListener('click', function (e) {
        const hit = e.target && e.target.closest ? e.target.closest('.k-planet-hit') : null;
        if (!hit) { if (aspectSelection) clearAspects(); return; }
        if (!state) return;
        showAspects('kundali-chart', state.items, hit.getAttribute('data-id'), 'kundali-aspect-note');
      });
      chartBox.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
        const hit = e.target && e.target.closest ? e.target.closest('.k-planet-hit') : null;
        if (!hit || !state) return;
        e.preventDefault();
        showAspects('kundali-chart', state.items, hit.getAttribute('data-id'), 'kundali-aspect-note');
      });
    }

    const vargaBox = el('kundali-varga-view');
    if (vargaBox) {
      const vargaPlanets = function () {
        const v = state && state.vargas && state.vargas[vargaSel - 1];
        return v ? v.planets : null;
      };
      vargaBox.addEventListener('click', function (e) {
        const hit = e.target && e.target.closest ? e.target.closest('.k-planet-hit') : null;
        if (!hit) { if (aspectSelection) clearAspects(); return; }
        const planets = vargaPlanets();
        if (!planets) return;
        showAspects('kundali-varga-chart', planets, hit.getAttribute('data-id'), 'kundali-varga-aspect-note');
      });
      vargaBox.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
        const hit = e.target && e.target.closest ? e.target.closest('.k-planet-hit') : null;
        const planets = vargaPlanets();
        if (!hit || !planets) return;
        e.preventDefault();
        showAspects('kundali-varga-chart', planets, hit.getAttribute('data-id'), 'kundali-varga-aspect-note');
      });
    }

    const vargaSelect = el('kundali-varga-select');
    if (vargaSelect) vargaSelect.addEventListener('change', function () {
      if (!state) return;
      const n = parseInt(vargaSelect.value, 10);
      if (n >= 1 && n <= 12) {
        vargaSel = n;
        clearAspects();
        vargaView(state);
      }
    });

    const phalSelect = el('kundali-phal-select');
    if (phalSelect) phalSelect.addEventListener('change', function () {
      if (!state) return;
      const n = parseInt(phalSelect.value, 10);
      if (n < 1 || n > 12) return;
      phalSel = n;
      renderPhalDetail(state);
    });

    const expandBtn = el('kundali-dasha-expand');
    if (expandBtn) expandBtn.addEventListener('click', function () {
      const wrap = el('kundali-dasha');
      if (wrap) Array.prototype.forEach.call(wrap.querySelectorAll('details'), d => { d.open = true; });
    });
    const collapseBtn = el('kundali-dasha-collapse');
    if (collapseBtn) collapseBtn.addEventListener('click', function () {
      const wrap = el('kundali-dasha');
      if (wrap) Array.prototype.forEach.call(wrap.querySelectorAll('details'), d => { d.open = false; });
    });

    const printBtn = el('kundali-print');
    if (printBtn) printBtn.addEventListener('click', function () {
      const opened = [];
      [el('kundali-dasha'), el('kundali-phal-detail')].forEach(function (wrap) {
        if (!wrap) return;
        Array.prototype.forEach.call(wrap.querySelectorAll('details'), d => {
          if (!d.open) { d.open = true; opened.push(d); }
        });
      });
      const restore = () => {
        opened.forEach(d => { d.open = false; });
        window.removeEventListener('afterprint', restore);
      };
      window.addEventListener('afterprint', restore);
      try { window.print(); } catch (e) {}
    });
    document.addEventListener('languagechange', () => {
      lang = currentLang();
      fillTimezones();
      if (placeResolution) {
        const input = el('kundali-place');
        if (input) input.value = cityLabel(placeResolution);
        setPlaceStatus(resolvedText(placeResolution), true);
      }
      const status = el('kundali-detect-status');
      if (status) status.hidden = true;
      if (state) renderAll();
    });
  }

  window.ShubhKundali = {
    siderealPlanetsAt: function (date) {
      const jd = date.getTime() / 86400000 + 2440587.5;
      const T = (jd - 2451545.0) / 36525;
      const ay = window.ShubhPanchang.ayanamsa(jd);
      const out = {
        sun: norm360(window.ShubhPanchang.sunLongitude(jd) - ay),
        moon: norm360(window.ShubhPanchang.moonLongitude(jd) - ay)
      };
      ['mercury', 'venus', 'mars', 'jupiter', 'saturn'].forEach(function (id) {
        out[id] = norm360(planetTropical(id, jd, T) - ay);
      });
      const rahu = norm360(meanNode(jd) - ay);
      out.rahu = rahu;
      out.ketu = norm360(rahu + 180);
      return out;
    },
    isRetrograde: function (id, date) {
      if (id === 'rahu' || id === 'ketu') return true;
      if (id === 'sun' || id === 'moon') return false;
      const jd = date.getTime() / 86400000 + 2440587.5;
      const T = (jd - 2451545.0) / 36525;
      const a = planetTropical(id, jd - 0.5, T - 0.5 / 36525);
      const b = planetTropical(id, jd + 0.5, T + 0.5 / 36525);
      return ((b - a + 540) % 360) - 180 < 0;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


