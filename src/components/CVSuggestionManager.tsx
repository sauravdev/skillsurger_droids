import { useState } from 'react';
import { Check, X, RefreshCw, Sparkles, FileText, User, Award, Briefcase, Download } from 'lucide-react';
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
  };
}

export default function CVSuggestionManager({
  suggestions,
  currentData
}: CVSuggestionManagerProps) {
  // Remove all Accept/Reject state and logic
  const [isDownloading, setIsDownloading] = useState(false);

  const generateOptimizedCVData = () => {
    let optimizedData = { ...currentData };
    // Always apply all suggestions for preview
      optimizedData.summary = suggestions.summary;
      // Merge current skills with highlighted skills
      const allSkills = [...new Set([...currentData.skills, ...suggestions.highlightedSkills])];
      optimizedData.skills = allSkills;
    // Apply experience improvements
    if (suggestions.experienceImprovements.length > 0) {
      const normalize = (str: string) => str?.toLowerCase().replace(/\s+/g, ' ').trim();
      optimizedData.experience = currentData.experience.map((exp) => {
        let improvement = suggestions.experienceImprovements.find((imp: any) =>
          imp.original && normalize(imp.original) === normalize(exp.description)
        );
        if (!improvement) {
          improvement = suggestions.experienceImprovements.find((imp: any) =>
            imp.original && (
              normalize(exp.description).includes(normalize(imp.original)) ||
              normalize(imp.original).includes(normalize(exp.description))
            )
          );
        }
        if (improvement) {
          return { ...exp, description: improvement.improved };
        }
        return exp;
      });
    }
    return optimizedData;
  };

  const handleDownloadOptimizedCV = async () => {
    try {
      setIsDownloading(true);

      // Find the CV preview element
      const cvPreviewElement = document.getElementById('cv-preview');
      if (!cvPreviewElement) {
        throw new Error('CV preview element not found');
      }

      // Use html2canvas to capture the actual rendered CV preview
      const canvas = await html2canvas(cvPreviewElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: cvPreviewElement.scrollWidth,
        height: cvPreviewElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        letterRendering: true,
        foreignObjectRendering: true,
        imageTimeout: 0,
        removeContainer: true,
        ignoreElements: (element) => {
          return element.classList.contains('no-print');
        }
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const fullName = currentData.fullName || 'CV';
      const fileName = `${fullName.replace(/\s+/g, '_')}_Optimized_CV.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating optimized CV PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusIcon = (type: string) => {
    return <Sparkles className="w-5 h-5 text-blue-600" />;
  };

  const getStatusColor = (type: string) => {
    return 'border-blue-200 bg-blue-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
          AI-Powered CV Optimization Suggestions
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleDownloadOptimizedCV}
            disabled={isDownloading}
            className="flex items-center"
            >
              <Download className={`w-4 h-4 mr-2 ${isDownloading ? 'animate-spin' : ''}`} />
              {isDownloading ? 'Generating...' : 'Download Optimized CV'}
            </Button>
        </div>
      </div>

      {/* Professional Summary Suggestion */}
      <div className={`border rounded-lg p-6 ${getStatusColor('summary')}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {getStatusIcon('summary')}
            <h4 className="font-medium text-gray-900 ml-2">Optimized Professional Summary</h4>
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
            <p className="text-sm text-gray-500 mb-2">AI-Optimized Version:</p>
            <div className="p-3 bg-white rounded border border-blue-200">
              <p className="text-gray-700 font-medium">{suggestions.summary}</p>
            </div>
          </div>
        </div>

        {/* No acceptance/rejection for summary */}
      </div>

      {/* Skills Optimization */}
      <div className={`border rounded-lg p-6 ${getStatusColor('skills')}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {getStatusIcon('skills')}
            <h4 className="font-medium text-gray-900 ml-2">Key Skills to Highlight</h4>
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
            <p className="text-sm text-gray-500 mb-2">AI-Recommended Skills to Highlight:</p>
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
        <div className={`border rounded-lg p-6 ${getStatusColor('experience')}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              {getStatusIcon('experience')}
              <h4 className="font-medium text-gray-900 ml-2">Experience Improvements</h4>
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
                    <p className="text-sm text-gray-500 mb-1">AI-Enhanced Version:</p>
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
        <div className={`border rounded-lg p-6 ${getStatusColor('sections')}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              {getStatusIcon('sections')}
              <h4 className="font-medium text-gray-900 ml-2">Suggested Additional Sections</h4>
            </div>
          </div>

          <div className="space-y-4">
            {suggestions.additionalSections.map((section, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <h5 className="font-medium text-gray-900 mb-2">{section.title}</h5>
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