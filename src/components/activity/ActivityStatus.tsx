import React from 'react';

/**
 * Get text and style for activity status
 */
export const getActivityDisplay = (status: string) => {
  switch (status) {
    case 'typing':
      return { text: 'Typing...', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' };
    case 'editing':
      return { text: 'Focused', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' };
    case 'selecting':
      return { text: 'Selecting', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' };
    case 'active':
      return { text: 'Focused', className: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' };
    case 'idle':
      return { text: 'Idle', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' };
    case 'away':
      return { text: 'Away', className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' };
    default:
      return { text: 'Offline', className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' };
  }
};

/**
 * Function to determine user activity status based on presence data
 */
export const getUserActivityStatus = (user: any) => {
  if (!user) return 'offline';
  
  const now = Date.now();
  const lastActive = user.lastActivity || 0;
  const timeSinceActive = now - lastActive;
  
  // Check if there's an active selection first
  if (user.selection && 
      (user.selection.startLine !== user.selection.endLine || 
       user.selection.startColumn !== user.selection.endColumn)) {
    return 'selecting';
  }
  
  // Then check active states
  if (user.isTyping) {
    // Use the isTyping flag directly - the timeout will turn this off
    return 'typing';
  } else if (timeSinceActive < 10000) {
    // Active in the last 10 seconds, but not typing - likely just moving cursor
    return 'editing';
  } else if (timeSinceActive < 60000) {
    // Active in the last minute
    return 'active';
  } else if (timeSinceActive < 300000) {
    // Active in the last 5 minutes
    return 'idle';
  } else {
    // Inactive for more than 5 minutes
    return 'away';
  }
};

/**
 * Function to get additional activity info text
 */
export const getActivityDetails = (user: any) => {
  if (!user) return '';
  
  const status = getUserActivityStatus(user);
  
  // For selection, show how many lines are selected
  if (status === 'selecting' && user.selection) {
    const lineCount = Math.abs(user.selection.endLine - user.selection.startLine) + 1;
    return `${lineCount} line${lineCount !== 1 ? 's' : ''} selected`;
  }
  
  // For typing/editing, show the line number they're on
  if (['typing', 'editing', 'active'].includes(status) && user.cursor) {
    return `Line ${user.cursor.line}`;
  }
  
  // For idle/away, show when they were last active
  if (['idle', 'away'].includes(status) && user.lastActivity) {
    const now = Date.now();
    const lastActive = user.lastActivity;
    const timeDiff = now - lastActive;
    
    if (timeDiff < 60000) {
      return 'Active moments ago';
    } else if (timeDiff < 3600000) {
      const minutes = Math.floor(timeDiff / 60000);
      return `Active ${minutes} min${minutes !== 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(timeDiff / 3600000);
      return `Active ${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
  }
  
  return '';
}; 