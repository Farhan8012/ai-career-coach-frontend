"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Editor from "@monaco-editor/react"; 

export default function CodingInterview() {
  // Default DSA Question
  const [question, setQuestion] = useState(
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]"
  );
  
  const [code, setCode] = useState("def twoSum(nums, target):\n    # Write your solution here\n    pass");
  const [language, setLanguage] = useState("python");
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // BRAND NEW: Hint State
  const [isFetchingHint, setIsFetchingHint] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    setFeedback(null);
    setHint(null); // Clear the hint if they submit

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/dsa-evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question,
          user_code: code 
        }),
      });

      const data = await response.json();
      
      if (data.status === "success") {
        setFeedback(data.feedback);
      } else {
        alert("Backend error: " + data.message);
      }
    } catch (error) {
      alert("Could not reach the backend to evaluate the code.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // BRAND NEW: Fetch the Hint from your new API endpoint
  const handleGetHint = async () => {
    setIsFetchingHint(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/dsa-hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question }),
      });

      const data = await response.json();
      if (data.status === "success") {
        setHint(data.hint);
      } else {
        alert("Backend error: " + data.message);
      }
    } catch (error) {
      alert("Could not reach the backend for a hint.");
    } finally {
      setIsFetchingHint(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-purple-500/30">
      
      {/* NAVBAR */}
      <div className="w-full bg-[#0a0a0a] border-b border-white/10 p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-6">
          <Link href="/">
            <motion.button whileHover={{ x: -5 }} className="text-gray-400 hover:text-white flex items-center gap-2 font-medium transition-colors">
              ← Dashboard
            </motion.button>
          </Link>
          <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
            Technical Interview Arena 💻
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          
          {/* BRAND NEW: The Hint Button */}
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={handleGetHint} 
            disabled={isFetchingHint} 
            className={`py-2 px-4 rounded-lg font-bold text-yellow-500 border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 transition-all ${isFetchingHint ? "opacity-50 cursor-not-allowed animate-pulse" : ""}`}
          >
            {isFetchingHint ? "Thinking..." : "💡 Get Hint"}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={handleEvaluate} 
            disabled={isEvaluating} 
            className={`py-2 px-6 rounded-lg font-bold text-white shadow-lg transition-all ${isEvaluating ? "bg-gray-600 cursor-not-allowed animate-pulse" : "bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]"}`}
          >
            {isEvaluating ? "Evaluating..." : "Run & Submit ✨"}
          </motion.button>
        </div>
      </div>

      {/* SPLIT SCREEN LAYOUT */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT PANEL: QUESTION & FEEDBACK */}
        <div className="w-full lg:w-1/3 bg-[#0a0a0a]/50 p-6 overflow-y-auto border-r border-white/10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Problem Statement</h2>
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-8">
             <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{question}</p>
          </div>

          {/* BRAND NEW: Hint Display Box */}
          {hint && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-yellow-500/10 rounded-xl p-5 border border-yellow-500/30 mb-8 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
              <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                💡 Conceptual Hint
              </h2>
              <p className="text-gray-300 leading-relaxed text-sm">{hint}</p>
            </motion.div>
          )}

          {/* FEEDBACK BOX */}
          {feedback && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-900/10 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
              <h2 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                AI Code Review 🤖
              </h2>
              <div className="prose prose-invert prose-blue max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">
                {feedback}
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT PANEL: MONACO EDITOR */}
        <div className="w-full lg:w-2/3 h-[60vh] lg:h-auto bg-[#1e1e1e] relative">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 16,
              wordWrap: "on",
              padding: { top: 24 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
            }}
          />
        </div>

      </div>
    </main>
  );
}