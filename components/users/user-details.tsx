"use client";

import { useState } from "react";
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
import { type User, UserStatus, deleteUser, getUserById } from "@/data/users";
import { formatDate } from "@/lib/utils";

type UserDetailsProps = {
  userId: string;
};

export default function UserDetails({ userId }: UserDetailsProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(
    () => getUserById(userId) || null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Button
              variant="ghost"
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
          <Button onClick={() => router.push("/admin/users")}>
            Back to Users List
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const handleEdit = () => {
    router.push(`/admin/users/${userId}/edit/`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const deletedUser = deleteUser(userId);
      if (deletedUser) {
        router.push("/admin/users");
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      // In a real app, you would show an error message to the user
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: UserStatus) => {
    return (
      <Badge
        variant={status === UserStatus.Active ? "default" : "destructive"}
        className={
          status === UserStatus.Active
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
              variant="ghost"
              size="sm"
              className="mr-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>{user.name}</CardTitle>
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
            <p>{renderStatusBadge(user.status)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Created At
            </p>
            <p>{formatDate(user.createdAt)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Last Updated
            </p>
            <p>{formatDate(user.updatedAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
