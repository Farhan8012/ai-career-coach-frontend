"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function InterviewRoom() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [questionData, setQuestionData] = useState<{ question: string; boilerplate: string } | null>(null);
  const [userCode, setUserCode] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleGenerateQuestion = async () => {
    if (!resumeFile) {
      alert("Please upload your resume so the AI can tailor the question to your level!");
      return;
    }

    setIsGenerating(true);
    setQuestionData(null);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/dsa-question`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.status === "success") {
        setQuestionData(data.data);
        setUserCode(data.data.boilerplate);
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Could not reach the backend to generate the question.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluateCode = async () => {
    if (!userCode.trim()) return;
    
    setIsEvaluating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/dsa-evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionData?.question,
          user_code: userCode,
        }),
      });

      const data = await response.json();
      if (data.status === "success") {
        setFeedback(data.feedback);
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Could not evaluate the code.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
            Technical Interview Room
          </h1>
        </div>

        {/* Upload Section */}
        {!questionData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a]/60 backdrop-blur-2xl shadow-2xl rounded-3xl p-8 border border-white/10 text-center">
            <h2 className="text-2xl font-bold mb-4">Let's test your logic.</h2>
            <p className="text-gray-400 mb-6">Upload your resume. The AI will analyze your experience and generate a custom Python DSA question tailored exactly to your skill level.</p>
            
            <div className="max-w-md mx-auto space-y-4">
              <input type="file" accept=".pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600/20 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-blue-300 hover:file:bg-blue-600/30 cursor-pointer transition" />
              
              <button onClick={handleGenerateQuestion} disabled={isGenerating} className={`w-full py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)] font-bold text-white transition-all ${isGenerating ? "bg-blue-500/50 cursor-not-allowed animate-pulse" : "bg-blue-600 hover:bg-blue-500"}`}>
                {isGenerating ? "🧠 Analyzing & Generating..." : "Start Technical Round"}
              </button>
            </div>
          </motion.div>
        )}

        {/* The Coding Environment */}
        {questionData && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Question & Feedback */}
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-blue-400 mb-4">Problem Statement</h3>
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{questionData.question}</p>
              </div>

              {feedback && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-900/20 rounded-2xl p-6 border border-green-500/30">
                  <h3 className="text-xl font-bold text-green-400 mb-4">Interviewer Feedback</h3>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{feedback}</p>
                </motion.div>
              )}
            </div>

            {/* Right Column: IDE */}
            <div className="bg-[#1e1e1e] rounded-2xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden">
              <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-gray-700">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-gray-400 font-mono">solution.py</span>
              </div>
              
              <textarea 
                value={userCode} 
                onChange={(e) => setUserCode(e.target.value)} 
                spellCheck="false"
                className="w-full h-96 bg-transparent text-green-400 font-mono text-sm p-4 outline-none resize-none leading-relaxed"
              />
              
              <div className="p-4 bg-[#252526] border-t border-gray-700">
                <button onClick={handleEvaluateCode} disabled={isEvaluating} className={`w-full py-3 rounded-xl font-bold text-white transition-all ${isEvaluating ? "bg-green-600/50 cursor-not-allowed animate-pulse" : "bg-green-600 hover:bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"}`}>
                  {isEvaluating ? "⚙️ Running Tests..." : "Submit Solution ▶"}
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </main>
  );
}