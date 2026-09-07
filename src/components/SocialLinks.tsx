import {
  ExternalLink,
  Linkedin,
  Twitter,
  Github,
  Facebook,
  Instagram,
  BookOpen,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialLinksProps {
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  mediumUrl?: string;
  substackUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

export const SocialLinks = ({
  linkedinUrl,
  githubUrl,
  twitterUrl,
  mediumUrl,
  substackUrl,
  facebookUrl,
  instagramUrl,
}: SocialLinksProps) => {
  const links = [
    { url: linkedinUrl, icon: Linkedin, label: "LinkedIn", color: "hover:text-[#0A66C2]" },
    { url: githubUrl, icon: Github, label: "GitHub", color: "hover:text-gray-900" },
    { url: twitterUrl, icon: Twitter, label: "Twitter", color: "hover:text-[#1DA1F2]" },
    { url: mediumUrl, icon: BookOpen, label: "Medium", color: "hover:text-gray-900" },
    { url: substackUrl, icon: FileText, label: "Substack", color: "hover:text-[#FF6719]" },
    { url: facebookUrl, icon: Facebook, label: "Facebook", color: "hover:text-[#1877F2]" },
    { url: instagramUrl, icon: Instagram, label: "Instagram", color: "hover:text-[#E4405F]" },
  ].filter((link) => link.url);

  if (links.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No social profiles available
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 ${link.color} transition-colors`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{link.label}</span>
              <ExternalLink className="h-3 w-3 opacity-50" />
            </Button>
          </a>
        );
      })}
    </div>
  );
};
