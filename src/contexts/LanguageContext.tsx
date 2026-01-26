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
  'app.name': { en: 'Study Buddy AI', hi: 'Study Buddy AI' },
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

  // School Dashboard
  'school.dashboardTitle': { en: 'School Dashboard', hi: 'स्कूल डैशबोर्ड' },
  'school.dashboardLoading': { en: 'Loading dashboard...', hi: 'डैशबोर्ड लोड हो रहा है...' },
  'school.accessSuspendedTitle': { en: 'Access Suspended', hi: 'एक्सेस बंद है' },
  'school.accessSuspendedDesc': { en: "Your school's dashboard access has been suspended due to unpaid fees. Please contact the admin to resolve this issue.", hi: 'फीस बाकी होने की वजह से आपका डैशबोर्ड एक्सेस बंद है। कृपया समाधान के लिए एडमिन से संपर्क करें।' },
  'school.bannedDesc': { en: 'Your school has been banned. Please contact admin.', hi: 'आपका स्कूल बैन है। कृपया एडमिन से संपर्क करें।' },
  'school.removeStudentFailed': { en: 'Failed to remove student. Please try again.', hi: 'स्टूडेंट हट नहीं पाया। फिर से कोशिश करो।' },
  'school.today': { en: 'Today', hi: 'आज' },
  'school.improving': { en: 'Improving', hi: 'इम्प्रूव हो रहा' },
  'school.pendingApprovalsTitle': { en: 'Pending Student Approvals', hi: 'पेंडिंग अप्रूवल' },
  'school.pendingApprovalsDesc': { en: 'Review and approve students to allow them access.', hi: 'स्टूडेंट्स को रिव्यू करके अप्रूव करो ताकि उन्हें एक्सेस मिल सके।' },
  'school.selectedCount': { en: 'selected', hi: 'सेलेक्टेड' },
  'school.selectAll': { en: 'Select All', hi: 'सब सेलेक्ट' },
  'school.deselect': { en: 'Deselect', hi: 'अनसेलेक्ट' },
  'school.approveAll': { en: 'Approve All', hi: 'सब अप्रूव' },
  'school.rejectAll': { en: 'Reject All', hi: 'सब रिजेक्ट' },
  'school.noPendingTitle': { en: 'No pending approvals!', hi: 'कोई पेंडिंग अप्रूवल नहीं!' },
  'school.noPendingDesc': { en: 'All students have been reviewed.', hi: 'सब स्टूडेंट्स रिव्यू हो चुके हैं।' },
  'school.searchStudents': { en: 'Search students...', hi: 'स्टूडेंट खोजो...' },
  'school.allClasses': { en: 'All Classes', hi: 'सभी क्लास' },
  'school.studentActivity': { en: 'Student Activity', hi: 'स्टूडेंट एक्टिविटी' },
  'school.noApprovedTitle': { en: 'No approved students yet.', hi: 'अभी कोई अप्रूव्ड स्टूडेंट नहीं।' },
  'school.noApprovedDesc': { en: 'Approve pending students to see them here.', hi: 'पेंडिंग स्टूडेंट्स को अप्रूव करो, फिर यहाँ दिखेंगे।' },
  'school.table.student': { en: 'Student', hi: 'स्टूडेंट' },
  'school.table.today': { en: 'Today', hi: 'आज' },
  'school.table.topicStudied': { en: 'Topic Studied', hi: 'टॉपिक' },
  'school.table.trend': { en: 'Trend', hi: 'ट्रेंड' },
  'school.table.sessions': { en: 'Sessions', hi: 'सेशन्स' },
  'school.table.actions': { en: 'Actions', hi: 'एक्शन' },
  'school.yes': { en: 'Yes', hi: 'हाँ' },
  'school.no': { en: 'No', hi: 'नहीं' },
  'school.studied': { en: 'Studied', hi: 'पढ़ा' },
  'school.notYet': { en: 'Not Yet', hi: 'अभी नहीं' },
  'school.topicLabel': { en: 'Topic', hi: 'टॉपिक' },
  'school.trendLabel': { en: 'Trend', hi: 'ट्रेंड' },
  'school.viewReport': { en: 'View Report', hi: 'रिपोर्ट देखो' },
  'school.rejectStudentTitle': { en: 'Reject Student Registration', hi: 'स्टूडेंट रजिस्ट्रेशन रिजेक्ट' },
  'school.rejectStudentDesc': { en: "You are about to reject {name}'s registration. Please provide a reason (optional):", hi: '{name} का रजिस्ट्रेशन रिजेक्ट होने वाला है। कारण (ऑप्शनल) लिखो:' },
  'school.rejectReasonPlaceholder': { en: 'Enter reason for rejection (e.g., Invalid details, Not a student of this school, etc.)', hi: 'रिजेक्शन का कारण लिखो (जैसे: गलत डिटेल्स, इस स्कूल का स्टूडेंट नहीं, आदि)' },
  'school.rejectStudentsTitle': { en: 'Reject {count} Students', hi: '{count} स्टूडेंट्स रिजेक्ट' },
  'school.rejectStudentsDesc': { en: 'You are about to reject {count} students. Please provide a reason (optional):', hi: 'आप {count} स्टूडेंट्स को रिजेक्ट करने वाले हो। कारण (ऑप्शनल) लिखो:' },
  'school.removeStudentTitle': { en: 'Remove Student', hi: 'स्टूडेंट हटाओ' },
  'school.removeStudentDesc': { en: 'Are you sure you want to remove {name} from your school? This will permanently delete their account and all study data.', hi: 'क्या आप {name} को स्कूल से हटाना चाहते हो? इससे अकाउंट और पूरा स्टडी डेटा हमेशा के लिए डिलीट हो जाएगा।' },

  // Trends
  'trend.improving': { en: 'Improving', hi: 'इम्प्रूव' },
  'trend.declining': { en: 'Declining', hi: 'डाउन' },
  'trend.stable': { en: 'Stable', hi: 'स्टेबल' },

  // Student Progress
  'progress.title': { en: 'Progress Report', hi: 'प्रोग्रेस रिपोर्ट' },
  'progress.overallGrade': { en: 'Overall Grade', hi: 'ओवरऑल ग्रेड' },
  'progress.downloadPdf': { en: 'Download PDF', hi: 'PDF डाउनलोड' },
  'progress.totalSessions': { en: 'Total Sessions', hi: 'कुल सेशन्स' },
  'progress.studyTime': { en: 'Study Time', hi: 'स्टडी टाइम' },
  'progress.avgScore': { en: 'Avg Score', hi: 'औसत स्कोर' },
  'progress.consistency': { en: 'Consistency', hi: 'कंसिस्टेंसी' },
  'progress.streak': { en: 'Streak', hi: 'स्ट्रीक' },
  'progress.quizzes': { en: 'Quizzes', hi: 'क्विज़' },
  'progress.quizAccuracy': { en: 'Quiz Accuracy', hi: 'क्विज़ एक्यूरेसी' },
  'progress.improvementOverTime': { en: 'Improvement Over Time (Last 30 Days)', hi: 'पिछले 30 दिन का इम्प्रूवमेंट' },
  'progress.startStudyingEmpty': { en: 'Start studying to see your progress!', hi: 'प्रोग्रेस देखने के लिए पढ़ाई शुरू करो!' },
  'progress.skillAssessment': { en: 'Skill Assessment', hi: 'स्किल असेसमेंट' },
  'progress.subjectPerformance': { en: 'Subject Performance', hi: 'सब्जेक्ट परफॉर्मेंस' },
  'progress.noDataYet': { en: 'No data available yet', hi: 'अभी डाटा नहीं है' },
  'progress.weeklyComparison': { en: 'Weekly Comparison', hi: 'हफ्ते की तुलना' },
  'progress.weeklyStudyPattern': { en: 'Weekly Study Pattern', hi: 'हफ्ते का स्टडी पैटर्न' },
  'progress.understandingLevels': { en: 'Understanding Levels', hi: 'समझ का लेवल' },
  'progress.recentQuizPerformance': { en: 'Recent Quiz Performance', hi: 'हाल की क्विज़ परफॉर्मेंस' },
  'progress.correctLabel': { en: 'correct', hi: 'सही' },
  'progress.strongAreas': { en: 'Strong Areas', hi: 'स्ट्रॉन्ग एरियाज़' },
  'progress.keepStudyingStrengths': { en: 'Keep studying to identify your strengths!', hi: 'अपनी स्ट्रेंथ जानने के लिए पढ़ते रहो!' },
  'progress.areasToImprove': { en: 'Areas to Improve', hi: 'इम्प्रूव वाले एरियाज़' },
  'progress.noWeakAreasYet': { en: 'Great job! No weak areas identified yet.', hi: 'शाबाश! अभी कोई वीक एरिया नहीं मिला।' },
  'progress.downloadFailedTitle': { en: 'Download Failed', hi: 'डाउनलोड फेल' },
  'progress.downloadFailedDesc': { en: 'Could not generate PDF. Please try again.', hi: 'PDF नहीं बन पाया। फिर से कोशिश करो।' },

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
