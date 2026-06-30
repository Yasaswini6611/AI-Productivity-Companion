import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, HelpCircle, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Task } from '../types';

interface VoiceAssistantProps {
  isDark: boolean;
  onAddTask: (taskData: Partial<Task>) => void;
  onPrioritize: () => Promise<void>;
  onTriggerSpeak: (text: string) => void;
}

export default function VoiceAssistant({ isDark, onAddTask, onPrioritize, onTriggerSpeak }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceQuery, setVoiceQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        setStatusMessage("Listening... Speak clearly into your mic.");
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setVoiceQuery(text);
        processVoiceCommand(text);
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage("Microphone access denied or blocked by browser settings inside this iframe. Please click 'Open in New Tab' at the top right of AI Studio to grant permission, or use the text box below.");
        } else {
          setErrorMessage(`Voice capture failed: ${event.error}. Please type below instead.`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        setErrorMessage("Microphone recognition is not fully supported in this iframe. Please type in the text box.");
        return;
      }
      setVoiceQuery('');
      recognitionRef.current.start();
    }
  };

  // Process natural language command to construct tasks
  const processVoiceCommand = (command: string) => {
    const text = command.toLowerCase().trim();
    setStatusMessage(`Processing: "${command}"`);

    // Proactive feedback voice synthesis
    setTimeout(() => {
      // Very smart regex/rule extraction
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (text.includes('urgent') || text.includes('critical') || text.includes('high priority') || text.includes('high')) {
        priority = 'high';
      } else if (text.includes('low') || text.includes('minor') || text.includes('low priority')) {
        priority = 'low';
      }

      // Extract date
      let dueDate = new Date(2026, 5, 29); // Default to June 29, 2026
      let dateString = "2026-06-29";

      if (text.includes('tomorrow')) {
        dueDate = new Date(2026, 5, 30);
        dateString = "2026-06-30";
      } else if (text.includes('today')) {
        dueDate = new Date(2026, 5, 29);
        dateString = "2026-06-29";
      } else if (text.includes('next week') || text.includes('in 7 days')) {
        dueDate = new Date(2026, 6, 6);
        dateString = "2026-07-06";
      } else if (text.includes('next month')) {
        dueDate = new Date(2026, 6, 29);
        dateString = "2026-07-29";
      }

      // Category extraction
      let category = 'General';
      if (text.includes('assignment') || text.includes('study') || text.includes('homework') || text.includes('exam')) {
        category = 'Education';
      } else if (text.includes('meeting') || text.includes('project') || text.includes('work') || text.includes('client')) {
        category = 'Work';
      } else if (text.includes('bill') || text.includes('payment') || text.includes('pay')) {
        category = 'Finance';
      } else if (text.includes('gym') || text.includes('workout') || text.includes('run') || text.includes('exercise')) {
        category = 'Health';
      }

      // Title extraction (remove command prefixes)
      let title = command;
      const prefixes = [
        'add a task to', 'add a task', 'schedule a task', 'schedule', 'remind me to',
        'create a task to', 'create a task', 'add', 'remind me'
      ];
      for (const p of prefixes) {
        if (title.toLowerCase().startsWith(p)) {
          title = title.substring(p.length).trim();
          break;
        }
      }

      // Clean up title (remove words like 'tomorrow', 'today', 'with high priority')
      title = title
        .replace(/with high priority/gi, '')
        .replace(/with low priority/gi, '')
        .replace(/high priority/gi, '')
        .replace(/medium priority/gi, '')
        .replace(/low priority/gi, '')
        .replace(/tomorrow/gi, '')
        .replace(/today/gi, '')
        .replace(/next week/gi, '')
        .trim();

      // Capitalize first letter
      title = title.charAt(0).toUpperCase() + title.slice(1);

      if (title.length < 3) {
        title = `Voice Plan: ${command}`;
      }

      onAddTask({
        title,
        description: `Voice Created: "${command}"`,
        priority,
        dueDate: dateString,
        status: 'pending',
        subtasks: [],
        category
      });

      const responseText = `Understood. I have scheduled "${title}" with ${priority} priority for ${dateString}.`;
      setStatusMessage(responseText);
      onTriggerSpeak(responseText);
    }, 1000);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceQuery.trim()) return;
    processVoiceCommand(voiceQuery);
    setVoiceQuery('');
  };

  return (
    <div className={`p-5 rounded-2xl border ${
      isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'
    }`} id="voice-assistant-panel">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-base">Voice-Enabled Scheduler</h3>
      </div>

      <div className="flex flex-col items-center justify-center p-6 text-center border border-neutral-700/10 rounded-xl mb-5 bg-neutral-500/5">
        <button
          onClick={toggleListening}
          className={`p-4 rounded-full mb-3 text-white transition-all transform hover:scale-105 active:scale-95 ${
            isListening 
              ? 'bg-rose-500 animate-pulse ring-4 ring-rose-500/20' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
          id="mic-trigger-btn"
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {isListening ? 'Listening... Speak Now' : 'Click Mic to Speak Command'}
        </p>

        {statusMessage && (
          <p className="text-xs font-medium text-emerald-500 mt-3 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
            {statusMessage}
          </p>
        )}

        {errorMessage && (
          <p className="text-[11px] text-amber-500 mt-3 flex items-center gap-1.5 justify-center">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>

      {/* Manual text backup */}
      <form onSubmit={handleTextSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={voiceQuery}
          onChange={e => setVoiceQuery(e.target.value)}
          placeholder="e.g. Schedule meeting high priority tomorrow"
          className={`flex-1 p-2.5 rounded-xl text-xs border bg-transparent outline-none ${
            isDark ? 'border-neutral-700 focus:border-indigo-500 text-white' : 'border-neutral-300 focus:border-indigo-500'
          }`}
          id="voice-fallback-input"
        />
        <button
          type="submit"
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-500 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          Try speaking these formulas:
        </h4>
        <ul className="text-[11px] text-neutral-400 space-y-1.5 pl-1">
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-indigo-500" />
            <span>"Schedule math assignment high priority tomorrow"</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-indigo-500" />
            <span>"Add low priority gym workout tomorrow"</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-indigo-500" />
            <span>"Remind me to pay electric bill next week"</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
