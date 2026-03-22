import { useState } from "react";
import { motion } from "framer-motion";

// This tells the component what functions it can receive from the main page
interface AuthFormProps {
  onLoginSuccess: (token: string) => void;
}

export default function AuthForm({ onLoginSuccess }: AuthFormProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    
    const endpoint = isLoginMode ? "/api/login" : "/api/signup";
    const payload = isLoginMode 
      ? { email, password } 
      : { email, password, first_name: firstName, last_name: lastName, target_role: targetRole };
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}${endpoint}`, {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.status === "success") {
        if (isLoginMode) {
          localStorage.setItem("supabase_token", data.access_token);
          // Tell the parent page that we succeeded!
          onLoginSuccess(data.access_token);
        } else {
          alert(`Account created successfully! Welcome aboard, ${firstName}! 🎉 Please log in.`);
          setIsLoginMode(true);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Error connecting to server.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="max-w-md mx-auto bg-[#0a0a0a]/60 backdrop-blur-2xl shadow-2xl rounded-3xl p-8 border border-white/10"
    >
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {isLoginMode ? "Secure Login" : "Create Account"}
      </h2>
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
        <motion.button 
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          type="submit" disabled={authLoading}
          className={`w-full mt-2 flex justify-center py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] text-md font-bold text-white transition-all ${authLoading ? "bg-purple-500/50 cursor-not-allowed animate-pulse" : "bg-purple-600 hover:bg-purple-500"}`}
        >
          {authLoading ? "Authenticating..." : (isLoginMode ? "Log In" : "Sign Up")}
        </motion.button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        {isLoginMode ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
          {isLoginMode ? "Sign Up" : "Log In"}
        </button>
      </p>
    </motion.div>
  );
}