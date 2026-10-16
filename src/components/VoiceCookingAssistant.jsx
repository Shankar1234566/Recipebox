import React from 'react';
import { 
  Play, Pause, Square, RotateCcw, ChevronRight, ChevronLeft, 
  Volume2, Mic, MicOff, Globe, Zap, AlertCircle
} from 'lucide-react';

export default function VoiceCookingAssistant({
  voiceState,
  currentStepNumber,
  totalSteps,
  recipeName
}) {
  const {
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
    toggleListening
  } = voiceState;

  if (!voiceSupported) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
        <span>Voice synthesis is not supported on this browser. On-screen controls remain fully functional!</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#FAF7F2] to-[#F3ECE0] rounded-3xl p-5 border border-[#E8DDCD] shadow-sm space-y-4">
      
      {/* Top row: Title, Language Selector & Speed */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8DDCD]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#66856A] text-white flex items-center justify-center shadow-sm">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-serif font-bold text-[#292D29]">Voice Cooking Assistant</h4>
            <p className="text-[10px] text-[#717B70]">Hands-free step-by-step guidance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-[#E5DACB]">
            <Globe className="w-3.5 h-3.5 text-[#66856A]" />
            <select
              value={language}
              onChange={(e) => {
                stop();
                setLanguage(e.target.value);
              }}
              className="text-xs font-bold text-[#292D29] bg-transparent focus:outline-none cursor-pointer"
              title="Select Assistant Language"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-[#E5DACB]">
            <Zap className="w-3 h-3 text-[#E89A55]" />
            <select
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="text-xs font-semibold text-[#292D29] bg-transparent focus:outline-none cursor-pointer"
              title="Speaking Speed"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spoken Instruction Subtitle Box */}
      {spokenText && (
        <div className="p-3 bg-white/90 rounded-2xl border border-[#EADFCF] text-xs text-[#384236] leading-relaxed flex items-start gap-2 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-[#4D9662] shrink-0 mt-1.5 animate-pulse" />
          <p className="italic font-serif">"{spokenText}"</p>
        </div>
      )}

      {/* Main Playback Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        
        {/* Core Audio Controls (Play/Pause/Stop/Repeat) */}
        <div className="flex items-center gap-1.5">
          {!isPlaying && !isPaused ? (
            <button
              onClick={play}
              className="px-4 py-2 rounded-2xl bg-[#66856A] hover:bg-[#526F56] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#66856A]/20 transition-all hover:scale-105"
              title="Start voice guidance from step 1"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Voice</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={resume}
              className="px-4 py-2 rounded-2xl bg-[#4D9662] hover:bg-[#3E7D51] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
              title="Resume speech"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={pause}
              className="px-4 py-2 rounded-2xl bg-[#E89A55] hover:bg-[#D58842] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
              title="Pause speech"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              onClick={stop}
              className="p-2 rounded-2xl bg-white hover:bg-[#FAF4EA] text-[#556054] border border-[#E5DACB] transition-colors"
              title="Stop voice guidance"
            >
              <Square className="w-3.5 h-3.5 fill-current text-red-500" />
            </button>
          )}

          <button
            onClick={repeatStep}
            className="px-3 py-2 rounded-2xl bg-white hover:bg-[#FAF4EA] text-[#333C32] text-xs font-semibold border border-[#E5DACB] flex items-center gap-1 transition-colors"
            title="Repeat current step"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#66856A]" />
            <span>Repeat</span>
          </button>
        </div>

        {/* Step Stepping Buttons (Prev / Next) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevStep}
            disabled={currentStepNumber <= 1}
            className={`p-2 rounded-2xl border text-xs font-semibold flex items-center justify-center transition-colors ${
              currentStepNumber <= 1 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'bg-white hover:bg-[#FAF4EA] text-[#333C32] border-[#E5DACB]'
            }`}
            title="Previous step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-[#4F594D] px-2 select-none">
            {currentStepNumber} / {totalSteps}
          </span>

          <button
            onClick={nextStep}
            disabled={currentStepNumber >= totalSteps}
            className={`p-2 rounded-2xl border text-xs font-semibold flex items-center justify-center transition-colors ${
              currentStepNumber >= totalSteps 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'bg-white hover:bg-[#FAF4EA] text-[#333C32] border-[#E5DACB]'
            }`}
            title="Next step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Optional Voice Commands Microphone Toggle */}
          <button
            onClick={toggleListening}
            className={`ml-2 px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isListening
                ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-300'
                : 'bg-white hover:bg-[#FAF4EA] text-[#292D29] border border-[#E5DACB]'
            }`}
            title={isListening ? "Microphone listening (click to disable)" : "Enable voice commands (Next, Previous, Repeat, Pause, Stop)"}
          >
            {isListening ? (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-[#7C887A]" />
                <span>Voice Commands</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Voice commands hint or error notice */}
      {isListening && (
        <div className="pt-2 border-t border-[#E8DDCD] flex items-center justify-between text-[11px] text-[#4E5B4C]">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Mic active: Say <strong>"Next"</strong>, <strong>"Previous"</strong>, <strong>"Repeat"</strong>, <strong>"Pause"</strong>, or <strong>"Stop"</strong>
          </span>
        </div>
      )}

      {micError && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

    </div>
  );
}
