import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PopupMessageProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  primaryButton?: {
    text: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  secondaryButton?: {
    text: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  showCloseButton?: boolean;
}

const PopupMessage: React.FC<PopupMessageProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  primaryButton,
  secondaryButton,
  showCloseButton = true,
}) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "error":
        return <XCircle className="h-12 w-12 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-12 w-12 text-yellow-500" />;
      case "info":
        return <Info className="h-12 w-12 text-blue-500" />;
      default:
        return <Info className="h-12 w-12 text-blue-500" />;
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <DialogTitle className={cn("text-xl font-semibold text-center", getTitleColor())}>
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center">
          <p className="text-muted-foreground mb-6">{message}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {secondaryButton && (
              <Button
                variant={secondaryButton.variant || "outline"}
                onClick={secondaryButton.onClick}
                className="flex-1 sm:flex-none"
              >
                {secondaryButton.text}
              </Button>
            )}
            
            {primaryButton && (
              <Button
                variant={primaryButton.variant || "default"}
                onClick={primaryButton.onClick}
                className="flex-1 sm:flex-none"
              >
                {primaryButton.text}
              </Button>
            )}
            
            {showCloseButton && !primaryButton && !secondaryButton && (
              <Button onClick={onClose} className="flex-1 sm:flex-none">
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PopupMessage; 