import { useState } from "react";
import {
  FiChevronDown,
  FiChevronRight,
  FiAlertTriangle,
  FiInfo,
  FiZap,
  FiClock,
  FiCode,
  FiCpu,
} from "react-icons/fi";
import { IconType } from "react-icons";
import { useTheme } from "./ThemeContext";

export interface ReviewItem {
  title: string;
  description: string;
  code?: string;
  lineNumber?: number;
  severity?: 'high' | 'medium' | 'low';
}

interface ReviewSectionProps {
  title: string;
  items: ReviewItem[];
  icon: IconType;
  isExpanded: boolean;
  onToggle: () => void;
}

export interface AIReview {
  suggestions: ReviewItem[];
  issues: ReviewItem[];
  improvements: ReviewItem[];
  _metadata?: {
    model: string;
    created: number;
  };
}

interface AIReviewPanelProps {
  review: AIReview | null;
}

const ReviewSection = ({ title, items, icon: Icon, isExpanded, onToggle }: ReviewSectionProps) => {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className={`flex items-center w-full px-3 sm:px-4 py-3 text-sm font-medium text-left transition-colors duration-200 rounded-lg ${
          isExpanded 
            ? 'bg-indigo-50 dark:bg-gray-700 text-indigo-700 dark:text-gray-100' 
            : 'bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        }`}
      >
        <Icon className={`w-4 h-4 mr-2 sm:mr-3 ${isExpanded ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`} />
        <span className="flex-1 truncate">{title}</span>
        {items.length > 0 && (
          <span className={`px-2 py-0.5 text-xs rounded-full ml-1 mr-2 ${
            isExpanded ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
          }`}>
            {items.length}
          </span>
        )}
        {isExpanded ? (
          <FiChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <FiChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {isExpanded && items.length > 0 && (
        <div className="mt-2 space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-3 sm:p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600/50 hover:border-indigo-200 dark:hover:border-gray-500/50 transition-colors shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight">
                  {item.title}
                </h3>
                {item.severity && (
                  <span
                    className={`self-start px-2 py-0.5 text-xs rounded-full font-medium ${
                      item.severity === "high"
                        ? "bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-500/30"
                        : item.severity === "medium"
                        ? "bg-yellow-50 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30"
                        : "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30"
                    }`}
                  >
                    {item.severity}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.description}
              </p>
              {item.code && (
                <div className="mt-3">
                  <div className="relative">
                    <pre className="p-3 bg-gray-50 dark:bg-black/30 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-700">
                      <code className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-mono">{item.code}</code>
                    </pre>
                    {item.lineNumber && (
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs bg-white/90 dark:bg-black/50 rounded-full text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        <FiCode className="w-3 h-3" />
                        <span>Line {item.lineNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AIReviewPanel = ({ review }: AIReviewPanelProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>("issues");
  const { theme } = useTheme();

  if (!review || typeof review !== "object") {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400 transition-colors">
        <div className="text-center space-y-2">
          <FiCpu className="w-8 h-8 mx-auto mb-3 text-gray-400 dark:text-gray-700" />
          <p className="text-lg font-medium">No review available</p>
          <p className="text-sm text-gray-500">Run the AI review to get feedback on your code</p>
        </div>
      </div>
    );
  }

  const { issues = [], suggestions = [], improvements = [] } = review;

  const handleSectionToggle = (sectionName: string) => {
    setExpandedSection(expandedSection === sectionName ? null : sectionName);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors">
      {/* Header */}
      <div className="flex-none px-4 sm:px-6 py-4 bg-white dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800/50 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100 transition-colors">AI Code Review</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 transition-colors">
              Automated analysis and suggestions for your code
            </p>
          </div>
          {review._metadata && (
            <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors">
              <div className="flex items-center gap-2">
                <FiCpu className="w-4 h-4" />
                <span className="truncate">{review._metadata.model}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                <span>{new Date(review._metadata.created * 1000).toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 pb-16">
          {issues.length > 0 && (
            <ReviewSection
              title="Issues to Address"
              items={issues}
              icon={FiAlertTriangle}
              isExpanded={expandedSection === "issues"}
              onToggle={() => handleSectionToggle("issues")}
            />
          )}
          {suggestions.length > 0 && (
            <ReviewSection
              title="Suggestions for Improvement"
              items={suggestions}
              icon={FiInfo}
              isExpanded={expandedSection === "suggestions"}
              onToggle={() => handleSectionToggle("suggestions")}
            />
          )}
          {improvements.length > 0 && (
            <ReviewSection
              title="Optimization Opportunities"
              items={improvements}
              icon={FiZap}
              isExpanded={expandedSection === "improvements"}
              onToggle={() => handleSectionToggle("improvements")}
            />
          )}
          {issues.length === 0 && suggestions.length === 0 && improvements.length === 0 && (
            <div className="text-center py-12">
              <FiCode className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-800 transition-colors" />
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400 transition-colors">All Clear!</p>
              <p className="text-sm text-gray-500 mt-1">No issues or suggestions found in your code</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIReviewPanel; 