// components/admin/PrintButton.tsx
"use client";

import React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintButtonProps {
  targetId?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function PrintButton({ 
  targetId, 
  label = "Print", 
  variant = "outline", 
  size = "default" 
}: PrintButtonProps) {
  
  const handlePrint = () => {
    if (targetId) {
      const printContent = document.getElementById(targetId);
      if (printContent) {
        const originalContent = document.body.innerHTML;
        const printHtml = printContent.innerHTML;
        
        // Temporarily replace body for printing
        document.body.innerHTML = `
          <div class="print-container">
            ${printHtml}
          </div>
        `;
        
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Necessary to restore React event listeners
      } else {
        window.print();
      }
    } else {
      window.print();
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handlePrint} className="no-print">
      <Printer className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
