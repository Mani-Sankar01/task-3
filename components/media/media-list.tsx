"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  ArrowUpDown,
  Search,
  Loader2,
  Download,
  Eye,
  Trash2,
  Upload,
  CheckSquare,
  Square,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface MediaFile {
  filename: string;
  size: number;
  created: string;
  modified: string;
}

export default function MediaList() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<
    "filename" | "size" | "created" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [singleDeleteDialogOpen, setSingleDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const itemsPerPage = 10;

  // API token for documents service
  const DOCUMENTS_API_TOKEN = "your-secret-api-token-2024";
  const DOCUMENTS_API_URL =
    process.env.NEXT_PUBLIC_DOCUMENTS_API_URL || "https://documents.tsmwa.online";

  // Fetch files from API
  const fetchFiles = async () => {
    if (status === "loading") {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${DOCUMENTS_API_URL}/files`, {
        headers: {
          "x-api-token": DOCUMENTS_API_TOKEN,
        },
      });

      const filesData = response.data.files || [];
      setFiles(filesData);
    } catch (error: any) {
      console.error("Error fetching files:", error);
      toast({
        title: "Error",
        description: "Failed to fetch files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [status]);

  // Filter files based on search term
  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort files if a sort field is selected
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (!sortField) return 0;

    let valueA: string | number = "";
    let valueB: string | number = "";

    switch (sortField) {
      case "filename":
        valueA = a.filename;
        valueB = b.filename;
        break;
      case "size":
        valueA = a.size;
        valueB = b.size;
        break;
      case "created":
        valueA = new Date(a.created).getTime();
        valueB = new Date(b.created).getTime();
        break;
      default:
        return 0;
    }

    if (valueA < valueB) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Paginate the sorted files
  const paginatedFiles = sortedFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate total pages
  const totalPages = Math.ceil(sortedFiles.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: "filename" | "size" | "created") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Handle file selection
  const handleSelectFile = (filename: string) => {
    setSelectedFiles((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === paginatedFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(paginatedFiles.map((f) => f.filename));
    }
  };

  // Handle download
  const handleDownload = async (filename: string) => {
    try {
      setIsDownloading(true);
      const response = await axios.get(
        `${DOCUMENTS_API_URL}/download/${filename}`,
        {
          headers: {
            "x-api-token": DOCUMENTS_API_TOKEN,
          },
          responseType: "blob",
        }
      );

      // Create a blob from the response
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${filename}...`,
      });
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle view (open in new tab)
  const handleView = async (filename: string) => {
    try {
      setIsDownloading(true);
      const response = await axios.get(
        `${DOCUMENTS_API_URL}/download/${filename}`,
        {
          headers: {
            "x-api-token": DOCUMENTS_API_TOKEN,
          },
          responseType: "blob",
        }
      );

      // Create a blob with the correct MIME type
      const mimeType = getMimeType(filename);
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab
      const newWindow = window.open(url, "_blank");
      
      if (newWindow) {
        // Revoke URL after the window is opened
        newWindow.onload = () => {
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        };
      } else {
        // If popup was blocked, revoke immediately
        window.URL.revokeObjectURL(url);
        toast({
          title: "View Failed",
          description: "Popup blocked. Please allow popups for this site.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Opening File",
        description: `Opening ${filename} in new tab...`,
      });
    } catch (error: any) {
      console.error("Error viewing file:", error);
      toast({
        title: "View Failed",
        description: "Failed to open file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle single delete dialog
  const openDeleteDialog = (filename: string) => {
    setFileToDelete(filename);
    setSingleDeleteDialogOpen(true);
  };

  const confirmSingleDelete = async () => {
    if (!fileToDelete) return;

    try {
      setIsDeleting(true);
      await axios.delete(`${DOCUMENTS_API_URL}/delete/${fileToDelete}`, {
        headers: {
          "x-api-token": DOCUMENTS_API_TOKEN,
        },
      });

      toast({
        title: "File Deleted",
        description: `${fileToDelete} has been deleted successfully.`,
      });

      // Remove from local state
      setFiles((prevFiles) =>
        prevFiles.filter((file) => file.filename !== fileToDelete)
      );
      setSelectedFiles((prev) => prev.filter((f) => f !== fileToDelete));
      setSingleDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast({
        title: "Delete Failed",
        description: error.response?.data?.message || "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle multiple delete
  const handleDeleteMultiple = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select files to delete.",
        variant: "destructive",
      });
      return;
    }

    setDeleteDialogOpen(true);
  };

  const confirmDeleteMultiple = async () => {
    try {
      setIsDeleting(true);
      
      // Delete all selected files
      const deletePromises = selectedFiles.map((filename) =>
        axios.delete(`${DOCUMENTS_API_URL}/delete/${filename}`, {
          headers: {
            "x-api-token": DOCUMENTS_API_TOKEN,
          },
        })
      );

      await Promise.all(deletePromises);

      toast({
        title: "Files Deleted",
        description: `${selectedFiles.length} file(s) have been deleted successfully.`,
      });

      // Remove from local state
      setFiles((prevFiles) =>
        prevFiles.filter((file) => !selectedFiles.includes(file.filename))
      );
      setSelectedFiles([]);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting files:", error);
      toast({
        title: "Delete Failed",
        description: "Some files could not be deleted. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Get file extension
  const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toUpperCase() || "FILE";
  };

  // Get MIME type from file extension
  const getMimeType = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      bmp: "image/bmp",
      webp: "image/webp",
      svg: "image/svg+xml",
    };
    return mimeTypes[extension] || "application/octet-stream";
  };

  // Check if file is viewable (PDF or image)
  const isViewable = (filename: string): boolean => {
    const extension = getFileExtension(filename).toLowerCase();
    const viewableExtensions = ["pdf", "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    return viewableExtensions.includes(extension);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">Loading files...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Media Files</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all uploaded documents and media files
              </p>
            </div>
            <div className="flex gap-2">
              {selectedFiles.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteMultiple}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedFiles.length})
                </Button>
              )}
              <Button
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    setIsLoading(true);
                    const formData = new FormData();
                    formData.append("file", file);

                    await axios.post(`${DOCUMENTS_API_URL}/upload`, formData, {
                      headers: {
                        "x-api-token": DOCUMENTS_API_TOKEN,
                        "Content-Type": "multipart/form-data",
                      },
                    });

                    toast({
                      title: "Upload Successful",
                      description: `${file.name} has been uploaded successfully.`,
                    });

                    // Refresh file list
                    await fetchFiles();
                  } catch (error: any) {
                    console.error("Error uploading file:", error);
                    toast({
                      title: "Upload Failed",
                      description:
                        error.response?.data?.message ||
                        "Failed to upload file. Please try again.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsLoading(false);
                    e.target.value = "";
                  }
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        paginatedFiles.length > 0 &&
                        selectedFiles.length === paginatedFiles.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("filename")}
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("created")}
                  >
                    <div className="flex items-center">
                      Created
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("size")}
                  >
                    <div className="flex items-center">
                      Size
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFiles.length > 0 ? (
                  paginatedFiles.map((file, index) => (
                    <TableRow key={file.filename}>
                      <TableCell>
                        <Checkbox
                          checked={selectedFiles.includes(file.filename)}
                          onCheckedChange={() =>
                            handleSelectFile(file.filename)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {file.filename}
                      </TableCell>
                      <TableCell>
                        {format(new Date(file.created), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getFileExtension(file.filename)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isViewable(file.filename) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(file.filename)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(file.filename)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(file.filename)}
                            disabled={isDeleting}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No files found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {paginatedFiles.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {paginatedFiles.length} of {filteredFiles.length} files
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center justify-center text-sm font-medium">
                  Page {currentPage} of {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Files</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedFiles.length} file(s)?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant="destructive"
                onClick={confirmDeleteMultiple}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={singleDeleteDialogOpen} onOpenChange={setSingleDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {fileToDelete || "this file"}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant="destructive"
                onClick={confirmSingleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

