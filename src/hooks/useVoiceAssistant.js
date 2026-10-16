import { useState, useEffect, useRef, useCallback } from 'react';
import { VOICE_PROMPTS, RECIPE_STEP_TRANSLATIONS } from '../data/translations.js';

export function useVoiceAssistant({
  recipe,
  activeStepId,
  setActiveStepId,
  markStepComplete,
  onStepChange,
  showToast
}) {
  const [language, setLanguage] = useState('en'); // 'en' | 'hi' | 'te'
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0); // 0.75, 1.0, 1.25
  const [availableVoices, setAvailableVoices] = useState([]);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recSupported, setRecSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const [spokenText, setSpokenText] = useState('');

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const manualStopRef = useRef(false);

  // Check Web Speech API Support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech = 'speechSynthesis' in window;
      setVoiceSupported(hasSpeech);

      const hasRec = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      setRecSupported(hasRec);

      if (hasSpeech) {
        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          setAvailableVoices(voices);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Helper: Find appropriate voice for language
  const getBestVoice = useCallback((lang) => {
    if (!availableVoices.length) return null;
    if (lang === 'hi') {
      return availableVoices.find(v => v.lang.startsWith('hi')) ||
             availableVoices.find(v => v.lang.includes('IN') && !v.lang.startsWith('en')) || null;
    }
    if (lang === 'te') {
      return availableVoices.find(v => v.lang.startsWith('te')) ||
             availableVoices.find(v => v.lang.includes('te')) || null;
    }
    // English
    return availableVoices.find(v => v.lang === 'en-IN') ||
           availableVoices.find(v => v.lang.startsWith('en')) || null;
  }, [availableVoices]);

  // Helper: Get step content according to language
  const getStepContent = useCallback((stepId) => {
    if (!recipe || !recipe.steps) return null;
    const step = recipe.steps.find(s => s.id === stepId) || recipe.steps[0];
    
    // Check if custom translation exists
    const trans = RECIPE_STEP_TRANSLATIONS[recipe.id]?.[language];
    if (trans) {
      const translatedStep = trans.find(s => s.id === stepId);
      if (translatedStep) {
        return {
          id: step.id,
          title: translatedStep.title,
          text: translatedStep.text
        };
      }
    }

    // Default to English original
    return {
      id: step.id,
      title: step.title,
      text: step.instruction
    };
  }, [recipe, language]);

  // Core Speech Synthesis function
  const speakText = useCallback((text, onEndCallback) => {
    if (!voiceSupported || typeof window === 'undefined') return;

    window.speechSynthesis.cancel();
    setSpokenText(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const voice = getBestVoice(language);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsPlaying(false);
      setIsPaused(false);
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      isSpeakingRef.current = false;
      setIsPlaying(false);
      setIsPaused(false);
      // Ignore user-initiated cancellation
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('Speech synthesis error:', e);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [voiceSupported, rate, language, getBestVoice]);

  // Read current step aloud
  const readCurrentStep = useCallback((stepId = activeStepId) => {
    const step = getStepContent(stepId);
    if (!step) return;

    const prompts = VOICE_PROMPTS[language] || VOICE_PROMPTS.en;
    const textToSpeak = prompts.stepIntro(step.id, step.title, step.text);
    speakText(textToSpeak);
  }, [activeStepId, getStepContent, language, speakText]);

  // Controls: Play / Start guidance
  const play = useCallback(() => {
    if (!recipe) return;
    if (isPaused && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    const prompts = VOICE_PROMPTS[language] || VOICE_PROMPTS.en;
    const intro = prompts.start(recipe.name);
    speakText(intro, () => {
      readCurrentStep(activeStepId);
    });
  }, [recipe, isPaused, language, speakText, readCurrentStep, activeStepId]);

  // Controls: Pause
  const pause = useCallback(() => {
    if (!voiceSupported) return;
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  }, [voiceSupported, isPlaying]);

  // Controls: Resume
  const resume = useCallback(() => {
    if (!voiceSupported) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      readCurrentStep(activeStepId);
    }
  }, [voiceSupported, isPaused, readCurrentStep, activeStepId]);

  // Controls: Stop
  const stop = useCallback(() => {
    if (!voiceSupported) return;
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setSpokenText('');
  }, [voiceSupported]);

  // Controls: Repeat current step
  const repeatStep = useCallback(() => {
    stop();
    readCurrentStep(activeStepId);
  }, [stop, readCurrentStep, activeStepId]);

  // Controls: Next step
  const nextStep = useCallback(() => {
    if (!recipe || !recipe.steps) return;
    const currentIndex = recipe.steps.findIndex(s => s.id === activeStepId);
    if (currentIndex < recipe.steps.length - 1) {
      const nextStepObj = recipe.steps[currentIndex + 1];
      setActiveStepId(nextStepObj.id);
      if (onStepChange) onStepChange(nextStepObj.id);
      stop();
      readCurrentStep(nextStepObj.id);
    } else {
      // Completed all
      const prompts = VOICE_PROMPTS[language] || VOICE_PROMPTS.en;
      speakText(prompts.finish(recipe.name));
    }
  }, [recipe, activeStepId, setActiveStepId, onStepChange, stop, readCurrentStep, language, speakText]);

  // Controls: Previous step
  const prevStep = useCallback(() => {
    if (!recipe || !recipe.steps) return;
    const currentIndex = recipe.steps.findIndex(s => s.id === activeStepId);
    if (currentIndex > 0) {
      const prevStepObj = recipe.steps[currentIndex - 1];
      setActiveStepId(prevStepObj.id);
      if (onStepChange) onStepChange(prevStepObj.id);
      stop();
      readCurrentStep(prevStepObj.id);
    }
  }, [recipe, activeStepId, setActiveStepId, onStepChange, stop, readCurrentStep]);

  // Controls: Restart
  const restart = useCallback(() => {
    if (!recipe || !recipe.steps) return;
    const firstStep = recipe.steps[0];
    setActiveStepId(firstStep.id);
    if (onStepChange) onStepChange(firstStep.id);
    stop();
    readCurrentStep(firstStep.id);
  }, [recipe, setActiveStepId, onStepChange, stop, readCurrentStep]);

  // Handle Speech Recognition Voice Commands
  const processCommand = useCallback((transcript) => {
    const clean = transcript.trim().toLowerCase();
    const prompts = VOICE_PROMPTS[language] || VOICE_PROMPTS.en;
    const cmds = prompts.commands;

    // Check next
    if (cmds.next.some(w => clean.includes(w))) {
      if (showToast) showToast('Voice: Next Step ⏩');
      nextStep();
      return;
    }
    // Check prev
    if (cmds.prev.some(w => clean.includes(w))) {
      if (showToast) showToast('Voice: Previous Step ⏪');
      prevStep();
      return;
    }
    // Check repeat
    if (cmds.repeat.some(w => clean.includes(w))) {
      if (showToast) showToast('Voice: Repeating Step 🔁');
      repeatStep();
      return;
    }
    // Check pause
    if (cmds.pause.some(w => clean.includes(w))) {
      if (showToast) showToast('Voice: Paused ⏸️');
      pause();
      return;
    }
    // Check resume
    if (cmds.resume.some(w => clean.includes(w))) {
      if (showToast) showToast('Voice: Resumed ▶️');
      resume();
      return;
    }
    // Check stop
    if (cmds.stop.some(w => clean.includes(w))) {
      if (showToast) showToast('Voice: Stopped ⏹️');
      stop();
      return;
    }
  }, [language, nextStep, prevStep, repeatStep, pause, resume, stop, showToast]);

  // Toggle Voice Commands Mic
  const toggleListening = useCallback(() => {
    if (!recSupported) {
      if (showToast) showToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }

    if (isListening) {
      manualStopRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      if (showToast) showToast('Microphone disabled');
      return;
    }

    // Start recognition
    manualStopRef.current = false;
    setMicError(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      if (showToast) showToast('Microphone active! Say "Next", "Repeat", "Pause"...');
    };

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      processCommand(transcript);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setMicError('Microphone permission was denied.');
        setIsListening(false);
        if (showToast) showToast('Mic access denied. Please allow microphone in browser settings.', 'error');
      } else if (event.error !== 'no-speech') {
        console.warn('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if user did not manually stop listening
      if (!manualStopRef.current && isListening) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  }, [recSupported, isListening, language, processCommand, showToast]);

  return {
    language,
    setLanguage,
    isPlaying,
    isPaused,
    rate,
    setRate,
    voiceSupported,
    recSupported,
    isListening,
    micError,
    spokenText,
    play,
    pause,
    resume,
    stop,
    repeatStep,
    nextStep,
    prevStep,
    restart,
    readCurrentStep,
    toggleListening
  };
}
