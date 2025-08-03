import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, User, Share2, BookOpen } from 'lucide-react';
import Button from '../components/Button';

const BlogPost = () => {
  const { slug } = useParams();

  const blogPosts = {
    "ai-resume-builder-tools": {
      title: "Best AI Resume Builder Tools to Beat ATS Filters in Minutes",
      excerpt: "Getting past Applicant Tracking Systems (ATS) has become the single biggest hurdle between talented job-seekers and human recruiters.",
      category: "Resume Building",
      readTime: "8 min read",
      date: "January 15, 2025",
      author: "Skillsurger Team",
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      content: `
        <p>Getting past Applicant Tracking Systems (ATS) has become the single biggest hurdle between talented job-seekers and human recruiters. An estimated 75% of applications are rejected by bots before a person ever reads them.</p>

        <h2>Why an AI Resume Builder Beats DIY Word Templates</h2>
        <p>Fast-moving AI postings often close in under 48 hours. Hiring teams configure ATS filters to shave hundreds of candidates down to a short list that exactly matches pre-defined keywords, skills, and formatting rules.</p>

        <h2>Top AI Resume Builder Tools Compared</h2>
        
        <h3>1. Rezi – Best for 100% ATS Score Guarantee</h3>
        <p><strong>ATS Compliance:</strong> 10/10<br>
        <strong>Price:</strong> Free basic download; Pro $29 one-time</p>

        <h3>2. Resume.io – Best Template Library</h3>
        <p><strong>ATS Compliance:</strong> 8/10<br>
        <strong>Price:</strong> Free preview; $24.95 / 4 weeks</p>

        <h2>Where an AI Resume Builder Ends—and Skillsurger Begins</h2>
        <p>Even the best AI resume builder stops after the PDF download. Skillsurger picks up the baton with comprehensive career coaching and job matching.</p>
      `
    },
    "ai-interview-questions": {
      title: "Top 50 AI Interview Questions & Answers to Ace Your Next Engineer Role",
      excerpt: "Recruiters now screen AI engineers with deeper technical drills and behavioral puzzles—often under tight time-limits on Zoom.",
      category: "Interview Prep",
      readTime: "12 min read",
      date: "January 12, 2025",
      author: "Skillsurger Team",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      content: `
        <p>Recruiters now screen AI engineers with deeper technical drills and behavioral puzzles—often under tight time-limits on Zoom. The right AI interview questions can mean the difference between awkward silence and a confident, structured answer.</p>

        <h2>Why Reviewing AI Interview Questions Beats "Winging It"</h2>
        <ul>
          <li>Unknown scope: Hiring loops now include data ethics, deployment, and cost-optimization curves</li>
          <li>Feedback scarcity: Live panel interviews rarely tell you what went wrong</li>
          <li>Time pressure: Question-per-minute counts keep rising in remote formats</li>
        </ul>

        <h2>The High-Yield AI Interview Questions</h2>
        
        <h3>Fundamentals</h3>
        <p><strong>Q1: What is the bias–variance trade-off?</strong><br>
        Lower bias ⭢ better fit but ↑ variance; goal is minimal total error at cross-val.</p>

        <h3>Behavioral & Leadership</h3>
        <p><strong>Q: Tell me about a time you failed to deliver an ML project on schedule.</strong><br>
        Use the STAR method: Situation, Task, Action, Result.</p>

        <h2>Skillsurger: AI Career Coach That Tracks Your Interview Readiness</h2>
        <p>Most tools end at practice once. Skillsurger's integrated AI mock-interview engine provides comprehensive feedback and tracks your progress over time.</p>
      `
    },
    "resume-coach-ai-tools": {
      title: "Is a Resume Coach Worth It? Pricing, ROI & Top AI Tools Compared",
      excerpt: "Job seekers are facing more rejections and longer hiring cycles than ever before. The right resume coach—especially if AI-powered—can mean the difference between weeks of silence and a fast-track offer.",
      category: "Career Advice",
      readTime: "10 min read",
      date: "January 10, 2025",
      author: "Skillsurger Team",
      image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      content: `
        <p>Job seekers are facing more rejections and longer hiring cycles than ever before. The right resume coach—especially if AI-powered—can mean the difference between weeks of silence and a fast-track offer.</p>

        <h2>Why a Resume Coach is the Secret Weapon for Fast Offers</h2>
        <p><strong>Pain Point #1: Format Fatigue</strong><br>
        Are you worried your resume looks outdated or "template-y?"</p>

        <p><strong>Pain Point #2: Imposter Syndrome</strong><br>
        Not sure which wins or keywords are strong enough?</p>

        <h2>Top Resume Coach Tools Compared</h2>
        
        <h3>1. Resume.io Coach</h3>
        <p><strong>Price:</strong> Free to preview, $24.95/month to export unlimited<br>
        <strong>Real Results:</strong> 22M+ users; claims up to 65% more callbacks</p>

        <h3>2. Rezi Pro</h3>
        <p><strong>Price:</strong> Free for basic, $29 lifetime for Pro<br>
        <strong>Real Results:</strong> 100% ATS guarantee; 30–50% reduction in job-search time</p>

        <h2>Skillsurger: Beyond the Resume Coach—A 24/7 AI Career Agent</h2>
        <p>While a resume coach tunes your PDF for a single application, Skillsurger acts as a career-long guide with comprehensive career coaching and job matching.</p>
      `
    }
  };

  const post = blogPosts[slug as keyof typeof blogPosts];

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
            <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
            <Link to="/blog">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link
                to="/blog"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </div>

            {/* Article Header */}
            <div className="mb-8">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mb-4">
                {post.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {post.excerpt}
              </p>
              
              {/* Article Meta */}
              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-8">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {post.author}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {post.date}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {post.readTime}
                </div>
                <button className="flex items-center hover:text-blue-600 transition-colors">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
              </div>
            </div>

            {/* Featured Image */}
            <div className="mb-12">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-64 md:h-96 object-cover rounded-xl"
              />
            </div>

            {/* Article Content */}
            <article className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>

            {/* CTA Section */}
            <div className="mt-16 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Transform Your Career?
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Experience the power of AI-driven career development with Skillsurger. Start your free trial today and discover personalized guidance tailored to your goals.
                </p>
                <Link to="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                    Start Free Trial
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 mt-4">No credit card required • 7-day free trial</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPost; 