"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Loader2, AlertCircle, FileText, Server, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LogEntry {
  timestamp?: string;
  level?: string;
  message?: string;
  [key: string]: any;
}

export default function LogsList() {
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState("backend-combined");
  const [logs, setLogs] = useState<{
    "backend-combined": LogEntry[];
    "backend-error": LogEntry[];
    "notify-error": LogEntry[];
    "notify-combined": LogEntry[];
  }>({
    "backend-combined": [],
    "backend-error": [],
    "notify-error": [],
    "notify-combined": [],
  });
  const [isLoading, setIsLoading] = useState<{
    "backend-combined": boolean;
    "backend-error": boolean;
    "notify-error": boolean;
    "notify-combined": boolean;
  }>({
    "backend-combined": false,
    "backend-error": false,
    "notify-error": false,
    "notify-combined": false,
  });
  const [errors, setErrors] = useState<{
    "backend-combined": string | null;
    "backend-error": string | null;
    "notify-error": string | null;
    "notify-combined": string | null;
  }>({
    "backend-combined": null,
    "backend-error": null,
    "notify-error": null,
    "notify-combined": null,
  });

  const apiEndpoints = {
    "backend-combined": {
      url: `${process.env.BACKEND_API_URL || "https://backend.tsmwa.online"}/api/logs/get_logs?type=combined`,
      baseUrl: "backend.tsmwa.online",
    },
    "backend-error": {
      url: `${process.env.BACKEND_API_URL || "https://backend.tsmwa.online"}/api/logs/get_logs?type=error`,
      baseUrl: "backend.tsmwa.online",
    },
    "notify-error": {
      url: `https://notify.tsmwa.online/api/logs?type=error`,
      baseUrl: "notify.tsmwa.online",
    },
    "notify-combined": {
      url: `https://notify.tsmwa.online/api/logs?type=combined`,
      baseUrl: "notify.tsmwa.online",
    },
  };

  const fetchLogs = async (tabKey: keyof typeof apiEndpoints) => {
    // For backend APIs, require authentication
    if (tabKey.startsWith("backend") && (sessionStatus !== "authenticated" || !session?.user?.token)) {
      return;
    }

    setIsLoading((prev) => ({ ...prev, [tabKey]: true }));
    setErrors((prev) => ({ ...prev, [tabKey]: null }));

    try {
      const endpoint = apiEndpoints[tabKey];
      const headers: any = {};
      
      // Only add auth header if we have a token (for backend APIs)
      if (session?.user?.token && tabKey.startsWith("backend")) {
        headers.Authorization = `Bearer ${session.user.token}`;
      }

      const response = await axios.get(endpoint.url, {
        headers,
        // Handle text responses
        responseType: tabKey.startsWith("notify") ? "text" : "json",
      });

      // Handle different response formats
      let logData: LogEntry[] = [];
      
      // If response is plain text (notify APIs)
      if (typeof response.data === "string") {
        const lines = response.data.split("\n").filter((line: string) => line.trim());
        logData = lines.map((line: string) => ({
          message: line,
          raw: line,
          timestamp: line.match(/\[(.*?)\]/)?.[1] || "",
          level: line.includes("ERROR") ? "ERROR" : line.includes("WARN") ? "WARN" : line.includes("INFO") ? "INFO" : undefined,
        }));
      } 
      // If response is an array
      else if (Array.isArray(response.data)) {
        logData = response.data;
      } 
      // If it's an object
      else if (response.data && typeof response.data === "object") {
        logData = [response.data];
      }

      setLogs((prev) => ({ ...prev, [tabKey]: logData }));
    } catch (error: any) {
      console.error(`Error fetching ${tabKey} logs:`, error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data || 
                          error.message || 
                          "Failed to fetch logs";
      setErrors((prev) => ({
        ...prev,
        [tabKey]: typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage),
      }));
      setLogs((prev) => ({ ...prev, [tabKey]: [] }));
    } finally {
      setIsLoading((prev) => ({ ...prev, [tabKey]: false }));
    }
  };

  useEffect(() => {
    // For backend APIs, wait for authentication
    // For notify APIs, we can fetch immediately
    if (activeTab.startsWith("backend")) {
      if (sessionStatus === "authenticated" && session?.user?.token) {
        fetchLogs(activeTab as keyof typeof apiEndpoints);
      }
    } else {
      // Notify APIs can be fetched without waiting for auth
      fetchLogs(activeTab as keyof typeof apiEndpoints);
    }
  }, [sessionStatus, session?.user?.token, activeTab]);

  const formatLogEntry = (entry: LogEntry, index: number): string => {
    if (typeof entry === "string") {
      return entry;
    }
    
    if (entry.raw) {
      return entry.raw;
    }

    if (entry.message) {
      return entry.message;
    }

    if (entry.timestamp && entry.level && entry.message) {
      return `[${entry.timestamp}] ${entry.level}: ${entry.message}`;
    }

    // Fallback: stringify the entire object
    return JSON.stringify(entry, null, 2);
  };

  const renderLogs = (tabKey: keyof typeof apiEndpoints) => {
    if (isLoading[tabKey]) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading logs...</p>
          </div>
        </div>
      );
    }

    if (errors[tabKey]) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-destructive font-medium mb-2">Error</p>
            <p className="text-muted-foreground">{errors[tabKey]}</p>
          </div>
        </div>
      );
    }

    if (logs[tabKey].length === 0) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <FileText className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No logs available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-[65vh] w-full rounded-md border p-4 overflow-y-auto">
        <div className="space-y-2">
          {logs[tabKey].map((entry, index) => (
            <div
              key={index}
              className={`p-3 rounded-md font-mono text-sm ${
                entry.level === "ERROR" || entry.message?.includes("ERROR")
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : entry.level === "WARN" || entry.message?.includes("WARN")
                  ? "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20"
                  : "bg-muted border"
              }`}
            >
              <pre className="whitespace-pre-wrap break-words">
                {formatLogEntry(entry, index)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            System Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="backend-combined" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Backend Combined
              </TabsTrigger>
              <TabsTrigger value="backend-error" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Backend Errors
              </TabsTrigger>
              <TabsTrigger value="notify-combined" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notify Combined
              </TabsTrigger>
              <TabsTrigger value="notify-error" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notify Errors
              </TabsTrigger>
             
            </TabsList>

            <TabsContent value="backend-combined" className="mt-4">
              <div className="mb-2 text-sm text-muted-foreground">
                Logs from: {apiEndpoints["backend-combined"].baseUrl}
              </div>
              {renderLogs("backend-combined")}
            </TabsContent>

            <TabsContent value="backend-error" className="mt-4">
              <div className="mb-2 text-sm text-muted-foreground">
                Error logs from: {apiEndpoints["backend-error"].baseUrl}
              </div>
              {renderLogs("backend-error")}
            </TabsContent>

            <TabsContent value="notify-error" className="mt-4">
              <div className="mb-2 text-sm text-muted-foreground">
                Error logs from: {apiEndpoints["notify-error"].baseUrl}
              </div>
              {renderLogs("notify-error")}
            </TabsContent>

            <TabsContent value="notify-combined" className="mt-4">
              <div className="mb-2 text-sm text-muted-foreground">
                Logs from: {apiEndpoints["notify-combined"].baseUrl}
              </div>
              {renderLogs("notify-combined")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

