"use client"; 
import { useState, useEffect } from "react"; 
import { motion } from "framer-motion";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  // --- AUTHENTICATION STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  // --- PROFILE & HISTORY STATE ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]); 

  // BRAND NEW: KANBAN STATE
  const [applications, setApplications] = useState<any[]>([]);

  // --- APP STATE ---
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

  // BRAND NEW: Fetch saved job applications from Supabase
  const fetchApplications = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/applications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === "success" && data.data) {
        setApplications(data.data);
      }
    } catch (error) {
      console.error("Could not fetch applications:", error);
    }
  };

  const fetchHistory = async (userEmail: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/history/${userEmail}`);
      const data = await response.json();
      if (data.status === "success" && data.data) {
        const formattedData = data.data.map((item: any, index: number) => ({
          attempt: `Scan ${index + 1}`,
          ATS: item.match_score,
          Semantic: item.semantic_score
        }));
        setScoreHistory(formattedData);
      }
    } catch (error) {
      console.error("Could not fetch history:", error);
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        setUserProfile(data);
        fetchHistory(data.user_email); 
        fetchApplications(token); // Grab the Kanban board data!
      }
    } catch (error) {
      console.error("Could not fetch profile:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("supabase_token");
    if (token) {
      setIsLoggedIn(true);
      fetchUserProfile(token);
    }

    const savedResults = sessionStorage.getItem("dashboard_results");
    const savedGithub = sessionStorage.getItem("dashboard_github");
    
    if (savedResults) setResults(JSON.parse(savedResults));
    if (savedGithub) setGithubUsername(savedGithub);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const endpoint = isLoginMode ? "/api/login" : "/api/signup";
    const payload = isLoginMode 
      ? { email, password } 
      : { email, password, first_name: firstName, last_name: lastName, target_role: targetRole };
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.status === "success") {
        if (isLoginMode) {
          localStorage.setItem("supabase_token", data.access_token);
          setIsLoggedIn(true);
          fetchUserProfile(data.access_token);
        } else {
          alert(`Account created successfully! Welcome aboard, ${firstName}! 🎉 Please log in.`);
          setIsLoginMode(true);
        }
      } else alert(data.message);
    } catch (error) { alert("Error connecting to server."); } 
    finally { setAuthLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("supabase_token");
    sessionStorage.removeItem("dashboard_results"); 
    sessionStorage.removeItem("dashboard_github");
    setIsLoggedIn(false); setResults(null); setUserProfile(null); setScoreHistory([]); setApplications([]);
  };

  const handleAnalyze = async () => {
    if (!resumeFile) return alert("Please upload a PDF resume first! 📄");
    setIsLoading(true); setResults(null); setCoverLetter(null); setStudyPlan(null); 

    try {
      const formData = new FormData();
      formData.append("github_username", githubUsername);
      formData.append("job_description", jobDescription);
      formData.append("resume", resumeFile); 
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/evaluate-candidate`, {
        method: "POST", body: formData,
      });
      const data = await response.json();
      
      if (data.status === "success") {
        const evalData = data.candidate_evaluation;
        setResults(evalData);
        sessionStorage.setItem("dashboard_results", JSON.stringify(evalData));
        sessionStorage.setItem("dashboard_github", githubUsername);

        if (userProfile?.user_email) {
          await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/history`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_email: userProfile.user_email, match_score: evalData.resume_metrics.ats_score, semantic_score: evalData.resume_metrics.semantic_score, missing_skills: evalData.resume_metrics.missing_skills })
          });
          fetchHistory(userProfile.user_email);
        }
      } else alert("Backend returned an error: " + data.message);
    } catch (error) { alert("Uh oh! Could not reach the backend."); } 
    finally { setIsLoading(false); }
  };

  const handleDownloadPDF = async () => { /* ... existing logic ... */
    if (!results) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/generate-pdf`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_username: githubUsername, ats_score: results.resume_metrics?.ats_score || 0, semantic_score: results.resume_metrics?.semantic_score || 0, matched_skills: results.resume_metrics?.matched_skills || [], missing_skills: results.resume_metrics?.missing_skills || [], ai_scorecard: results.github_metrics?.ai_scorecard || "No scorecard generated." }),
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob(); const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${githubUsername || "Candidate"}_AI_Scorecard.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (error) { alert("Could not download the PDF."); } 
    finally { setIsDownloading(false); }
  };

  const handleGenerateCoverLetter = async () => { /* ... existing logic ... */
    if (!resumeFile || !jobDescription) return;
    setIsGeneratingLetter(true);
    try {
      const formData = new FormData(); formData.append("job_description", jobDescription); formData.append("resume", resumeFile);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/cover-letter`, { method: "POST", body: formData });
      const data = await response.json();
      if (data.status === "success") setCoverLetter(data.cover_letter);
    } catch (error) { console.error(error); } 
    finally { setIsGeneratingLetter(false); }
  };

  const handleGenerateStudyPlan = async () => { /* ... existing logic ... */
    const missingSkills = results?.resume_metrics?.missing_skills || [];
    if (missingSkills.length === 0) return;
    setIsGeneratingPlan(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/study-plan`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ missing_skills: missingSkills }),
      });
      const data = await response.json();
      if (data.status === "success") setStudyPlan(data.study_plan);
    } catch (error) { alert("Could not generate the study plan."); } 
    finally { setIsGeneratingPlan(false); }
  };

  // BRAND NEW: Save a job to the Kanban board
  const handleSaveToTracker = async () => {
    const token = localStorage.getItem("supabase_token");
    if (!token) return alert("Please log in to save jobs.");
    
    const companyName = window.prompt("What company is this for?");
    const jobTitle = window.prompt("What is the exact job title?");
    
    if (!companyName || !jobTitle) return; // User cancelled

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ company_name: companyName, job_title: jobTitle, match_score: results?.resume_metrics?.ats_score || 0 })
      });
      const data = await response.json();
      if (data.status === "success") {
        alert("Job saved to your tracker! 📌");
        fetchApplications(token); // Refresh the board
      }
    } catch (error) {
      console.error(error);
    }
  };

  // BRAND NEW: Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("app_id", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping!
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("app_id");
    const token = localStorage.getItem("supabase_token");
    
    // Optimistic UI Update (Change it on screen instantly)
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));

    // Send the change to the database in the background
    if (token) {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
    }
  };

  const kanbanColumns = ["Saved", "Applied", "Interviewing", "Offer"];

  return (
    <main className="min-h-screen bg-[#050505] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-purple-500/30">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="text-center mb-12 mt-10">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 sm:text-6xl drop-shadow-lg">
            AI Career Coach
          </h1>
          <p className="mt-4 text-lg text-gray-400 font-light pointer-events-none">
            {isLoggedIn && userProfile
              ? `Welcome back, ${userProfile.first_name}. Let's land that ${userProfile.target_role} role.`
              : isLoggedIn
              ? "Welcome back. Let's analyze your next opportunity."
              : "Sign in to access personalized ATS evaluation."}
          </p>
          {isLoggedIn && (
            <button onClick={handleLogout} className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors">Sign Out 🚪</button>
          )}
        </motion.div>

        {/* --- AUTHENTICATION SCREEN --- */}
        {!isLoggedIn ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto bg-[#0a0a0a]/60 backdrop-blur-2xl shadow-2xl rounded-3xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{isLoginMode ? "Secure Login" : "Create Account"}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLoginMode && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                      <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="block w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 outline-none transition" placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                      <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="block w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 outline-none transition" placeholder="Doe" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Target Role</label>
                    <input type="text" required value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="block w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 outline-none transition" placeholder="e.g., AI Engineer" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition" placeholder="you@domain.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition" placeholder="••••••••" />
              </div>
              <motion.button type="submit" disabled={authLoading} className={`w-full mt-2 flex justify-center py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] text-md font-bold text-white transition-all ${authLoading ? "bg-purple-500/50 cursor-not-allowed animate-pulse" : "bg-purple-600 hover:bg-purple-500"}`}>
                {authLoading ? "Authenticating..." : (isLoginMode ? "Log In" : "Sign Up")}
              </motion.button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-400">
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">{isLoginMode ? "Sign Up" : "Log In"}</button>
            </p>
          </motion.div>
        ) : (
          /* --- MAIN DASHBOARD SCREEN --- */
          <>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0a0a0a]/60 backdrop-blur-2xl shadow-2xl rounded-3xl p-8 border border-white/10">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">GitHub Username</label>
                    <input type="text" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} className="block w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 outline-none transition" placeholder="e.g., Farhan8012" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Upload Resume (PDF)</label>
                    <input type="file" accept=".pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-xl file:border-0 file:bg-purple-600/20 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-purple-300 hover:file:bg-purple-600/30 cursor-pointer transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Job Description</label>
                  <textarea rows={4} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="block w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500 outline-none transition" placeholder="Paste the requirements..." />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={handleAnalyze} disabled={isLoading} className={`w-full mt-4 flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] text-lg font-bold text-white transition-all ${isLoading ? "bg-purple-500/50 cursor-not-allowed animate-pulse" : "bg-purple-600 hover:bg-purple-500"}`}>
                  {isLoading ? "🧠 Analyzing Profile..." : "Analyze Profile ✨"}
                </motion.button>
              </form>
            </motion.div>

            {/* BRAND NEW: THE KANBAN BOARD */}
            {applications.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-2xl rounded-3xl p-8 border border-white/10">
                <h2 className="text-3xl font-extrabold text-white mb-6">Application Tracker 📋</h2>
                <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-black/50">
                  {kanbanColumns.map((col) => (
                    <div 
                      key={col} 
                      onDragOver={handleDragOver} 
                      onDrop={(e) => handleDrop(e, col)} 
                      className="w-72 min-w-[18rem] bg-white/5 rounded-2xl p-5 border border-white/10 flex-shrink-0"
                    >
                      <h3 className="text-white font-bold mb-4 flex items-center justify-between">
                        {col} 
                        <span className="bg-black/50 text-gray-400 text-xs px-2 py-1 rounded-full">{applications.filter(a => a.status === col).length}</span>
                      </h3>
                      <div className="space-y-4 min-h-[100px]">
                        {applications.filter(app => app.status === col).map(app => (
                          <div 
                            key={app.id} 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, app.id)} 
                            className="bg-black/60 border border-white/10 p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-purple-500/50 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                          >
                            <div className="text-sm font-bold text-white line-clamp-1">{app.job_title}</div>
                            <div className="text-xs text-gray-400 mt-1">{app.company_name}</div>
                            <div className="mt-3 flex justify-end">
                              <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2 py-1 rounded-md border border-purple-500/30">
                                {app.match_score}% Match
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ATS PROGRESS CHART */}
            {scoreHistory.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, type: "spring", bounce: 0.3 }} className="bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-2xl rounded-3xl p-8 border border-white/10">
                <h2 className="text-3xl font-extrabold text-white mb-6">Your Progress 📈</h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                      <XAxis dataKey="attempt" stroke="#a0aec0" tick={{ fill: '#a0aec0' }} />
                      <YAxis stroke="#a0aec0" tick={{ fill: '#a0aec0' }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #ffffff20', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                      <Line type="monotone" dataKey="ATS" stroke="#a855f7" strokeWidth={4} dot={{ r: 6, fill: '#a855f7' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* DYNAMIC RESULTS SECTION */}
            {results && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, type: "spring", bounce: 0.3 }} className="bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-2xl rounded-3xl p-8 border border-white/10">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-white/10 pb-4 gap-4">
                  <h2 className="text-3xl font-extrabold text-white">Evaluation Results 🎯</h2>
                  <div className="flex flex-wrap gap-3">
                    {/* BRAND NEW: Save to Tracker Button! */}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveToTracker} className="flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-white bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 transition-colors">
                      📌 Save to Tracker
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDownloadPDF} disabled={isDownloading} className={`flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-white shadow-sm transition-colors ${isDownloading ? "bg-gray-600 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 border border-white/10"}`}>
                      {isDownloading ? "⏳ Generating..." : "📄 Download PDF Report"}
                    </motion.button>
                    <Link href="/interview">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-white bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 transition-colors">
                        💻 Practice Interview
                      </motion.button>
                    </Link>
                  </div>
                </div>

                {/* Scores Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/20 flex flex-col items-center justify-center text-center">
                    <span className="text-blue-300 font-semibold text-sm uppercase tracking-wider">ATS Match Score</span>
                    <span className="text-5xl font-black text-blue-400 mt-2">{results.resume_metrics?.ats_score || 0}%</span>
                  </div>
                  <div className="bg-purple-500/10 rounded-2xl p-6 border border-purple-500/20 flex flex-col items-center justify-center text-center">
                    <span className="text-purple-300 font-semibold text-sm uppercase tracking-wider">Semantic Similarity</span>
                    <span className="text-5xl font-black text-purple-400 mt-2">{results.resume_metrics?.semantic_score || 0}</span>
                  </div>
                </div>

                {/* Skills Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-3 flex items-center">✅ Matched Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.resume_metrics?.matched_skills?.map((skill: string, index: number) => (
                        <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} key={index} className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-sm font-medium">{skill}</motion.span>
                      )) || <span className="text-gray-500 italic">None found</span>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center">⚠️ Missing Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.resume_metrics?.missing_skills?.map((skill: string, index: number) => (
                        <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} key={index} className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-sm font-medium">{skill}</motion.span>
                      )) || <span className="text-gray-500 italic">None found</span>}
                    </div>
                    {(results.resume_metrics?.missing_skills?.length || 0) > 0 && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleGenerateStudyPlan} disabled={isGeneratingPlan} className={`mt-4 py-2 px-4 text-sm rounded-xl font-bold text-white shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-colors ${isGeneratingPlan ? "bg-teal-500/50 cursor-not-allowed animate-pulse" : "bg-teal-600 hover:bg-teal-500"}`}>
                        {isGeneratingPlan ? "📚 Building Roadmap..." : "Generate Study Plan 📚"}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* AI Scorecard Paragraph */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">🤖 AI Developer Persona</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{results.github_metrics?.ai_scorecard || "No persona generated."}</p>
                </div>

                {/* GITHUB METRICS SECTION */}
                <div className="mt-12 pt-10 border-t border-white/10">
                  <h2 className="text-3xl font-extrabold text-white mb-8 flex items-center gap-3">GitHub Profile Analysis 🐙</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <motion.div whileHover={{ y: -5 }} className="bg-black/40 rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center text-center shadow-lg transition-transform">
                      <span className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Public Repositories</span>
                      <span className="text-6xl font-black text-white mt-3">{results.github_metrics?.public_repos !== undefined ? results.github_metrics.public_repos : "N/A"}</span>
                    </motion.div>
                    <motion.div whileHover={{ y: -5 }} className="bg-black/40 rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center text-center shadow-lg transition-transform">
                      <span className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Top Languages</span>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {results.github_metrics?.top_languages && Object.keys(results.github_metrics.top_languages).length > 0 ? (
                          Object.keys(results.github_metrics.top_languages).map((lang: string, idx: number) => (
                            <span key={idx} className="px-4 py-1.5 bg-white/5 text-blue-300 rounded-full text-sm font-bold border border-white/10">{lang}</span>
                          ))
                        ) : <span className="text-gray-500 italic mt-2">No top languages found</span>}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
}