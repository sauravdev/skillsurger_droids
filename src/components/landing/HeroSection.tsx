import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Clock, Globe, Sparkles, Star, Upload } from 'lucide-react';
import Button from '../Button';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <>
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80&fm=webp"
          alt="Career growth background"
          className="absolute inset-0 w-full h-full object-cover opacity-5"
          fetchPriority="high"
          loading="eager"
        />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        </div>

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by Advanced AI Technology
            </div>

            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Get job-ready with AI in 4 simple steps
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your career with our intelligent AI agent that provides
              personalized guidance, job matching, skill development, and
              interview preparation - all powered by cutting-edge artificial
              intelligence.
            </p>

            <div className="flex flex-col sm:flex-row items-center sm:items-baseline justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <div className="flex flex-col items-center w-full sm:w-auto">
                <Link to="/signup" className="w-full">
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg w-full sm:w-auto"
                  >
                    Start Free 7-Day Trial
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <div className="flex items-center text-sm text-gray-600 mt-2 font-medium">
                  <Shield className="w-4 h-4 mr-1.5 text-green-500" />
                  No credit card required
                </div>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg border-2 w-full sm:w-auto"
                onClick={() => setShowDemoModal(true)}
              >
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Enterprise Security
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                24/7 AI Support
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-1" />
                Global Job Market
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CV Scoring CTA - Above the Fold */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50 border-y-2 border-green-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold mb-4">
              <Star className="w-4 h-4 mr-2" />
              Most Popular Feature
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Get Your FREE CV Score in 30 Seconds
            </h2>
            <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
              Upload your resume and get instant ATS compatibility score, keyword analysis, and expert suggestions to beat applicant tracking systems.
            </p>
            <Link to="/signup" className="inline-block">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-5 text-lg shadow-lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                Score My CV Now - It's Free
              </Button>
            </Link>
            <p className="text-sm text-gray-600 mt-4">
              ✓ No credit card required  ✓ Instant results  ✓ Used by 5,000+ job seekers
            </p>
          </div>
        </div>
      </section>

      {/* Demo Video Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <button
              className="absolute top-2 right-2 text-gray-700 hover:text-red-500 text-2xl font-bold focus:outline-none"
              onClick={() => setShowDemoModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="p-4">
              <video
                src="https://firebasestorage.googleapis.com/v0/b/wisedroids-c9988.appspot.com/o/videos%2Fskillsurger%20demo.mov?alt=media&token=08472c85-7e45-4ec4-a813-902458105df2"
                controls
                autoPlay
                muted
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: "70svh" }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
