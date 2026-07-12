"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 5 * 60 * 1000; // 5 minutes before timeout
const WARNING_START_MS = TIMEOUT_MS - WARNING_MS; // 25 minutes

export function SessionTimeoutWarning() {
  const router = useRouter();
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [minutesRemaining, setMinutesRemaining] = useState(5);

  const updateActivity = useCallback(() => {
    // Only update activity if warning is not currently showing
    if (!showWarning) {
      setLastActivity(Date.now());
    }
  }, [showWarning]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [updateActivity]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivity;

      if (idleTime >= TIMEOUT_MS) {
        // Timeout exceeded
        handleLogout();
      } else if (idleTime >= WARNING_START_MS) {
        // Warning zone
        setShowWarning(true);
        const remaining = Math.ceil((TIMEOUT_MS - idleTime) / 60000);
        setMinutesRemaining(remaining);
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [lastActivity]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    setLastActivity(Date.now());
  };

  return (
    <Dialog open={showWarning} onOpenChange={(open) => !open && handleStayLoggedIn()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Timeout Warning</DialogTitle>
          <DialogDescription>
            Your session expires in {minutesRemaining} minute{minutesRemaining !== 1 && "s"} due to inactivity. 
            Stay logged in?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleLogout}>
            Log Out Now
          </Button>
          <Button onClick={handleStayLoggedIn} className="bg-[#1E3A5F] text-white hover:bg-[#0F2A4A]">
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
