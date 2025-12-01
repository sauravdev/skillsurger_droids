import { useState } from 'react';
import { Upload, FileText, Zap, CheckCircle, AlertCircle, Loader2, TrendingUp, Download } from 'lucide-react';
import Button from './Button';
import { backendApi, type CVScore, type CVEnhancement } from '../lib/backendApi';
import { extractTextFromPdf } from '../lib/pdf';
import { useUser } from '../context/UserContext';

export default function CVScoring() {
  const { checkSubscriptionForAI } = useUser();
  const [cvText, setCvText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [score, setScore] = useState<CVScore | null>(null);
  const [enhancedCV, setEnhancedCV] = useState<CVEnhancement | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'score' | 'enhanced'>('upload');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ['text/plain', 'application/pdf'];
    const validExtensions = ['.txt', '.pdf'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    
    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
      setError('Please upload a .txt or .pdf file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setLoading(true);

    try {
      let text: string;
      
      if (selectedFile.type === 'application/pdf' || fileExtension === '.pdf') {
        // Extract text from PDF
        text = await extractTextFromPdf(selectedFile);
        if (!text || text.trim().length === 0) {
          setError('Could not extract text from PDF. Please ensure the PDF contains selectable text.');
          setLoading(false);
          return;
        }
      } else {
        // Read text file
        text = await selectedFile.text();
      }
      
      setCvText(text);
    } catch (err: any) {
      console.error('File reading error:', err);
      setError(err.message || 'Failed to read file');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreCV = async () => {
    if (!cvText.trim()) {
      setError('Please upload or paste your CV first');
      return;
    }

    // Check subscription for AI features
    if (!checkSubscriptionForAI()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await backendApi.scoreCVText(cvText);
      setScore(result);
      setActiveTab('score');
    } catch (err: any) {
      setError(err.message || 'Failed to score CV');
    } finally {
      setLoading(false);
    }
  };

  const handleEnhanceCV = async () => {
    if (!cvText.trim()) {
      setError('Please upload or paste your CV first');
      return;
    }

    // Check subscription for AI features
    if (!checkSubscriptionForAI()) {
      return;
    }

    try {
      setEnhancing(true);
      setError('');
      const result = await backendApi.enhanceCVText(cvText, targetRole || undefined);
      setEnhancedCV(result);
      
      // Automatically score the enhanced CV
      const newScore = await backendApi.scoreCVText(result.enhancedCV);
      setScore(newScore);
      setCvText(result.enhancedCV);
      
      setActiveTab('enhanced');
    } catch (err: any) {
      setError(err.message || 'Failed to enhance CV');
    } finally {
      setEnhancing(false);
    }
  };

  const downloadEnhancedCV = () => {
    if (!enhancedCV) return;

    const blob = new Blob([enhancedCV.enhancedCV], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enhanced-cv.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI CV Scoring & Enhancement</h1>
        <p className="text-gray-600">Upload your CV to get an AI-powered score and automatic enhancements</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* CV Score Section - Full Width at Top */}
        {score && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold">CV Analysis Results</h2>
              </div>
              {enhancedCV && (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  ✨ Enhanced
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-6 gap-6 mb-8">
              {/* Overall Score - Large */}
              <div className="md:col-span-2 flex flex-col items-center justify-center">
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(score.overallScore)} border-4 ${score.overallScore >= 80 ? 'border-green-600' : score.overallScore >= 60 ? 'border-yellow-600' : 'border-red-600'}`}>
                  <span className={`text-5xl font-bold ${getScoreColor(score.overallScore)}`}>
                    {score.overallScore}
                  </span>
                </div>
                <p className="text-base font-semibold text-gray-700 mt-3">Overall Score</p>
                <p className="text-sm text-gray-500">
                  {score.overallScore >= 80 ? 'Excellent' : score.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>

              {/* Detailed Scores */}
              <div className="md:col-span-4 space-y-4">
                {Object.entries(score.scores).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-900 font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={`font-bold ${getScoreColor(value)}`}>
                        {value}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          value >= 80 ? 'bg-green-600' : value >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Strengths */}
              {score.strengths.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-base font-bold text-green-900 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {score.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-green-800 flex items-start">
                        <span className="text-green-600 mr-2 font-bold">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {score.weaknesses.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="text-base font-bold text-red-900 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {score.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm text-red-800 flex items-start">
                        <span className="text-red-600 mr-2 font-bold">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {score.recommendations.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-base font-bold text-blue-900 mb-3 flex items-center">
                    <Zap className="w-5 h-5 text-blue-600 mr-2" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {score.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-800 flex items-start">
                        <span className="text-blue-600 mr-2 font-bold">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Section - Full Width Below Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-6">
              <Upload className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold">Upload & Analyze Your CV</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Upload Column */}
              <div className="md:col-span-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CV File (.txt or .pdf)
                  </label>
                  <input
                    type="file"
                    accept=".txt,.pdf,application/pdf,text/plain"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  {file && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {file.name}
                    </p>
                  )}
                  {loading && !score && (
                    <p className="text-sm text-blue-600 mt-2 flex items-center">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Extracting text from PDF...
                    </p>
                  )}
                </div>

                <div className="text-center text-gray-500 text-sm py-2">OR</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Role (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleScoreCV}
                    disabled={loading || !cvText.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scoring...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Score CV
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleEnhanceCV}
                    disabled={enhancing || !cvText.trim()}
                    variant="secondary"
                    className="w-full"
                  >
                    {enhancing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Enhance CV
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* CV Text Column */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CV Text Preview
                </label>
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your CV content here or upload a file..."
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {cvText.length} characters
                </p>
              </div>
            </div>
        </div>

        {/* Enhanced CV Section - Full Width */}
        {enhancedCV && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Zap className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-xl font-bold">Enhanced CV</h2>
              </div>
              <Button
                onClick={downloadEnhancedCV}
                size="sm"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            {/* Changes Summary */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-bold text-blue-900 mb-3">✨ Key Improvements Made</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {enhancedCV.changesSummary.map((change, idx) => (
                  <div key={idx} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-800">{change}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced CV Preview */}
            <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                {enhancedCV.enhancedCV}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

