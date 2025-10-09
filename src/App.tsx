import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import JobSearchPage from './pages/JobSearchPage';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';
import Blog from './pages/Blog';
import ProtectedRoute from './components/ProtectedRoute';
import SubscriptionProtectedRoute from './components/SubscriptionProtectedRoute';
import { UserProvider } from './context/UserContext';
import Pricing from './pages/Pricing';
import Subscription from './pages/Subscription';
import AIResumeBuilder from "./pages/AIResumeBuilder";
import MockInterview from "./pages/MockInterview";
import BlogPost from "./pages/BlogPost";
import WhatsAppChat from './components/WhatsAppChat';
import Footer from './components/Footer';
import AnalyticsTracking from './components/AnalyticsTracking';
import UserTypeSelection from './components/UserTypeSelection';
import OnboardingForm from './components/OnboardingForm';

function App() {
  return (
    <Router>
      <UserProvider>
        {/* Analytics Tracking */}
        <AnalyticsTracking />
        
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/auth/callback" element={<GoogleAuthCallback />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/blog" element={<Blog />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <SubscriptionProtectedRoute>
                      <DashboardPage />
                    </SubscriptionProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/job-search"
                element={
                  <ProtectedRoute>
                    <SubscriptionProtectedRoute>
                      <JobSearchPage />
                    </SubscriptionProtectedRoute>
                  </ProtectedRoute>
                }
              />
              <Route path="/auth/callback/google" element={<GoogleAuthCallback />} />
              <Route 
                path="/ai-resume-builder" 
                element={
                  <ProtectedRoute>
                    <SubscriptionProtectedRoute>
                      <AIResumeBuilder />
                    </SubscriptionProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mock-interview" 
                element={
                  <ProtectedRoute>
                    <SubscriptionProtectedRoute>
                      <MockInterview />
                    </SubscriptionProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/user-type-selection" element={<UserTypeSelection />} />
              <Route path="/onboarding" element={<OnboardingForm />} />
            </Routes>
          </main>
          
          {/* WhatsApp Chat - Fixed position on all pages */}
          <WhatsAppChat 
            phoneNumber="+917310768702"
            message="Hi! I'm interested in Skillsurger's career services."
          />
          
          {/* Footer */}
          <Footer />
        </div>
      </UserProvider>
    </Router>
  );
}

export default App;