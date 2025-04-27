import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../ThemeContext";
import { toast } from "sonner";
import { 
  SiJavascript, 
  SiTypescript, 
  SiPython,
  SiCplusplus,
  SiC,
  SiSharp,
  SiGo,
  SiRust,
  SiSwift,
  SiKotlin,
  SiPhp
} from "react-icons/si";
import { FaJava } from "react-icons/fa";
import { FiCode, FiUsers, FiPlus, FiHash, FiClock, FiEdit, FiEye, FiActivity, FiCalendar } from "react-icons/fi";
import { getSupportedLanguages, getLanguageDisplayName } from "../../convex/languageMap";

// Popular programming languages for quick selection
const POPULAR_LANGUAGES = [
  { id: "javascript", name: "JavaScript", icon: SiJavascript, color: "#F7DF1E" },
  { id: "typescript", name: "TypeScript", icon: SiTypescript, color: "#3178C6" },
  { id: "python", name: "Python", icon: SiPython, color: "#3776AB" },
  { id: "java", name: "Java", icon: FaJava, color: "#007396" },
  { id: "c++", name: "C++", icon: SiCplusplus, color: "#00599C" },
  { id: "c", name: "C", icon: SiC, color: "#A8B9CC" },
  { id: "csharp.net", name: "C#", icon: SiSharp, color: "#239120" },
  { id: "go", name: "Go", icon: SiGo, color: "#00ADD8" },
  { id: "rust", name: "Rust", icon: SiRust, color: "#000000" },
  { id: "swift", name: "Swift", icon: SiSwift, color: "#FA7343" },
  { id: "kotlin", name: "Kotlin", icon: SiKotlin, color: "#7F52FF" },
  { id: "php", name: "PHP", icon: SiPhp, color: "#777BB4" },
];

// Get all supported languages
const ALL_LANGUAGES = getSupportedLanguages().map(langId => ({
  id: langId,
  name: getLanguageDisplayName(langId)
}));

// Add this CSS at the top of the file, after the imports
const styles = `
  .scrollbar-hide {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
  
  .activity-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    z-index: 50;
    pointer-events: none;
  }
  
  .activity-cell {
    position: relative;
  }
  
  .day-labels {
    width: 20px;
    flex-shrink: 0;
    font-size: 9px;
    text-align: center;
  }
  
  .month-label {
    position: absolute;
    top: 0;
    transform: translateX(-40%);
    white-space: nowrap;
    font-size: 10px;
  }
  
  .activity-grid-container {
    padding-left: 8px;
    padding-right: 8px;
    position: relative;
    margin: 0 auto;
    width: 100%;
  }
`;

// Activity graph component
const ActivityGraph = ({ refreshKey }: { refreshKey: number }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Define types for activity data
  type ActivityDay = {
    date: string;
    count: number;
    level: number;
  };
  
  // Get real user activity data from our API
  const activityResult = useQuery(api.userActivity.getUserActivityData, { days: 365 });
  const activityStats = useQuery(api.userActivity.getUserActivityStats);
  
  // Use loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Force refresh when refreshKey changes
  useEffect(() => {
    // This effect runs whenever refreshKey changes
    // No need to do anything - just dependency will cause re-renders
  }, [refreshKey]);
  
  useEffect(() => {
    if (activityResult !== undefined) {
      setIsLoading(false);
    }
  }, [activityResult]);
  
  // If data is still loading or not available, show a loading state
  if (isLoading || !activityResult) {
    return (
      <div className="mt-4 mb-4">
        <div className="flex items-center mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <FiActivity className="mr-1.5" />
            Activity Summary
          </h3>
        </div>
        <div className="h-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  const activityData = activityResult.activityData;
  
  // Group data by week
  const weeks: (ActivityDay | null)[][] = [];
  let currentWeek: (ActivityDay | null)[] = [];
  
  // First day of the week (Sunday = 0, Monday = 1, etc.)
  const firstDayOfWeek = 0; // Sunday
  
  // Check if we have data before proceeding
  if (activityData.length === 0) {
    return (
      <div className="mt-4 mb-4">
        <div className="flex items-center mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <FiActivity className="mr-1.5" />
            Activity Summary
          </h3>
        </div>
        <div className="h-24 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No activity data yet</p>
        </div>
      </div>
    );
  }
  
  // Find the first day of the first week
  const firstDay = new Date(activityData[0].date);
  const dayOfWeek = firstDay.getDay();
  
  // Fill in empty days at the beginning to align with week
  for (let i = 0; i < (dayOfWeek - firstDayOfWeek + 7) % 7; i++) {
    currentWeek.push(null);
  }
  
  // Group days into weeks
  activityData.forEach((day, index) => {
    currentWeek.push(day);
    
    const dayDate = new Date(day.date);
    const isEndOfWeek = dayDate.getDay() === (firstDayOfWeek + 6) % 7;
    const isLastDay = index === activityData.length - 1;
    
    if (isEndOfWeek || isLastDay) {
      // If it's the last week and not full, pad with null
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });
  
  // Get color for activity level
  const getActivityColor = (level: number | null): string => {
    if (level === null || level === 0) {
      return isDark ? 'bg-gray-800' : 'bg-gray-100';
    }
    
    const colors = isDark ? [
      'bg-indigo-900/30', // Level 1 - changed from emerald to indigo
      'bg-indigo-700/60', // Level 2
      'bg-indigo-600', // Level 3
      'bg-indigo-500' // Level 4
    ] : [
      'bg-indigo-100', // Level 1
      'bg-indigo-300', // Level 2
      'bg-indigo-500', // Level 3
      'bg-indigo-700' // Level 4
    ];
    
    return colors[level - 1];
  };
  
  // Get month labels with better positioning
  const getMonthLabels = () => {
    // Fixed array of months from January to September with equidistant positions
    // Starting at 10% and ending at 90%, with exactly 11% distance between them
    const months = [
      { month: 0, name: "Jan", position: 10 },
      { month: 1, name: "Feb", position: 21 },
      { month: 2, name: "Mar", position: 32 },
      { month: 3, name: "Apr", position: 43 },
      { month: 4, name: "May", position: 54 },
      { month: 5, name: "Jun", position: 65 },
      { month: 6, name: "Jul", position: 76 },
      { month: 7, name: "Aug", position: 87 },
      { month: 8, name: "Sep", position: 98 }
    ];
    
    return months;
  };
  
  const monthLabels = getMonthLabels();
  
  return (
    <div className="mt-4 mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
          <FiActivity className="mr-1.5 text-indigo-500 dark:text-indigo-400" />
          Activity Summary
        </h3>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <span className="mr-1.5">Less</span>
          <div className="flex items-center space-x-1">
            <div className={`w-3 h-3 rounded-sm ${isDark ? 'bg-gray-800' : 'bg-gray-100'} border border-gray-300 dark:border-gray-700`}></div>
            <div className={`w-3 h-3 rounded-sm ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}></div>
            <div className={`w-3 h-3 rounded-sm ${isDark ? 'bg-indigo-700/60' : 'bg-indigo-300'}`}></div>
            <div className={`w-3 h-3 rounded-sm ${isDark ? 'bg-indigo-600' : 'bg-indigo-500'}`}></div>
            <div className={`w-3 h-3 rounded-sm ${isDark ? 'bg-indigo-500' : 'bg-indigo-700'}`}></div>
          </div>
          <span className="ml-1.5">More</span>
        </div>
      </div>
      
      {/* Activity stats */}
      {activityStats && (
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
            <div className="font-medium text-gray-600 dark:text-gray-400">Current Streak</div>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{activityStats.currentStreak} days</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
            <div className="font-medium text-gray-600 dark:text-gray-400">Longest Streak</div>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{activityStats.longestStreak} days</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
            <div className="font-medium text-gray-600 dark:text-gray-400">Active Days</div>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{activityStats.totalActiveDays}</div>
          </div>
        </div>
      )}
      
      <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/40">
        <div className="activity-grid-container">
          {/* Month labels */}
          <div className="flex mb-2 h-5 relative pl-[20px]">
            {monthLabels.map((month) => (
              <div 
                key={`month-${month.month}`} 
                className="month-label text-xs text-gray-500 dark:text-gray-400"
                style={{ left: `${month.position}%` }}
              >
                {month.name}
              </div>
            ))}
          </div>
          
          {/* Day labels and Activity grid */}
          <div className="flex justify-center">
            <div className="day-labels flex flex-col text-gray-500 dark:text-gray-400 pr-1 py-1">
              <div className="h-3.5">M</div>
              <div className="h-3.5 mt-1"></div>
              <div className="h-3.5 mt-1">W</div>
              <div className="h-3.5 mt-1"></div>
              <div className="h-3.5 mt-1">F</div>
              <div className="h-3.5 mt-1"></div>
            </div>
            
            {/* Activity grid */}
            <div className="flex space-x-px overflow-x-auto scrollbar-hide pb-1 w-full">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col space-y-px flex-shrink-0">
                  {week.map((day, dayIndex) => {
                    if (day === null) {
                      return <div key={`empty-${dayIndex}`} className="w-3 h-3 rounded-sm opacity-0"></div>;
                    }
                    
                    return (
                      <div
                        key={day.date}
                        className={`activity-cell w-3 h-3 rounded-sm ${getActivityColor(day.level)} hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-500 transition-all cursor-pointer group`}
                        title={`${day.count} activities on ${day.date}`}
                      >
                        {/* Tooltip */}
                        <div className="activity-tooltip px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
                          {day.count} activities on {new Date(day.date).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Component for workspace listing, creation and joining.
 * Allows users to create new workspaces or join existing ones for real-time code collaboration.
 */
export default function WorkspaceHub() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLanguage, setNewRoomLanguage] = useState("javascript");
  const [isLoading, setIsLoading] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [mounted, setMounted] = useState(false);
  // Add a state to force refresh the activity graph
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  
  const navigate = useNavigate();
  const rooms = useQuery(api.rooms.list);
  const createRoom = useMutation(api.rooms.create);
  const joinRoomByCode = useMutation(api.rooms.joinByCode);
  
  // Get active collaborators for each workspace
  const roomsWithPresence = useQuery(api.rooms.listWithDetails) || [];
  
  const { theme } = useTheme();
  
  // Animation trigger after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Add the styles to the document
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  
  const handleCreateRoomClick = useCallback(() => {
    setIsCreateModalOpen(true);
    setNewRoomName("");
    setNewRoomLanguage("javascript");
    setShowAllLanguages(false);
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);
  
  const handleCreateRoom = useCallback(async () => {
    // Use "Untitled Workspace" if name is empty, otherwise use uppercase trimmed name
    const roomName = newRoomName.trim() ? newRoomName.trim().toUpperCase() : "UNTITLED WORKSPACE";
    
    setIsLoading(true);
    try {
      const result = await createRoom({ 
        name: roomName,
        language: newRoomLanguage 
      });
      
      // Increment the activity refresh key to trigger a refresh
      setActivityRefreshKey(prev => prev + 1);
      
      // Navigate directly to the workspace using the returned code
      void navigate(`/workspace/${result.code}`);
      
      setIsCreateModalOpen(false);
      toast.success("Workspace created successfully!");
    } catch (_error) {
      toast.error("Failed to create workspace");
    } finally {
      setIsLoading(false);
    }
  }, [newRoomName, newRoomLanguage, createRoom, navigate]);
  
  const handleJoinRoom = useCallback(async () => {
    if (joinCode.length !== 6) {
      toast.error("Workspace code should be 6 characters");
      return;
    }
    
    setIsLoading(true);
    try {
      // Just validate that the workspace exists
      await joinRoomByCode({ code: joinCode });
      
      // Increment the activity refresh key to trigger a refresh
      setActivityRefreshKey(prev => prev + 1);
      
      // Navigate to the workspace
      void navigate(`/workspace/${joinCode}`);
      
      toast.success("Joined workspace successfully!");
    } catch (_error) {
      toast.error("Failed to join workspace. Invalid code.");
      setIsLoading(false);
    }
  }, [joinCode, joinRoomByCode, navigate]);
  
  const handleSelectRoom = useCallback((roomCode: string) => {
    if (roomCode) {
      // Increment the activity refresh key to trigger a refresh
      setActivityRefreshKey(prev => prev + 1);
      
      void navigate(`/workspace/${roomCode}`);
    }
  }, [navigate]);

  // Helper function to render workspace cards
  const renderWorkspaceCard = (roomData: any, index: number) => {
    const { workspace, activeCollaborators, lastEdited } = roomData;
    
    // Format time since last edit
    const timeAgo = lastEdited ? formatTimeAgo(lastEdited) : null;
    
    // Find the language icon if available
    const language = POPULAR_LANGUAGES.find(lang => lang.id === workspace.language);
    const IconComponent = language?.icon;
    
    return (
      <button
        key={workspace._id}
        onClick={() => void handleSelectRoom(workspace.code)}
        className="group w-full text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gradient-to-br hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.01] flex flex-col relative overflow-hidden"
        style={{ 
          transitionDelay: `${50 * (index % 10)}ms`,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(8px)'
        }}
      >
        {/* Decorative gradient background that shows on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="flex justify-between items-start relative">
          <div className="flex items-center">
            {IconComponent ? (
              <div className="relative w-10 h-10 mr-3">
                {/* Background blur effect */}
                <div className="absolute inset-0 bg-gradient-to-br rounded-xl blur-xl opacity-30"
                  style={{ background: `linear-gradient(135deg, ${language?.color}40, transparent)` }}
                ></div>
                {/* Icon container */}
                <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50 rounded-lg border border-gray-200/80 dark:border-gray-700/80 shadow-sm overflow-hidden group-hover:border-indigo-200/50 dark:group-hover:border-indigo-700/50 transition-colors duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity duration-300 group-hover:opacity-30"
                    style={{ background: `linear-gradient(135deg, ${language?.color}20, transparent)` }}
                  ></div>
                  <IconComponent className="w-5 h-5 relative transform group-hover:scale-110 transition-transform duration-300" 
                    color={language?.color} 
                  />
                </div>
              </div>
            ) : (
              <div className="relative w-10 h-10 mr-3">
                <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50 rounded-lg border border-gray-200/80 dark:border-gray-700/80 shadow-sm group-hover:border-indigo-200/50 dark:group-hover:border-indigo-700/50 transition-colors duration-300">
                  <FiCode className="w-5 h-5 text-gray-500 dark:text-gray-400 transform group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white transition-colors text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {workspace.name}
              </h3>
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <span>{getLanguageDisplayName(workspace.language)}</span>
                {timeAgo && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="flex items-center">
                      <FiClock className="w-3 h-3 mr-0.5" />
                      {timeAgo}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-600 dark:text-indigo-400 py-0.5 px-2 rounded-full transition-colors">
              {workspace.code}
            </span>
            
            {/* Active users status */}
            <div className={`flex items-center text-xs rounded-full px-1.5 py-0.5 mt-1 ${
              activeCollaborators > 0 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                activeCollaborators > 0 
                  ? 'bg-green-500 dark:bg-green-400 animate-pulse' 
                  : 'bg-gray-400 dark:bg-gray-600'
              }`}></div>
              <span className="font-medium">
                {activeCollaborators > 0 
                  ? `${activeCollaborators} active` 
                  : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors bg-noise">
      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className={`bg-white dark:bg-gray-800 rounded-xl p-3 xs:p-4 sm:p-6 w-full max-w-[340px] sm:max-w-md shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform ${mounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}>
            <div className="relative mb-3 xs:mb-4 sm:mb-6">
              <div className="absolute inset-0 -z-10 bg-gradient-radial from-indigo-100/50 to-transparent dark:from-indigo-900/20 dark:to-transparent opacity-70 blur-xl rounded-xl"></div>
              <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 dark:text-white transition-colors flex items-center">
                <div className="mr-2 xs:mr-2 sm:mr-3 w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 flex items-center justify-center shadow-md">
                  <FiPlus className="text-white w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                </div>
                Create New Workspace
              </h2>
            </div>
            
            <div className="space-y-3 xs:space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="roomName" className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 xs:mb-2 sm:mb-2 transition-colors">
                  Workspace Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value.toUpperCase().slice(0, 30))}
                  placeholder="Enter workspace name"
                  maxLength={30}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-1.5 xs:py-2 sm:py-2.5 text-sm xs:text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-xs xs:text-sm sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 xs:mb-2 sm:mb-2 transition-colors">
                  Choose Your Language
                </label>
                
                {!showAllLanguages ? (
                  <>
                    <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1 xs:gap-1.5 sm:gap-2 mb-2 xs:mb-3 sm:mb-3">
                      {POPULAR_LANGUAGES.map(lang => {
                        const IconComponent = lang.icon;
                        return (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => setNewRoomLanguage(lang.id)}
                            className={`p-1 xs:p-1.5 sm:p-2 rounded-lg border transition-all hover-float ${newRoomLanguage === lang.id 
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300'}`}
                          >
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg mb-0.5 xs:mb-1 sm:mb-1.5">
                                <IconComponent 
                                  className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" 
                                  color={lang.color}
                                />
                              </div>
                              <span className="text-[10px] xs:text-xs sm:text-xs truncate w-full text-center">{lang.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllLanguages(true)}
                      className="text-xs xs:text-sm sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                      Show all languages
                    </button>
                  </>
                ) : (
                  <>
                    <select
                      value={newRoomLanguage}
                      onChange={(e) => setNewRoomLanguage(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-1.5 xs:py-2 sm:py-2.5 text-sm xs:text-sm sm:text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors"
                      disabled={isLoading}
                    >
                      {ALL_LANGUAGES.map(lang => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAllLanguages(false)}
                      className="text-xs xs:text-sm sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mt-2 transition-colors"
                    >
                      Show popular languages
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-4 xs:mt-5 sm:mt-7 flex justify-end space-x-2 xs:space-x-3 sm:space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium transition-colors text-xs xs:text-sm sm:text-base"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateRoom()}
                className="px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-400 dark:hover:to-purple-400 text-white rounded-lg font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs xs:text-sm sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    
      <div className="flex flex-col md:flex-row h-full w-full overflow-auto">
        {/* Left side - Create/Join */}
        <div className="w-full md:w-1/2 p-4 md:p-8 flex flex-col bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 transition-colors relative">
          {/* Background decorative elements */}
          <div className="absolute inset-0 -z-10 bg-gradient-radial from-indigo-100/30 to-transparent dark:from-indigo-900/10 dark:to-transparent opacity-70 pointer-events-none"></div>
          <div className="absolute inset-0 -z-20 bg-gradient-to-b from-purple-100/10 via-transparent to-indigo-100/10 dark:from-purple-900/10 dark:via-transparent dark:to-indigo-900/10 blur-2xl pointer-events-none"></div>
          
          <div className={`text-center mb-6 md:mb-10 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="flex items-center justify-center mb-4 md:mb-6">
              <img 
                src="/apple-touch-icon.png" 
                alt="Lumenly Logo" 
                className="w-16 h-16 md:w-20 md:h-20 mb-2 hover-float"
              />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2 md:mb-3 transition-colors relative">
              <span className="relative">
                <span className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent">Real-time Collaboration</span>
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300 bg-clip-text text-transparent blur-[2px] opacity-30 -z-10 translate-y-[1px] translate-x-[0.5px]">Real-time Collaboration</span>
              </span>
            </h1>
            
            {/* Ornamental divider with animation */}
            <div className="relative h-px w-32 mx-auto my-3 md:my-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/70 dark:via-indigo-400/70 to-transparent"></div>
              <div className="absolute inset-0 logo-shimmer"></div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 transition-colors text-sm md:text-base">
              Create a workspace to start coding <span className="inline-block italic font-normal bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">together with AI</span>
            </p>
          </div>
          
          <div className={`space-y-6 md:space-y-8 flex-1 flex flex-col justify-center max-w-md mx-auto w-full transition-all duration-700 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <button
              onClick={handleCreateRoomClick}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-400 dark:hover:to-purple-400 text-white rounded-xl px-4 py-3 md:px-5 md:py-4 text-base md:text-lg font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] flex items-center justify-center"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white/20 flex items-center justify-center mr-2 md:mr-3">
                  <FiPlus className="text-white" />
                </div>
                <span>Create a Workspace</span>
              </div>
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700 transition-colors"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 transition-colors">OR</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-green-500/10 to-indigo-500/10 dark:from-green-400/20 dark:to-indigo-400/20 flex items-center justify-center">
                    <FiHash className="h-4 w-4 md:h-5 md:w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="Enter 6-character code"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl pl-12 md:pl-14 pr-4 py-3 md:py-3.5 text-center text-xs sm:text-sm md:text-base lg:text-lg tracking-widest uppercase text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors shadow-sm"
                  maxLength={6}
                />
                <div className="absolute inset-0 -z-10 rounded-xl opacity-0 transition-opacity duration-300 bg-gradient-to-r from-green-500/50 to-indigo-500/50 blur-lg group-focus-within:opacity-70"></div>
              </div>
              <button
                onClick={() => void handleJoinRoom()}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-400 dark:hover:to-emerald-400 text-white rounded-xl px-4 py-3 md:py-3.5 text-base md:text-lg font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
                disabled={joinCode.length !== 6 || isLoading}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-white/20 flex items-center justify-center mr-2 md:mr-3">
                    <FiUsers className="text-white" />
                  </div>
                  <span>{isLoading ? 'Joining...' : 'Join Workspace'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Right side - Recent Activities */}
        <div className="w-full md:w-1/2 p-4 md:p-8 bg-gray-50 dark:bg-gray-900/30 transition-colors overflow-auto flex flex-col">
          <div className="w-full max-w-md lg:max-w-[85%] xl:max-w-[85%] mx-auto flex flex-col h-full">
            <h2 className={`text-lg md:text-xl font-semibold mb-4 md:mb-5 text-gray-900 dark:text-white transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} flex items-center sticky top-0 bg-gray-50 dark:bg-gray-900/30 z-10 py-2`}>
              <div className="mr-2 w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/40 flex items-center justify-center shadow-sm">
                <FiActivity className="text-indigo-500 dark:text-indigo-400" />
              </div>
              Recent Activity & Workspaces
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-48 md:h-64">
                <div className="relative w-12 h-12 md:w-16 md:h-16">
                  <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-t-2 border-b-2 border-indigo-400 animate-spin-reverse" style={{ animationDuration: '1.5s' }}></div>
                  <div className="absolute inset-4 rounded-full border-t-2 border-indigo-300 animate-spin" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute inset-6 rounded-full border-t-2 border-indigo-200 animate-spin-reverse" style={{ animationDuration: '2.5s' }}></div>
                </div>
              </div>
            ) : roomsWithPresence && roomsWithPresence.length > 0 ? (
              <div className="flex-1 overflow-auto">
                {/* Mobile layout (workspaces first, then activity) */}
                <div className="md:hidden">
                  <div className={`transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    {/* Workspaces section */}
                    <div className="relative flex items-center mb-4">
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                      <div className="mx-3 flex items-center">
                        <span className="bg-gray-50 dark:bg-gray-900/30 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                          <FiCode className="mr-1.5 text-indigo-500 dark:text-indigo-400" />
                          Recent Workspaces
                        </span>
                      </div>
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {roomsWithPresence.map((roomData, index) => renderWorkspaceCard(roomData, index))}
                    </div>
                  </div>
                  
                  {/* Activity section on mobile */}
                  <div className={`transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <div className="relative flex items-center mb-4">
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                      <div className="mx-3 flex items-center">
                        <span className="bg-gray-50 dark:bg-gray-900/30 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                          <FiActivity className="mr-1.5 text-indigo-500 dark:text-indigo-400" />
                          Activity Summary
                        </span>
                      </div>
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                    </div>
                    <ActivityGraph refreshKey={activityRefreshKey} />
                  </div>
                </div>
                
                {/* Desktop layout (original order - activity first, then workspaces) */}
                <div className="hidden md:block">
                  <div className={`transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <div className="relative flex items-center mb-4">
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                      <div className="mx-3 flex items-center">
                        <span className="bg-gray-50 dark:bg-gray-900/30 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                          <FiActivity className="mr-1.5 text-indigo-500 dark:text-indigo-400" />
                          Activity Summary
                        </span>
                      </div>
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                    </div>
                    <ActivityGraph refreshKey={activityRefreshKey} />
                  </div>
                  
                  <div className={`transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    {/* Separator with label */}
                    <div className="relative flex items-center my-6">
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                      <div className="mx-3 flex items-center">
                        <span className="bg-gray-50 dark:bg-gray-900/30 px-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                          <FiCode className="mr-1.5 text-indigo-500 dark:text-indigo-400" />
                          Recent Workspaces
                        </span>
                      </div>
                      <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                    </div>
                    
                    <div className="space-y-3 pb-4">
                      {roomsWithPresence.map((roomData, index) => renderWorkspaceCard(roomData, index))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-center py-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className="relative w-16 h-16 mx-auto mb-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-full blur-md opacity-70"></div>
                  <div className="absolute inset-0 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                    <FiCode className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 transition-colors font-medium text-sm">No recent workspaces found</p>
                <p className="text-xs mt-2 text-gray-500 dark:text-gray-500 transition-colors">Create a new workspace to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Format time ago (e.g., "2 minutes ago", "3 hours ago", "2 days ago")
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'just now';
  }
} 