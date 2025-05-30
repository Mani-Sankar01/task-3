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
import { DownloadCloudIcon, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function Step4MembershipDocs() {
  const { control, watch } = useFormContext();
  const isMemberOfOrg = watch("membershipDetails.isMemberOfOrg");
  const hasAppliedEarlier = watch("membershipDetails.hasAppliedEarlier");
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  // Add field array for dynamic attachments
  const attachmentsArray = useFieldArray({
    control,
    name: "documentDetails.additionalAttachments",
  });

  const mockUploadToS3 = (
    file: File,
    onProgress: (percent: number) => void
  ): Promise<string> => {
    return new Promise((resolve) => {
      let percent = 0;
      const interval = setInterval(() => {
        percent += 10;
        onProgress(percent);
        if (percent >= 100) {
          clearInterval(interval);
          resolve(`/upload/${file.name}`);
        }
      }, 100);
    });
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Membership Inquiry */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Membership Inquiry
        </h3>
        <div className="space-y-6">
          <FormField
            control={control}
            name="membershipDetails.isMemberOfOrg"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>
                  Are you a member of any similar organization?
                </FormLabel>
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
                      className="min-h-[80px]"
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
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* New fields for valid member and executive member */}
          <FormField
            control={control}
            name="membershipDetails.isValidMember"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Is this a valid member?</FormLabel>
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

      {/* Section 2: Required Attachments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium border-b pb-2 w-full">
            Required Attachments
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => attachmentsArray.append({ name: "", file: null })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Attachment
          </Button>
        </div>

        <div className="space-y-6">
          <FormField
            control={control}
            name="documentDetails.saleDeedElectricityBill"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sale Deed & Electricity Bill (If Owner)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      field.onChange(file);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="documentDetails.rentalDeed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid Rental Deed (If Tenant)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      field.onChange(file);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="documentDetails.partnershipDeed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Partnership Deed (If Partnership Firm)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      field.onChange(file);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dynamic attachments */}
          {attachmentsArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-4">
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
                name={`documentDetails.additionalAttachments.${index}.file`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Upload File</FormLabel>
                    <FormControl>
                      <>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const key = `attachment-${index}`;
                              setUploadProgress((prev) => ({
                                ...prev,
                                [key]: 0,
                              }));
                              const uploadedPath = await mockUploadToS3(
                                file,
                                (percent) =>
                                  setUploadProgress((prev) => ({
                                    ...prev,
                                    [key]: percent,
                                  }))
                              );
                              field.onChange(uploadedPath);
                            }
                          }}
                        />
                        {uploadProgress[`attachment-${index}`] >= 0 &&
                          uploadProgress[`attachment-${index}`] < 100 && (
                            <div className="h-2 bg-muted mt-2 rounded">
                              <div
                                className="bg-primary h-2 rounded transition-all"
                                style={{
                                  width: `${
                                    uploadProgress[`attachment-${index}`]
                                  }%`,
                                }}
                              />
                            </div>
                          )}
                        {
                          <div
                            onClick={() => {
                              alert("");
                            }}
                          >
                            <DownloadCloudIcon />
                          </div>
                        }
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive mb-2"
                onClick={() => attachmentsArray.remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
