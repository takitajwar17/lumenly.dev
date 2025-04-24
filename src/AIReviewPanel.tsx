import { useState } from "react";
import {
  FiChevronDown,
  FiChevronRight,
  FiAlertTriangle,
  FiInfo,
  FiZap,
} from "react-icons/fi";
import { IconType } from "react-icons";

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
}

interface AIReviewPanelProps {
  review: AIReview | null;
}

const ReviewSection = ({ title, items, icon: Icon, isExpanded, onToggle }: ReviewSectionProps) => {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center w-full px-4 py-2 text-sm font-medium text-left text-gray-100 bg-gray-800 rounded-lg hover:bg-gray-700"
      >
        <Icon className="w-4 h-4 mr-2" />
        <span>{title}</span>
        {items.length > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-gray-700 rounded-full text-gray-200">
            {items.length}
          </span>
        )}
        {isExpanded ? (
          <FiChevronDown className="ml-auto" />
        ) : (
          <FiChevronRight className="ml-auto" />
        )}
      </button>

      {isExpanded && items.length > 0 && (
        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-gray-100">{item.title}</h3>
                {item.severity && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      item.severity === "high"
                        ? "bg-red-900/50 text-red-200"
                        : item.severity === "medium"
                        ? "bg-yellow-900/50 text-yellow-200"
                        : "bg-blue-900/50 text-blue-200"
                    }`}
                  >
                    {item.severity}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-300">{item.description}</p>
              {item.code && (
                <div className="mt-3">
                  <div className="relative">
                    <pre className="p-3 bg-gray-900 rounded-lg overflow-x-auto">
                      <code className="text-sm text-gray-100">{item.code}</code>
                    </pre>
                    {item.lineNumber && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-gray-700 rounded-full text-gray-200">
                        Line {item.lineNumber}
                      </span>
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
  const [expandedSection, setExpandedSection] = useState<string | null>("issues"); // Default to issues being open

  if (!review || typeof review !== "object") {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">No review available.</p>
        </div>
      </div>
    );
  }

  const { issues = [], suggestions = [], improvements = [] } = review;

  const handleSectionToggle = (sectionName: string) => {
    setExpandedSection(expandedSection === sectionName ? null : sectionName);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="flex-none px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h2 className="text-lg font-medium text-gray-100">AI Code Review</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {issues.length > 0 && (
            <ReviewSection
              title="Issues"
              items={issues}
              icon={FiAlertTriangle}
              isExpanded={expandedSection === "issues"}
              onToggle={() => handleSectionToggle("issues")}
            />
          )}
          {suggestions.length > 0 && (
            <ReviewSection
              title="Suggestions"
              items={suggestions}
              icon={FiInfo}
              isExpanded={expandedSection === "suggestions"}
              onToggle={() => handleSectionToggle("suggestions")}
            />
          )}
          {improvements.length > 0 && (
            <ReviewSection
              title="Improvements"
              items={improvements}
              icon={FiZap}
              isExpanded={expandedSection === "improvements"}
              onToggle={() => handleSectionToggle("improvements")}
            />
          )}
          {issues.length === 0 && suggestions.length === 0 && improvements.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>No review items to display.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIReviewPanel; 