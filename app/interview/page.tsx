"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function InterviewRoom() {
  const [question, setQuestion] = useState("Tell me about a time you had to learn a new technology quickly to solve a complex problem. How did you approach it?");
  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // We use a ref to hold the speech recognition instance
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if the browser supports the Web Speech API
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          // If the AI detected a finished sentence, add it to the text box
          if (finalTranscript) {
            setUserAnswer((prev) => prev + " " + finalTranscript.trim());
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      } else {
        console.warn("Speech Recognition not supported in this browser.");
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice typing is not supported in this browser. Please try Chrome or Edge!");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // Clear the box and start fresh!
      setUserAnswer("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) {
      alert("Please record or type an answer first! 🎙️");
      return;
    }

    setIsEvaluating(true);
    setFeedback(null);

    try {
      // We will reuse the dsa-evaluate endpoint you built earlier for both behavioral and technical!
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/dsa-evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question,
          user_code: userAnswer // Sending the spoken text as the answer
        }),
      });

      const data = await response.json();
      
      if (data.status === "success") {
        setFeedback(data.feedback);
      } else {
        alert("Backend error: " + data.message);
      }
    } catch (error) {
      alert("Could not reach the backend to evaluate the interview.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-purple-500/30">
      
      {/* AMBIENT GLOW */}
      <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mt-6 mb-12 border-b border-white/10 pb-6">
          <Link href="/">
            <motion.button whileHover={{ x: -5 }} className="text-gray-400 hover:text-white flex items-center gap-2 font-medium transition-colors">
              ← Back to Dashboard
            </motion.button>
          </Link>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Voice Interview Room 🎙️
          </h1>
        </div>

        {/* QUESTION CARD */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-2xl rounded-3xl p-8 border border-white/10">
          <label className="block text-sm font-medium text-blue-400 mb-2 uppercase tracking-wider">Current Question</label>
          <textarea 
            className="w-full bg-transparent text-2xl font-bold text-white outline-none resize-none" 
            rows={3} 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">You can edit this question to practice anything you want!</p>
        </motion.div>

        {/* RECORDING AREA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0a0a0a]/60 backdrop-blur-2xl shadow-xl rounded-3xl p-8 border border-white/10 relative">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Your Response
              {isRecording && <span className="flex w-3 h-3 bg-red-500 rounded-full animate-pulse ml-2"></span>}
            </h2>

            {/* THE MAGIC MICROPHONE BUTTON */}
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              onClick={toggleRecording} 
              className={`flex items-center gap-2 py-3 px-6 rounded-full font-bold text-white shadow-lg transition-all duration-300 ${isRecording ? "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "bg-purple-600 hover:bg-purple-500"}`}
            >
              {isRecording ? "⏹️ Stop Recording" : "🎤 Start Speaking"}
            </motion.button>
          </div>

          <textarea 
            value={userAnswer} 
            onChange={(e) => setUserAnswer(e.target.value)} 
            placeholder="Click the microphone and start speaking. Your words will appear here magically..."
            className="w-full h-48 p-4 bg-black/40 border border-white/10 rounded-2xl text-gray-200 leading-relaxed focus:ring-2 focus:ring-purple-500 outline-none resize-y"
          />

          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={handleEvaluate} 
            disabled={isEvaluating || isRecording} 
            className={`w-full mt-6 py-4 rounded-xl text-lg font-bold text-white transition-all ${isEvaluating || isRecording ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]"}`}
          >
            {isEvaluating ? "🤖 Gemini is evaluating your answer..." : "Evaluate Response ✨"}
          </motion.button>

        </motion.div>

        {/* FEEDBACK SECTION */}
        {feedback && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-900/10 backdrop-blur-2xl shadow-2xl rounded-3xl p-8 border border-blue-500/30 mt-8">
            <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-3">
              AI Feedback 🧠
            </h2>
            <div className="prose prose-invert prose-blue max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
              {feedback}
            </div>
          </motion.div>
        )}

      </div>
    </main>
  );
}