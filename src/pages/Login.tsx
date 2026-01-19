import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import AuthRepairButton from "@/components/AuthRepairButton";
import { useLanguage } from "@/contexts/LanguageContext";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthRepair, setShowAuthRepair] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: language === 'en' ? "Login Failed" : "लॉगिन फेल",
            description: language === 'en' ? "Invalid email or password. Please try again." : "गलत ईमेल या पासवर्ड।",
            variant: "destructive",
          });
        } else {
          setShowAuthRepair(true);
          throw error;
        }
        setIsLoading(false);
        return;
      }

      toast({
        title: language === 'en' ? "Welcome back!" : "वापस स्वागत है!",
        description: language === 'en' ? "Let's start studying together." : "चलो साथ में पढ़ाई करते हैं।",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setShowAuthRepair(true);
      toast({
        title: language === 'en' ? "Login Failed" : "लॉगिन फेल",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      {/* Header */}
      <header className="container mx-auto py-4 px-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {language === 'en' ? 'Back to Home' : 'वापस होम'}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 container mx-auto px-4 flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className="edu-card p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">
                {language === 'en' ? 'Welcome Back!' : 'वापस स्वागत है!'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {language === 'en' ? 'Login to continue studying' : 'पढ़ाई जारी रखने के लिए लॉगिन करें'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label htmlFor="email">{language === 'en' ? 'Email' : 'ईमेल'}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="password">{language === 'en' ? 'Password' : 'पासवर्ड'}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={language === 'en' ? "Enter your password" : "अपना पासवर्ड डालें"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    {language === 'en' ? 'Forgot password?' : 'पासवर्ड भूल गए?'}
                  </Link>
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (language === 'en' ? "Logging in..." : "लॉगिन हो रहा है...") : (language === 'en' ? "Login" : "लॉगिन")}
              </Button>
            </form>

            {/* Auth Repair Button */}
            {showAuthRepair && (
              <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-muted-foreground mb-2">
                  {language === 'en' ? 'Having trouble logging in?' : 'लॉगिन में परेशानी?'}
                </p>
                <AuthRepairButton 
                  onRepaired={() => setShowAuthRepair(false)} 
                  className="w-full"
                />
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {language === 'en' ? "Don't have an account?" : "अकाउंट नहीं है?"}{" "}
                <Link to="/signup" className="text-primary font-semibold hover:underline">
                  {language === 'en' ? 'Sign Up' : 'साइन अप'}
                </Link>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-border text-center">
              <Link to="/school-login" className="text-sm text-muted-foreground hover:text-primary">
                {language === 'en' ? 'School Admin? Login here →' : 'स्कूल एडमिन? यहां लॉगिन करें →'}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
