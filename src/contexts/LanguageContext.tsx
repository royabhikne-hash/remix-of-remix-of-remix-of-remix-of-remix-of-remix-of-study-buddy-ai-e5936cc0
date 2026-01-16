import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

// Common translations used across the app
export const translations: Translations = {
  // Navigation & Common
  'app.name': { en: 'EduImprovement AI', hi: 'EduImprovement AI' },
  'nav.home': { en: 'Home', hi: 'होम' },
  'nav.login': { en: 'Login', hi: 'लॉगिन' },
  'nav.signup': { en: 'Sign Up', hi: 'साइन अप करो' },
  'nav.logout': { en: 'Logout', hi: 'लॉगआउट' },
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.progress': { en: 'Progress', hi: 'प्रोग्रेस' },
  
  // Auth
  'auth.email': { en: 'Email', hi: 'ईमेल' },
  'auth.password': { en: 'Password', hi: 'पासवर्ड' },
  'auth.newPassword': { en: 'New Password', hi: 'नया पासवर्ड' },
  'auth.confirmPassword': { en: 'Confirm Password', hi: 'पासवर्ड कन्फर्म करो' },
  'auth.loginButton': { en: 'Login', hi: 'लॉगिन करो' },
  'auth.signupButton': { en: 'Sign Up', hi: 'साइन अप करो' },
  'auth.forgotPassword': { en: 'Forgot Password?', hi: 'पासवर्ड भूल गए?' },
  'auth.resetPassword': { en: 'Reset Password', hi: 'पासवर्ड रीसेट करो' },
  'auth.adminId': { en: 'Admin ID', hi: 'एडमिन ID' },
  'auth.schoolId': { en: 'School ID', hi: 'स्कूल ID' },
  'auth.loggingIn': { en: 'Logging in...', hi: 'लॉगिन हो रहा है...' },
  'auth.enterAdmin': { en: 'Enter Admin Panel', hi: 'एडमिन पैनल में जाओ' },
  'auth.adminLogin': { en: 'Admin Login', hi: 'एडमिन लॉगिन' },
  'auth.schoolLogin': { en: 'School Login', hi: 'स्कूल लॉगिन' },
  'auth.studentLogin': { en: 'Student Login', hi: 'स्टूडेंट लॉगिन' },
  'auth.loginAsStudent': { en: 'Login as Student', hi: 'स्टूडेंट के रूप में लॉगिन करो' },
  'auth.loginAsSchool': { en: 'Login as School', hi: 'स्कूल के रूप में लॉगिन करो' },
  'auth.loginAsAdmin': { en: 'Login as Admin', hi: 'एडमिन के रूप में लॉगिन करो' },
  'auth.passwordResetRequired': { en: 'Password Reset Required', hi: 'पासवर्ड रीसेट करना जरूरी है' },
  'auth.mustResetPassword': { en: 'You must reset your password before continuing.', hi: 'आगे बढ़ने से पहले आपको अपना पासवर्ड रीसेट करना होगा।' },
  'auth.updating': { en: 'Updating...', hi: 'अपडेट हो रहा है...' },
  'auth.updatePassword': { en: 'Update Password', hi: 'पासवर्ड अपडेट करो' },
  
  // Dashboard
  'dashboard.welcome': { en: 'Welcome', hi: 'स्वागत है' },
  'dashboard.totalStudents': { en: 'Total Students', hi: 'कुल स्टूडेंट्स' },
  'dashboard.totalSchools': { en: 'Total Schools', hi: 'कुल स्कूल' },
  'dashboard.activeSchools': { en: 'Active Schools', hi: 'एक्टिव स्कूल' },
  'dashboard.bannedSchools': { en: 'Banned Schools', hi: 'बैन स्कूल' },
  'dashboard.unpaidFees': { en: 'Unpaid Fees', hi: 'बाकी फीस' },
  'dashboard.loading': { en: 'Loading...', hi: 'लोड हो रहा है...' },
  'dashboard.search': { en: 'Search...', hi: 'खोजो...' },
  
  // Tabs
  'tab.schools': { en: 'Schools', hi: 'स्कूल' },
  'tab.students': { en: 'Students', hi: 'स्टूडेंट्स' },
  'tab.reports': { en: 'Send Reports', hi: 'रिपोर्ट भेजो' },
  'tab.studentReports': { en: 'Student Reports', hi: 'स्टूडेंट रिपोर्ट्स' },
  
  // Actions
  'action.add': { en: 'Add', hi: 'जोड़ो' },
  'action.edit': { en: 'Edit', hi: 'एडिट करो' },
  'action.delete': { en: 'Delete', hi: 'डिलीट करो' },
  'action.ban': { en: 'Ban', hi: 'बैन करो' },
  'action.unban': { en: 'Unban', hi: 'अनबैन करो' },
  'action.approve': { en: 'Approve', hi: 'अप्रूव करो' },
  'action.reject': { en: 'Reject', hi: 'रिजेक्ट करो' },
  'action.save': { en: 'Save', hi: 'सेव करो' },
  'action.cancel': { en: 'Cancel', hi: 'कैंसल' },
  'action.confirm': { en: 'Confirm', hi: 'कन्फर्म' },
  'action.send': { en: 'Send', hi: 'भेजो' },
  'action.view': { en: 'View', hi: 'देखो' },
  'action.addSchool': { en: 'Add School', hi: 'स्कूल जोड़ो' },
  'action.sendReport': { en: 'Send Report', hi: 'रिपोर्ट भेजो' },
  'action.viewReport': { en: 'View Report', hi: 'रिपोर्ट देखो' },
  'action.markPaid': { en: 'Mark Paid', hi: 'पेड मार्क करो' },
  'action.markUnpaid': { en: 'Mark Unpaid', hi: 'अनपेड मार्क करो' },
  
  // School
  'school.name': { en: 'School Name', hi: 'स्कूल का नाम' },
  'school.district': { en: 'District', hi: 'जिला' },
  'school.state': { en: 'State', hi: 'राज्य' },
  'school.email': { en: 'Email', hi: 'ईमेल' },
  'school.whatsapp': { en: 'WhatsApp', hi: 'व्हाट्सएप' },
  'school.students': { en: 'Students', hi: 'स्टूडेंट्स' },
  'school.feePaid': { en: 'Fee Paid', hi: 'फीस पेड' },
  'school.feeUnpaid': { en: 'Fee Unpaid', hi: 'फीस बाकी' },
  'school.banned': { en: 'Banned', hi: 'बैन' },
  'school.active': { en: 'Active', hi: 'एक्टिव' },
  'school.credentials': { en: 'School Credentials', hi: 'स्कूल क्रेडेंशियल्स' },
  'school.credentialsSave': { en: 'Save these credentials! They cannot be recovered.', hi: 'ये क्रेडेंशियल्स सेव करो! ये रिकवर नहीं होंगे।' },
  
  // Student
  'student.name': { en: 'Name', hi: 'नाम' },
  'student.class': { en: 'Class', hi: 'क्लास' },
  'student.parentWhatsapp': { en: 'Parent WhatsApp', hi: 'पेरेंट का व्हाट्सएप' },
  'student.approved': { en: 'Approved', hi: 'अप्रूव्ड' },
  'student.pending': { en: 'Pending', hi: 'पेंडिंग' },
  
  // Messages
  'msg.success': { en: 'Success', hi: 'सफल' },
  'msg.error': { en: 'Error', hi: 'एरर' },
  'msg.loading': { en: 'Loading...', hi: 'लोड हो रहा है...' },
  'msg.noData': { en: 'No data found', hi: 'कोई डाटा नहीं मिला' },
  'msg.confirmDelete': { en: 'Are you sure you want to delete?', hi: 'क्या आप डिलीट करना चाहते हो?' },
  'msg.confirmBan': { en: 'Are you sure you want to ban?', hi: 'क्या आप बैन करना चाहते हो?' },
  'msg.passwordsMismatch': { en: 'Passwords do not match', hi: 'पासवर्ड मैच नहीं हो रहे' },
  'msg.passwordTooShort': { en: 'Password must be at least 8 characters', hi: 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए' },
  'msg.reportSent': { en: 'Report sent successfully', hi: 'रिपोर्ट सफलतापूर्वक भेजी गई' },
  'msg.schoolAdded': { en: 'School added successfully', hi: 'स्कूल सफलतापूर्वक जोड़ा गया' },
  
  // Landing
  'landing.hero': { en: 'AI-Powered Education for Every Student', hi: 'हर स्टूडेंट के लिए AI पावर्ड एजुकेशन' },
  'landing.heroSub': { en: 'Personalized learning that adapts to you', hi: 'आपके हिसाब से पर्सनलाइज्ड लर्निंग' },
  'landing.getStarted': { en: 'Get Started', hi: 'शुरू करो' },
  'landing.learnMore': { en: 'Learn More', hi: 'और जानो' },
  
  // Language toggle
  'language.toggle': { en: 'हिंदी', hi: 'English' },
  'language.current': { en: 'English', hi: 'हिंदी' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('appLanguage');
    return (stored === 'en' || stored === 'hi') ? stored : 'en';
  });

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'en' ? 'hi' : 'en');
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
