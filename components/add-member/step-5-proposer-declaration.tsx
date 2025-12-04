"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useEffect, useState } from "react";
import { getAllMembers } from "@/data/members";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useSession } from "next-auth/react";
import axios from "axios";
import { FileUpload } from "@/components/ui/file-upload";
import { downloadFile } from "@/lib/client-file-upload";

export default function Step5ProposerDeclaration() {
  const { control, setValue, watch } = useFormContext();
  const [validMembers, setValidMembers] = useState<any[]>([]);
  const [executiveMembers, setExecutiveMembers] = useState<any[]>([]);
  const proposer1Id = watch("proposer1.membershipId");
  const proposer2Id = watch("proposer2.membershipId");
  const proposer1Name = watch("proposer1.name");
  const proposer1firm = watch("proposer1.firmName");
  const proposer2Name = watch("proposer2.name");
  const proposer2firm = watch("proposer2.firmName");

  // Fetch members on component mount
  useEffect(() => {
    const allMembers = getAllMembers();

    // Filter valid members
    const validMembersList = allMembers.filter(
      (member) => member.membershipDetails?.isValidMember === "yes"
    );
    setValidMembers(validMembersList);

    // Filter executive members
    const executiveMembersList = allMembers.filter(
      (member) => member.membershipDetails?.isExecutiveMember === "yes"
    );
    setExecutiveMembers(executiveMembersList);
  }, []);

  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (status === "authenticated" && session?.user?.token) {
        try {
          const response1 = await axios.get(
            `${process.env.BACKEND_API_URL}/api/member/get_valid_members`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          const response2 = await axios.get(
            `${process.env.BACKEND_API_URL}/api/member/get_executive_members`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          setValidMembers(response1.data);
          setExecutiveMembers(response2.data);
        } catch (err: any) {
          console.error("Error fetching member data:", err);
          setError("Failed to load member data");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [status, session]);

  useEffect(() => {
    if (!isLoading && validMembers.length > 0 && proposer1Id) {
      handleProposer1Select(proposer1Id);
    }

    if (!isLoading && executiveMembers.length > 0 && proposer2Id) {
      handleProposer2Select(proposer2Id);
    }
  }, [isLoading, validMembers, executiveMembers, proposer1Id, proposer2Id]);

  const getMemberSignature = (member: any) => {
    // Prioritize declarations.applicationSignaturePath as this is the standard signature path
    if (member?.declarations?.applicationSignaturePath) {
      return member.declarations.applicationSignaturePath;
    }
    // Fallback to other signature paths if applicationSignaturePath is not available
    return (
      member?.declarations?.signaturePath ||
      member?.signaturePath ||
      member?.signature_path ||
      member?.proposerSignaturePath ||
      member?.executiveProposerSignaturePath ||
      member?.proposer?.signaturePath ||
      member?.executiveProposer?.signaturePath ||
      ""
    );
  };

  // Handle proposer 1 selection
  const handleProposer1Select = (memberId: any) => {
    const selectedMember = validMembers.find(
      (member) => member.membershipId === memberId
    );
    if (selectedMember) {
      setValue("proposer1.membershipId", memberId);
      setValue("proposer1.name", selectedMember.applicantName);
      setValue("proposer1.firmName", selectedMember.firmName);
      setValue(
        "proposer1.address",
        selectedMember.complianceDetails?.fullAddress || ""
      );
      // Set signature path from declarations.applicationSignaturePath (or fallback)
      const signaturePath = getMemberSignature(selectedMember);
      if (signaturePath) {
        setValue("proposer1.signaturePath", signaturePath);
      }
    }
  };

  // Handle proposer 2 selection
  const handleProposer2Select = (memberId: any) => {
    const selectedMember = executiveMembers.find(
      (member) => member.membershipId === memberId
    );
    if (selectedMember) {
      setValue("proposer2.name", selectedMember.applicantName);
      setValue("proposer2.firmName", selectedMember.firmName);
      setValue(
        "proposer2.address",
        selectedMember.complianceDetails?.fullAddress || ""
      );
      setValue("proposer2.membershipId", memberId);
      // Set signature path from declarations.applicationSignaturePath (or fallback)
      const signaturePath = getMemberSignature(selectedMember);
      if (signaturePath) {
        setValue("proposer2.signaturePath", signaturePath);
      }
    }
  };

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
      {/* Section 1: Proposer 1 */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Proposer 1 (Members of the Association)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="proposer1.memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel 
                  data-required={false}
                  data-tooltip="This field is optional. Select a valid member if available."
                >
                  Select valid Members of the Association
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleProposer1Select(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !isLoading && proposer1Id
                            ? `${proposer1Name} - ${proposer1firm}`
                            : "Select valid Members of the Association"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {validMembers.map((member) => (
                      <SelectItem
                        key={member.membershipId}
                        value={member.membershipId}
                      >
                        {member.applicantName} - {member.firmName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proposer1.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel 
                  data-required={false}
                  data-tooltip="This field is optional and will be auto-filled when a valid member is selected."
                >
                  Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Name will be auto-filled"
                    {...field}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proposer1.membershipId"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormLabel>Membership ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Membership ID will be auto-filled"
                    {...field}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proposer1.firmName"
            render={({ field }) => (
              <FormItem>
                <FormLabel 
                  data-required={false}
                  data-tooltip="This field is optional and will be auto-filled when a valid member is selected."
                >
                  Firm Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Firm name will be auto-filled"
                    {...field}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proposer1.address"
            render={({ field }) => (
              <FormItem>
                <FormLabel 
                  data-required={false}
                  data-tooltip="This field is optional and will be auto-filled when a valid member is selected."
                >
                  Address
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Address will be auto-filled"
                    {...field}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Section 2: Proposer 2 */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Proposer 2 (Executive Members of the Association)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="proposer2.memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel 
                  data-required={false}
                  data-tooltip="This field is optional. Select an executive member if available."
                >
                 Select Executive member of the association
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleProposer2Select(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !isLoading && proposer2Name && proposer2firm
                            ? `${proposer2Name} - ${proposer2firm}`
                            : "Select Executive member of the association"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {executiveMembers.map((member) => (
                      <SelectItem
                        key={member.membershipId}
                        value={member.membershipId}
                      >
                        {member.applicantName} - {member.firmName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proposer2.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel 
                  data-required={false}
                  data-tooltip="This field is optional and will be auto-filled when an executive member is selected."
                >
                  Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Name will be auto-filled"
                    {...field}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proposer2.membershipId"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormLabel>Membership ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Membership ID will be auto-filled"
                    {...field}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proposer2.firmName"
            render={({ field }) => (
              <FormItem>
                <FormLabel 
                  data-required={false}
                  data-tooltip="This field is optional and will be auto-filled when an executive member is selected."
                >
                  Firm Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Firm name will be auto-filled"
                    {...field}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proposer2.address"
            render={({ field }) => (
              <FormItem>
                <FormLabel 
                  data-required={false}
                  data-tooltip="This field is optional and will be auto-filled when an executive member is selected."
                >
                  Address
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Address will be auto-filled"
                    {...field}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Section 3: Declaration */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">Declaration</h3>
        <div className="space-y-6">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm">
              I/We agree to abide by the rules and regulations of the
              Association and all the decisions of the General Body / Managing
              Body.
            </p>
          </div>

          <FormField
            control={control}
            name="declaration.agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel 
                    data-required={true}
                    data-tooltip="You must agree to the terms and conditions to proceed with the application."
                  >
                    I agree to the terms and conditions
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="declaration.photoUpload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload copy of membership form</FormLabel>
                  <FormControl>
                    <FileUpload
                      onFileSelect={(file) => field.onChange(file)}
                      onUploadComplete={(filePath) => {
                        // File is already uploaded, just store the file object for later processing
                      }}
                      onUploadError={(error) => {
                        console.error('Upload error:', error);
                      }}
                      subfolder="photos"
                      accept=".jpg,.jpeg,.png,.pdf"
                      existingFilePath={field.value?.existingPath}
                      onDownload={handleDownload}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="declaration.signatureUpload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signature Upload (Applicant)</FormLabel>
                  <FormControl>
                    <FileUpload
                      onFileSelect={(file) => field.onChange(file)}
                      onUploadComplete={(filePath) => {
                        // File is already uploaded, just store the file object for later processing
                      }}
                      onUploadError={(error) => {
                        console.error('Upload error:', error);
                      }}
                      subfolder="signatures"
                      accept=".jpg,.jpeg,.png,.pdf"
                      existingFilePath={field.value?.existingPath}
                      onDownload={handleDownload}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
