import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Internal links to add to blogs
const internalLinks = [
  {
    text: 'AI Resume Builder',
    url: '/ai-resume-builder',
    keywords: ['resume', 'cv', 'application', 'job application', 'professional profile']
  },
  {
    text: 'Mock Interview',
    url: '/mock-interview',
    keywords: ['interview', 'interview preparation', 'interview skills', 'practice interview']
  },
  {
    text: 'Job Search',
    url: '/job-search',
    keywords: ['job search', 'find jobs', 'career opportunities', 'employment']
  },
  {
    text: 'Career Explorer',
    url: '/dashboard',
    keywords: ['career path', 'career guidance', 'career planning', 'career development']
  },
  {
    text: 'Skill Assessment',
    url: '/dashboard',
    keywords: ['skills', 'skill gap', 'skill development', 'learning']
  }
];

// Read the blogs file
const blogsPath = path.join(__dirname, '../src/content/blogs.generated.ts');
let content = fs.readFileSync(blogsPath, 'utf8');

// Function to add internal links to content
function addInternalLinks(htmlContent) {
  let modifiedContent = htmlContent;
  
  internalLinks.forEach(link => {
    link.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = modifiedContent.match(regex);
      
      if (matches && matches.length > 0) {
        // Add link to first occurrence of each keyword
        modifiedContent = modifiedContent.replace(
          new RegExp(`\\b${keyword}\\b`, 'i'),
          `<a href="${link.url}" class="internal-link">${keyword}</a>`
        );
      }
    });
  });
  
  return modifiedContent;
}

// Process each blog post
const blogRegex = /"content":\s*"([^"]*(?:\\"[^"]*)*)"/g;
let match;
let newContent = content;

while ((match = blogRegex.exec(content)) !== null) {
  const originalContent = match[1];
  const updatedContent = addInternalLinks(originalContent);
  
  if (originalContent !== updatedContent) {
    newContent = newContent.replace(originalContent, updatedContent);
  }
}

// Write the updated content back to the file
fs.writeFileSync(blogsPath, newContent, 'utf8');

console.log('Internal links added to blog posts successfully!');
