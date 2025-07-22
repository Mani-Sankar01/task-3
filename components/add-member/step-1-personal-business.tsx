"use client";

import { useFormContext } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface Step1PersonalBusinessProps {
  isEditMode?: boolean;
  validationErrors?: {
    electricalUscNumber?: string;
    scNumber?: string;
  };
  validationSuccess?: {
    electricalUscNumber?: string;
    scNumber?: string;
  };
  onFieldChange?: (fieldName: string, value: string) => void;
  isValidating?: boolean;
}

export default function Step1PersonalBusiness({ 
  isEditMode = false, 
  validationErrors = {},
  validationSuccess = {},
  onFieldChange,
  isValidating = false
}: Step1PersonalBusinessProps) {
  const { control, watch } = useFormContext();
  const ownershipType = watch("businessDetails.ownershipType");

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="applicationDetails.electricalUscNumber"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Electrical USC Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter USC number" 
                    {...field} 
                    readOnly={isEditMode}
                    className={isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}
                    onChange={(e) => {
                      field.onChange(e);
                      if (onFieldChange && !isEditMode) {
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
                <FormLabel>SC Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter SC number" 
                    {...field} 
                    readOnly={isEditMode}
                    className={isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}
                    onChange={(e) => {
                      field.onChange(e);
                      if (onFieldChange && !isEditMode) {
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
            name="applicationDetails.dateOfApplication"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Application</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full pl-3 text-left font-normal ${
                          !field.value ? "text-muted-foreground" : ""
                        }`}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                      }
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                <FormLabel>Applicant Name</FormLabel>
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
                <FormLabel>S/O, D/O, W/O</FormLabel>
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
                <FormLabel>Relative Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter relative's name" {...field} />
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
                <FormLabel>Firm Name</FormLabel>
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
                <FormLabel>Proprietor/Managing Partner Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter proprietor name" {...field} />
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
                <FormLabel>Contact 1 (Primary)</FormLabel>
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
                <FormLabel>Contact 2 (Optional)</FormLabel>
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
                <FormLabel>Survey Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter survey number" {...field} />
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
                <FormLabel>Village</FormLabel>
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="zone1">Zone 1</SelectItem>
                    <SelectItem value="zone2">Zone 2</SelectItem>
                    <SelectItem value="zone3">Zone 3</SelectItem>
                    <SelectItem value="zone4">Zone 4</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.mandal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mandal</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mandal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="mandal1">Mandal 1</SelectItem>
                    <SelectItem value="mandal2">Mandal 2</SelectItem>
                    <SelectItem value="mandal3">Mandal 3</SelectItem>
                    <SelectItem value="mandal4">Mandal 4</SelectItem>
                    <SelectItem value="mandal5">Mandal 5</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="district1">District 1</SelectItem>
                    <SelectItem value="district2">District 2</SelectItem>
                    <SelectItem value="district3">District 3</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="telangana">Telangana</SelectItem>
                    <SelectItem value="andhra_pradesh">
                      Andhra Pradesh
                    </SelectItem>
                    <SelectItem value="karnataka">Karnataka</SelectItem>
                    <SelectItem value="tamil_nadu">Tamil Nadu</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="businessDetails.pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pincode</FormLabel>
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
                  <FormLabel>Proprietor Type</FormLabel>
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
                      <SelectItem value="RENTED">Rented/Tenant</SelectItem>
                      <SelectItem value="TRADING">Trader</SelectItem>
                      <SelectItem value="FACTORY_ON_LEASE">
                        Factory given on lease
                      </SelectItem>
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
