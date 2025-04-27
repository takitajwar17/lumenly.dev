import React from "react";

interface LogoIconProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  animated?: boolean;
  className?: string;
  useResponsive?: boolean;
}

/**
 * Reusable LogoIcon component that displays the Lumenly SVG logo
 * with optional animation effects
 */
const LogoIcon: React.FC<LogoIconProps> = ({ 
  size = "md", 
  animated = true,
  className = "",
  useResponsive = false
}) => {
  // Calculate size in pixels based on named size or use provided number
  const getSizeInPixels = () => {
    if (typeof size === "number") return size;
    
    switch (size) {
      case "xs": return 16;
      case "sm": return 24;
      case "md": return 32;
      case "lg": return 48;
      case "xl": return 64;
      default: return 32;
    }
  };
  
  const sizeInPx = getSizeInPixels();
  
  // Only apply fixed sizing when not using responsive mode
  const sizeStyles = useResponsive ? {} : { width: sizeInPx, height: sizeInPx };
  
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${animated ? 'hover-float' : ''} ${className}`}
      style={sizeStyles}
    >
      {/* Optional shadow for 3D effect */}
      <div className="absolute inset-0 blur-md opacity-20 bg-indigo-500 dark:bg-indigo-400 rounded-full -z-10 transform scale-90"></div>
      
      {/* The logo */}
      <img 
        src="/favicon.svg" 
        alt="Lumenly Logo" 
        className="w-full h-full"
        aria-hidden="true"
      />
    </div>
  );
};

export default LogoIcon; 