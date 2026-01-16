import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowLeft, Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const SchoolLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [schoolId, setSchoolId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitWait, setRateLimitWait] = useState<number | null>(null);
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionToken, setSessionToken] = useState("");

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: t('msg.passwordsMismatch'),
        description: t('msg.passwordsMismatch'),
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: t('msg.passwordTooShort'),
        description: t('msg.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("secure-auth", {
        body: {
          action: "reset_password",
          sessionToken,
          newPassword,
        },
      });

      if (error || data.error) {
        throw new Error(data?.error || "Password reset failed");
      }

      localStorage.setItem("schoolSessionToken", data.sessionToken);

      toast({
        title: t('msg.success'),
        description: "Password updated successfully!",
      });
      navigate("/school-dashboard");
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: t('msg.error'),
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("secure-auth", {
        body: {
          action: "login",
          userType: "school",
          identifier: schoolId.trim(),
          password: password,
        },
      });

      if (error) {
        throw error;
      }

      if (data.rateLimited) {
        setRateLimitWait(data.waitSeconds);
        toast({
          title: "Too Many Attempts",
          description: `Please wait ${Math.ceil(data.waitSeconds / 60)} minutes before trying again.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data.error) {
        toast({
          title: t('msg.error'),
          description: data.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data.success) {
        localStorage.setItem("userType", "school");
        localStorage.setItem("schoolId", data.user.schoolId);
        localStorage.setItem("schoolUUID", data.user.id);
        localStorage.setItem("schoolName", data.user.name);
        localStorage.setItem("schoolSessionToken", data.sessionToken);

        if (data.requiresPasswordReset) {
          setSessionToken(data.sessionToken);
          setRequiresPasswordReset(true);
          toast({
            title: t('auth.passwordResetRequired'),
            description: t('auth.mustResetPassword'),
          });
          setIsLoading(false);
          return;
        }
        
        toast({
          title: t('dashboard.welcome') + "!",
          description: "School dashboard access granted.",
        });
        navigate("/school-dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: t('msg.error'),
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      <header className="container mx-auto py-6 px-4 flex justify-between items-center">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t('nav.home')}
        </Link>
        <LanguageToggle />
      </header>

      <main className="flex-1 container mx-auto px-4 flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className="edu-card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-accent-foreground" />
              </div>
              <h1 className="text-2xl font-bold">{t('auth.schoolLogin')}</h1>
              <p className="text-muted-foreground mt-2">Access your school dashboard</p>
            </div>

            <div className="bg-secondary/50 border border-secondary rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-foreground">Admin Access Only</p>
                  <p className="text-muted-foreground">This login is for registered schools only.</p>
                </div>
              </div>
            </div>

            {rateLimitWait && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Too many login attempts. Please wait before trying again.
                </p>
              </div>
            )}

            {requiresPasswordReset ? (
              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    {t('auth.mustResetPassword')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password (min 8 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" disabled={isLoading}>
                  {isLoading ? t('auth.updating') : t('auth.updatePassword')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Label htmlFor="schoolId">{t('auth.schoolId')}</Label>
                  <Input
                    id="schoolId"
                    placeholder="Enter your School ID"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" disabled={isLoading}>
                  {isLoading ? t('auth.loggingIn') : t('nav.dashboard')}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-border text-center space-y-3">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary block">
                {t('auth.loginAsStudent')} →
              </Link>
              <Link to="/admin-login" className="text-sm text-muted-foreground hover:text-destructive block">
                {t('auth.loginAsAdmin')} →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SchoolLogin;
