import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthRepairButtonProps {
  onRepaired?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const AuthRepairButton = ({ 
  onRepaired, 
  variant = "outline", 
  size = "sm",
  className = ""
}: AuthRepairButtonProps) => {
  const [repairing, setRepairing] = useState(false);
  const [repaired, setRepaired] = useState(false);
  const { toast } = useToast();

  const handleRepair = async () => {
    setRepairing(true);
    try {
      // Clear all local storage auth tokens
      const keysToRemove = [
        'adminSessionToken',
        'schoolSessionToken',
        'adminId',
        'adminName',
        'schoolId',
        'schoolName',
        'schoolUUID',
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage
      sessionStorage.clear();
      
      // Sign out from Supabase auth
      await supabase.auth.signOut();
      
      // Clear any cached data
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.warn("Session already cleared");
      }

      setRepaired(true);
      toast({
        title: "Auth Repaired ✓",
        description: "Session tokens cleared. Please login again.",
      });
      
      onRepaired?.();
      
      // Reset state after 3 seconds
      setTimeout(() => setRepaired(false), 3000);
    } catch (error) {
      console.error("Auth repair error:", error);
      toast({
        title: "Repair Failed",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setRepairing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRepair}
      disabled={repairing}
      className={className}
    >
      {repairing ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Repairing...
        </>
      ) : repaired ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2 text-accent" />
          Repaired!
        </>
      ) : (
        <>
          <AlertTriangle className="w-4 h-4 mr-2" />
          Fix Login
        </>
      )}
    </Button>
  );
};

export default AuthRepairButton;
