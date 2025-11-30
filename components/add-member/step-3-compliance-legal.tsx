"use client";

import { useFormContext } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import axios from "axios";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { downloadFile } from "@/lib/client-file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Step3ComplianceLegalProps {
  isEditMode?: boolean;
  validationErrors?: {
    gstinNo?: string;
    factoryLicenseNo?: string;
    tspcbOrderNo?: string;
    mdlNo?: string;
    udyamCertificateNo?: string;
  };
  validationSuccess?: {
    gstinNo?: string;
    factoryLicenseNo?: string;
    tspcbOrderNo?: string;
    mdlNo?: string;
    udyamCertificateNo?: string;
  };
  onFieldChange?: (fieldName: string, value: string) => void;
}

export default function Step3ComplianceLegal({ 
  isEditMode, 
  validationErrors, 
  validationSuccess, 
  onFieldChange 
}: Step3ComplianceLegalProps) {
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [gstDetails, setGstDetails] = useState<{
    name: string;
    address: string;
    GSTmemstatus: string;
    tradeName: string;
  } | null>(null);
  const [gstError, setGstError] = useState<string | null>(null);

  const { control, watch } = useFormContext();
  const gstinNo = watch("complianceDetails.gstinNo");

  const handleGstVerify = async () => {
    if (!gstinNo?.trim()) {
      setGstError("Please enter GSTIN number");
      return;
    }

    setIsVerifying(true);
    setGstError(null);
    setGstDetails(null);
    setShowVerifyDialog(true);

    try {
      // In Next.js, client components can only access NEXT_PUBLIC_ prefixed env variables
      const gstBackendUrl = process.env.NEXT_PUBLIC_GST_BACKEND_URL || "";
      if (!gstBackendUrl) {
        throw new Error("GST Backend URL is not configured.");
      }

      const apiUrl = `${gstBackendUrl}/api/search?gstin=${encodeURIComponent(gstinNo.trim())}`;
      console.log("Calling GST API:", apiUrl);

      const response = await axios.get(apiUrl);

      console.log("GST API Response:", response.data);

      if (response.data?.result?.status_cd === "1" && response.data?.result?.data) {
        const data = response.data.result.data;
        
        // Extract name
        const name = data.lgnm || "N/A";
        const tradeName = data.tradename || "N/A";
        // Format address from pradr.addr
        const addr = data.pradr?.addr;
        let address = "N/A";
        if (addr) {
          const addressParts = [
            addr.bno,
            addr.bnm,
            addr.st,
            addr.loc,
            addr.locality,
            addr.dst,
            addr.stcd,
            addr.pncd
          ].filter(Boolean);
          address = addressParts.join(", ");

        }

        setGstDetails({ name, tradeName, address, GSTmemstatus: data.sts || "N/A" });
      } else {
        throw new Error(response.data?.result?.status_desc || "Failed to fetch GST details");
      }
    } catch (error: any) {
      console.error("GST Verification Error:", error);
      setGstError(
        error.response?.data?.result?.status_desc ||
        error.message ||
        "Failed to verify GSTIN. Please try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Watch for isExpirable flags
  const factoryLicenseIsExpirable = watch("complianceDetails.factoryLicenseIsExpirable");
  const tspcbIsExpirable = watch("complianceDetails.tspcbIsExpirable");
  const mdlIsExpirable = watch("complianceDetails.mdlIsExpirable");
  const udyamIsExpirable = watch("complianceDetails.udyamIsExpirable");

  // Partner details field array
  const partnerArray = useFieldArray({
    control,
    name: "representativeDetails.partners",
  });

  const handleDownload = async (filePath: string) => {
    try {
      // Extract filename from path
      const filename = filePath.split('/').pop() || 'document';
      console.log('Downloading file:', filename, 'from path:', filePath);
      
      const blob = await downloadFile(filename);
      if (blob) {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Download failed: Could not get file blob');
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Registration & Compliance Numbers */}
      <div style={isEditMode ? { display: 'none' } : {}}>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Registration & Compliance Numbers
        </h3>
        <div className="space-y-6">
          {/* GSTIN */}
          <div className="space-y-4">
            <FormField
              control={control}
              name="complianceDetails.gstinNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-tooltip="GSTIN number should be unique">
                    GSTIN No
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl className="flex-1">
                      <Input 
                        placeholder="Enter GSTIN number" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          onFieldChange?.('gstinNo', e.target.value);
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleGstVerify}
                      disabled={!field.value}
                      className="whitespace-nowrap"
                    >
                      Validate
                    </Button>
                  </div>
                  <FormMessage />
                  {validationErrors?.gstinNo && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.gstinNo}</p>
                  )}
                  {validationSuccess?.gstinNo && (
                    <p className="text-sm text-green-600 mt-1">{validationSuccess.gstinNo}</p>
                  )}
                </FormItem>
              )}
            />
          </div>

          {/* Factory License */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
            <FormField
              control={control}
              name="complianceDetails.factoryLicenseNo"
              render={({ field }) => (
                  <FormItem className="flex-1">
                  <FormLabel data-tooltip="Factory License number should be unique">
                    Factory License No
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter factory license number"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        onFieldChange?.('factoryLicenseNo', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {validationErrors?.factoryLicenseNo && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.factoryLicenseNo}</p>
                  )}
                  {validationSuccess?.factoryLicenseNo && (
                    <p className="text-sm text-green-600 mt-1">{validationSuccess.factoryLicenseNo}</p>
                  )}
                </FormItem>
              )}
            />
              <FormField
                control={control}
                name="complianceDetails.factoryLicenseIsExpirable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Is Expirable</FormLabel>
                  </FormItem>
                )}
              />
              {factoryLicenseIsExpirable && (
                <FormField
                  control={control}
                  name="complianceDetails.factoryLicenseExpiredAt"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel data-tooltip="Factory License expiry date">
                        Factory License Expiry Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={control}
              name="complianceDetails.factoryLicenseDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-tooltip="Upload the factory license document">
                    Factory License Document
                  </FormLabel>
                  <FormControl>
                    <div style={isEditMode ? { display: 'none' } : {}}>
                      <FileUpload
                        onFileSelect={(file) => field.onChange(file)}
                        onUploadComplete={(filePath) => {
                          // File is already uploaded, just store the file object for later processing
                        }}
                        onUploadError={(error) => {
                          console.error('Upload error:', error);
                        }}
                        subfolder="documents"
                        accept=".pdf,.jpg,.jpeg,.png"
                        existingFilePath={field.value?.existingPath}
                        onDownload={handleDownload}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* TSPCB Order */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
            <FormField
              control={control}
              name="complianceDetails.tspcbOrderNo"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel
                    data-required="false"
                    data-tooltip="Optional: add the TSPCB order number if available"
                  >
                    TSPCB Order No
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter TSPCB order number" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        onFieldChange?.('tspcbOrderNo', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {validationErrors?.tspcbOrderNo && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.tspcbOrderNo}</p>
                  )}
                  {validationSuccess?.tspcbOrderNo && (
                    <p className="text-sm text-green-600 mt-1">{validationSuccess.tspcbOrderNo}</p>
                  )}
                </FormItem>
              )}
            />
              <FormField
                control={control}
                name="complianceDetails.tspcbIsExpirable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Is Expirable</FormLabel>
                  </FormItem>
                )}
              />
              {tspcbIsExpirable && (
                <FormField
                  control={control}
                  name="complianceDetails.tspcbExpiredAt"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel
                        data-required="false"
                        data-tooltip="Optional: add the TSPCB approval expiry date"
                      >
                        TSPCB Expiry Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={control}
              name="complianceDetails.tspcbOrderDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    data-required="false"
                    data-tooltip="Optional: upload the TSPCB approval certificate"
                  >
                    TSPCB Certificate
                  </FormLabel>
                  <FormControl>
                    <div style={isEditMode ? { display: 'none' } : {}}>
                      <FileUpload
                        onFileSelect={(file) => field.onChange(file)}
                        onUploadComplete={(filePath) => {
                          // File is already uploaded, just store the file object for later processing
                        }}
                        onUploadError={(error) => {
                          console.error('Upload error:', error);
                        }}
                        subfolder="documents"
                        accept=".pdf,.jpg,.jpeg,.png"
                        existingFilePath={field.value?.existingPath}
                        onDownload={handleDownload}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* MDL */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
            <FormField
              control={control}
              name="complianceDetails.mdlNo"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel
                    data-required="false"
                    data-tooltip="Optional: add the MDL authorization number if available"
                  >
                    M.D.L No
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter M.D.L number" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        onFieldChange?.('mdlNo', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {validationErrors?.mdlNo && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.mdlNo}</p>
                  )}
                  {validationSuccess?.mdlNo && (
                    <p className="text-sm text-green-600 mt-1">{validationSuccess.mdlNo}</p>
                  )}
                </FormItem>
              )}
            />
              <FormField
                control={control}
                name="complianceDetails.mdlIsExpirable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Is Expirable</FormLabel>
                  </FormItem>
                )}
              />
              {mdlIsExpirable && (
                <FormField
                  control={control}
                  name="complianceDetails.mdlExpiredAt"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel
                        data-required="false"
                        data-tooltip="Optional: add the MDL expiry date"
                      >
                        MDL Expiry Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={control}
              name="complianceDetails.mdlDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    data-required="false"
                    data-tooltip="Optional: upload the MDL certificate"
                  >
                    MDL Certificate
                  </FormLabel>
                  <FormControl>
                    <div style={isEditMode ? { display: 'none' } : {}}>
                      <FileUpload
                        onFileSelect={(file) => field.onChange(file)}
                        onUploadComplete={(filePath) => {
                          // File is already uploaded, just store the file object for later processing
                        }}
                        onUploadError={(error) => {
                          console.error('Upload error:', error);
                        }}
                        subfolder="documents"
                        accept=".pdf,.jpg,.jpeg,.png"
                        existingFilePath={field.value?.existingPath}
                        onDownload={handleDownload}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Udyam Certificate */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
            <FormField
              control={control}
              name="complianceDetails.udyamCertificateNo"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel
                    data-required="false"
                    data-tooltip="Optional: add the Udyam registration number if available"
                  >
                    Udyam Certificate No
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Udyam certificate number"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        onFieldChange?.('udyamCertificateNo', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {validationErrors?.udyamCertificateNo && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.udyamCertificateNo}</p>
                  )}
                  {validationSuccess?.udyamCertificateNo && (
                    <p className="text-sm text-green-600 mt-1">{validationSuccess.udyamCertificateNo}</p>
                  )}
                </FormItem>
              )}
            />
              <FormField
                control={control}
                name="complianceDetails.udyamIsExpirable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Is Expirable</FormLabel>
                  </FormItem>
                )}
              />
              {udyamIsExpirable && (
                <FormField
                  control={control}
                  name="complianceDetails.udyamCertificateExpiredAt"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel
                        data-required="false"
                        data-tooltip="Optional: add the Udyam certificate expiry date"
                      >
                        Udyam Certificate Expiry Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={control}
              name="complianceDetails.udyamCertificateDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    data-required="false"
                    data-tooltip="Optional: upload the Udyam certificate"
                  >
                    Udyam Certificate
                  </FormLabel>
                  <FormControl>
                    <div style={isEditMode ? { display: 'none' } : {}}>
                      <FileUpload
                        onFileSelect={(file) => field.onChange(file)}
                        onUploadComplete={(filePath) => {
                          // File is already uploaded, just store the file object for later processing
                        }}
                        onUploadError={(error) => {
                          console.error('Upload error:', error);
                        }}
                        subfolder="documents"
                        accept=".pdf,.jpg,.jpeg,.png"
                        existingFilePath={field.value?.existingPath}
                        onDownload={handleDownload}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Communication Details */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Communication Details
        </h3>
          <FormField
            control={control}
            name="communicationDetails.fullAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Address</FormLabel>
                <FormControl>
                  <Textarea
                  placeholder="Enter complete address"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
      </div>

      {/* Section 3: Representative Details */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium border-b pb-2 w-full">
            Representative/Partner Details
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              partnerArray.append({
                name: "",
                contactNo: "",
                aadharNo: "",
                email: "",
                pan: "",
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Add More
          </Button>
        </div>

        <div className="space-y-6">
          {partnerArray.fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name={`representativeDetails.partners.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Representative/Partner Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter partner name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`representativeDetails.partners.${index}.contactNo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter contact number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`representativeDetails.partners.${index}.aadharNo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aadhar Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Aadhar number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`representativeDetails.partners.${index}.email`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`representativeDetails.partners.${index}.pan`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter PAN number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                      size="icon"
                      className="text-destructive"
                  onClick={() => partnerArray.remove(index)}
                >
                      <Trash2 className="h-4 w-4" />
                </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* GST Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={(open) => {
        setShowVerifyDialog(open);
        if (!open) {
          setGstError(null);
          setGstDetails(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isVerifying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  Fetching Details
                </>
              ) : gstDetails ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  GST Details
                </>
              ) : (
                "GST Verification"
              )}
            </DialogTitle>
            <DialogDescription>
              {isVerifying
                ? "Please wait while we fetch GST details..."
                : gstError
                ? "There was an error verifying the GSTIN."
                : gstDetails
                ? "GST details retrieved successfully."
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isVerifying ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : gstError ? (
              <div className="rounded-md bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{gstError}</p>
              </div>
            ) : gstDetails ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="mt-1 text-sm font-medium">{gstDetails.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Trade Name</label>
                  <p className="mt-1 text-sm font-medium">{gstDetails.tradeName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="mt-1 text-sm font-medium">{gstDetails.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="mt-1 text-sm">{gstDetails.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">GST Status</label>
                  <p className="mt-1 text-sm">{gstDetails.GSTmemstatus}</p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            {isVerifying ? null : (
              <Button onClick={() => {
                setShowVerifyDialog(false);
                setGstError(null);
                setGstDetails(null);
              }}>
                {gstDetails || gstError ? "Close" : "Cancel"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
