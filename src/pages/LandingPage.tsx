import {
  ArrowRight,
  Brain,
  Briefcase,
  GraduationCap,
  LineChart,
  Users,
  CheckCircle,
  Star,
  Zap,
  Target,
  MessageSquare,
  FileText,
  Award,
  TrendingUp,
  Shield,
  Clock,
  Globe,
  Sparkles,
  Download,
  Bot,
  Video,
  Search,
  BarChart3,
  Rocket,
  Check,
  X,
} from "lucide-react";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { useState } from "react";

const features = [
  {
    icon: Brain,
    title: "AI Career Agent",
    description:
      "Your personal AI agent that analyzes your profile and provides intelligent career guidance 24/7.",
    color: "blue",
  },
  {
    icon: Briefcase,
    title: "Smart Job Matching",
    description:
      "AI-powered job discovery with real-time matching to opportunities that fit your skills and goals.",
    color: "green",
  },
  {
    icon: GraduationCap,
    title: "Personalized Learning Paths",
    description:
      "Custom learning roadmaps with verified courses and resources tailored to your career objectives.",
    color: "purple",
  },
  {
    icon: MessageSquare,
    title: "AI Mentorship",
    description:
      "Get instant guidance from our AI mentor trained on industry best practices and career strategies.",
    color: "indigo",
  },
  {
    icon: Video,
    title: "Mock Interviews",
    description:
      "Practice with AI-powered mock interviews and receive detailed feedback to improve your performance.",
    color: "red",
  },
  {
    icon: FileText,
    title: "CV Optimization",
    description:
      "AI-enhanced CV suggestions with instant PDF generation for optimized professional documents.",
    color: "orange",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description:
      "Track your career development with detailed analytics and achievement milestones.",
    color: "teal",
  },
  {
    icon: Search,
    title: "Career Explorer",
    description:
      "Discover new career paths with AI-generated opportunities based on your unique profile.",
    color: "pink",
  },
];

const testimonials = [
  {
    name: "Mahesh Kumar",
    role: "Software Engineer",
    company: "Infosys",
    quote:
      "Skillsurger's AI agent helped me transition from junior to senior engineer in just 6 months. The personalized guidance was incredible!",
    rating: 5,
  },
  {
    name: "Ruchi Sharma",
    role: "Data Scientist",
    company: "Tredence",
    quote:
      "The AI-powered learning paths were exactly what I needed. I landed my dream job at Tredence thanks to the structured guidance.",
    rating: 5,
  },
  {
    name: "Rohan Patel",
    role: "Product Manager",
    company: "GE",
    quote:
      "The mock interviews and CV optimization features gave me the confidence to apply for senior roles. Now I'm at GE!",
    rating: 5,
  },
];

const stats = [
  { number: "50,000+", label: "Careers Transformed" },
  { number: "98%", label: "Success Rate" },
  { number: "24/7", label: "AI Agent Support" },
  { number: "500+", label: "Companies Hiring" },
];

const pricingPlans = [
  {
    name: "Free Trial",
    price: "0",
    period: "7 days",
    description: "Experience the full power of our AI career agent",
    features: [
      "Complete AI career analysis",
      "Personalized learning paths",
      "Mock interview sessions",
      "CV optimization",
      "Job matching",
      "AI mentorship chat",
      "Progress tracking",
      "All premium features",
    ],
    cta: "Start Free Trial",
    popular: false,
    color: "gray",
    url: "/dashboard", // Redirect to dashboard after trial
  },
  {
    name: "Monthly Pro",
    price: "10",
    period: "month",
    description: "Full access to your AI career agent",
    features: [
      "Unlimited AI career guidance",
      "Advanced job matching",
      "Premium learning resources",
      "Unlimited mock interviews",
      "CV optimization & download",
      "Priority AI mentorship",
      "Detailed analytics",
      "Career roadmap planning",
      "Industry insights",
      "Email support",
    ],
    cta: "Get Started",
    popular: true,
    color: "blue",
    url: "https://test.checkout.dodopayments.com/buy/pdt_JLSo4zewc0ftJnmIgXPGh?quantity=1",
  },
  {
    name: "Yearly Pro",
    price: "100",
    period: "year",
    description: "Best value for serious career growth",
    features: [
      "Everything in Monthly Pro",
      "2 months free (save $20)",
      "Priority feature access",
      "Advanced analytics",
      "Career strategy sessions",
      "Industry expert insights",
      "Custom learning paths",
      "Premium support",
      "Early access to new features",
    ],
    cta: "Save 17%",
    popular: false,
    color: "green",
    url: "https://test.checkout.dodopayments.com/buy/pdt_yOoATGzjBE3S6dR5c45PY?quantity=1",
  },
];

export default function LandingPage() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitSuccess(true);
    setContactForm({ name: "", email: "", company: "", message: "" });
    setIsSubmitting(false);

    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen">
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
                style={{ maxHeight: "70vh" }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-5"></div>

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
              Your Personal
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                AI Career Agent
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your career with our intelligent AI agent that provides
              personalized guidance, job matching, skill development, and
              interview preparation - all powered by cutting-edge artificial
              intelligence.
            </p>

            <div className="flex items-center justify-center space-x-4 mb-12">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
                >
                  Start Free 7-Day Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg border-2"
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

      {/* Stats Section */}
      <section className="py-16 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <p className="text-4xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </p>
                <p className="text-gray-600 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete AI-Powered Career Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI agent provides comprehensive career support with advanced
              features designed to accelerate your professional growth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`inline-flex p-3 rounded-lg bg-${feature.color}-100 text-${feature.color}-600 mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Your AI Career Agent Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our intelligent system analyzes your profile and provides
              personalized career guidance in four simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Profile Analysis",
                description:
                  "Upload your CV and complete your profile. Our AI analyzes your skills, experience, and career goals.",
                icon: FileText,
              },
              {
                step: "02",
                title: "AI Recommendations",
                description:
                  "Receive personalized career paths, job matches, and skill development recommendations.",
                icon: Brain,
              },
              {
                step: "03",
                title: "Skill Development",
                description:
                  "Follow AI-curated learning paths and practice with mock interviews to enhance your abilities.",
                icon: TrendingUp,
              },
              {
                step: "04",
                title: "Career Success",
                description:
                  "Apply to matched opportunities with optimized CVs and confidence from AI-powered preparation.",
                icon: Rocket,
              },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Success Stories from Our Community
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of professionals who have transformed their careers
              with our AI career agent.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Career Growth Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with our free trial and experience the full power of
              AI-driven career development.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl border-2 p-8 ${
                  plan.popular
                    ? "border-blue-500 bg-blue-50 scale-105 shadow-xl"
                    : "border-gray-200 bg-white hover:border-gray-300"
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to={plan.url} className="block">
                  <Button
                    className={`w-full py-3 ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">All plans include:</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <span className="flex items-center">
                <Shield className="w-4 h-4 mr-1" /> Enterprise Security
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" /> 24/7 Support
              </span>
              <span className="flex items-center">
                <Download className="w-4 h-4 mr-1" /> CV Downloads
              </span>
              <span className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-1" /> Analytics
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Ready to Transform Your Career?
              </h2>
              <p className="text-xl text-gray-600">
                Get in touch with our team to learn how our AI career agent can
                accelerate your professional growth.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                    Get Started Today
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          AI-Powered Support
                        </h4>
                        <p className="text-gray-600">
                          Get instant answers from our AI agent or connect with
                          our human experts.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          24/7 Availability
                        </h4>
                        <p className="text-gray-600">
                          Your AI career agent is always available to provide
                          guidance and support.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Rocket className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Fast Results
                        </h4>
                        <p className="text-gray-600">
                          Most users see career improvements within the first 30
                          days of using our platform.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                  <h4 className="font-semibold mb-2">Enterprise Solutions</h4>
                  <p className="text-blue-100 mb-4">
                    Looking to transform your entire organization's career
                    development?
                  </p>
                  <Button
                    variant="outline"
                    className="bg-white text-blue-600 border-white hover:bg-blue-50"
                  >
                    Contact Sales
                  </Button>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                  Send us a Message
                </h3>

                {submitSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Message Sent!
                    </h4>
                    <p className="text-gray-600">
                      We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={contactForm.name}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company (Optional)
                      </label>
                      <input
                        type="text"
                        value={contactForm.company}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            company: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            message: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tell us about your career goals and how we can help..."
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Your AI Career Agent is Waiting
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of professionals who have already discovered their
            true potential with our AI-powered career platform.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              >
                Start Free 7-Day Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
            >
              Schedule Demo
            </Button>
          </div>

          <div className="mt-8 text-blue-100 text-sm">
            No credit card required • Full access during trial • Cancel anytime
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
