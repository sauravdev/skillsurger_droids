import { useState } from 'react';
import { FileText, Download, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import Button from './Button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CVData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
  languages: string[];
}

interface Props {
  initialData: CVData;
  onSave: (data: CVData) => Promise<void>;
  hideSummaryInPreview?: boolean;
}

export default function CVEditor({ initialData, onSave, hideSummaryInPreview }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<CVData>(initialData);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving CV:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      const cvElement = document.getElementById('cv-preview');
      if (!cvElement) return;

      const canvas = await html2canvas(cvElement, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${data.fullName.replace(/\s+/g, '_')}_CV.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit CV</h3>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Professional Title</label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={data.location}
                onChange={(e) => setData({ ...data, location: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="City, State, Country"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Professional Summary</label>
            <textarea
              value={data.summary}
              onChange={(e) => setData({ ...data, summary: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Experience</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData({
                  ...data,
                  experience: [
                    ...data.experience,
                    { title: '', company: '', duration: '', description: '' }
                  ]
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </div>
            <div className="space-y-4">
              {data.experience.map((exp, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <h4 className="font-medium">Experience #{index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setData({
                        ...data,
                        experience: data.experience.filter((_, i) => i !== index)
                      })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => {
                          const newExp = [...data.experience];
                          newExp[index] = { ...exp, title: e.target.value };
                          setData({ ...data, experience: newExp });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...data.experience];
                          newExp[index] = { ...exp, company: e.target.value };
                          setData({ ...data, experience: newExp });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration</label>
                      <input
                        type="text"
                        value={exp.duration}
                        onChange={(e) => {
                          const newExp = [...data.experience];
                          newExp[index] = { ...exp, duration: e.target.value };
                          setData({ ...data, experience: newExp });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Jan 2020 - Present"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                        const newExp = [...data.experience];
                        newExp[index] = { ...exp, description: e.target.value };
                        setData({ ...data, experience: newExp });
                      }}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Education</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData({
                  ...data,
                  education: [
                    ...data.education,
                    { degree: '', institution: '', year: '' }
                  ]
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            </div>
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <h4 className="font-medium">Education #{index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setData({
                        ...data,
                        education: data.education.filter((_, i) => i !== index)
                      })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const newEdu = [...data.education];
                          newEdu[index] = { ...edu, degree: e.target.value };
                          setData({ ...data, education: newEdu });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const newEdu = [...data.education];
                          newEdu[index] = { ...edu, institution: e.target.value };
                          setData({ ...data, education: newEdu });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Year</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => {
                          const newEdu = [...data.education];
                          newEdu[index] = { ...edu, year: e.target.value };
                          setData({ ...data, education: newEdu });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
            <input
              type="text"
              value={data.skills.join(', ')}
              onChange={(e) => setData({
                ...data,
                skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Languages (comma-separated)</label>
            <input
              type="text"
              value={data.languages.join(', ')}
              onChange={(e) => setData({
                ...data,
                languages: e.target.value.split(',').map(l => l.trim()).filter(Boolean)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">CV Preview</h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit CV
          </Button>
          <Button onClick={handleDownloadPDF} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <div id="cv-preview" className="bg-white p-8 shadow-lg rounded-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{data.fullName}</h1>
          <p className="text-xl text-gray-600 mt-1">{data.title}</p>
          <div className="flex items-center justify-center space-x-4 mt-2 text-gray-600">
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>•</span>}
            {data.phone && <span>{data.phone}</span>}
            {data.location && <span>•</span>}
            {data.location && <span>{data.location}</span>}
          </div>
        </div>

        {/* Summary */}
        {data.summary && !hideSummaryInPreview && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b">Professional Summary</h2>
            <p className="text-gray-700 leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b">Professional Experience</h2>
            <div className="space-y-6">
              {data.experience.map((exp, index) => (
                <div key={index}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{exp.title}</h3>
                      <p className="text-gray-600">{exp.company}</p>
                    </div>
                    <span className="text-gray-500">{exp.duration}</span>
                  </div>
                  <p className="mt-2 text-gray-700">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b">Education</h2>
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{edu.degree}</h3>
                    <p className="text-gray-600">{edu.institution}</p>
                  </div>
                  <span className="text-gray-500">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {data.languages.map((language, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}