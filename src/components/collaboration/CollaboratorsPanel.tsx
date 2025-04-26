import React from 'react';
import { FiUsers } from 'react-icons/fi';
import { getUserActivityStatus, getActivityDisplay, getActivityDetails } from '../activity/ActivityStatus';

interface CollaboratorsPanelProps {
  presence: any[];
  activityLog: Array<{
    type: 'join' | 'leave' | 'system';
    user: any;
    timestamp: number;
    message?: string;
  }>;
  onClearActivityLog: () => void;
}

export default function CollaboratorsPanel({ 
  presence, 
  activityLog, 
  onClearActivityLog 
}: CollaboratorsPanelProps) {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-colors">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 transition-colors">
        <h3 className="font-semibold text-gray-900 dark:text-white transition-colors flex items-center">
          <FiUsers className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
          Collaborators
          {presence && presence.length > 0 && (
            <span className="ml-2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full px-2 py-0.5 transition-colors">
              {presence.length}
            </span>
          )}
        </h3>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {presence && presence.length > 0 ? (
          <div className="space-y-3">
            {presence.map((user) => {
              const activityStatus = getUserActivityStatus(user);
              const activityDisplay = getActivityDisplay(activityStatus);
              
              return (
                <div 
                  key={user._id} 
                  className={`flex items-center gap-3 p-2.5 rounded-lg ${
                    user.isCurrentUser 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700'
                  } transition-colors`}
                >
                  <div className="relative">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" 
                      style={{ 
                        backgroundColor: user.color ? `${user.color}20` : 'rgba(99, 102, 241, 0.1)', 
                        color: user.color || '#6366F1'
                      }}
                    >
                      <span className="text-sm font-medium" style={{ color: user.color || 'inherit' }}>
                        {user.isAnonymous && user.nickname
                          ? user.nickname.substring(0, 2)
                          : user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div 
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 transition-colors ${
                        activityStatus === 'typing' || activityStatus === 'editing' || activityStatus === 'active'
                          ? 'bg-green-400 dark:bg-green-500' 
                          : activityStatus === 'selecting' || activityStatus === 'idle'
                            ? 'bg-yellow-400 dark:bg-yellow-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                      }`} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate transition-colors flex items-center">
                      {user.isAnonymous && user.nickname
                        ? user.nickname
                        : (user.name.includes('@') 
                            ? user.name.split('@')[0]
                            : user.name)
                      }
                      {user.isCurrentUser && (
                        <span className="ml-2 text-xs text-indigo-500 dark:text-indigo-400 font-normal">(you)</span>
                      )}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 transition-colors">
                      <span className={`inline-flex items-center rounded-full text-[10px] px-1.5 py-0.5 ${activityDisplay.className}`}>
                        {activityDisplay.text}
                      </span>
                      
                      <span className="ml-2 text-gray-400 dark:text-gray-500">
                        {getActivityDetails(user)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiUsers className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600 transition-colors" />
            <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">No active collaborators</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 transition-colors">
              Share the room code to invite others
            </p>
          </div>
        )}
      </div>
      
      {/* Activity Feed */}
      {presence && presence.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 transition-colors max-h-48 overflow-auto">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 transition-colors flex justify-between items-center">
            <span>Activity</span>
            {activityLog.length > 0 && (
              <button 
                onClick={onClearActivityLog} 
                className="text-xs text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                title="Clear activity log"
              >
                Clear
              </button>
            )}
          </h4>
          <div className="space-y-2 text-xs">
            {activityLog.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 italic">No recent activity</p>
            ) : (
              activityLog.map((activity, index) => {
                const time = new Date(activity.timestamp);
                const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                if (activity.type === 'system') {
                  return (
                    <div key={`system-${index}`} className="flex items-center py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-300">{activity.message}</span>
                      <span className="text-gray-400 dark:text-gray-500 ml-auto text-[10px]">{timeString}</span>
                    </div>
                  );
                }
                
                const user = activity.user;
                if (!user) return null;
                
                const displayName = user.isAnonymous && user.nickname 
                  ? user.nickname 
                  : (user.name.includes('@') ? user.name.split('@')[0] : user.name);
                  
                return (
                  <div key={`${activity.type}-${user._id}-${activity.timestamp}`} className="flex items-center py-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      activity.type === 'join' ? 'bg-green-500' : 'bg-gray-400'
                    } mr-2`}></div>
                    <span 
                      className="text-gray-600 dark:text-gray-300 font-medium"
                      style={{ color: user.color ? user.color : undefined }}
                    >
                      {displayName}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      {activity.type === 'join' ? 'joined' : 'left'}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 ml-auto text-[10px]">{timeString}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
} 