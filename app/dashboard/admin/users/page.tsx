"use client"

import { CardFooter } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Edit, Trash2, Shield, UserPlus, UserCheck, UserX } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { UserManagementService, type UserProfile } from "@/lib/user-management-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

export default function UsersPage() {
  const { user, hasRole } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New user form state
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserRole, setNewUserRole] = useState<"user" | "admin" | "developer">("user")
  const [isAddingUser, setIsAddingUser] = useState(false)

  // Edit user state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editUserName, setEditUserName] = useState("")
  const [editUserRole, setEditUserRole] = useState<"user" | "admin" | "developer">("user")
  const [isEditingUser, setIsEditingUser] = useState(false)

  // Delete user state
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if user has admin permissions
  useEffect(() => {
    if (!loading && user && !hasRole(["admin"])) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [user, hasRole, loading, router])

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)

        const users = await UserManagementService.getAllUsers()
        setUsers(users)
        setFilteredUsers(users)

        setLoading(false)
      } catch (err) {
        console.error("Error fetching users:", err)
        setError("Failed to fetch users")
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.company && user.company.toLowerCase().includes(query)) ||
        user.role.toLowerCase().includes(query),
    )

    setFilteredUsers(filtered)
  }, [users, searchQuery])

  // Handle adding a new user
  const handleAddUser = async () => {
    try {
      setIsAddingUser(true)

      // Validate form
      if (!newUserEmail || !newUserPassword) {
        toast({
          title: "Validation Error",
          description: "Email and password are required",
          variant: "destructive",
        })
        setIsAddingUser(false)
        return
      }

      // Create the user
      const newUser = await UserManagementService.createUser(newUserEmail, newUserPassword, {
        name: newUserName,
        role: newUserRole,
      })

      // Update the users list
      setUsers([...users, newUser])

      // Reset form
      setNewUserEmail("")
      setNewUserPassword("")
      setNewUserName("")
      setNewUserRole("user")

      toast({
        title: "User Created",
        description: `User ${newUserEmail} has been created successfully`,
      })

      setIsAddingUser(false)
    } catch (err: any) {
      console.error("Error adding user:", err)

      toast({
        title: "Error Creating User",
        description: err.message || "Failed to create user",
        variant: "destructive",
      })

      setIsAddingUser(false)
    }
  }

  // Handle editing a user
  const handleEditUser = async () => {
    if (!editingUser) return

    try {
      setIsEditingUser(true)

      // Update the user
      await UserManagementService.updateUser(editingUser.id, {
        name: editUserName,
        role: editUserRole,
      })

      // Update the users list
      setUsers(
        users.map((user) => (user.id === editingUser.id ? { ...user, name: editUserName, role: editUserRole } : user)),
      )

      toast({
        title: "User Updated",
        description: `User ${editingUser.email} has been updated successfully`,
      })

      setEditingUser(null)
      setIsEditingUser(false)
    } catch (err) {
      console.error("Error updating user:", err)

      toast({
        title: "Error Updating User",
        description: "Failed to update user",
        variant: "destructive",
      })

      setIsEditingUser(false)
    }
  }

  // Handle deleting a user
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setIsDeleting(true)

      // Delete the user
      await UserManagementService.deleteUser(userToDelete)

      // Update the users list
      setUsers(users.filter((user) => user.id !== userToDelete))

      toast({
        title: "User Deleted",
        description: "User has been deleted successfully",
      })

      setUserToDelete(null)
      setIsDeleting(false)
    } catch (err) {
      console.error("Error deleting user:", err)

      toast({
        title: "Error Deleting User",
        description: "Failed to delete user",
        variant: "destructive",
      })

      setIsDeleting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait while we fetch the users</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        </div>
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. The user will receive an email to set their password.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as any)}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setNewUserEmail("")
                  setNewUserPassword("")
                  setNewUserName("")
                  setNewUserRole("user")
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={isAddingUser}>
                {isAddingUser ? "Adding..." : "Add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "developer"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role === "admin" && <Shield className="mr-1 h-3 w-3" />}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.onboardingComplete ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {user.onboardingComplete ? (
                          <>
                            <UserCheck className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX className="mr-1 h-3 w-3" />
                            Pending
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingUser(user)
                                setEditUserName(user.name || "")
                                setEditUserRole(user.role)
                              }}
                            >
                              <span className="sr-only">Edit</span>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>Update user details and permissions</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input id="edit-email" value={editingUser?.email || ""} disabled />
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                  id="edit-name"
                                  value={editUserName}
                                  onChange={(e) => setEditUserName(e.target.value)}
                                />
                              </div>

                              <div className="grid gap-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select value={editUserRole} onValueChange={(value) => setEditUserRole(value as any)}>
                                  <SelectTrigger id="edit-role">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="developer">Developer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingUser(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleEditUser} disabled={isEditingUser}>
                                {isEditingUser ? "Saving..." : "Save Changes"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setUserToDelete(user.id)}
                            >
                              <span className="sr-only">Delete</span>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteUser}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
