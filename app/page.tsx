"use client"; 
import { useState } from "react"; 
import { motion } from "framer-motion";
// NEW 3D IMPORTS:
import { Canvas } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, Float, OrbitControls } from "@react-three/drei";

// NEW 3D COMPONENT: The morphing AI Core!
function AIBrain() {
  return (
    <Canvas camera={{ position: [0, 0, 4] }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 2, 5]} intensity={1.5} />
      <OrbitControls enableZoom={false} />
      <Float speed={2.5} rotationIntensity={1.5} floatIntensity={2}>
        <Sphere args={[1.2, 64, 64]}>
          <MeshDistortMaterial 
            color="#6366f1" // Indigo color to match the theme
            attach="material" 
            distort={0.4} // How much it bubbles
            speed={2}     // How fast it bubbles
            roughness={0.1}
            metalness={0.8}
          />
        </Sphere>
      </Float>
    </Canvas>
  );
}

export default function Home() {
  const [githubUsername, setGithubUsername] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);

  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const handleAnalyze = async () => {
    if (!resumeFile) {
      alert("Please upload a PDF resume first! 📄");
      return;
    }

    setIsLoading(true);
    setResults(null); 
    setCoverLetter(null); 
    setStudyPlan(null); 

    try {
      const formData = new FormData();
      formData.append("github_username", githubUsername);
      formData.append("job_description", jobDescription);
      formData.append("resume", resumeFile); 

      const response = await fetch("http://localhost:8000/api/evaluate-candidate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (data.status === "success") {
        setResults(data.candidate_evaluation);
      } else {
        alert("Backend returned an error: " + data.message);
      }
    } catch (error) {
      console.error("Bridge Error:", error);
      alert("Uh oh! Could not reach the backend. Is your Python server running on port 8000?");
    } finally {
      setIsLoading(false); 
    }
  };

  const handleDownloadPDF = async () => {
    if (!results) return;
    setIsDownloading(true);
    try {
      const response = await fetch("http://localhost:8000/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          github_username: githubUsername,
          ats_score: results.resume_metrics?.ats_score || 0,
          semantic_score: results.resume_metrics?.semantic_score || 0,
          matched_skills: results.resume_metrics?.matched_skills || [],
          missing_skills: results.resume_metrics?.missing_skills || [],
          ai_scorecard: results.resume_metrics?.ai_scorecard || "No scorecard generated."
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${githubUsername || "Candidate"}_AI_Scorecard.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Download Error:", error);
      alert("Could not download the PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!resumeFile || !jobDescription) return;
    setIsGeneratingLetter(true);
    try {
      const formData = new FormData();
      formData.append("job_description", jobDescription);
      formData.append("resume", resumeFile);

      const response = await fetch("http://localhost:8000/api/cover-letter", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.status === "success") {
        setCoverLetter(data.cover_letter);
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Cover Letter Error:", error);
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    const missingSkills = results?.resume_metrics?.missing_skills || [];
    if (missingSkills.length === 0) {
      alert("You have no missing skills! You are perfectly qualified. 🎉");
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const response = await fetch("http://localhost:8000/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missing_skills: missingSkills }),
      });

      const data = await response.json();
      if (data.status === "success") {
        setStudyPlan(data.study_plan);
      } else {
        alert("Backend returned an error: " + data.message);
      }
    } catch (error) {
      console.error("Study Plan Error:", error);
      alert("Could not generate the study plan. Check your backend!");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* --- ANIMATED HEADER & 3D BRAIN --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12 relative"
        >
          {/* 3D Canvas Box */}
          <div className="h-64 w-full flex justify-center items-center cursor-grab active:cursor-grabbing mb-4">
            <AIBrain />
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            AI Career Coach
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Upload your resume and job description to get a personalized ATS evaluation and developer scorecard.
          </p>
        </motion.div>

        {/* --- ANIMATED MAIN INPUT CARD --- */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100 relative z-10"
        >
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">GitHub Username</label>
                <input type="text" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="e.g., Farhan8012" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Resume (PDF)</label>
                <input type="file" accept=".pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 cursor-pointer transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Job Description</label>
              <textarea rows={4} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="Paste the requirements of the job you are applying for here..." />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button" 
              onClick={handleAnalyze} 
              disabled={isLoading} 
              className={`w-full mt-4 flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white transition-colors ${isLoading ? "bg-blue-400 cursor-not-allowed animate-pulse" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isLoading ? "🧠 Analyzing Profile..." : "Analyze Profile ✨"}
            </motion.button>
          </form>
        </motion.div>

        {/* --- ANIMATED DYNAMIC RESULTS SECTION --- */}
        {results && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
            className="bg-white shadow-2xl rounded-2xl p-8 border border-green-100"
          >
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-4 gap-4">
              <h2 className="text-3xl font-extrabold text-gray-900">Evaluation Results 🎯</h2>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDownloadPDF} disabled={isDownloading} className={`flex items-center gap-2 py-2 px-4 rounded-lg font-bold text-white shadow-sm transition-colors ${isDownloading ? "bg-gray-400 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-900"}`}>
                {isDownloading ? "⏳ Generating..." : "📄 Download PDF Report"}
              </motion.button>
            </div>

            {/* Scores Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex flex-col items-center justify-center text-center">
                <span className="text-blue-800 font-semibold text-sm uppercase tracking-wider">ATS Match Score</span>
                <span className="text-5xl font-black text-blue-600 mt-2">{results.resume_metrics?.ats_score || 0}%</span>
              </div>
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-100 flex flex-col items-center justify-center text-center">
                <span className="text-purple-800 font-semibold text-sm uppercase tracking-wider">Semantic Similarity</span>
                <span className="text-5xl font-black text-purple-600 mt-2">{results.resume_metrics?.semantic_score || 0}</span>
              </div>
            </div>

            {/* Skills Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center">✅ Matched Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {results.resume_metrics?.matched_skills?.map((skill: string, index: number) => (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">{skill}</motion.span>
                  )) || <span className="text-gray-500 italic">None found</span>}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center">⚠️ Missing Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {results.resume_metrics?.missing_skills?.map((skill: string, index: number) => (
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">{skill}</motion.span>
                  )) || <span className="text-gray-500 italic">None found</span>}
                </div>
                {(results.resume_metrics?.missing_skills?.length || 0) > 0 && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleGenerateStudyPlan} disabled={isGeneratingPlan} className={`mt-4 py-2 px-4 text-sm rounded-lg font-bold text-white shadow-sm transition-colors ${isGeneratingPlan ? "bg-teal-400 cursor-not-allowed animate-pulse" : "bg-teal-600 hover:bg-teal-700"}`}>
                    {isGeneratingPlan ? "📚 Building Roadmap..." : "Generate Study Plan 📚"}
                  </motion.button>
                )}
              </div>
            </div>

            {/* AI Scorecard Paragraph */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">🤖 AI Scorecard</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{results.resume_metrics?.ai_scorecard || "No scorecard generated."}</p>
            </div>

            {/* GITHUB METRICS SECTION */}
            <div className="mt-12 pt-10 border-t border-gray-200">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">GitHub Profile Analysis 🐙</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div whileHover={{ y: -5 }} className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex flex-col items-center justify-center text-center shadow-lg transition-transform">
                  <span className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Public Repositories</span>
                  <span className="text-6xl font-black text-white mt-3">{results.github_metrics?.total_repos !== undefined ? results.github_metrics.total_repos : "N/A"}</span>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex flex-col items-center justify-center text-center shadow-lg transition-transform">
                  <span className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Top Languages</span>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {results.github_metrics?.top_languages?.length > 0 ? (
                      results.github_metrics.top_languages.map((lang: string, idx: number) => (
                        <span key={idx} className="px-4 py-1.5 bg-gray-800 text-blue-400 rounded-full text-sm font-bold border border-gray-700">{lang}</span>
                      ))
                    ) : <span className="text-gray-500 italic mt-2">No top languages found</span>}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* COVER LETTER SECTION */}
            <div className="mt-12 pt-10 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">Auto-Draft Cover Letter ✉️</h2>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleGenerateCoverLetter} disabled={isGeneratingLetter} className={`py-2 px-6 rounded-lg font-bold text-white shadow-sm transition-colors ${isGeneratingLetter ? "bg-purple-400 cursor-not-allowed animate-pulse" : "bg-purple-600 hover:bg-purple-700"}`}>
                  {isGeneratingLetter ? "✍️ Drafting..." : "Generate Cover Letter"}
                </motion.button>
              </div>
              {coverLetter && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.5 }}>
                  <textarea className="w-full h-96 p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-gray-800 leading-relaxed focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y mt-4" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
                </motion.div>
              )}
            </div>

            {/* STUDY PLAN SECTION */}
            {studyPlan && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-12 pt-10 border-t border-gray-200">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                  Your Custom Study Plan 🗺️
                </h2>
                <div className="bg-teal-50 rounded-xl p-8 border border-teal-200 shadow-inner">
                  <div className="prose prose-teal max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {studyPlan}
                  </div>
                </div>
              </motion.div>
            )}

          </motion.div>
        )}

      </div>
    </main>
  );
}