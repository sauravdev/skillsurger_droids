import { useState } from 'react';
import { Sparkles, Download, Plus } from 'lucide-react';
import Button from './Button';
import { CVSuggestion } from '../lib/careerServices';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CVSuggestionManagerProps {
  suggestions: CVSuggestion;
  currentData: {
    summary: string;
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    projects: Array<{
      name: string;
      description: string;
      technologies: string[];
    }>;
    education?: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    languages?: string[];
    customSections?: Array<{
      title: string;
      content: string;
      type: 'text' | 'list' | 'experience';
    }>;
  };
  onAddCustomSection?: (section: { title: string; content: string; type: 'text' | 'list' | 'experience' }) => void;
}

export default function CVSuggestionManager({
  suggestions,
  currentData,
  onAddCustomSection
}: CVSuggestionManagerProps) {
  // Remove all Accept/Reject state and logic
  const [isDownloading, setIsDownloading] = useState(false);



  const handleDownloadOptimizedCV = async () => {
    try {
      setIsDownloading(true);

      // Find the CV preview element
      const cvPreviewElement = document.getElementById('cv-preview');
      if (!cvPreviewElement) {
        console.error('CV preview element not found');
        throw new Error('CV preview element not found');
      }

      // Wait a bit for any dynamic content to render
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('CV Element found:', cvPreviewElement);
      console.log('CV Element dimensions:', {
        width: cvPreviewElement.offsetWidth,
        height: cvPreviewElement.offsetHeight,
        scrollWidth: cvPreviewElement.scrollWidth,
        scrollHeight: cvPreviewElement.scrollHeight
      });

      // Use html2canvas to capture the actual rendered CV preview
      const canvas = await html2canvas(cvPreviewElement, {
        scale: 1.5, // Reduced scale for smaller file size
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: cvPreviewElement.scrollWidth,
        height: cvPreviewElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: true, // Enable logging to debug
        imageTimeout: 0,
        removeContainer: true,
        ignoreElements: (element) => {
          return element.classList.contains('no-print');
        }
      });

      console.log('Canvas created:', {
        width: canvas.width,
        height: canvas.height
      });

      // Create PDF with custom dimensions to fit all content
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, canvas.height * 210 / canvas.width] // Custom height to fit content
      });
      
      // Convert to JPEG for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      // Add image to PDF - full size to fit all content
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, canvas.height * 210 / canvas.width);

      // Download the PDF
      const fullName = currentData.fullName || 'CV';
      const fileName = `${fullName.replace(/\s+/g, '_')}_Enhanced_CV.pdf`;
      pdf.save(fileName);
      
      console.log('PDF saved successfully');

    } catch (error) {
      console.error('Error generating optimized CV PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
          AI-Powered CV Enhancement Suggestions
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleDownloadOptimizedCV}
            disabled={isDownloading}
            className="flex items-center"
            >
              <Download className={`w-4 h-4 mr-2 ${isDownloading ? 'animate-spin' : ''}`} />
              {isDownloading ? 'Generating...' : 'Download Enhanced CV'}
            </Button>
        </div>
      </div>

      {/* Professional Summary Suggestion */}
      <div className="border rounded-lg p-6 border-blue-200 bg-blue-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900 ml-2">Enhanced Professional Summary</h4>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">Current Summary:</p>
            <div className="p-3 bg-gray-100 rounded border">
              <p className="text-gray-700">{currentData.summary || 'No summary provided'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">AI-Enhanced Version (adds to existing):</p>
            <div className="p-3 bg-white rounded border border-blue-200">
              <p className="text-gray-700 font-medium">{suggestions.summary}</p>
            </div>
          </div>
        </div>

        {/* No acceptance/rejection for summary */}
      </div>

      {/* Skills Optimization */}
      <div className="border rounded-lg p-6 border-blue-200 bg-blue-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900 ml-2">Additional Skills to Add</h4>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">Current Skills:</p>
            <div className="flex flex-wrap gap-2">
              {currentData.skills.map((skill, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">AI-Recommended Additional Skills:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.highlightedSkills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* No acceptance/rejection for skills */}
      </div>

      {/* Experience Improvements */}
      {suggestions.experienceImprovements.length > 0 && (
        <div className="border rounded-lg p-6 border-blue-200 bg-blue-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900 ml-2">Experience Enhancements</h4>
            </div>
          </div>

          <div className="space-y-4">
            {suggestions.experienceImprovements.map((improvement, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Original:</p>
                    <p className="text-gray-700 text-sm">{improvement.original}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">AI-Enhanced Addition (adds to original):</p>
                    <p className="text-gray-700 font-medium text-sm bg-blue-50 p-3 rounded border">
                      {improvement.improved}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No acceptance/rejection for experience */}
        </div>
      )}

      {/* Additional Sections */}
      {suggestions.additionalSections.length > 0 && (
        <div className="border rounded-lg p-6 border-blue-200 bg-blue-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900 ml-2">Suggested Additional Sections</h4>
            </div>
          </div>

          <div className="space-y-4">
            {suggestions.additionalSections.map((section, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{section.title}</h5>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (onAddCustomSection) {
                        onAddCustomSection({
                          title: section.title,
                          content: section.content,
                          type: 'text'
                        });
                      }
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add to CV
                  </Button>
                </div>
                <p className="text-gray-700 text-sm">{section.content}</p>
              </div>
            ))}
          </div>

          {/* No acceptance/rejection for sections */}
        </div>
      )}

      {/* Summary of Changes */}
      {/* No summary of changes section as acceptance/rejection is removed */}
    </div>
  );
}