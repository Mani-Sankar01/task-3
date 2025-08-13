"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  Calendar,
  Phone,
  Mail,
  User,
  Edit,
  ArrowLeft,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Download,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { downloadFile } from "@/lib/client-file-upload";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/client-file-upload";
import Link from "next/link";
import { renderRoleBasedPath } from "@/lib/utils";

interface LabourDetailsProps {
  labour: any;
  refetchLabour?: () => Promise<void>;
}

export default function LabourDetails({
  labour,
  refetchLabour,
}: LabourDetailsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();

  // Debug: Log labour data structure
  useEffect(() => {
    console.log("Labour data:", labour);
    console.log("Additional documents:", labour?.laboursAdditionalDocs);
  }, [labour]);

  // Document management state
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [editPrimaryDoc, setEditPrimaryDoc] = useState<{
    type: string;
    path: string;
  } | null>(null);
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const [filePathForUpload, setFilePathForUpload] = useState<string | null>(
    null
  );

  const handleEdit = () => {
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/labour/${
        labour.labourId
      }/edit`
    );
  };

  const handleBack = () => {
    router.push(`/${renderRoleBasedPath(session?.user?.role)}/labour`);
  };

  // Add or Edit Document
  const handleDocSubmit = async () => {
    setDocLoading(true);
    setDocError("");
    try {
      let filePath = editDoc?.documentPath || "";
      if (docFile) {
        const upload = await uploadFile(docFile, "documents");
        if (!upload.success || !upload.filePath) {
          setDocError(upload.error || "File upload failed");
          setDocLoading(false);
          return;
        }
        filePath = upload.filePath;
      }

      let payload: any = { labourId: labour.labourId };

      if (editPrimaryDoc) {
        // Editing primary document (photo or aadhar)
        if (editPrimaryDoc.type === "photo") {
          payload.photoPath = filePath;
        } else if (editPrimaryDoc.type === "aadhar") {
          payload.aadharPath = filePath;
        }
      } else if (editDoc) {
        // Editing additional document
        payload.updateAdditionalDocs = [
          {
            id: editDoc.id,
            docName: docName,
            docFilePath: filePath,
          },
        ];
      } else {
        // Adding new additional document
        payload.newAdditionalDocs = [
          {
            docName: docName,
            docFilePath: filePath,
          },
        ];
      }

      if (!session?.user.token) throw new Error("No auth token");

      const response = await axios.post(
        `${
          process.env.BACKEND_API_URL || "https://tsmwa.online"
        }/api/labour/update_labour`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error("Failed to update labour document");
      }

      setShowDocDialog(false);
      setEditPrimaryDoc(null);
      toast({
        title:
          editDoc || editPrimaryDoc ? "Document updated" : "Document added",
        description: `The document was successfully ${
          editDoc || editPrimaryDoc ? "updated" : "added"
        }.`,
        variant: "default",
      });

      if (refetchLabour) {
        await refetchLabour();
      }
    } catch (err: any) {
      setDocError(err.message || "Failed to update document");
      toast({
        title: "Error",
        description: err.message || "Failed to update document",
        variant: "destructive",
      });
    } finally {
      setDocLoading(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (doc: any) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    setDocLoading(true);
    setDocError("");

    if (!session?.user.token) {
      toast({
        title: "Error",
        description: "No auth token found. Please login again.",
        variant: "destructive",
      });
      setDocLoading(false);
      return;
    }

    try {
      const payload = {
        labourId: labour.labourId,
        deleteAdditionalDocs: [{ id: doc.id }],
      };

      const response = await axios.post(
        `${
          process.env.BACKEND_API_URL || "https://tsmwa.online"
        }/api/labour/update_labour`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error("Failed to delete document");
      }

      toast({
        title: "Document deleted",
        description: "The document was successfully deleted.",
        variant: "default",
      });

      if (refetchLabour) {
        await refetchLabour();
      }
    } catch (err: any) {
      setDocError(err.message || "Failed to delete document");
      toast({
        title: "Error",
        description: err.message || "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setDocLoading(false);
    }
  };

  const openAddDoc = () => {
    setEditDoc(null);
    setEditPrimaryDoc(null);
    setDocName("");
    setDocFile(null);
    setFilePathForUpload(null);
    setShowDocDialog(true);
  };

  const openEditDoc = (doc: any) => {
    console.log("Editing document:", doc);
    setEditDoc(doc);
    setEditPrimaryDoc(null);
    // Try different possible field names for document name
    const docName = doc.documentName || doc.docName || doc.name || "";
    setDocName(docName);
    setDocFile(null);
    // Try different possible field names for document path
    const docPath =
      doc.documentPath || doc.docFilePath || doc.filePath || doc.path || "";
    setFilePathForUpload(docPath || null);
    setShowDocDialog(true);
  };

  const openEditPrimaryDoc = (type: string, path: string) => {
    setEditPrimaryDoc({ type, path });
    setEditDoc(null);
    setDocName(type === "photo" ? "Photo" : "Aadhar Card");
    setDocFile(null);
    setFilePathForUpload(path || null);
    setShowDocDialog(true);
  };

  const closeDocDialog = () => {
    setShowDocDialog(false);
    setEditDoc(null);
    setEditPrimaryDoc(null);
  };

  // Helper for pretty date
  const prettyDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Download function
  const handleDownloadFile = async (filePath: string) => {
    try {
      // Extract filename from path
      const filename = filePath.split("/").pop() || "document";
      console.log("Downloading file:", filename, "from path:", filePath);

      const blob = await downloadFile(filename);
      if (blob) {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Download Successful",
          description: `File ${filename} downloaded successfully.`,
        });
      } else {
        toast({
          title: "Download Failed",
          description: "Could not download the file. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "An error occurred while downloading the file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Labour Details</h1>
        </div>
        <Link href={`/admin/labour/${labour.labourId}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={`${process.env.BACKEND_API_URL || "https://tsmwa.online"}${
                  labour.photoPath
                }`}
                alt={labour.fullName}
              />
              <AvatarFallback>{labour.fullName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{labour.fullName}</CardTitle>
                  <Badge
                    variant={
                      labour.labourStatus === "ACTIVE"
                        ? "default"
                        : labour.labourStatus === "BENCH"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {labour.labourStatus?.charAt(0).toUpperCase() +
                      labour.labourStatus?.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <CardDescription>
                  {labour.labourAssignedTo?.firmName
                    ? `Currently working at ${labour.labourAssignedTo.firmName}`
                    : "Not currently assigned"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Father's Name: {labour.fatherName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Date of Birth:{" "}
                    {labour.dob
                      ? new Date(labour.dob).toLocaleDateString()
                      : "Not provided"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Phone: {labour.phoneNumber}</span>
                </div>
                {labour.emailId && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>Email: {labour.emailId}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Aadhar Number: {labour.aadharNumber}</span>
                </div>
                {labour.panNumber && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>PAN Number: {labour.panNumber}</span>
                  </div>
                )}
                {labour.esiNumber && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>ESI Number: {labour.esiNumber}</span>
                  </div>
                )}
                {labour.eShramId && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>E-Shram ID: {labour.eShramId}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="employment" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employment">Employment History</TabsTrigger>
            <TabsTrigger value="address">Address Information</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="employment">
            <Card>
              <CardHeader>
                <CardTitle>Employment History</CardTitle>
                <CardDescription>
                  Record of all employment history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Industry</TableHead>
                      <TableHead>From Date</TableHead>
                      <TableHead>To Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labour.LabourHistory && labour.LabourHistory.length > 0 ? (
                      labour.LabourHistory.map((employment: any) => (
                        <TableRow key={employment.Id}>
                          <TableCell className="font-medium">
                            {employment.assignedTo}
                          </TableCell>
                          <TableCell>
                            {new Date(employment.fromDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {employment.toDate
                              ? new Date(employment.toDate).toLocaleDateString()
                              : "Current"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                employment.labourStatus === "ACTIVE"
                                  ? "default"
                                  : employment.labourStatus === "BENCH"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {employment.labourStatus
                                ?.charAt(0)
                                .toUpperCase() +
                                employment.labourStatus?.slice(1).toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {employment.reasonForTransfer || "N/A"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No employment history found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
                <CardDescription>
                  Permanent and present addresses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <MapPin className="mr-2 h-4 w-4" /> Permanent Address
                    </h3>
                    <p className="text-muted-foreground">
                      {labour.permanentAddress || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <MapPin className="mr-2 h-4 w-4" /> Present Address
                    </h3>
                    <p className="text-muted-foreground">
                      {labour.presentAddress || "Not provided"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    All uploaded documents and identification
                  </CardDescription>
                </div>
                <Button onClick={openAddDoc}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Primary Documents */}
                  <div>
                    <h3 className="font-medium mb-4">Primary Documents</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document Name</TableHead>
                          <TableHead>File Path</TableHead>
                          <TableHead>Upload Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Photo */}
                        <TableRow>
                          <TableCell className="font-medium">Photo</TableCell>
                          <TableCell>{labour.photoPath || "-"}</TableCell>
                          <TableCell>
                            {labour.createdAt
                              ? prettyDate(labour.createdAt)
                              : "-"}
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openEditPrimaryDoc("photo", labour.photoPath)
                              }
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadFile(labour.photoPath)
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {/* Aadhar Card */}
                        <TableRow>
                          <TableCell className="font-medium">
                            Aadhar Card
                          </TableCell>
                          <TableCell>{labour.aadharPath || "-"}</TableCell>
                          <TableCell>
                            {labour.createdAt
                              ? prettyDate(labour.createdAt)
                              : "-"}
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openEditPrimaryDoc("aadhar", labour.aadharPath)
                              }
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadFile(labour.aadharPath)
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Additional Documents */}
                  <div>
                    <h3 className="font-medium mb-4">Additional Documents</h3>
                    {labour.laboursAdditionalDocs &&
                    labour.laboursAdditionalDocs.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Document Name</TableHead>
                            <TableHead>File Path</TableHead>
                            <TableHead>Upload Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {labour.laboursAdditionalDocs.map((doc: any) => {
                            console.log("Document data:", doc);
                            // Try different possible field names for document name
                            const docName =
                              doc.documentName ||
                              doc.docName ||
                              doc.name ||
                              "Document";
                            // Try different possible field names for document path
                            const docPath =
                              doc.documentPath ||
                              doc.docFilePath ||
                              doc.filePath ||
                              doc.path ||
                              "-";
                            return (
                              <TableRow key={doc.id}>
                                <TableCell className="font-medium">
                                  {docName}
                                </TableCell>
                                <TableCell>{docPath}</TableCell>
                                <TableCell>
                                  {doc.createdAt
                                    ? prettyDate(doc.createdAt)
                                    : "-"}
                                </TableCell>
                                <TableCell className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDoc(doc)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteDoc(doc)}
                                    disabled={docLoading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadFile(docPath)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No additional documents uploaded yet.</p>
                        <p className="text-sm">
                          Click "Add Document" to upload additional files.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add/Edit Document Dialog */}
            <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editDoc || editPrimaryDoc
                      ? "Edit Document"
                      : "Add Document"}
                  </DialogTitle>
                  <DialogDescription>
                    {editDoc || editPrimaryDoc
                      ? "Update the document information"
                      : "Upload a new document for this labour"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {!editPrimaryDoc && (
                    <div>
                      <Label htmlFor="docName">Document Name</Label>
                      <Input
                        id="docName"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder="Enter document name"
                      />
                    </div>
                  )}
                  <div>
                    <Label>File</Label>
                    <FileUpload
                      onFileSelect={setDocFile}
                      onUploadComplete={() => {}}
                      onUploadError={setDocError}
                      subfolder={
                        editPrimaryDoc?.type === "photo"
                          ? "photos"
                          : "documents"
                      }
                      accept={
                        editPrimaryDoc?.type === "photo"
                          ? ".jpg,.jpeg,.png"
                          : ".pdf,.jpg,.jpeg,.png"
                      }
                      existingFilePath={filePathForUpload ?? undefined}
                      onDownload={handleDownloadFile}
                      onRemoveFile={() => setFilePathForUpload(null)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={closeDocDialog}
                    disabled={docLoading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleDocSubmit} disabled={docLoading}>
                    {editDoc || editPrimaryDoc
                      ? "Save Changes"
                      : "Add Document"}
                  </Button>
                </DialogFooter>
                {docError && (
                  <div className="text-red-500 text-sm mt-2">{docError}</div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
