// Types for health check API response
export interface HealthCheckResponse {
  status: string;
  uptime: number;
  timestamp: string;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: {
    cpuPercent: number;
    loadavg: number[];
    cpus: {
      model: string;
      speed: number;
      times: {
        user: number;
        nice: number;
        sys: number;
        idle: number;
        irq: number;
      };
    }[];
  };
  disk: {
    ok: boolean;
    message: string;
    available: number;
    free: number;
    total: number;
  };
  redis: {
    ok: boolean;
    message: string;
  };
  db: {
    ok: boolean;
    message: string;
  };
  environment: string;
}

// Function to fetch health check data
export async function fetchHealthCheckData(): Promise<HealthCheckResponse> {
  try {
    const response = await fetch(
      `${process.env.BACKEND_API_URL}/api/health/check`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch health check data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching health check data:", error);
    // Return default values in case of error
    return {
      status: "ERROR",
      uptime: 0,
      timestamp: new Date().toISOString(),
      memoryUsage: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 },
      cpuUsage: { cpuPercent: 0, loadavg: [0, 0, 0], cpus: [] },
      disk: {
        ok: false,
        message: "Failed to check disk",
        available: 0,
        free: 0,
        total: 0,
      },
      redis: { ok: false, message: "Failed to check Redis" },
      db: { ok: false, message: "Failed to check database" },
      environment: "unknown",
    };
  }
}

// Helper function to format bytes to human-readable format
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
}

// Helper function to format uptime to human-readable format
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);

  return parts.join(", ");
}

// Calculate disk usage percentage
export function calculateDiskUsagePercentage(
  used: number,
  total: number
): number {
  return Math.round((used / total) * 100);
}

// Calculate memory usage percentage
export function calculateMemoryUsagePercentage(
  used: number,
  total: number
): number {
  return Math.round((used / total) * 100);
}
