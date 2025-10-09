import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import OnboardingCheck from '../components/OnboardingCheck';
import {
  User,
  BarChart,
  Briefcase,
  Users,
  GraduationCap,
  Menu,
  X,
  LogOut,
  BookOpen
} from 'lucide-react';
import MentorshipHub from '../components/MentorshipHub';
import CareerExplorer from '../components/CareerExplorer';
import ProgressTracker from '../components/ProgressTracker';
import ProfileSection from '../components/ProfileSection';
import LearningPaths from '../components/LearningPaths';
import Subscription from './Subscription';
import TrialWarning from '../components/TrialWarning';
import { UserProvider, useUser } from '../context/UserContext';

type DashboardSection = 'overview' | 'profile' | 'career' | 'mentorship' | 'learning' | 'subscription';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [selectedJobForLearning, setSelectedJobForLearning] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

  // Persist job suggestions and selected career for CareerExplorer
  const [careerExplorerJobs, setCareerExplorerJobs] = useState<any[]>([]);
  const [careerExplorerSelectedCareer, setCareerExplorerSelectedCareer] = useState<string>('');

  const { user, subscription, loading: contextLoading } = useUser();

  useEffect(() => {
    // Read section from URL query params
    const sectionFromQuery = searchParams.get('section');
    if (sectionFromQuery && ['overview', 'profile', 'career', 'mentorship', 'learning', 'subscription'].includes(sectionFromQuery)) {
      setActiveSection(sectionFromQuery as DashboardSection);
    }
    
    checkUser();

    // Listen for section change events from achievements
    const handleSectionChange = (event: CustomEvent) => {
      const section = event.detail;
      switch (section) {
        case 'profile':
          setActiveSection('profile');
          break;
        case 'mock-interviews':
        case 'mentorship':
          setActiveSection('mentorship');
          break;
        case 'skills':
        case 'learning':
          setActiveSection('learning');
          break;
        case 'subscription':
          setActiveSection('subscription');
          break;
      }
      setIsMobileMenuOpen(false);
    };

    window.addEventListener('changeSection', handleSectionChange as EventListener);

    return () => {
      window.removeEventListener('changeSection', handleSectionChange as EventListener);
    };
  }, [searchParams]);

  async function checkUser() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        navigate('/login');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking user session:', error);
      navigate('/login');
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
    {
      id: 'career',
      label: 'Career Explorer',
      icon: Briefcase,
    },
    {
      id: 'mentorship',
      label: 'Mentorship Hub',
      icon: Users,
    },
    {
      id: 'learning',
      label: 'Learning Paths',
      icon: BookOpen,
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: BarChart, // You can use a more appropriate icon if desired
    },
  ];

  if (loading || contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingCheck>
      <UserProvider>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>

          {/* Sidebar - Always visible on desktop, toggleable on mobile */}
          <div
            className={`fixed lg:static inset-y-0 left-0 transform ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 transition-transform duration-200 ease-in-out z-30 w-64 bg-white border-r shadow-lg lg:shadow-none pt-24 h-screen overflow-y-auto`}
          >
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id as DashboardSection);
                      // Don't close menu on desktop
                      if (window.innerWidth < 1024) {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </nav>
          </div>

          {/* Main Content - Adjusted padding for fixed sidebar */}
          <div className="flex-1 pt-24 pb-12 px-4 lg:px-8 lg:ml-64">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="max-w-6xl mx-auto space-y-8">
              {/* Trial Warning */}
              <TrialWarning />
              
              {activeSection === 'overview' && (
                <>
                  <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                  <ProgressTracker />
                </>
              )}

              {activeSection === 'profile' && (
                <>
                  <h1 className="text-2xl font-bold">Profile Management</h1>
                  <ProfileSection />
                </>
              )}

              {activeSection === 'career' && (
                <>
                  <h1 className="text-2xl font-bold">Career Explorer</h1>
                  <CareerExplorer
                    onGenerateLearningPath={(job) => {
                      setSelectedJobForLearning(job);
                      setActiveSection('learning');
                    }}
                    jobs={careerExplorerJobs}
                    setJobs={setCareerExplorerJobs}
                    selectedCareer={careerExplorerSelectedCareer}
                    setSelectedCareer={setCareerExplorerSelectedCareer}
                  />
                </>
              )}

              {activeSection === 'mentorship' && (
                <>
                  <h1 className="text-2xl font-bold">Mentorship Hub</h1>
                  <MentorshipHub />
                </>
              )}

              {activeSection === 'learning' && (
                <>
                  <h1 className="text-2xl font-bold">Learning Paths</h1>
                  <LearningPaths job={selectedJobForLearning} />
                </>
              )}

              {activeSection === 'subscription' && (
                <>
                  <h1 className="text-2xl font-bold">Subscription</h1>
                  <Subscription />
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )}
        </div>
      </UserProvider>
    </OnboardingCheck>
  );
}