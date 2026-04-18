import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const quickLogins = [
  { role: "Student", email: "student1@lpu.in", color: "from-primary to-primary-glow" },
  { role: "Staff", email: "hod.cse@lpu.in", color: "from-emerald-500 to-teal-500" },
  { role: "Recruiter", email: "schoolhod@lpu.in", color: "from-violet-500 to-purple-500" },
  { role: "Placement Director", email: "daa@lpu.in", color: "from-blue-500 to-cyan-500" },
  { role: "Admin", email: "admin@lpu.in", color: "from-rose-500 to-pink-500" },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);
    if (result.success) {
      setTimeout(() => navigate("/dashboard"), 500);
    } else {
      setError(result.error || "Invalid credentials. Please try again.");
      setIsLoading(false);
    }
  };

  const fillCredentials = (cred: typeof quickLogins[0]) => {
    setEmail(cred.email);
    setPassword("Demo@123");
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background login-bg-pattern px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-primary-glow/5 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow text-primary-foreground font-bold text-xl">
            PA
          </div>
          <h1 className="text-3xl font-extrabold font-display text-foreground tracking-tight">
            Place<span className="gradient-text">AI</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Smart Placement Portal
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl glass p-6 shadow-lg"
        >
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex h-11 w-full rounded-xl border border-border bg-background/60 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="flex h-11 w-full rounded-xl border border-border bg-background/60 px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex h-11 w-full items-center justify-center rounded-xl gradient-primary text-sm font-semibold text-primary-foreground transition-all duration-300 hover:shadow-glow disabled:opacity-70 overflow-hidden"
            >
              <span className={`flex items-center gap-2 transition-all duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}>
                Login <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
                </div>
              )}
            </button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-5 rounded-2xl glass p-5"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Login (Password: Demo@123)</p>
          <div className="grid grid-cols-2 gap-2">
            {quickLogins.map((cred, i) => (
              <motion.button
                key={cred.role}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                onClick={() => fillCredentials(cred)}
                className="group relative overflow-hidden rounded-xl bg-secondary/50 p-3 text-left transition-all duration-200 hover:bg-secondary hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${cred.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                <p className="text-xs font-semibold text-foreground">{cred.role}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{cred.email}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;