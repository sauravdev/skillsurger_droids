import { Shield, Clock, Download, BarChart3, Check } from "lucide-react";
import Button from "../components/Button";
import { Link } from "react-router-dom";

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

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Career Growth Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start with our free trial and experience the full power of AI-driven
            career development.
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
  );
};

export default Pricing;
