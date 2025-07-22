"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "../ui/button";
import { Plus, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";

export default function Step4MembershipDocs() {
  const { control, watch } = useFormContext();
  const isMemberOfOrg = watch("membershipDetails.isMemberOfOrg");
  const hasAppliedEarlier = watch("membershipDetails.hasAppliedEarlier");

  // Add field array for dynamic attachments
  const attachmentsArray = useFieldArray({
    control,
    name: "documentDetails.additionalAttachments",
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
      {/* Section 1: Membership Details */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Membership Details
        </h3>
        <div className="space-y-6">
          <FormField
            control={control}
            name="membershipDetails.isMemberOfOrg"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Are you a member of any similar organization?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="member-yes" />
                      <Label htmlFor="member-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="member-no" />
                      <Label htmlFor="member-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isMemberOfOrg === "yes" && (
            <FormField
              control={control}
              name="membershipDetails.orgDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide details about the organization"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={control}
            name="membershipDetails.hasAppliedEarlier"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Have you applied for membership earlier?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="applied-yes" />
                      <Label htmlFor="applied-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="applied-no" />
                      <Label htmlFor="applied-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {hasAppliedEarlier === "yes" && (
            <FormField
              control={control}
              name="membershipDetails.previousApplicationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Application Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide details about your previous application"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={control}
            name="membershipDetails.isValidMember"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Is this a Valid member?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="valid-yes" />
                      <Label htmlFor="valid-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="valid-no" />
                      <Label htmlFor="valid-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="membershipDetails.isExecutiveMember"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Is this an Executive member?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="executive-yes" />
                      <Label htmlFor="executive-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="executive-no" />
                      <Label htmlFor="executive-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Section 2: Additional Attachments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium border-b pb-2 w-full">
            Additional Attachments
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => attachmentsArray.append({ name: "", file: null, expiredAt: "" })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Attachment
          </Button>
        </div>

        <div className="space-y-6">
          {/* Dynamic attachments */}
          {attachmentsArray.fields.map((field, index) => (
            <div key={field.id} className="space-y-4 border rounded-lg p-4">
              <div className="flex items-end gap-4">
              <FormField
                control={control}
                name={`documentDetails.additionalAttachments.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter document name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                  name={`documentDetails.additionalAttachments.${index}.expiredAt`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                      <FormLabel>Expiry Date</FormLabel>
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

              <Button
                type="button"
                variant="ghost"
                size="icon"
                  className="text-destructive"
                onClick={() => attachmentsArray.remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              </div>

              <FormField
                control={control}
                name={`documentDetails.additionalAttachments.${index}.file`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload File</FormLabel>
                    <FormControl>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
