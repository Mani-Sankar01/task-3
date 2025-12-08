"use client";

import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Step1PersonalBusinessProps {
  isEditMode?: boolean;
  validationErrors?: {
    membershipId?: string;
    electricalUscNumber?: string;
    scNumber?: string;
  };
  validationSuccess?: {
    membershipId?: string;
    electricalUscNumber?: string;
    scNumber?: string;
  };
  onFieldChange?: (fieldName: string, value: string) => void;
  isValidating?: boolean;
  isValidatingMembershipId?: boolean;
}

export default function Step1PersonalBusiness({ 
  isEditMode = false, 
  validationErrors = {},
  validationSuccess = {},
  onFieldChange,
  isValidating = false,
  isValidatingMembershipId = false
}: Step1PersonalBusinessProps) {
  const { control, watch, setValue } = useFormContext();
  const ownershipType = watch("businessDetails.ownershipType");
  
  // Set default values for district and state
  useEffect(() => {
    setValue("businessDetails.district", "Vikarabad");
    setValue("businessDetails.state", "Telangana");
  }, [setValue]);

  return (
    <div className="space-y-8">
      {/* Section 1: Application Details */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Application Details
          {isValidating && (
            <span className="ml-2 text-sm text-blue-600">
              Validating...
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="membershipId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel data-tooltip="Enter the membership ID for this member.">
                  Membership ID
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="Enter Membership ID"
                      readOnly={isEditMode}
                      className={`${
                        isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
                      } ${
                        validationErrors.membershipId
                          ? "border-red-500"
                          : validationSuccess.membershipId
                          ? "border-green-500"
                          : ""
                      }`}
                      onChange={(e) => {
                        field.onChange(e);
                        if (onFieldChange && !isEditMode) {
                          onFieldChange("membershipId", e.target.value);
                        }
                      }}
                      disabled={isValidatingMembershipId}
                    />
                    {isValidatingMembershipId && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                {validationErrors?.membershipId && (
                  <p className="text-sm text-destructive">
                    {validationErrors.membershipId}
                  </p>
                )}
                {validationSuccess?.membershipId && !validationErrors?.membershipId && (
                  <p className="text-sm text-green-600">
                    {validationSuccess.membershipId}
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="applicationDetails.electricalUscNumber"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel data-tooltip="Must be unique. This value is validated automatically.">
                  Electrical USC Number
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter USC number" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      if (onFieldChange) {
                        onFieldChange('electricalUscNumber', e.target.value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
                {validationErrors.electricalUscNumber && (
                  <p className="text-sm text-destructive">
                    {validationErrors.electricalUscNumber}
                  </p>
                )}
                {validationSuccess.electricalUscNumber && (
                  <p className="text-sm text-green-600">
                    {validationSuccess.electricalUscNumber}
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="applicationDetails.scNumber"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel data-tooltip="Must be unique. This value is validated automatically.">
                  SC Number
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter SC number" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      if (onFieldChange) {
                        onFieldChange('scNumber', e.target.value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
                {validationErrors.scNumber && (
                  <p className="text-sm text-destructive">
                    {validationErrors.scNumber}
                  </p>
                )}
                {validationSuccess.scNumber && (
                  <p className="text-sm text-green-600">
                    {validationSuccess.scNumber}
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="membershipType"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Membership Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select membership type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TSMWA">TSMWA</SelectItem>
                    <SelectItem value="TMQOWA">TMQOWA</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="applicationDetails.dateOfApplication"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel data-tooltip="Select the date when this application is submitted.">
                  Date of Application
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="applicationDetails.dateOfApplicationApproved"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel data-required="false" data-tooltip="Select the date when this application was approved.">
                  Date of Application Approved
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="applicationDetails.yearOfJoining"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel data-required="false" data-tooltip="Enter the year of joining.">
                  Year of Joining
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter year (e.g., 2025)" 
                    {...field}
                    maxLength={4}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Section 2: Member Details */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Member Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="memberDetails.applicantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Enter the primary applicant's full name.">
                  Applicant Name
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="memberDetails.relation"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Select the relationship prefix for the applicant.">
                  S/O, D/O, W/O
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SO">S/O (Son Of)</SelectItem>
                    <SelectItem value="DO">D/O (Daughter Of)</SelectItem>
                    <SelectItem value="WO">W/O (Wife Of)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="memberDetails.relativeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Provide the name that corresponds to the selected relation.">
                  Relative Name
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter relative's name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="firmDetails.contact1"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Please provide a primary phone number. WhatsApp-enabled numbers receive alerts.">
                  Contact 1 (Primary)
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter primary number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="firmDetails.contact2"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  data-required="false"
                  data-tooltip="Optional secondary contact number for backup communication."
                >
                  Contact 2
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter phone number"
                    type="tel"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="memberDetails.aadharNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-required="false" data-tooltip="Enter 12-digit Aadhar number.">
                  Aadhar Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter Aadhar number"
                    type="text"
                    maxLength={12}
                    {...field}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="memberDetails.panNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-required="false" data-tooltip="Enter 10-character PAN number.">
                  PAN Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter PAN number"
                    type="text"
                    maxLength={10}
                    {...field}
                    onChange={(e) => {
                      // Convert to uppercase and only allow alphanumeric
                      const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="memberDetails.emailId"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-required="false" data-tooltip="Enter email address.">
                  Email ID
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter email address"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Section 3: Firm Details */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">Firm Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="firmDetails.firmName"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Enter the registered name of the firm.">
                  Firm Name
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter firm name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="firmDetails.proprietorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Enter the name of the proprietor or managing partner.">
                  Proprietor/Managing Partner Name
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter proprietor name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Section 4: Business Details */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Business Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="businessDetails.surveyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-required="false" data-tooltip="Enter the land survey number associated with the unit.">
                  Survey Number
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter survey number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.housePlotNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-required="false" data-tooltip="Enter the house or plot number.">
                  House/Plot Number
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter house/plot number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.village"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-required="false" data-tooltip="Enter the village or locality name.">
                  Village
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter village name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.zone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zone</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select zone"
                    type="zone"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.mandal"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Select the mandal in which the unit operates.">
                  Mandal
                </FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select mandal"
                    type="mandal"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.district"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Specify the district for this business location.">
                  District
                </FormLabel>
                <FormControl>
                  <Input
                    value={field.value || "Vikarabad"}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.state"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Select the state where the firm operates.">
                  State
                </FormLabel>
                <FormControl>
                  <Input
                    value={field.value || "Telangana"}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel data-tooltip="Enter the 6-digit postal code for the business location.">
                  Pincode
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter pincode" maxLength={6} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.ownershipType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status of the Proprietor</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ownership type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="TENANT">Tenant</SelectItem>
                    <SelectItem value="TRADER">Trader</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {ownershipType === "OWNER" && (
            <FormField
              control={control}
              name="businessDetails.ownerSubType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    data-required="false"
                    data-tooltip="Optional: refine the ownership classification."
                  >
                    Factory Type
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select proprietor type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="OWNED">Owned</SelectItem>
                      <SelectItem value="RENTED_LEASE">Rented/Leased</SelectItem>
                      
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
