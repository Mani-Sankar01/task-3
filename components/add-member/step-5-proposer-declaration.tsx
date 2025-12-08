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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import axios from "axios";
import { FileUpload } from "@/components/ui/file-upload";
import { downloadFile } from "@/lib/client-file-upload";

export default function Step5ProposerDeclaration() {
  const { control, setValue, watch } = useFormContext();
  const [validMembers, setValidMembers] = useState<any[]>([]);
  const [executiveMembers, setExecutiveMembers] = useState<any[]>([]);
  const [proposer1Open, setProposer1Open] = useState(false);
  const [proposer2Open, setProposer2Open] = useState(false);
  const proposer1Id = watch("proposer1.membershipId");
  const proposer2Id = watch("proposer2.membershipId");
  const proposer1Name = watch("proposer1.name");
  const proposer1firm = watch("proposer1.firmName");
  const proposer2Name = watch("proposer2.name");
  const proposer2firm = watch("proposer2.firmName");

  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (status === "authenticated" && session?.user?.token) {
        try {
          // Fetch all members for valid members dropdown
          const response1 = await axios.get(
            `${process.env.BACKEND_API_URL}/api/member/get_members`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          
          // Fetch executive members from reference data
          const response2 = await axios.get(
            `${process.env.BACKEND_API_URL}/api/referenceData/getExecutive`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );
          
          // Handle response - get_members returns array directly
          const membersData = Array.isArray(response1.data) 
            ? response1.data 
            : response1.data?.data || response1.data?.members || [];
          setValidMembers(membersData);
          
          // Handle executive response - has result array
          const executiveData = response2.data?.result || [];
          setExecutiveMembers(executiveData);
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
  }, [isLoading, validMembers, proposer1Id]);

  useEffect(() => {
    if (!isLoading && executiveMembers.length > 0 && proposer2Id) {
      handleProposer2Select(proposer2Id);
    }
  }, [isLoading, executiveMembers, proposer2Id]);

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
      setValue("proposer1.phoneNumber", selectedMember.phoneNumber1 || "");
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
  const handleProposer2Select = (executiveId: any) => {
    const selectedExecutive = executiveMembers.find(
      (executive) => executive.id === executiveId || executive.id?.toString() === executiveId
    );
    if (selectedExecutive) {
      setValue("proposer2.name", selectedExecutive.name || "");
      setValue("proposer2.firmName", selectedExecutive.firmName || "");
      setValue("proposer2.phoneNumber", selectedExecutive.phone || "");
      setValue("proposer2.address", selectedExecutive.address || "");
      // For executives, we use id as membershipId (or could be a separate field)
      setValue("proposer2.membershipId", selectedExecutive.id?.toString() || executiveId);
      // Executive members from reference data don't have signature paths
      // So we don't set signature path for executives
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
                <Popover open={proposer1Open} onOpenChange={setProposer1Open}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value && proposer1Id && proposer1Name && proposer1firm
                          ? `${proposer1Name} - ${proposer1firm}`
                          : "Select valid Members of the Association"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command>
                      <CommandInput placeholder="Search members..." />
                      <CommandList>
                        <CommandEmpty>No members found.</CommandEmpty>
                        <CommandGroup>
                          {validMembers.map((member) => (
                            <CommandItem
                              value={`${member.applicantName} ${member.firmName} ${member.membershipId}`}
                              key={member.membershipId}
                              onSelect={() => {
                                field.onChange(member.membershipId);
                                handleProposer1Select(member.membershipId);
                                setProposer1Open(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === member.membershipId
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {member.applicantName} - {member.firmName}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
            name="proposer1.phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel 
                  data-required={false}
                  data-tooltip="This field is optional and will be auto-filled when a valid member is selected."
                >
                  Phone Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Phone number will be auto-filled"
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
                <Popover open={proposer2Open} onOpenChange={setProposer2Open}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value && proposer2Name && proposer2firm
                          ? `${proposer2Name} - ${proposer2firm}`
                          : "Select Executive member of the association"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command>
                      <CommandInput placeholder="Search executives..." />
                      <CommandList>
                        <CommandEmpty>No executives found.</CommandEmpty>
                        <CommandGroup>
                          {executiveMembers.map((executive) => {
                            const executiveId = executive.id?.toString() || String(executive.id) || "";
                            return (
                              <CommandItem
                                value={`${executive.name} ${executive.firmName} ${executiveId}`}
                                key={executiveId}
                                onSelect={() => {
                                  field.onChange(executiveId);
                                  handleProposer2Select(executiveId);
                                  setProposer2Open(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === executiveId
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {executive.name} - {executive.firmName}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
            name="proposer2.phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel 
                  data-required={false}
                  data-tooltip="This field is optional and will be auto-filled when an executive member is selected."
                >
                  Phone Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Phone number will be auto-filled"
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
