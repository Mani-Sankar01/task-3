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

export default function Step5ProposerDeclaration() {
  const { control, setValue } = useFormContext();
  const [validMembers, setValidMembers] = useState<any[]>([]);
  const [executiveMembers, setExecutiveMembers] = useState<any[]>([]);

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

  // Handle proposer 1 selection
  const handleProposer1Select = (memberId: any) => {
    const selectedMember = validMembers.find(
      (member) => member.id === memberId
    );
    if (selectedMember) {
      setValue("proposer1.name", selectedMember.memberDetails.applicantName);
      setValue("proposer1.firmName", selectedMember.firmDetails.firmName);
      setValue(
        "proposer1.address",
        selectedMember.communicationDetails?.fullAddress || ""
      );
    }
  };

  // Handle proposer 2 selection
  const handleProposer2Select = (memberId: any) => {
    const selectedMember = executiveMembers.find(
      (member) => member.id === memberId
    );
    if (selectedMember) {
      setValue("proposer2.name", selectedMember.memberDetails.applicantName);
      setValue("proposer2.firmName", selectedMember.firmDetails.firmName);
      setValue(
        "proposer2.address",
        selectedMember.communicationDetails?.fullAddress || ""
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Proposer 1 */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Proposer 1 (Factory Owner/Valid Member)
        </h3>
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={control}
            name="proposer1.memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Valid Member</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleProposer1Select(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a valid member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {validMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.memberDetails.applicantName} -{" "}
                        {member.firmDetails.firmName}
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
                <FormLabel>Name</FormLabel>
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
            name="proposer1.firmName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firm Name</FormLabel>
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
                <FormLabel>Address</FormLabel>
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
          Proposer 2 (Executive Member)
        </h3>
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={control}
            name="proposer2.memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Executive Member</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleProposer2Select(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an executive member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {executiveMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.memberDetails.applicantName} -{" "}
                        {member.firmDetails.firmName}
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
                <FormLabel>Name</FormLabel>
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
            name="proposer2.firmName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firm Name</FormLabel>
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
                <FormLabel>Address</FormLabel>
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
                  <FormLabel>I agree to the terms and conditions</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="declaration.membershipFormUpload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload copy of membership form</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
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
              name="declaration.signatureUpload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signature Upload (Applicant)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
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
          </div>
        </div>
      </div>
    </div>
  );
}
