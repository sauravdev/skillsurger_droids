import { useState } from 'react';
import { Calendar, User, Clock, ChevronRight, Search, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';
import Button from '../components/Button';

const blogPost = {
  id: 1,
  title: 'How AI is Transforming Career Development in 2025',
  excerpt: 'Explore how artificial intelligence is revolutionizing the way professionals navigate their career paths, from personalized learning to intelligent job matching.',
  category: 'AI & Technology',
  author: 'Skillsurger Team',
  date: '2025-01-12',
  readTime: '8 min read',
  image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  content: `
    <p>The landscape of career development has undergone a dramatic transformation in recent years, with artificial intelligence emerging as the driving force behind this revolution. As we navigate through 2025, AI-powered career platforms are not just changing how we approach professional growth—they're fundamentally redefining what's possible in career development.</p>

    <h2>The AI Revolution in Career Guidance</h2>
    <p>Traditional career counseling, while valuable, often suffered from limitations in scale, personalization, and real-time market insights. AI has addressed these challenges by providing:</p>
    
    <ul>
      <li><strong>Personalized Career Pathways:</strong> AI algorithms analyze individual skills, interests, and market trends to suggest tailored career paths that align with both personal goals and industry demands.</li>
      <li><strong>Real-time Market Intelligence:</strong> AI systems continuously monitor job markets, salary trends, and skill demands to provide up-to-date career advice.</li>
      <li><strong>Intelligent Skill Gap Analysis:</strong> By comparing current skills with market requirements, AI identifies specific areas for improvement and suggests targeted learning resources.</li>
    </ul>

    <h2>Key AI-Powered Features Transforming Careers</h2>
    
    <h3>1. Smart Job Matching</h3>
    <p>Gone are the days of manually searching through hundreds of job listings. AI-powered job matching systems analyze your profile, preferences, and career goals to surface opportunities that truly align with your aspirations. These systems consider factors beyond just keywords, including company culture, growth potential, and long-term career trajectory.</p>

    <h3>2. Personalized Learning Paths</h3>
    <p>AI creates customized learning journeys based on your current skill level, learning style, and career objectives. Whether you're looking to transition into data science or advance in your current field, AI curates resources from verified educational platforms, ensuring you're always learning the most relevant and up-to-date skills.</p>

    <h3>3. AI-Powered Mock Interviews</h3>
    <p>Practice makes perfect, and AI interview simulators provide unlimited opportunities to hone your interview skills. These systems analyze your responses, body language, and communication patterns to provide detailed feedback, helping you build confidence and improve your performance.</p>

    <h3>4. Dynamic CV Optimization</h3>
    <p>AI doesn't just help you write a better CV—it optimizes your resume for specific roles and industries. By analyzing job descriptions and successful applications, AI suggests improvements that increase your chances of getting noticed by recruiters and passing through applicant tracking systems.</p>

    <h2>The Human-AI Collaboration</h2>
    <p>While AI brings unprecedented capabilities to career development, the most effective platforms combine artificial intelligence with human expertise. This hybrid approach ensures that while AI handles data processing and pattern recognition, human mentors provide emotional support, industry insights, and strategic guidance that only comes from experience.</p>

    <h2>Real-World Impact: Success Stories</h2>
    <p>The impact of AI-powered career development is already visible across industries. Professionals are reporting faster career transitions, better job matches, and more strategic skill development. Companies are also benefiting from better-prepared candidates who arrive with relevant skills and clear career goals.</p>

    <h2>Looking Ahead: The Future of AI in Career Development</h2>
    <p>As we look toward the future, several trends are emerging:</p>
    
    <ul>
      <li><strong>Predictive Career Analytics:</strong> AI will increasingly predict industry changes and help professionals prepare for future opportunities before they become mainstream.</li>
      <li><strong>Immersive Learning Experiences:</strong> Virtual and augmented reality, powered by AI, will create more engaging and effective learning environments.</li>
      <li><strong>Continuous Career Optimization:</strong> AI will provide ongoing career guidance, adapting recommendations as your skills, interests, and market conditions evolve.</li>
    </ul>

    <h2>Getting Started with AI-Powered Career Development</h2>
    <p>If you're ready to leverage AI for your career growth, start by:</p>
    
    <ol>
      <li><strong>Assessing your current situation:</strong> Use AI tools to get an objective analysis of your skills and market position.</li>
      <li><strong>Setting clear goals:</strong> Define what you want to achieve in your career, both short-term and long-term.</li>
      <li><strong>Embracing continuous learning:</strong> Use AI-recommended resources to stay current with industry trends and develop new skills.</li>
      <li><strong>Practicing regularly:</strong> Take advantage of AI-powered practice tools for interviews, presentations, and other professional skills.</li>
    </ol>

    <h2>Conclusion</h2>
    <p>The integration of AI into career development represents more than just technological advancement—it's a democratization of career guidance that makes personalized, expert-level advice accessible to everyone. As AI continues to evolve, those who embrace these tools early will find themselves better positioned to navigate the complexities of modern career development.</p>

    <p>The future of career development is here, and it's powered by AI. The question isn't whether you should adopt these tools, but how quickly you can integrate them into your professional growth strategy.</p>
  `
};

export default function Blog() {
  const [showFullPost, setShowFullPost] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-12">
        {!showFullPost ? (
          <>
            {/* Blog Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Skillsurger Blog
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Insights, tips, and strategies for accelerating your career growth with AI-powered guidance.
              </p>
            </div>

            {/* Featured Post */}
            <div className="max-w-4xl mx-auto">
              <article className="bg-white rounded-lg overflow-hidden shadow-lg border hover:shadow-xl transition-shadow duration-300">
                <img
                  src={blogPost.image}
                  alt={blogPost.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                      {blogPost.category}
                    </span>
                    <span className="text-sm text-gray-500">Featured Post</span>
                  </div>
                  
                  <h2 className="text-3xl font-bold mb-4 text-gray-900">{blogPost.title}</h2>
                  <p className="text-gray-600 mb-6 text-lg leading-relaxed">{blogPost.excerpt}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {blogPost.author}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(blogPost.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {blogPost.readTime}
                      </span>
                    </div>
                    <Button
                      onClick={() => setShowFullPost(true)}
                      className="flex items-center"
                    >
                      Read More
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </article>

              {/* Coming Soon Section */}
              <div className="mt-12 text-center">
                <div className="bg-white rounded-lg p-8 shadow-sm border">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">More Articles Coming Soon</h3>
                  <p className="text-gray-600 mb-6">
                    We're working on bringing you more valuable insights about career development, AI technology, and professional growth strategies.
                  </p>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Career Transition Strategies</h4>
                      <p className="text-sm text-gray-600">Learn how to successfully navigate career changes with AI guidance.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Interview Mastery</h4>
                      <p className="text-sm text-gray-600">Advanced techniques for acing interviews using AI-powered practice.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Skill Development Roadmaps</h4>
                      <p className="text-sm text-gray-600">Create personalized learning paths for in-demand skills.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Full Blog Post */
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={() => setShowFullPost(false)}
              variant="outline"
              className="mb-6 flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>

            <article className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-8">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mb-4">
                  {blogPost.category}
                </span>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{blogPost.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {blogPost.author}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(blogPost.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {blogPost.readTime}
                  </span>
                </div>
                <img
                  src={blogPost.image}
                  alt={blogPost.title}
                  className="w-full h-64 object-cover rounded-lg mb-8"
                />
              </div>

              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: blogPost.content }}
              />

              <div className="mt-12 pt-8 border-t">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">Ready to Transform Your Career?</h3>
                  <p className="text-blue-700 mb-4">
                    Experience the power of AI-driven career development with Skillsurger. Start your free trial today and discover personalized guidance tailored to your goals.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Start Free Trial
                  </Button>
                </div>
              </div>
            </article>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}