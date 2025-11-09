"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Step2OperationDetailsProps {
  isEditMode?: boolean;
  validationErrors?: {
    [key: string]: string | undefined;
  };
  validationSuccess?: {
    [key: string]: string | undefined;
  };
  onFieldChange?: (fieldName: string, value: string) => void;
  isValidating?: boolean;
}

export default function Step2OperationDetails({ 
  isEditMode = false, 
  validationErrors = {},
  validationSuccess = {},
  onFieldChange,
  isValidating = false
}: Step2OperationDetailsProps) {
  const { control, register, watch, setValue, getValues } = useFormContext();

  // Branch details field array
  const branchArray = useFieldArray({
    control,
    name: "branchDetails.branches",
  });

  // Function to add a new machinery to a specific branch
  const addMachinery = (branchIndex: number) => {
    const currentBranches = getValues("branchDetails.branches");
    if (!currentBranches[branchIndex].machinery) {
      currentBranches[branchIndex].machinery = [];
    }
    currentBranches[branchIndex].machinery.push({
      type: "",
      machineName: "",
      isOther: false,
      quantity: "",
    });
    setValue("branchDetails.branches", [...currentBranches]);
  };

  // Function to remove a machinery from a specific branch
  const removeMachinery = (branchIndex: number, machineryIndex: number) => {
    const currentBranches = getValues("branchDetails.branches");
    currentBranches[branchIndex].machinery.splice(machineryIndex, 1);
    setValue("branchDetails.branches", [...currentBranches]);
  };

  // Function to add a new labour to a specific branch
  const addLabour = (branchIndex: number) => {
    const currentBranches = getValues("branchDetails.branches");
    if (!currentBranches[branchIndex].labour) {
      currentBranches[branchIndex].labour = [];
    }
    currentBranches[branchIndex].labour.push({
      name: "",
      aadharNumber: "",
      eshramCardNumber: "",
      employedFrom: new Date().toISOString().split("T")[0],
      employedTo: "",
      esiNumber: "",
      status: "Active",
    });
    setValue("branchDetails.branches", [...currentBranches]);
  };

  // Function to remove a labour from a specific branch
  const removeLabour = (branchIndex: number, labourIndex: number) => {
    const currentBranches = getValues("branchDetails.branches");
    currentBranches[branchIndex].labour.splice(labourIndex, 1);
    setValue("branchDetails.branches", [...currentBranches]);
  };



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
                <FormLabel>Total Sanctioned HP</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter total sanctioned HP"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


      </div>

      {/* Section 2: Branch Details */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Branch Details</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              branchArray.append({
                placeOfBusiness: "",
                proprietorStatus: "",
                proprietorType: "",
                electricalUscNumber: "",
                scNumber: "", // Added SC Number
                sanctionedHP: "",
                machinery: [],
                labour: [],
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Add Branch
          </Button>
        </div>

        <div className="space-y-6">
          {branchArray.fields.map((field, branchIndex) => (
            <Card key={field.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-muted p-4">
                  <h4 className="text-base font-medium">
                    Branch {branchIndex + 1}:{" "}
                    {watch(
                      `branchDetails.branches.${branchIndex}.placeOfBusiness`
                    ) || "New Branch"}
                  </h4>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={control}
                      name={`branchDetails.branches.${branchIndex}.placeOfBusiness`}
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
                      name={`branchDetails.branches.${branchIndex}.proprietorStatus`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status of the Proprietor</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
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

                    {watch(
                      `branchDetails.branches.${branchIndex}.proprietorStatus`
                    ) === "OWNER" && (
                      <FormField
                        control={control}
                        name={`branchDetails.branches.${branchIndex}.proprietorType`}
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
                                <SelectItem value="RENTED">
                                  Rented/Tenant
                                </SelectItem>
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

                    <FormField
                      control={control}
                      name={`branchDetails.branches.${branchIndex}.electricalUscNumber`}
                      render={({ field }) => (
                        <FormItem>
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
                                  onFieldChange(`branch_${branchIndex}_electricalUscNumber`, e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          {validationErrors[`branch_${branchIndex}_electricalUscNumber`] && (
                            <p className="text-sm text-destructive">
                              {validationErrors[`branch_${branchIndex}_electricalUscNumber`]}
                            </p>
                          )}
                          {validationSuccess[`branch_${branchIndex}_electricalUscNumber`] && (
                            <p className="text-sm text-green-600">
                              {validationSuccess[`branch_${branchIndex}_electricalUscNumber`]}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`branchDetails.branches.${branchIndex}.scNumber`}
                      render={({ field }) => (
                        <FormItem>
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
                                  onFieldChange(`branch_${branchIndex}_scNumber`, e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          {validationErrors[`branch_${branchIndex}_scNumber`] && (
                            <p className="text-sm text-destructive">
                              {validationErrors[`branch_${branchIndex}_scNumber`]}
                            </p>
                          )}
                          {validationSuccess[`branch_${branchIndex}_scNumber`] && (
                            <p className="text-sm text-green-600">
                              {validationSuccess[`branch_${branchIndex}_scNumber`]}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`branchDetails.branches.${branchIndex}.sanctionedHP`}
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

                  {/* Tabs for Machinery and Labour */}
                  <Tabs defaultValue="machinery" className="mt-6">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="machinery">Machinery</TabsTrigger>
                      <TabsTrigger value="labour">Labour</TabsTrigger>
                    </TabsList>

                    {/* Machinery Tab */}
                    <TabsContent value="machinery" className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Machinery Information</h5>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addMachinery(branchIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Machine
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {(
                          getValues(
                            `branchDetails.branches.${branchIndex}.machinery`
                          ) || []
                        ).map((machine: any, machineryIndex: any) => (
                          <Card key={machineryIndex}>
                            <CardContent className="pt-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={control}
                                  name={`branchDetails.branches.${branchIndex}.machinery.${machineryIndex}.type`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Machine Type</FormLabel>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          // Update isOther based on selection
                                          const isOther = value === "Others";
                                          setValue(
                                            `branchDetails.branches.${branchIndex}.machinery.${machineryIndex}.isOther`,
                                            isOther
                                          );
                                          // Clear machineName if not "Others"
                                          if (!isOther) {
                                            setValue(
                                              `branchDetails.branches.${branchIndex}.machinery.${machineryIndex}.machineName`,
                                              ""
                                            );
                                          }
                                        }}
                                        defaultValue={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select machine type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="High Polish">
                                            High Polish
                                          </SelectItem>
                                          <SelectItem value="Slice">
                                            Slice
                                          </SelectItem>
                                          <SelectItem value="Cutting">
                                            Cutting
                                          </SelectItem>
                                          <SelectItem value="Others">
                                            Others
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {(watch(
                                  `branchDetails.branches.${branchIndex}.machinery.${machineryIndex}.type`
                                ) === "Others" || 
                                getValues(
                                  `branchDetails.branches.${branchIndex}.machinery.${machineryIndex}.isOther`
                                )) && (
                                  <FormField
                                    control={control}
                                    name={`branchDetails.branches.${branchIndex}.machinery.${machineryIndex}.machineName`}
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
                                )}

                                <FormField
                                  control={control}
                                  name={`branchDetails.branches.${branchIndex}.machinery.${machineryIndex}.quantity`}
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
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="mt-4 text-destructive"
                                onClick={() =>
                                  removeMachinery(branchIndex, machineryIndex)
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Remove
                              </Button>
                            </CardContent>
                          </Card>
                        ))}

                        {(!getValues(
                          `branchDetails.branches.${branchIndex}.machinery`
                        ) ||
                          getValues(
                            `branchDetails.branches.${branchIndex}.machinery`
                          ).length === 0) && (
                          <p className="text-sm text-muted-foreground">
                            No machinery added yet for this branch. Click the
                            button above to add machinery.
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    {/* Labour Tab */}
                    <TabsContent value="labour" className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Labour Information</h5>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addLabour(branchIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Labour
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {(
                          getValues(
                            `branchDetails.branches.${branchIndex}.labour`
                          ) || []
                        ).map((labour: any, labourIndex: any) => (
                          <Card key={labourIndex}>
                            <CardContent className="pt-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={control}
                                  name={`branchDetails.branches.${branchIndex}.labour.${labourIndex}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Labour Name</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter labour name"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={control}
                                  name={`branchDetails.branches.${branchIndex}.labour.${labourIndex}.aadharNumber`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Aadhar Number</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter Aadhar number"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={control}
                                  name={`branchDetails.branches.${branchIndex}.labour.${labourIndex}.eshramCardNumber`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Eshram Card Number</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter Eshram card number"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={control}
                                  name={`branchDetails.branches.${branchIndex}.labour.${labourIndex}.esiNumber`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        ESI Number (Optional)
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter ESI number"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={control}
                                  name={`branchDetails.branches.${branchIndex}.labour.${labourIndex}.employedFrom`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Employed From</FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant={"outline"}
                                              className={`w-full pl-3 text-left font-normal ${
                                                !field.value
                                                  ? "text-muted-foreground"
                                                  : ""
                                              }`}
                                            >
                                              {field.value ? (
                                                format(
                                                  new Date(field.value),
                                                  "PPP"
                                                )
                                              ) : (
                                                <span>Pick a date</span>
                                              )}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          align="start"
                                        >
                                          <Calendar
                                            mode="single"
                                            selected={
                                              field.value
                                                ? new Date(field.value)
                                                : undefined
                                            }
                                            onSelect={(date) =>
                                              field.onChange(
                                                date
                                                  ? format(date, "yyyy-MM-dd")
                                                  : ""
                                              )
                                            }
                                            disabled={(date) =>
                                              date > new Date()
                                            }
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={control}
                                  name={`branchDetails.branches.${branchIndex}.labour.${labourIndex}.employedTo`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>
                                        Employed To (Leave empty if currently
                                        employed)
                                      </FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant={"outline"}
                                              className={`w-full pl-3 text-left font-normal ${
                                                !field.value
                                                  ? "text-muted-foreground"
                                                  : ""
                                              }`}
                                            >
                                              {field.value ? (
                                                format(
                                                  new Date(field.value),
                                                  "PPP"
                                                )
                                              ) : (
                                                <span>Pick a date</span>
                                              )}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          className="w-auto p-0"
                                          align="start"
                                        >
                                          <Calendar
                                            mode="single"
                                            selected={
                                              field.value
                                                ? new Date(field.value)
                                                : undefined
                                            }
                                            onSelect={(date) =>
                                              field.onChange(
                                                date
                                                  ? format(date, "yyyy-MM-dd")
                                                  : ""
                                              )
                                            }
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={control}
                                  name={`branchDetails.branches.${branchIndex}.labour.${labourIndex}.status`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Status</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Active">
                                            Active
                                          </SelectItem>
                                          <SelectItem value="Bench">
                                            Bench
                                          </SelectItem>
                                          <SelectItem value="Discontinued">
                                            Discontinued
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
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
                                onClick={() =>
                                  removeLabour(branchIndex, labourIndex)
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Remove
                              </Button>
                            </CardContent>
                          </Card>
                        ))}

                        {(!getValues(
                          `branchDetails.branches.${branchIndex}.labour`
                        ) ||
                          getValues(
                            `branchDetails.branches.${branchIndex}.labour`
                          ).length === 0) && (
                          <p className="text-sm text-muted-foreground">
                            No labour added yet for this branch. Click the
                            button above to add labour details.
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="bg-muted p-4 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => branchArray.remove(branchIndex)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove Branch
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {branchArray.fields.length === 0 && (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                No branches added yet. Click the "Add Branch" button above to
                add your first branch.
              </p>
            </Card>
          )}
        </div>
      </div>
      {/* Section 2: Labour Count Details */}
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
      </div>
    </div>
  );
}
