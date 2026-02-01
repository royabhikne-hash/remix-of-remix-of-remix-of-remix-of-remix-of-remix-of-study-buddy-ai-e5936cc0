import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * WebView-compatible navigation hook
 * Provides reliable navigation that works in:
 * - Desktop browsers
 * - Mobile browsers
 * - PWA/Standalone mode
 * - WebView (Android APK converters)
 * - Capacitor/Cordova apps
 */
export const useWebViewNavigation = () => {
  const navigate = useNavigate();

  /**
   * Navigate to a route with WebView fallback
   * Uses router navigation first, falls back to location.href if needed
   */
  const navigateTo = useCallback((path: string, options?: { replace?: boolean }) => {
    try {
      // Primary: Use React Router navigation (SPA-friendly)
      if (options?.replace) {
        navigate(path, { replace: true });
      } else {
        navigate(path);
      }
    } catch (err) {
      console.error("Router navigation failed, using fallback:", err);
      // Fallback: Direct location change (works in all WebViews)
      if (options?.replace) {
        window.location.replace(path);
      } else {
        window.location.href = path;
      }
    }
  }, [navigate]);

  /**
   * Navigate back with WebView fallback
   */
  const goBack = useCallback(() => {
    try {
      // Check if we can go back in history
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        // Fallback to dashboard if no history
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Back navigation failed:", err);
      window.location.href = "/dashboard";
    }
  }, [navigate]);

  /**
   * Check if running in WebView/PWA mode
   */
  const isWebView = useCallback(() => {
    // Check for standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check for iOS standalone
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    // Check for Android WebView
    const isAndroidWebView = /wv/.test(navigator.userAgent.toLowerCase());
    
    // Check for common WebView user agents
    const userAgent = navigator.userAgent.toLowerCase();
    const isWebViewUA = userAgent.includes('webview') || 
                        userAgent.includes('android') && userAgent.includes('version/');
    
    return isStandalone || isIOSStandalone || isAndroidWebView || isWebViewUA;
  }, []);

  /**
   * Check if DOM storage is available (required for auth)
   */
  const isStorageAvailable = useCallback(() => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  return {
    navigateTo,
    goBack,
    isWebView,
    isStorageAvailable,
  };
};

export default useWebViewNavigation;
