import { useState } from "react";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, Users, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Role = "student" | "concern-hod" | "school-hod" | "daa";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  school: string;
  status: "Active" | "Inactive";
}

const initialUsers: UserRecord[] = [
  { id: "1", name: "Aryan Sharma", email: "aryan@lpu.in", password: "demo123", role: "student", department: "Computer Science", school: "School of CS & Engg", status: "Active" },
  { id: "2", name: "Priya Singh", email: "priya@lpu.in", password: "demo123", role: "student", department: "Electronics", school: "School of CS & Engg", status: "Active" },
  { id: "3", name: "Rahul Verma", email: "rahul@lpu.in", password: "demo123", role: "student", department: "Mechanical", school: "School of Engineering", status: "Active" },
  { id: "4", name: "Sneha Patel", email: "sneha@lpu.in", password: "demo123", role: "student", department: "Biotechnology", school: "School of Bio Sciences", status: "Active" },
  { id: "5", name: "Amit Kumar", email: "amit@lpu.in", password: "demo123", role: "student", department: "Business Admin", school: "School of Business", status: "Inactive" },
  { id: "6", name: "Dr. Rajesh Kumar", email: "hod@lpu.in", password: "demo123", role: "concern-hod", department: "Computer Science", school: "School of CS & Engg", status: "Active" },
  { id: "7", name: "Dr. Anita Rao", email: "anita@lpu.in", password: "demo123", role: "concern-hod", department: "Electronics", school: "School of CS & Engg", status: "Active" },
  { id: "8", name: "Dr. Meena Sharma", email: "schoolhod@lpu.in", password: "demo123", role: "school-hod", department: "All Departments", school: "School of CS & Engg", status: "Active" },
  { id: "9", name: "Dr. Vikram Patel", email: "vikram@lpu.in", password: "demo123", role: "school-hod", department: "All Departments", school: "School of Engineering", status: "Active" },
  { id: "10", name: "Prof. Ashok Mittal", email: "daa@lpu.in", password: "demo123", role: "daa", department: "Academic Affairs", school: "University Level", status: "Active" },
];

const roleLabels: Record<Role, string> = {
  student: "Student",
  "concern-hod": "Concern HOD",
  "school-hod": "School HOD",
  daa: "DAA",
};

const roleTabs: { value: string; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "student", label: "Students" },
  { value: "concern-hod", label: "Concern HODs" },
  { value: "school-hod", label: "School HODs" },
  { value: "daa", label: "DAA" },
];

interface FormData {
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  school: string;
  status: "Active" | "Inactive";
}

const emptyForm: FormData = {
  name: "", email: "", password: "", role: "student", department: "", school: "", status: "Active",
};

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const filtered = users.filter((u) => {
    const matchesTab = activeTab === "all" || u.role === activeTab;
    const matchesSearch = searchQuery === "" ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({ title: "Error", description: "Name, Email, and Password are required.", variant: "destructive" });
      return;
    }
    setUsers((prev) => [...prev, { ...formData, id: Date.now().toString() }]);
    setShowAddModal(false);
    setFormData(emptyForm);
    setShowPassword(false);
    toast({ title: "User Created", description: `${formData.name} has been added as ${roleLabels[formData.role]}.` });
  };

  const handleEdit = () => {
    if (!editId) return;
    setUsers((prev) => prev.map((u) => (u.id === editId ? { ...u, ...formData } : u)));
    setShowEditModal(false);
    setEditId(null);
    setFormData(emptyForm);
    setShowPassword(false);
    toast({ title: "User Updated", description: `${formData.name} has been updated.` });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const user = users.find((u) => u.id === deleteId);
    setUsers((prev) => prev.filter((u) => u.id !== deleteId));
    setShowDeleteDialog(false);
    setDeleteId(null);
    toast({ title: "User Deleted", description: `${user?.name} has been removed.` });
  };

  const openAdd = () => {
    setFormData(emptyForm);
    setShowPassword(false);
    setShowAddModal(true);
  };

  const openEdit = (user: UserRecord) => {
    setEditId(user.id);
    setFormData({ name: user.name, email: user.email, password: user.password, role: user.role, department: user.department, school: user.school, status: user.status });
    setShowPassword(false);
    setShowEditModal(true);
  };

  const openDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const formFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="form-name">Full Name</Label>
          <Input id="form-name" value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Enter name" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="form-email">Email</Label>
          <Input id="form-email" type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="Enter email" className="mt-1.5" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="form-password">Password</Label>
          <div className="relative mt-1.5">
            <Input
              id="form-password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Set password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <Label>Role</Label>
          <Select value={formData.role} onValueChange={(v) => updateField("role", v)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="concern-hod">Concern HOD</SelectItem>
              <SelectItem value="school-hod">School HOD</SelectItem>
              <SelectItem value="daa">DAA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => updateField("status", v)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="form-dept">Department</Label>
          <Input id="form-dept" value={formData.department} onChange={(e) => updateField("department", e.target.value)} placeholder="Enter department" className="mt-1.5" />
        </div>
      </div>
      <div>
        <Label htmlFor="form-school">School</Label>
        <Input id="form-school" value={formData.school} onChange={(e) => updateField("school", e.target.value)} placeholder="Enter school" className="mt-1.5" />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground">Create, edit, and manage platform users</p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["student", "concern-hod", "school-hod", "daa"] as Role[]).map((role) => (
            <Card key={role} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{roleLabels[role]}s</p>
                <p className="mt-1 text-xl font-bold text-foreground">{users.filter((u) => u.role === role).length}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs + Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  {roleTabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="text-xs">{tab.label}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-56 pl-9 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Name</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Email</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Role</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Department</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">School</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{user.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{user.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary" className="text-xs">{roleLabels[user.role]}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-foreground">{user.department}</td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">{user.school}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                          user.status === "Active"
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20"
                            : "bg-red-500/15 text-red-600 border-red-500/20"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDelete(user.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <Users className="mb-2 h-8 w-8" />
                  <p className="text-sm">No users found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account on the platform.</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user account details.</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{users.find((u) => u.id === deleteId)?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminUserManagement;
