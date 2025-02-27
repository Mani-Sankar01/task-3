"use client"

import { useFormContext } from "react-hook-form"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function Step4MembershipDocs() {
  const { control, watch } = useFormContext()
  const isMemberOfOrg = watch("membershipDetails.isMemberOfOrg")
  const hasAppliedEarlier = watch("membershipDetails.hasAppliedEarlier")

  return (
    <div className="space-y-8">
      {/* Section 1: Membership Inquiry */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">Membership Inquiry</h3>
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
        </div>
      </div>

      {/* Section 2: Required Attachments */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">Required Attachments</h3>
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
                      const file = e.target.files?.[0]
                      field.onChange(file)
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
                      const file = e.target.files?.[0]
                      field.onChange(file)
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
                      const file = e.target.files?.[0]
                      field.onChange(file)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="documentDetails.additionalDocuments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Photos and Xerox Copies</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const files = e.target.files
                      field.onChange(files)
                    }}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-sm text-muted-foreground">You can select multiple files</p>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}

