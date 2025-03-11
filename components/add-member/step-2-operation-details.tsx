"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function Step2OperationDetails() {
  const { control, register, watch } = useFormContext();

  // Machinery information field array
  const machineryArray = useFieldArray({
    control,
    name: "electricalDetails.machinery",
  });

  // Branch details field array
  const branchArray = useFieldArray({
    control,
    name: "branchDetails.branches",
  });

  // Labour details field array
  const labourArray = useFieldArray({
    control,
    name: "labourDetails.workers",
  });

  return (
    <div className="space-y-8">
      {/* Section 1: Electrical & Power Details */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Electrical & Power Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField
            control={control}
            name="electricalDetails.sanctionedHP"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sanctioned HP</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter sanctioned HP"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Machinery Information</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                machineryArray.append({
                  name: "",
                  quantity: "",
                  chasisNumber: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Add Machine
            </Button>
          </div>

          <div className="space-y-4">
            {machineryArray.fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={control}
                      name={`electricalDetails.machinery.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Machine Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter machine name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`electricalDetails.machinery.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter quantity"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`electricalDetails.machinery.${index}.chasisNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chassis Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter chassis number"
                              {...field}
                            />
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
                    onClick={() => machineryArray.remove(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                  </Button>
                </CardContent>
              </Card>
            ))}

            {machineryArray.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No machinery added yet. Click the button above to add machinery.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Branch Details */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Branch Details (If Any)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              branchArray.append({
                placeBusiness: "",
                ownershipType: "",
                ownerSubType: "",
                electricalUscNumber: "",
                sanctionedHP: "",
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Add Branch
          </Button>
        </div>

        <div className="space-y-4">
          {branchArray.fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name={`branchDetails.branches.${index}.placeBusiness`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Place of Business</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter business location"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`branchDetails.branches.${index}.ownershipType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ownership Type</FormLabel>
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
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="tenant">Tenant</SelectItem>
                            <SelectItem value="trader">Trader</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watch(`branchDetails.branches.${index}.ownershipType`) ===
                    "owner" && (
                    <FormField
                      control={control}
                      name={`branchDetails.branches.${index}.ownerSubType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select owner type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="own_business">
                                Own Business
                              </SelectItem>
                              <SelectItem value="factory_on_lease">
                                Factory on Lease
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={control}
                    name={`branchDetails.branches.${index}.electricalUscNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electrical USC Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter USC number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`branchDetails.branches.${index}.sanctionedHP`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sanctioned HP</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter sanctioned HP"
                            {...field}
                          />
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
                  onClick={() => branchArray.remove(index)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove Branch
                </Button>
              </CardContent>
            </Card>
          ))}

          {branchArray.fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No branches added yet. Click the button above to add a branch.
            </p>
          )}
        </div>
      </div>

      {/* Section 3: Labour Details */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Labour Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField
            control={control}
            name="labourDetails.estimatedMaleWorkers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Male Workers</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter number of male workers"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="labourDetails.estimatedFemaleWorkers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Female Workers</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter number of female workers"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Labour Details</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => labourArray.append({ name: "", aadharNumber: "", photo: null })}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Worker
            </Button>
          </div>

          <div className="space-y-4">
            {labourArray.fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={control}
                      name={`labourDetails.workers.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Worker Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter worker name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`labourDetails.workers.${index}.aadharNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aadhar Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Aadhar number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`labourDetails.workers.${index}.photo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Photo</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
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
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-4 text-destructive"
                    onClick={() => labourArray.remove(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                  </Button>
                </CardContent>
              </Card>
            ))}

            {labourArray.fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No workers added yet. Click the button above to add worker details.
              </p>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}
