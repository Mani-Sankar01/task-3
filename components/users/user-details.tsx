"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, AlertTriangle } from "lucide-react";
import { UserStatus } from "@/data/users";
import { formatDate, renderRoleBasedPath } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import axios from "axios";

// User interface
interface User {
  id: number;
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  email: string;
  phone: string;
  role:
    | "TSMWA_ADMIN"
    | "TSMWA_EDITOR"
    | "TSMWA_VIEWER"
    | "TQMWA_EDITOR"
    | "TQMWA_VIEWER";
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

type UserDetailsProps = {
  userId: string;
};

export default function UserDetails({ userId }: UserDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user data
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.token) return;

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
        console.log("User details loaded:", userData);
        setUser(userData);
      } catch (error: any) {
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
  }, [userId, status, session?.user?.token, toast]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Loading User...</CardTitle>
          </div>
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

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>User Not Found</CardTitle>
          </div>
          <CardDescription>
            The requested user could not be found.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={() =>
              router.push(`/${renderRoleBasedPath(session?.user?.role)}/users`)
            }
          >
            Back to Users List
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const handleEdit = () => {
    router.push(
      `/${renderRoleBasedPath(session?.user?.role)}/users/${userId}/edit/`
    );
  };

  const handleDelete = async () => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete(
        `${process.env.BACKEND_API_URL}/api/user/delete_user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      router.push(`/${renderRoleBasedPath(session?.user?.role)}/users`);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: UserStatus) => {
    return (
      <Badge
        variant={status === UserStatus.ACTIVE ? "default" : "destructive"}
        className={
          status === UserStatus.ACTIVE
            ? "bg-green-100 text-green-800 hover:bg-green-100"
            : "bg-red-100 text-red-800 hover:bg-red-100"
        }
      >
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>{user.fullName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this user? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <p>Deleting this user will remove all associated data.</p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Phone</p>
            <p>{user.phone}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <p>{user.role}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p>{renderStatusBadge(user.status as UserStatus)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Created At
            </p>
            <p>{user.createdAt ? formatDate(user.createdAt) : "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Last Updated
            </p>
            <p>{user.updatedAt ? formatDate(user.updatedAt) : "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
