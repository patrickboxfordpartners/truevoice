import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  useEffect(() => { setTheme("light"); }, [setTheme]);
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      toast({
        title: "Account created",
        description: "Check your email to confirm your account, then sign in.",
      });
      navigate("/onboarding");
    } catch (err: any) {
      toast({
        title: "Signup failed",
        description: err.message || "Something went wrong.",
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
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="inline-block mb-12">
            <img src="/truevoice-logo.png" alt="TrueVoice HQ" className="h-10 w-auto" />
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Welcome to TrueVoice
            </h1>
            <p className="text-gray-600">
              Interview fraud detection built for scale.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Your name
              </Label>
              <Input
                id="fullName"
                placeholder="Patrick Mitchell"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 px-4 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 px-4 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 px-4 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Creating account..." : "Continue"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-8">
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="underline hover:text-gray-700">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline hover:text-gray-700">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block flex-1 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')",
          }}
        >
          {/* Gradient overlay matching TrueVoice brand (teal/green/blue tones) */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/50 via-emerald-800/40 to-cyan-900/50" />
        </div>
      </div>
    </div>
  );
};

export default Signup;
