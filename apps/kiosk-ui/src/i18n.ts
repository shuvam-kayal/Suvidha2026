import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
    en: {
        translation: {
            // Header
            'app.title': 'SUVIDHA',
            'app.subtitle': 'Civic Utility Kiosk',

            // Welcome Screen
            'welcome.title': 'Welcome to SUVIDHA',
            'welcome.subtitle': 'Your one-stop solution for all utility services',
            'welcome.touchToStart': 'Touch anywhere to begin',

            // Services
            'services.title': 'Select a Service',
            'services.electricity': 'Electricity',
            'services.gas': 'Gas',
            'services.water': 'Water',
            'services.municipal': 'Municipal',
            'services.payBill': 'Pay Bill',
            'services.viewHistory': 'View History',
            'services.fileGrievance': 'File Grievance',
            'services.trackGrievance': 'Track Complaint',

            // Authentication
            'auth.login': 'Login',
            'auth.logout': 'Logout',
            'auth.phoneNumber': 'Phone Number',
            'auth.enterOtp': 'Enter OTP',
            'auth.sendOtp': 'Send OTP',
            'auth.verifyOtp': 'Verify OTP',
            'auth.resendOtp': 'Resend OTP',

            // Common
            'common.back': 'Back',
            'common.next': 'Next',
            'common.cancel': 'Cancel',
            'common.confirm': 'Confirm',
            'common.submit': 'Submit',
            'common.home': 'Home',
            'common.loading': 'Loading...',
            'common.error': 'Error',
            'common.success': 'Success',

            // Billing
            'billing.billDetails': 'Bill Details',
            'billing.amountDue': 'Amount Due',
            'billing.dueDate': 'Due Date',
            'billing.payNow': 'Pay Now',
            'billing.paymentSuccess': 'Payment Successful',
            'billing.printReceipt': 'Print Receipt',

            // Grievance
            'grievance.title': 'File a Complaint',
            'grievance.category': 'Category',
            'grievance.description': 'Description',
            'grievance.ticketNumber': 'Ticket Number',
            'grievance.status': 'Status',

            // Language
            'language.select': 'Select Language',
            'language.en': 'English',
            'language.hi': 'हिंदी',
        },
    },
    hi: {
        translation: {
            // Header
            'app.title': 'सुविधा',
            'app.subtitle': 'नागरिक उपयोगिता कियोस्क',

            // Welcome Screen
            'welcome.title': 'सुविधा में आपका स्वागत है',
            'welcome.subtitle': 'सभी उपयोगिता सेवाओं के लिए आपका एक-स्टॉप समाधान',
            'welcome.touchToStart': 'शुरू करने के लिए कहीं भी स्पर्श करें',

            // Services
            'services.title': 'एक सेवा चुनें',
            'services.electricity': 'बिजली',
            'services.gas': 'गैस',
            'services.water': 'पानी',
            'services.municipal': 'नगर निगम',
            'services.payBill': 'बिल भरें',
            'services.viewHistory': 'इतिहास देखें',
            'services.fileGrievance': 'शिकायत दर्ज करें',
            'services.trackGrievance': 'शिकायत ट्रैक करें',

            // Authentication
            'auth.login': 'लॉगिन',
            'auth.logout': 'लॉगआउट',
            'auth.phoneNumber': 'फोन नंबर',
            'auth.enterOtp': 'OTP दर्ज करें',
            'auth.sendOtp': 'OTP भेजें',
            'auth.verifyOtp': 'OTP सत्यापित करें',
            'auth.resendOtp': 'OTP पुनः भेजें',

            // Common
            'common.back': 'वापस',
            'common.next': 'आगे',
            'common.cancel': 'रद्द करें',
            'common.confirm': 'पुष्टि करें',
            'common.submit': 'जमा करें',
            'common.home': 'होम',
            'common.loading': 'लोड हो रहा है...',
            'common.error': 'त्रुटि',
            'common.success': 'सफलता',

            // Billing
            'billing.billDetails': 'बिल विवरण',
            'billing.amountDue': 'देय राशि',
            'billing.dueDate': 'देय तिथि',
            'billing.payNow': 'अभी भुगतान करें',
            'billing.paymentSuccess': 'भुगतान सफल',
            'billing.printReceipt': 'रसीद प्रिंट करें',

            // Grievance
            'grievance.title': 'शिकायत दर्ज करें',
            'grievance.category': 'श्रेणी',
            'grievance.description': 'विवरण',
            'grievance.ticketNumber': 'टिकट नंबर',
            'grievance.status': 'स्थिति',

            // Language
            'language.select': 'भाषा चुनें',
            'language.en': 'English',
            'language.hi': 'हिंदी',
        },
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // Default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already escapes
        },
        react: {
            useSuspense: false, // Better for SSR compatibility
        },
    });

export default i18n;
