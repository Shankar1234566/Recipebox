// Multilingual voice assistant prompts and step translations (English, Hindi, Telugu)

export const VOICE_PROMPTS = {
  en: {
    start: (name) => `Starting cooking guidance for ${name}. Let's begin with step one.`,
    stepIntro: (stepNum, title, text) => `Step ${stepNum}: ${title}. ${text}`,
    stepComplete: (stepNum) => `Step ${stepNum} completed. Great job!`,
    finish: (name) => `Congratulations! You have successfully cooked ${name}. Bon appétit!`,
    paused: "Speech paused.",
    resumed: "Resuming cooking instructions.",
    stopped: "Voice cooking guidance stopped.",
    listening: "Listening for commands: say Next, Previous, Repeat, Pause, or Stop.",
    micDenied: "Microphone permission denied. Voice controls are available on screen.",
    unsupportedVoice: "A native voice for this language is not installed on your device. Playing in standard voice.",
    unsupportedRec: "Voice commands are not supported on this browser. Please use the on-screen buttons.",
    commands: {
      next: ["next", "next step", "forward", "go ahead"],
      prev: ["previous", "previous step", "prev", "back", "go back"],
      repeat: ["repeat", "repeat step", "again", "say again"],
      pause: ["pause", "wait", "hold on"],
      resume: ["resume", "continue", "play", "start"],
      stop: ["stop", "cancel", "quit", "exit"]
    }
  },
  hi: {
    start: (name) => `${name} के लिए कुकिंग निर्देश शुरू हो रहे हैं। चलिए पहले चरण से शुरू करते हैं।`,
    stepIntro: (stepNum, title, text) => `चरण ${stepNum}: ${title}। ${text}`,
    stepComplete: (stepNum) => `चरण ${stepNum} पूरा हो गया है। बहुत बढ़िया!`,
    finish: (name) => `बधाई हो! आपने ${name} सफलतापूर्वक तैयार कर लिया है। आनंद लें!`,
    paused: "निर्देश रोक दिए गए हैं।",
    resumed: "निर्देश फिर से शुरू किए जा रहे हैं।",
    stopped: "वॉइस कुकिंग गाइड रोक दी गई है।",
    listening: "आवाज़ की पहचान चालू है: 'अगला', 'पिछला', 'दोहराओ', 'रोको' बोलें।",
    micDenied: "माइक्रोफ़ोन की अनुमति अस्वीकृत हुई। ऑन-स्क्रीन बटन उपलब्ध हैं।",
    unsupportedVoice: "इस भाषा के लिए कोई वॉइस नहीं मिली। डिफ़ॉल्ट आवाज़ में बोला जा रहा है।",
    unsupportedRec: "इस ब्राउज़र में वॉइस कमांड समर्थित नहीं है।",
    commands: {
      next: ["next", "agla", "aage", "अगला", "आगे"],
      prev: ["previous", "prev", "pichla", "pehle", "पिछला", "पहले"],
      repeat: ["repeat", "phir se", "dohrao", "फिर से", "दोहराओ"],
      pause: ["pause", "ruko", "roko", "रुकिए", "रोको"],
      resume: ["resume", "shuru", "aage badho", "शुरू"],
      stop: ["stop", "band karo", "khatam", "बंद करो"]
    }
  },
  te: {
    start: (name) => `${name} వంట మార్గదర్శకత్వం ప్రారంభమవుతోంది. మొదటి దశతో ప్రారంభిద్దాం.`,
    stepIntro: (stepNum, title, text) => `దశ ${stepNum}: ${title}. ${text}`,
    stepComplete: (stepNum) => `దశ ${stepNum} పూర్తయింది. అద్భుతం!`,
    finish: (name) => `అభినందనలు! మీరు ${name} వంటను విజయవంతంగా పూర్తి చేశారు. రుచికరమైన ఆహారాన్ని ఆస్వాదించండి!`,
    paused: "సూచనలు నిలిపివేయబడ్డాయి.",
    resumed: "సూచనలు తిరిగి కొనసాగుతున్నాయి.",
    stopped: "వాయిస్ గైడెన్స్ నిలిపివేయబడింది.",
    listening: "కమాండ్‌లు వినబడుతున్నాయి: 'నెక్స్ట్', 'వెనుకకు', 'మళ్లీ', 'ఆపు' చెప్పండి.",
    micDenied: "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. స్క్రీన్ నియంత్రణలు అందుబాటులో ఉన్నాయి.",
    unsupportedVoice: "ఈ భాషకు నేటివ్ వాయిస్ పరికరంలో లభ్యం కాలేదు.",
    unsupportedRec: "ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు.",
    commands: {
      next: ["next", "taruvatha", "munde", "తరువాత", "ముందుకు"],
      prev: ["previous", "prev", "venuka", "venukaku", "వెనుక", "వెనుకకు"],
      repeat: ["repeat", "malli", "malli cheppu", "మళ్లీ"],
      pause: ["pause", "aagu", "aapu", "ఆగు", "ఆపు"],
      resume: ["resume", "modalupettu", "konasaginchu", "మొదలుపెట్టు", "కొనసాగించు"],
      stop: ["stop", "aapeyi", "chalu", "ఆపేయి", "చాలు"]
    }
  }
};

// Helpful step translations for top recipes in Hindi and Telugu
export const RECIPE_STEP_TRANSLATIONS = {
  "paneer-butter-masala": {
    hi: [
      { id: 1, title: "टमाटर और काजू की प्यूरी बनाना", text: "उबलते पानी में टमाटर और काजू को 8 से 10 मिनट तक उबालें। ठंडा होने पर मिक्सी में पीसकर मुलायम प्यूरी बना लें।" },
      { id: 2, title: "मसाले भूनना", text: "कड़ाही में मक्खन और थोड़ा तेल गरम करें। तेजपत्ता, दालचीनी, लौंग और इलायची डालकर 30 सेकंड तक भूनें।" },
      { id: 3, title: "ग्रेवी पकाना", text: "बारीक कटा प्याज, अदरक-लहसुन पेस्ट और टमाटर की प्यूरी डालें। तेल अलग होने तक मध्यम आंच पर पकाएं।" },
      { id: 4, title: "सूखे मसाले मिलाना", text: "हल्दी, कश्मीरी लाल मिर्च पाउडर, धनिया पाउडर और नमक डालें। 2 से 3 मिनट तक भूनें।" },
      { id: 5, title: "पनीर और क्रीम मिलाना", text: "पनीर के टुकड़े, ताजी क्रीम और कसूरी मेथी मिलाएं। धीमी आंच पर 5 मिनट तक पकने दें।" },
      { id: 6, title: "गार्निश और परोसना", text: "ऊपर से थोड़ा मक्खन और ताज़ा हरा धनिया डालकर गरमा-गरम नान या पराठे के साथ परोसें।" }
    ],
    te: [
      { id: 1, title: "టొమాటో, కాజు ప్యూరీ తయారుచేయడం", text: "టొమాటోలు, జీడిపప్పును 8-10 నిమిషాలు ఉడికించి, చల్లారాక మిక్సీలో మెత్తటి పేస్ట్‌లా చేసుకోవాలి." },
      { id: 2, title: "మసాలాలు వేయించడం", text: "పాన్‌లో వెన్న, కొద్దిగా నూనె వేడి చేసి బిర్యానీ ఆకు, దాల్చినచెక్క, లవంగాలు, యాలకులు వేయించాలి." },
      { id: 3, title: "గ్రేవీ ఉడికించడం", text: "ఉల్లిపాయ ముక్కలు, అల్లం-వెల్లుల్లి పేస్ట్, టొమాటో ప్యూరీ వేసి నూనె తేలేవరకు ఉడికించాలి." },
      { id: 4, title: "మసాలా పొడులు కలపడం", text: "పసుపు, కారం, ధనియాల పొడి, ఉప్పు వేసి 2-3 నిమిషాలు బాగా కలపాలి." },
      { id: 5, title: "పనీర్, క్రీమ్ చేర్చడం", text: "పనీర్ ముక్కలు, ఫ్రెష్ క్రీమ్, కసూరి మేథి వేసి చిన్న మంటపై 5 నిమిషాలు ఉడికించాలి." },
      { id: 6, title: "గార్నిష్ & వడ్డించడం", text: "కొత్తిమీర, కాస్త వెన్నతో అలంకరించి వేడివేడి నాన్ లేదా పుల్కాతో వడ్డించండి." }
    ]
  },
  "vegetable-pasta": {
    hi: [
      { id: 1, title: "पास्ता उबालना", text: "बड़े बर्तन में नमक वाले पानी में पास्ता को 9 से 10 मिनट तक उबालें और छान लें।" },
      { id: 2, title: "सब्जियां तैयार करना", text: "ज़ुकिनी, शिमला मिर्च और चेरी टमाटर को छोटे टुकड़ों में काट लें।" },
      { id: 3, title: "लहसुन और सब्जियां भूनना", text: "जैतून के तेल में लहसुन को महक आने तक भूनें, फिर कटी हुई सब्जियां डालकर कुरकुरा होने तक पकाएं।" },
      { id: 4, title: "पास्ता मिलाना", text: "उबला हुआ पास्ता और थोड़ा पास्ता का पानी सब्जियों में डालें।" },
      { id: 5, title: "सीजनिंग", text: "काली मिर्च, नमक, लाल मिर्च फ्लेक्स और ताज़ा बेसिल पत्तियां डालें।" },
      { id: 6, title: "परोसना", text: "ऊपर से परमेसन चीज़ और जैतून का तेल डालकर तुरंत परोसें।" }
    ],
    te: [
      { id: 1, title: "పాస్తా ఉడికించడం", text: "ఉప్పు వేసిన మరిగే నీటిలో పాస్తాను 9-10 నిమిషాలు ఉడికించి వడకట్టండి." },
      { id: 2, title: "కూరగాయలు సిద్ధం చేయడం", text: "జుకిని, బెల్ పెప్పర్, చెర్రీ టొమాటోలను ముక్కలుగా కోయండి." },
      { id: 3, title: "కూరగాయలు వేయించడం", text: "ఆలివ్ ఆయిల్‌లో వెల్లుల్లి, ఆపై కూరగాయలు వేసి క్రిస్పీగా వేయించండి." },
      { id: 4, title: "పాస్తా కలపడం", text: "ఉడికించిన పాస్తాను కూరగాయల మిశ్రమంలో కలపండి." },
      { id: 5, title: "మసాలాలు చేర్చడం", text: "మిరియాల పొడి, ఉప్పు, చిల్లీ ఫ్లేక్స్, తాజా బేసిల్ ఆకులు వేయండి." },
      { id: 6, title: "వడ్డించడం", text: "చీజ్ తురుము చల్లి వేడిగా వడ్డించండి." }
    ]
  }
};
