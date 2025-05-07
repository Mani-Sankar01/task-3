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

export default function Step3ComplianceLegal() {
  const { control } = useFormContext();

  // Partner details field array
  const partnerArray = useFieldArray({
    control,
    name: "representativeDetails.partners",
  });

  return (
    <div className="space-y-8">
      {/* Section 1: Registration & Compliance Numbers */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Registration & Compliance Numbers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-x-2 flex">
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
              name="complianceDetails.gstinDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GSTIN Certificate</FormLabel>
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
          </div>

          <div className="space-x-2 flex">
            <FormField
              control={control}
              name="complianceDetails.factoryLicenseNo"
              render={({ field }) => (
                <FormItem>
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
              name="complianceDetails.factoryLicenseDoc"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Upload Doc</FormLabel>
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
          </div>

          <div className="space-x-2 flex">
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
              name="complianceDetails.tspcbOrderDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Doc</FormLabel>
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
          </div>

          <div className="space-x-2 flex">
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
              name="complianceDetails.mdlDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Doc</FormLabel>
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
          </div>

          <div className="space-x-2 flex">
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
              name="complianceDetails.udyamCertificateDoc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Doc</FormLabel>
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
          </div>
        </div>
      </div>

      {/* Section 2: Address for Communication */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Address for Communication
        </h3>
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={control}
            name="communicationDetails.fullAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter complete address for communication"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Section 3: Representative/Partner Details */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">
            Representative/Partner Details
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              partnerArray.append({ name: "", contactNo: "", aadharNo: "" })
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>

        <div className="space-y-4">
          {partnerArray.fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={control}
                    name={`representativeDetails.partners.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Representative/Partner Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} />
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
                        <FormLabel>Contact No</FormLabel>
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
                        <FormLabel>Aadhar No</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Aadhar number" {...field} />
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
                          <Input placeholder="Enter email" {...field} />
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
                        <FormLabel>PAN</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter PAN no" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-4 text-destructive"
                  onClick={() => partnerArray.remove(index)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
              </CardContent>
            </Card>
          ))}

          {partnerArray.fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No partners added yet. Click the button above to add partner
              details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
