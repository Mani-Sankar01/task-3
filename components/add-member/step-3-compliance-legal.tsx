"use client";

import { useFormContext } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

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

interface Step3ComplianceLegalProps {
  isEditMode?: boolean;
}

export default function Step3ComplianceLegal({ isEditMode }: Step3ComplianceLegalProps) {
  const { control } = useFormContext();

  // Partner details field array
  const partnerArray = useFieldArray({
    control,
    name: "representativeDetails.partners",
  });

  const handleDownload = (filePath: string) => {
    // Use the download API endpoint
    const downloadUrl = `/api/download?path=${encodeURIComponent(filePath)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filePath.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <div className="flex items-end gap-4">
            <FormField
              control={control}
              name="complianceDetails.gstinNo"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>GSTIN No</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter GSTIN number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
                control={control}
                name="complianceDetails.gstinExpiredAt"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>GSTIN Expiry Date</FormLabel>
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
            </div>
            <FormField
              control={control}
              name="complianceDetails.gstinDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GSTIN Certificate</FormLabel>
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

          {/* Factory License */}
          <div className="space-y-4">
            <div className="flex items-end gap-4">
            <FormField
              control={control}
              name="complianceDetails.factoryLicenseNo"
              render={({ field }) => (
                  <FormItem className="flex-1">
                  <FormLabel>Factory License No</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter factory license number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
                control={control}
                name="complianceDetails.factoryLicenseExpiredAt"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Factory License Expiry Date</FormLabel>
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
            </div>
            <FormField
              control={control}
              name="complianceDetails.factoryLicenseDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Factory License Document</FormLabel>
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
            <div className="flex items-end gap-4">
            <FormField
              control={control}
              name="complianceDetails.tspcbOrderNo"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>TSPCB Order No</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter TSPCB order number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
                control={control}
                name="complianceDetails.tspcbExpiredAt"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>TSPCB Expiry Date</FormLabel>
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
            </div>
            <FormField
              control={control}
              name="complianceDetails.tspcbOrderDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TSPCB Certificate</FormLabel>
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
            <div className="flex items-end gap-4">
            <FormField
              control={control}
              name="complianceDetails.mdlNo"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>M.D.L No</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter M.D.L number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
                control={control}
                name="complianceDetails.mdlExpiredAt"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>MDL Expiry Date</FormLabel>
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
            </div>
            <FormField
              control={control}
              name="complianceDetails.mdlDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MDL Certificate</FormLabel>
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
            <div className="flex items-end gap-4">
            <FormField
              control={control}
              name="complianceDetails.udyamCertificateNo"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Udyam Certificate No</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Udyam certificate number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
                control={control}
                name="complianceDetails.udyamCertificateExpiredAt"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Udyam Certificate Expiry Date</FormLabel>
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
            </div>
            <FormField
              control={control}
              name="complianceDetails.udyamCertificateDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Udyam Certificate</FormLabel>
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
            Representative Details
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
            <Plus className="h-4 w-4 mr-2" /> Add Partner
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
                        <FormLabel>Partner Name</FormLabel>
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
    </div>
  );
}
