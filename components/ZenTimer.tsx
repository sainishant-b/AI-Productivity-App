import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimerState, QuoteData } from '../types';
import { fetchZenWisdom } from '../services/geminiService';
import { Loader2, RefreshCw, Hand } from 'lucide-react';

const TARGET_TIME = 60; // 60 seconds of doing nothing

export const ZenTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(TARGET_TIME);
  const [timerState, setTimerState] = useState<TimerState>(TimerState.IDLE);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref to track if we are currently "safe" to move (e.g. initial start or failed state)
  const isTrackingRef = useRef(false);

  const startTimer = useCallback(() => {
    setTimeLeft(TARGET_TIME);
    setTimerState(TimerState.RUNNING);
    setQuote(null);
    isTrackingRef.current = true;
  }, []);

  const failTimer = useCallback(() => {
    if (timerState === TimerState.RUNNING) {
      setTimerState(TimerState.FAILED);
      isTrackingRef.current = false;
    }
  }, [timerState]);

  const completeTimer = useCallback(async () => {
    setTimerState(TimerState.COMPLETED);
    isTrackingRef.current = false;
    setIsLoading(true);
    const wisdom = await fetchZenWisdom();
    setQuote(wisdom);
    setIsLoading(false);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerState === TimerState.RUNNING && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerState === TimerState.RUNNING) {
      completeTimer();
    }
    return () => clearInterval(interval);
  }, [timerState, timeLeft, completeTimer]);

  // Movement detection
  useEffect(() => {
    const handleActivity = () => {
      if (isTrackingRef.current) {
        failTimer();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [failTimer]);

  // Formatting time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 text-center z-10 relative">
      
      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-serif tracking-widest text-slate-200 mb-12 opacity-80">
        DO NOTHING
      </h1>

      {/* Main Content Area */}
      <div className="w-full max-w-2xl h-64 flex flex-col items-center justify-center">
        
        {timerState === TimerState.IDLE && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              startTimer();
            }}
            className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-medium tracking-tighter text-white bg-slate-800/50 rounded-full hover:bg-slate-800/70 transition-all duration-300 border border-slate-700 backdrop-blur-sm"
          >
            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-rose-500 rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
            <span className="relative text-xl font-light tracking-widest uppercase">Begin Stillness</span>
          </button>
        )}

        {timerState === TimerState.RUNNING && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="text-9xl font-thin text-rose-100/90 font-sans tracking-tighter tabular-nums select-none">
              {formatTime(timeLeft)}
            </div>
            <p className="mt-8 text-lg text-slate-400 font-light tracking-wide animate-pulse-slow">
              Don't move. Just breathe.
            </p>
          </div>
        )}

        {timerState === TimerState.FAILED && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="mb-6 text-rose-400">
               <Hand size={48} strokeWidth={1} />
            </div>
            <h2 className="text-2xl font-serif text-slate-200 mb-2">You moved.</h2>
            <p className="text-slate-400 font-light mb-8">Stillness requires practice.</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startTimer();
              }}
              className="flex items-center gap-2 px-6 py-3 text-sm uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-colors border border-transparent hover:border-white/10"
            >
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        )}

        {timerState === TimerState.COMPLETED && (
          <div className="flex flex-col items-center animate-fade-in max-w-lg">
            {isLoading ? (
              <Loader2 className="animate-spin text-rose-300/50" size={48} strokeWidth={1} />
            ) : quote ? (
              <div className="bg-slate-800/30 p-8 rounded-2xl border border-white/5 backdrop-blur-md">
                <p className="text-2xl md:text-3xl font-serif leading-relaxed text-rose-100/90 mb-6 italic">
                  "{quote.text}"
                </p>
                <div className="w-12 h-[1px] bg-rose-500/50 mx-auto mb-4"></div>
                <p className="text-sm uppercase tracking-widest text-slate-400">
                  {quote.author}
                </p>
              </div>
            ) : null}

            {!isLoading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startTimer();
                }}
                className="mt-12 text-slate-500 hover:text-slate-300 transition-colors text-xs uppercase tracking-[0.2em]"
              >
                Start Over
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-8 text-xs text-slate-600 font-medium tracking-[0.2em] uppercase">
        {timerState === TimerState.RUNNING ? 'Let go of control' : 'The Art of doing nothing'}
      </div>
    </div>
  );
};
