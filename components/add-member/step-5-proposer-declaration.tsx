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

export default function Step5ProposerDeclaration() {
  const { control } = useFormContext();

  return (
    <div className="space-y-8">
      {/* Section 1: Proposer 1 */}
      <div>
        <h3 className="text-lg font-medium border-b pb-2 mb-4">
          Proposer 1 (Valid member of the Association)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="proposer1.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter proposer name" {...field} />
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
                  <Input placeholder="Enter firm name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proposer1.address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter address" {...field} />
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
          Proposer 2 (Valid member Executive Member of the Association)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="proposer2.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter proposer name" {...field} />
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
                  <Input placeholder="Enter firm name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="proposer2.address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter address" {...field} />
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
              name="declaration.photoUpload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo Upload (Partner/Representative)</FormLabel>
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
