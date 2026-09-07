import { Bot } from "lucide-react";

interface JoanAvatarProps {
  size?: "sm" | "md" | "lg";
  showPulse?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-2xl",
};

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 28,
};

export const JoanAvatar = ({
  size = "md",
  showPulse = true,
  className = "",
}: JoanAvatarProps) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Pulse animation ring */}
      {showPulse && (
        <div className="absolute inset-0 animate-ping opacity-75">
          <div
            className={`${sizeClasses[size]} rounded-full bg-accent/30`}
          />
        </div>
      )}

      {/* Avatar container */}
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-accent-foreground font-semibold shadow-elevated relative z-10 transition-transform hover:scale-105`}
      >
        {/* Option 1: Bot icon */}
        <Bot size={iconSizes[size]} className="animate-pulse" />

        {/* Option 2: "J" initial (uncomment to use instead of icon) */}
        {/* <span>J</span> */}
      </div>

      {/* Active indicator dot */}
      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-background z-20" />
    </div>
  );
};
