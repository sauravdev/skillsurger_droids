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
  onAcceptSuggestion: (type: string, data: any) => void;
  onRejectSuggestion: (type: string) => void;
  onApplyAllSuggestions: () => void;
}

export default function CVSuggestionManager({
  suggestions,
  currentData,
  onAcceptSuggestion,
  onRejectSuggestion,
  onApplyAllSuggestions
}: CVSuggestionManagerProps) {
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());
  const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleAccept = (type: string, data: any) => {
    setAcceptedSuggestions(prev => new Set([...prev, type]));
    setRejectedSuggestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(type);
      return newSet;
    });
    onAcceptSuggestion(type, data);
  };

  const handleReject = (type: string) => {
    setRejectedSuggestions(prev => new Set([...prev, type]));
    setAcceptedSuggestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(type);
      return newSet;
    });
    onRejectSuggestion(type);
  };

  const handleApplyAll = async () => {
    setIsApplying(true);
    try {
      await onApplyAllSuggestions();
    } finally {
      setIsApplying(false);
    }
  };

  const generateOptimizedCVData = () => {
    let optimizedData = { ...currentData };

    // Apply accepted suggestions
    if (acceptedSuggestions.has('summary')) {
      optimizedData.summary = suggestions.summary;
    }

    if (acceptedSuggestions.has('skills')) {
      // Merge current skills with highlighted skills
      const allSkills = [...new Set([...currentData.skills, ...suggestions.highlightedSkills])];
      optimizedData.skills = allSkills;
    }

    if (acceptedSuggestions.has('experience') && suggestions.experienceImprovements.length > 0) {
      // Apply experience improvements
      optimizedData.experience = currentData.experience.map((exp, index) => {
        const improvement = suggestions.experienceImprovements[index];
        if (improvement) {
          return {
            ...exp,
            description: improvement.improved
          };
        }
        return exp;
      });
    }

    return optimizedData;
  };

  const handleDownloadOptimizedCV = async () => {
    try {
      setIsDownloading(true);

      // Generate optimized CV data
      const optimizedData = generateOptimizedCVData();

      // Create a temporary CV preview element
      const tempDiv = document.createElement('div');
      tempDiv.id = 'temp-cv-preview';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';

      // Generate CV HTML content
      tempDiv.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; background: white; padding: 40px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
            <h1 style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">${optimizedData.fullName || 'Professional Name'}</h1>
            <p style="font-size: 18px; color: #6b7280; margin: 0 0 12px 0;">${currentData.experience[0]?.title || 'Professional Title'}</p>
            <div style="display: flex; justify-content: center; gap: 20px; font-size: 14px; color: #6b7280; flex-wrap: wrap;">
              ${optimizedData.email ? `<span>${optimizedData.email}</span>` : ''}
              ${optimizedData.phone ? `<span>•</span><span>${optimizedData.phone}</span>` : ''}
              ${optimizedData.location ? `<span>•</span><span>${optimizedData.location}</span>` : ''}
            </div>
          </div>

          <!-- Professional Summary -->
          ${optimizedData.summary ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Professional Summary</h2>
            <p style="color: #374151; margin: 0; text-align: justify;">${optimizedData.summary}</p>
          </div>
          ` : ''}

          <!-- Professional Experience -->
          ${optimizedData.experience.length > 0 ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Professional Experience</h2>
            <div style="margin-left: 0;">
              ${optimizedData.experience.map(exp => `
                <div style="margin-bottom: 24px;">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div>
                      <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0;">${exp.title}</h3>
                      <p style="color: #6b7280; margin: 0; font-size: 14px;">${exp.company}</p>
                    </div>
                    <span style="color: #6b7280; font-size: 14px; white-space: nowrap;">${exp.duration}</span>
                  </div>
                  <p style="color: #374151; margin: 0; text-align: justify; font-size: 14px;">${exp.description}</p>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Projects -->
          ${optimizedData.projects && optimizedData.projects.length > 0 ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Projects</h2>
            <div>
              ${optimizedData.projects.map(project => `
                <div style="margin-bottom: 24px;">
                  <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0;">${project.name}</h3>
                  <p style="color: #6b7280; margin: 0; font-size: 14px;">${project.description}</p>
                  <p style="color: #6b7280; margin: 0; font-size: 14px;">Technologies: ${project.technologies.join(', ')}</p>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Education -->
          ${optimizedData.education && optimizedData.education.length > 0 ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Education</h2>
            <div>
              ${optimizedData.education.map(edu => `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                  <div>
                    <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0;">${edu.degree}</h3>
                    <p style="color: #6b7280; margin: 0; font-size: 14px;">${edu.institution}</p>
                  </div>
                  <span style="color: #6b7280; font-size: 14px;">${edu.year}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Skills -->
          ${optimizedData.skills.length > 0 ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Skills</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${optimizedData.skills.map(skill => `
                <span style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 20px; font-size: 14px; border: 1px solid #e5e7eb;">${skill}</span>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Languages -->
          ${optimizedData.languages && optimizedData.languages.length > 0 ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">Languages</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${optimizedData.languages.map(language => `
                <span style="background: #dbeafe; color: #1d4ed8; padding: 6px 12px; border-radius: 20px; font-size: 14px; border: 1px solid #bfdbfe;">${language}</span>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Additional Sections from AI Suggestions -->
          ${acceptedSuggestions.has('sections') ? suggestions.additionalSections.map(section => `
            <div style="margin-bottom: 32px;">
              <h2 style="font-size: 20px; font-weight: 600; color: #1f2937; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">${section.title}</h2>
              <p style="color: #374151; margin: 0; text-align: justify;">${section.content}</p>
            </div>
          `).join('') : ''}
        </div>
      `;

      document.body.appendChild(tempDiv);

      // Generate PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
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

      // Clean up
      document.body.removeChild(tempDiv);

      // Download the PDF
      const fileName = `${optimizedData.fullName?.replace(/\s+/g, '_') || 'Optimized'}_CV.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating optimized CV:', error);
      alert('Failed to generate optimized CV. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusIcon = (type: string) => {
    if (acceptedSuggestions.has(type)) {
      return <Check className="w-5 h-5 text-green-600" />;
    }
    if (rejectedSuggestions.has(type)) {
      return <X className="w-5 h-5 text-red-600" />;
    }
    return <Sparkles className="w-5 h-5 text-blue-600" />;
  };

  const getStatusColor = (type: string) => {
    if (acceptedSuggestions.has(type)) {
      return 'border-green-200 bg-green-50';
    }
    if (rejectedSuggestions.has(type)) {
      return 'border-red-200 bg-red-50';
    }
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
            onClick={handleApplyAll}
            disabled={acceptedSuggestions.size === 0 || isApplying}
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isApplying ? 'animate-spin' : ''}`} />
            {isApplying ? 'Applying Changes...' : 'Apply All Accepted Changes'}
          </Button>
          {acceptedSuggestions.size > 0 && (
            <Button
              onClick={handleDownloadOptimizedCV}
              disabled={isDownloading}
              variant="outline"
              className="flex items-center bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
            >
              <Download className={`w-4 h-4 mr-2 ${isDownloading ? 'animate-spin' : ''}`} />
              {isDownloading ? 'Generating...' : 'Download Optimized CV'}
            </Button>
          )}
        </div>
      </div>

      {/* Professional Summary Suggestion */}
      <div className={`border rounded-lg p-6 ${getStatusColor('summary')}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {getStatusIcon('summary')}
            <h4 className="font-medium text-gray-900 ml-2">Optimized Professional Summary</h4>
          </div>
          {!acceptedSuggestions.has('summary') && !rejectedSuggestions.has('summary') && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleAccept('summary', suggestions.summary)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject('summary')}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
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

        {acceptedSuggestions.has('summary') && (
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-green-800 text-sm font-medium">✓ Summary optimization accepted and will be applied</p>
          </div>
        )}
      </div>

      {/* Skills Optimization */}
      <div className={`border rounded-lg p-6 ${getStatusColor('skills')}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {getStatusIcon('skills')}
            <h4 className="font-medium text-gray-900 ml-2">Key Skills to Highlight</h4>
          </div>
          {!acceptedSuggestions.has('skills') && !rejectedSuggestions.has('skills') && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleAccept('skills', suggestions.highlightedSkills)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject('skills')}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
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

        {acceptedSuggestions.has('skills') && (
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-green-800 text-sm font-medium">✓ Skills optimization accepted and will be applied</p>
          </div>
        )}
      </div>

      {/* Experience Improvements */}
      {suggestions.experienceImprovements.length > 0 && (
        <div className={`border rounded-lg p-6 ${getStatusColor('experience')}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              {getStatusIcon('experience')}
              <h4 className="font-medium text-gray-900 ml-2">Experience Improvements</h4>
            </div>
            {!acceptedSuggestions.has('experience') && !rejectedSuggestions.has('experience') && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept('experience', suggestions.experienceImprovements)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject('experience')}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject All
                </Button>
              </div>
            )}
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

          {acceptedSuggestions.has('experience') && (
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-green-800 text-sm font-medium">✓ Experience improvements accepted and will be applied</p>
            </div>
          )}
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
            {!acceptedSuggestions.has('sections') && !rejectedSuggestions.has('sections') && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept('sections', suggestions.additionalSections)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject('sections')}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject All
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {suggestions.additionalSections.map((section, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <h5 className="font-medium text-gray-900 mb-2">{section.title}</h5>
                <p className="text-gray-700 text-sm">{section.content}</p>
              </div>
            ))}
          </div>

          {acceptedSuggestions.has('sections') && (
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-green-800 text-sm font-medium">✓ Additional sections accepted and will be applied</p>
            </div>
          )}
        </div>
      )}

      {/* Summary of Changes */}
      {acceptedSuggestions.size > 0 && (
        <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
          <h4 className="font-medium text-green-900 mb-3 flex items-center">
            <Check className="w-5 h-5 mr-2" />
            Ready to Apply Changes
          </h4>
          <div className="space-y-2">
            {acceptedSuggestions.has('summary') && (
              <p className="text-green-800 text-sm">• Professional summary will be updated</p>
            )}
            {acceptedSuggestions.has('skills') && (
              <p className="text-green-800 text-sm">• Skills section will be optimized</p>
            )}
            {acceptedSuggestions.has('experience') && (
              <p className="text-green-800 text-sm">• Experience descriptions will be enhanced</p>
            )}
            {acceptedSuggestions.has('sections') && (
              <p className="text-green-800 text-sm">• Additional sections will be added</p>
            )}
          </div>
          <div className="mt-4 flex space-x-2">
            <Button
              onClick={handleApplyAll}
              disabled={isApplying}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isApplying ? 'animate-spin' : ''}`} />
              {isApplying ? 'Applying Changes to Profile...' : 'Apply All Accepted Changes to Profile'}
            </Button>
            <Button
              onClick={handleDownloadOptimizedCV}
              disabled={isDownloading}
              variant="outline"
              className="bg-white border-green-300 text-green-700 hover:bg-green-50"
            >
              <Download className={`w-4 h-4 mr-2 ${isDownloading ? 'animate-spin' : ''}`} />
              {isDownloading ? 'Generating...' : 'Download Optimized CV'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}