"use client"; 
import { useState } from "react"; 

export default function Home() {
  const [githubUsername, setGithubUsername] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!resumeFile) {
      alert("Please upload a PDF resume first! 📄");
      return;
    }

    setIsLoading(true);
    setResults(null); 

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
      console.log("🔥 THE AI HAS SPOKEN:", data);
      
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

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            AI Career Coach
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Upload your resume and job description to get a personalized ATS evaluation and developer scorecard.
          </p>
        </div>

        {/* --- MAIN INPUT CARD --- */}
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <form className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  GitHub Username
                </label>
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  placeholder="e.g., Farhan8012"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Upload Resume (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 cursor-pointer transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Job Description
              </label>
              <textarea
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                placeholder="Paste the requirements of the job you are applying for here..."
              />
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isLoading}
              className={`w-full mt-4 flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white transition-all ${
                isLoading ? "bg-blue-400 cursor-not-allowed animate-pulse" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              {isLoading ? "🧠 Analyzing Profile..." : "Analyze Profile ✨"}
            </button>
            
          </form>
        </div>

        {/* --- DYNAMIC RESULTS SECTION --- */}
        {results && (
          <div className="bg-white shadow-2xl rounded-2xl p-8 border border-green-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b pb-4">
              Evaluation Results 🎯
            </h2>

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
                <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center">
                  ✅ Matched Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.resume_metrics?.matched_skills?.map((skill: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  )) || <span className="text-gray-500 italic">None found</span>}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center">
                  ⚠️ Missing Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.resume_metrics?.missing_skills?.map((skill: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  )) || <span className="text-gray-500 italic">None found</span>}
                </div>
              </div>
            </div>

            {/* AI Scorecard Paragraph */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                🤖 AI Scorecard
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {results.resume_metrics?.ai_scorecard || "No scorecard generated."}
              </p>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}