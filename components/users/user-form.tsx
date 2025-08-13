"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import axios from "axios";
import { UserRole, UserStatus, UserGender, userSchema } from "@/data/users";
import { renderRoleBasedPath } from "@/lib/utils";

// Extend the user schema for the form
const formSchema = userSchema;

type UserFormProps = {
  userId?: string;
};

export default function UserForm({ userId }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!userId;

  // Initialize form with default values or existing user data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      gender: UserGender.MALE,
      email: "",
      phone: "",
      role: UserRole.TSMWA_VIEWER, // Default role
      status: UserStatus.ACTIVE, // Default status
    },
  });

  // Load user data for edit mode
  useEffect(() => {
    if (
      isEditMode &&
      userId &&
      status === "authenticated" &&
      session?.user?.token
    ) {
      const fetchUser = async () => {
        try {
          setIsLoading(true);
          const response = await axios.get(
            `${process.env.BACKEND_API_URL}/api/user/get_user_id/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${session.user.token}`,
              },
            }
          );

          const userData = response.data;
          console.log("User data loaded:", userData);
          form.reset({
            fullName: userData.fullName || "",
            gender: userData.gender || UserGender.MALE,
            email: userData.email || "",
            phone: userData.phone || "",
            role: userData.role || UserRole.TSMWA_VIEWER,
            status: userData.status || UserStatus.ACTIVE,
          });
        } catch (error) {
          console.error("Error loading user:", error);
          toast({
            title: "Error",
            description: "Failed to load user data",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    }
  }, [isEditMode, userId, status, session?.user?.token, form, toast]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && userId) {
        // Update existing user
        const updatePayload = {
          id: parseInt(userId),
          ...data,
        };
        console.log("Update payload:", updatePayload);
        console.log(data);

        const response = await axios.post(
          `${process.env.BACKEND_API_URL}/api/user/update_user`,
          updatePayload,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Update response:", response.data);
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        router.push(`/${renderRoleBasedPath(session?.user?.role)}/users/`);
      } else {
        // Create new user
        console.log("Create payload:", data);

        const response = await axios.post(
          `${process.env.BACKEND_API_URL}/api/user/add_user`,
          data,
          {
            headers: {
              Authorization: `Bearer ${session.user.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Create response:", response.data);
        toast({
          title: "Success",
          description: "User created successfully",
        });
        router.push(`/${renderRoleBasedPath(session?.user?.role)}/users/`);
      }
    } catch (error: any) {
      console.error("Error saving user:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
      });

      let errorMessage = "Failed to save user. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>{isEditMode ? "Edit User" : "Add New User"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading user data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle>{isEditMode ? "Edit User" : "Add New User"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the user's full name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gender Field */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(UserGender).map((gender) => (
                          <SelectItem key={gender} value={gender}>
                            {gender}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the user's gender</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a valid email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone Field */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Enter phone number"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a valid phone number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role Field */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(UserRole).map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the user's role in the system
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Field */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(UserStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set the user's account status
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                  ? "Update User"
                  : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
