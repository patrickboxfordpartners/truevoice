import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const PHOTOS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2074&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop",
];

const Login = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  useEffect(() => { setTheme("light"); }, [setTheme]);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhotoIndex((i) => (i + 1) % PHOTOS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description: err.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[400px] mx-auto">
          {/* Logo — centered */}
          <div className="flex justify-center mb-14">
            <Link to="/">
              <img src="/truevoice-logo.png" alt="TrueVoice HQ" className="h-9 w-auto" />
            </Link>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-gray-500 text-[15px]">
              Interview authenticity detection for hiring teams.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 px-4 bg-gray-50 border-gray-200 rounded-lg text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-gray-300"
            />

            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 px-4 bg-gray-50 border-gray-200 rounded-lg text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-gray-300"
            />

            <Button
              type="submit"
              className="w-full h-12 text-[15px] font-medium bg-gray-900 text-white hover:bg-gray-800 rounded-lg"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Signing in..." : "Continue with email"}
            </Button>
          </form>

          {/* Forgot password */}
          <div className="mt-4 text-center">
            <Link to="/reset-password" className="text-sm text-gray-400 hover:text-gray-600">
              Forgot your password?
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/signup?plan=starter" className="text-gray-900 font-medium hover:underline">
                Get started
              </Link>
            </p>
          </div>

          {/* Legal footer */}
          <p className="mt-10 text-xs text-gray-400 text-center">
            By continuing, you agree to our{" "}
            <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
            {" "}and{" "}
            <Link to="/terms" className="underline hover:text-gray-600">Terms of Service</Link>.
          </p>
        </div>
      </div>

      {/* Right side - Rotating photos */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        {PHOTOS.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
            style={{
              backgroundImage: `url('${src}')`,
              opacity: i === photoIndex ? 1 : 0,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Login;
