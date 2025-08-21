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

      // Generate CV HTML content with modern design
      tempDiv.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; background: white; padding: 40px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
            <h1 style="font-size: 36px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">${optimizedData.fullName || 'Professional Name'}</h1>
            <p style="font-size: 20px; color: #2563eb; font-weight: 600; margin: 0 0 12px 0;">${currentData.experience[0]?.title || 'Professional Title'}</p>
            <div style="display: flex; justify-content: center; gap: 24px; font-size: 14px; color: #6b7280; flex-wrap: wrap; margin-top: 16px;">
              ${optimizedData.email ? `<div style="display: flex; align-items: center;"><span style="margin-right: 8px;">📧</span><span>${optimizedData.email}</span></div>` : ''}
              ${optimizedData.phone ? `<div style="display: flex; align-items: center;"><span style="margin-right: 8px;">📞</span><span>${optimizedData.phone}</span></div>` : ''}
              ${optimizedData.location ? `<div style="display: flex; align-items: center;"><span style="margin-right: 8px;">📍</span><span>${optimizedData.location}</span></div>` : ''}
            </div>
          </div>

          <!-- Professional Summary -->
          ${optimizedData.summary ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 16px 0; display: flex; align-items: center;">
              <div style="width: 32px; height: 4px; background: #2563eb; margin-right: 12px;"></div>
              Professional Summary
            </h2>
            <p style="color: #374151; margin: 0; text-align: justify; font-size: 16px; line-height: 1.6;">${optimizedData.summary}</p>
          </div>
          ` : ''}

          <!-- Professional Experience -->
          ${optimizedData.experience.length > 0 ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 24px 0; display: flex; align-items: center;">
              <div style="width: 32px; height: 4px; background: #2563eb; margin-right: 12px;"></div>
              Professional Experience
            </h2>
            <div style="margin-left: 0;">
              ${optimizedData.experience.map((exp: any) => `
                <div style="margin-bottom: 24px; border-left: 4px solid #dbeafe; padding-left: 24px;">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div style="flex: 1; padding-right: 24px;">
                      <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 4px 0;">${exp.title}</h3>
                      <p style="color: #2563eb; font-weight: 500; margin: 0; font-size: 14px;">${exp.company}</p>
                    </div>
                    <div style="flex-shrink: 0; width: 128px; text-align: right;">
                      <span style="color: #6b7280; font-weight: 500; background: #f3f4f6; padding: 6px 12px; border-radius: 20px; font-size: 11px; border: 1px solid #e5e7eb; display: inline-block;">${exp.duration}</span>
                    </div>
                  </div>
                  <p style="color: #374151; margin: 0; text-align: justify; font-size: 13px; line-height: 1.6;">${exp.description}</p>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Projects -->
          ${optimizedData.projects && optimizedData.projects.length > 0 ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 24px 0; display: flex; align-items: center;">
              <div style="width: 32px; height: 4px; background: #2563eb; margin-right: 12px;"></div>
              Projects
            </h2>
            <div>
              ${optimizedData.projects.map((project: any) => `
                <div style="margin-bottom: 24px; background: #f9fafb; padding: 24px; border-radius: 8px;">
                  <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 12px 0;">${project.name}</h3>
                  <p style="color: #374151; margin: 0 0 12px 0; font-size: 14px; line-height: 1.6;">${project.description}</p>
                  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    <span style="font-size: 12px; font-weight: 500; color: #6b7280;">Technologies:</span>
                    ${project.technologies.map((tech: any) => `
                      <span style="background: #dbeafe; color: #1d4ed8; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${tech}</span>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Education -->
          ${optimizedData.education && optimizedData.education.length > 0 ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 24px 0; display: flex; align-items: center;">
              <div style="width: 32px; height: 4px; background: #2563eb; margin-right: 12px;"></div>
              Education
            </h2>
            <div>
              ${optimizedData.education.map((edu: any) => `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; background: #f9fafb; padding: 16px; border-radius: 8px;">
                  <div style="flex: 1; padding-right: 24px;">
                    <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0 0 4px 0;">${edu.degree}</h3>
                    <p style="color: #2563eb; font-weight: 500; margin: 0; font-size: 14px;">${edu.institution}</p>
                  </div>
                  <div style="flex-shrink: 0; width: 128px; text-align: right;">
                    <span style="color: #6b7280; font-weight: 500; background: white; padding: 6px 12px; border-radius: 20px; font-size: 11px; border: 1px solid #e5e7eb; display: inline-block;">${edu.year}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Skills -->
          ${optimizedData.skills.length > 0 ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 24px 0; display: flex; align-items: center;">
              <div style="width: 32px; height: 4px; background: #2563eb; margin-right: 12px;"></div>
              Skills
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              ${optimizedData.skills.map((skill: any) => `
                <span style="background: #f3f4f6; color: #374151; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; border: 1px solid #e5e7eb;">${skill}</span>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Languages -->
          ${optimizedData.languages && optimizedData.languages.length > 0 ? `
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 24px 0; display: flex; align-items: center;">
              <div style="width: 32px; height: 4px; background: #2563eb; margin-right: 12px;"></div>
              Languages
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              ${optimizedData.languages.map((language: any) => `
                <span style="background: #dbeafe; color: #1d4ed8; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; border: 1px solid #bfdbfe;">${language}</span>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Additional Sections from AI Suggestions -->
          ${suggestions.additionalSections.length > 0 ? `
            <div style="margin-bottom: 32px;">
              <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 24px 0; display: flex; align-items: center;">
                <div style="width: 32px; height: 4px; background: #2563eb; margin-right: 12px;"></div>
                Additional Sections
              </h2>
              ${suggestions.additionalSections.map((section: any) => `
                <div style="margin-bottom: 16px;">
                  <h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin: 0;">${section.title}</h3>
                  <p style="color: #374151; margin: 0; text-align: justify; font-size: 14px; line-height: 1.6;">${section.content}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
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