import React from 'react';
import { Calendar, Clock, ArrowRight, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "Best AI Résumé Builder Tools to Beat ATS Filters in Minutes",
      excerpt: "Getting past Applicant Tracking Systems (ATS) has become the single biggest hurdle between talented job-seekers and human recruiters. An estimated 75% of applications are rejected by bots before a person ever reads them.",
      category: "Resume Building",
      readTime: "8 min read",
      date: "January 15, 2025",
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      slug: "ai-resume-builder-tools"
    },
    {
      id: 2,
      title: "Top 50 AI Interview Questions & Answers to Ace Your Next Engineer Role",
      excerpt: "Recruiters now screen AI engineers with deeper technical drills and behavioral puzzles—often under tight time-limits on Zoom. The right AI interview questions can mean the difference between awkward silence and a confident, structured answer.",
      category: "Interview Prep",
      readTime: "12 min read",
      date: "January 12, 2025",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      slug: "ai-interview-questions"
    },
    {
      id: 3,
      title: "Is a Resume Coach Worth It? Pricing, ROI & Top AI Tools Compared",
      excerpt: "Job seekers are facing more rejections and longer hiring cycles than ever before. The right resume coach—especially if AI-powered—can mean the difference between weeks of silence and a fast-track offer.",
      category: "Career Advice",
      readTime: "10 min read",
      date: "January 10, 2025",
      image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      slug: "resume-coach-ai-tools"
    },
    {
      id: 4,
      title: "How to Find High-Paying Local Jobs in Under 10 Minutes",
      excerpt: "Are you tired of endless job-board scrolling, only to see duplicates and dead ends? The search for local jobs—those within your commute sweet spot and pay target—often turns into hours wasted chasing outdated listings.",
      category: "Job Search",
      readTime: "7 min read",
      date: "January 8, 2025",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      slug: "local-jobs"
    },
    {
      id: 5,
      title: "200 Must-Know Technical Interview Questions (With Code Walkthroughs)",
      excerpt: "Every tech job-seeker faces the same hurdle: a wall of technical interview questions drawn from Python, SQL, machine learning, and more. But with the flood of online lists, how do you know which questions matter?",
      category: "Technical Interviews",
      readTime: "15 min read",
      date: "January 5, 2025",
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      slug: "technical-interview-questions"
    },
    {
      id: 6,
      title: "AI-Powered Career Options Matrix: 25 Paths You Haven't Considered",
      excerpt: "With automation and AI reshaping the job market, the range of viable career options is wider—and more surprising—than ever. If you're stuck in analysis paralysis, tired of the same old lists, or worried about investing in the 'wrong' skill.",
      category: "Career Development",
      readTime: "11 min read",
      date: "January 3, 2025",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      slug: "career-options"
    }
  ];

  const categories = [
    "All",
    "Resume Building",
    "Interview Prep",
    "Career Advice",
    "Job Search",
    "Technical Interviews",
    "Career Development"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Skillsurger Blog
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Expert insights on AI-powered career development, job search strategies, and professional growth.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  index === 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 mr-1" />
                    {post.date}
                    <Clock className="w-4 h-4 ml-4 mr-1" />
                    {post.readTime}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          
          {/* Load More Button */}
          <div className="text-center mt-12">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
              Load More Articles
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stay Updated with Career Insights
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Get the latest articles on AI-powered career development, job search strategies, and professional growth delivered to your inbox.
          </p>
          
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-l-lg border-0 focus:ring-2 focus:ring-white text-gray-900"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-r-lg font-medium hover:bg-gray-100 transition-colors duration-200">
              Subscribe
            </button>
          </div>
          
          <p className="text-blue-100 text-sm mt-4">
            No spam, unsubscribe at any time.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Blog;