import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCog, Plus, Pencil, Trash2, Search, Users, ShieldCheck, Building, ChevronRight, BookOpen, Layers } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/shared/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ThemeToggle from "@/components/dashboard/shared/ThemeToggle";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "concern-hod" | "school-hod";
  subject: string;
  sections: string[];
  schoolId: string;
}

interface School {
  id: string;
  name: string;
  shortName: string;
  staff: StaffMember[];
}

const schoolsData: School[] = [
  {
    id: "s1", name: "School of Computing & AI", shortName: "SCAI",
    staff: [
      { id: "1", name: "Dr. Rajesh Kumar", email: "rajesh.hod@lpu.in", role: "concern-hod", subject: "Data Structures", sections: ["K24BX", "G24BX", "K24AI"], schoolId: "s1" },
      { id: "2", name: "Dr. Meena Sharma", email: "meena.shod@lpu.in", role: "school-hod", subject: "Machine Learning", sections: ["K24BX", "G24BX", "K23CS", "G23CS"], schoolId: "s1" },
      { id: "3", name: "Dr. Vikram Patel", email: "vikram.hod@lpu.in", role: "concern-hod", subject: "Algorithms", sections: ["K23CS", "G23CS"], schoolId: "s1" },
    ],
  },
  {
    id: "s2", name: "School of Computer Science & Engineering", shortName: "CSE",
    staff: [
      { id: "4", name: "Dr. Pradeep Singh", email: "pradeep.hod@lpu.in", role: "concern-hod", subject: "Operating Systems", sections: ["K24CS", "G24CS"], schoolId: "s2" },
      { id: "5", name: "Dr. Anita Desai", email: "anita.shod@lpu.in", role: "school-hod", subject: "Computer Networks", sections: ["K24CS", "G24CS", "K23CE"], schoolId: "s2" },
    ],
  },
  {
    id: "s3", name: "School of Agriculture", shortName: "AGR",
    staff: [
      { id: "6", name: "Dr. Sunita Rao", email: "sunita.hod@lpu.in", role: "concern-hod", subject: "Crop Science", sections: ["K24AG", "G24AG"], schoolId: "s3" },
      { id: "7", name: "Dr. Mohan Das", email: "mohan.shod@lpu.in", role: "school-hod", subject: "Soil Science", sections: ["K24AG", "G24AG", "K23AG"], schoolId: "s3" },
    ],
  },
  {
    id: "s4", name: "School of Aeronautical Engineering", shortName: "AERO",
    staff: [
      { id: "8", name: "Dr. Ramesh Gupta", email: "ramesh.shod@lpu.in", role: "school-hod", subject: "Aerodynamics", sections: ["K24AE", "G24AE"], schoolId: "s4" },
      { id: "9", name: "Dr. Pooja Nair", email: "pooja.hod@lpu.in", role: "concern-hod", subject: "Propulsion", sections: ["K24AE"], schoolId: "s4" },
    ],
  },
  {
    id: "s5", name: "School of Business", shortName: "BUS",
    staff: [
      { id: "10", name: "Dr. Anil Verma", email: "anil.shod@lpu.in", role: "school-hod", subject: "Marketing", sections: ["K24MB", "G24MB"], schoolId: "s5" },
      { id: "11", name: "Dr. Ritu Kapoor", email: "ritu.hod@lpu.in", role: "concern-hod", subject: "Finance", sections: ["K24MB", "G24MB", "K23MB"], schoolId: "s5" },
    ],
  },
  {
    id: "s6", name: "School of Law", shortName: "LAW",
    staff: [
      { id: "12", name: "Dr. Neelam Patel", email: "neelam.hod@lpu.in", role: "concern-hod", subject: "Constitutional Law", sections: ["K24LW", "G24LW"], schoolId: "s6" },
      { id: "13", name: "Dr. Arvind Mishra", email: "arvind.shod@lpu.in", role: "school-hod", subject: "Criminal Law", sections: ["K24LW"], schoolId: "s6" },
    ],
  },
  {
    id: "s7", name: "School of Pharmacy", shortName: "PHRM",
    staff: [
      { id: "14", name: "Dr. Kavita Joshi", email: "kavita.hod@lpu.in", role: "concern-hod", subject: "Pharmacology", sections: ["K24PH", "G24PH"], schoolId: "s7" },
      { id: "15", name: "Dr. Sanjay Tiwari", email: "sanjay.shod@lpu.in", role: "school-hod", subject: "Pharmaceutical Chemistry", sections: ["K24PH", "G24PH", "K23PH"], schoolId: "s7" },
    ],
  },
  {
    id: "s8", name: "School of Architecture", shortName: "ARCH",
    staff: [
      { id: "16", name: "Dr. Deepak Chauhan", email: "deepak.hod@lpu.in", role: "concern-hod", subject: "Urban Design", sections: ["K24AR", "G24AR"], schoolId: "s8" },
    ],
  },
  {
    id: "s9", name: "School of Hotel Management", shortName: "HM",
    staff: [
      { id: "17", name: "Dr. Swati Banerjee", email: "swati.shod@lpu.in", role: "school-hod", subject: "Hospitality Management", sections: ["K24HM", "G24HM"], schoolId: "s9" },
      { id: "18", name: "Dr. Rakesh Saxena", email: "rakesh.hod@lpu.in", role: "concern-hod", subject: "Food & Beverage", sections: ["K24HM"], schoolId: "s9" },
    ],
  },
  {
    id: "s10", name: "School of Education", shortName: "EDU",
    staff: [
      { id: "19", name: "Dr. Geeta Iyer", email: "geeta.hod@lpu.in", role: "concern-hod", subject: "Pedagogy", sections: ["K24ED", "G24ED"], schoolId: "s10" },
    ],
  },
  {
    id: "s11", name: "School of Design", shortName: "DES",
    staff: [
      { id: "20", name: "Dr. Suresh Mehta", email: "suresh.hod@lpu.in", role: "concern-hod", subject: "Visual Communication", sections: ["K24DS", "G24DS"], schoolId: "s11" },
      { id: "21", name: "Dr. Pallavi Ghosh", email: "pallavi.shod@lpu.in", role: "school-hod", subject: "Industrial Design", sections: ["K24DS"], schoolId: "s11" },
    ],
  },
  {
    id: "s12", name: "School of Bioengineering", shortName: "BIO",
    staff: [
      { id: "22", name: "Dr. Harish Menon", email: "harish.hod@lpu.in", role: "concern-hod", subject: "Bioprocess Engineering", sections: ["K24BE", "G24BE"], schoolId: "s12" },
    ],
  },
  {
    id: "s13", name: "School of Chemical Engineering", shortName: "CHEM",
    staff: [
      { id: "23", name: "Dr. Nisha Agarwal", email: "nisha.hod@lpu.in", role: "concern-hod", subject: "Thermodynamics", sections: ["K24CH", "G24CH"], schoolId: "s13" },
      { id: "24", name: "Dr. Manoj Reddy", email: "manoj.shod@lpu.in", role: "school-hod", subject: "Reaction Engineering", sections: ["K24CH"], schoolId: "s13" },
    ],
  },
  {
    id: "s14", name: "School of Electronics & Communication", shortName: "ECE",
    staff: [
      { id: "25", name: "Dr. Ashwin Jha", email: "ashwin.hod@lpu.in", role: "concern-hod", subject: "Signal Processing", sections: ["K24EC", "G24EC"], schoolId: "s14" },
      { id: "26", name: "Dr. Lata Kumari", email: "lata.shod@lpu.in", role: "school-hod", subject: "VLSI Design", sections: ["K24EC", "G24EC", "K23EC"], schoolId: "s14" },
    ],
  },
  {
    id: "s15", name: "School of Mechanical Engineering", shortName: "MECH",
    staff: [
      { id: "27", name: "Dr. Bharat Sharma", email: "bharat.hod@lpu.in", role: "concern-hod", subject: "Manufacturing", sections: ["K24ME", "G24ME"], schoolId: "s15" },
      { id: "28", name: "Dr. Sarita Devi", email: "sarita.shod@lpu.in", role: "school-hod", subject: "Fluid Mechanics", sections: ["K24ME", "G24ME", "K23ME"], schoolId: "s15" },
    ],
  },
];

const roleLabels: Record<string, string> = {
  "concern-hod": "Concern HOD",
  "school-hod": "School HOD",
};

const roleBadgeColors: Record<string, string> = {
  "concern-hod": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  "school-hod": "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
};

const AdminStaff = () => {
  const [schools, setSchools] = useState<School[]>(schoolsData);
  const [level, setLevel] = useState<"schools" | "school">("schools");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "concern-hod" as StaffMember["role"], subject: "", sections: "" });

  const allStaff = schools.flatMap(s => s.staff);
  const totalConcernHODs = allStaff.filter(s => s.role === "concern-hod").length;
  const totalSchoolHODs = allStaff.filter(s => s.role === "school-hod").length;

  const currentSchool = selectedSchool ? schools.find(s => s.id === selectedSchool.id) : null;

  const openSchool = (school: School) => {
    setSelectedSchool(school);
    setLevel("school");
    setSearchQuery("");
  };

  const goBack = () => {
    setLevel("schools");
    setSelectedSchool(null);
    setSearchQuery("");
  };

  const openAdd = () => {
    setEditingStaff(null);
    setForm({ name: "", email: "", role: "concern-hod", subject: "", sections: "" });
    setShowDialog(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setForm({ name: member.name, email: member.email, role: member.role, subject: member.subject, sections: member.sections.join(", ") });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email || !currentSchool) return;
    const sectionsArr = form.sections.split(",").map(s => s.trim()).filter(Boolean);
    if (editingStaff) {
      setSchools(prev => prev.map(school =>
        school.id === currentSchool.id
          ? { ...school, staff: school.staff.map(s => s.id === editingStaff.id ? { ...s, name: form.name, email: form.email, role: form.role, subject: form.subject, sections: sectionsArr } : s) }
          : school
      ));
    } else {
      const newMember: StaffMember = { id: `staff-${Date.now()}`, name: form.name, email: form.email, role: form.role, subject: form.subject, sections: sectionsArr, schoolId: currentSchool.id };
      setSchools(prev => prev.map(school =>
        school.id === currentSchool.id ? { ...school, staff: [...school.staff, newMember] } : school
      ));
    }
    setShowDialog(false);
    // Update selectedSchool reference
    setSelectedSchool(prev => prev ? { ...prev } : null);
  };

  const handleDelete = (memberId: string) => {
    if (!currentSchool) return;
    setSchools(prev => prev.map(school =>
      school.id === currentSchool.id ? { ...school, staff: school.staff.filter(s => s.id !== memberId) } : school
    ));
  };

  const StatCard = ({ icon: Icon, label, value, color, index }: { icon: any; label: string; value: number | string; color: string; index: number }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}>
      <Card className="border-l-4" style={{ borderLeftColor: color }}>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const schoolStaff = currentSchool ? schools.find(s => s.id === currentSchool.id)?.staff.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [] : [];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 ml-[70px] p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <button onClick={goBack} className="hover:text-foreground transition-colors">All Schools</button>
              {level === "school" && currentSchool && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-foreground font-medium">{currentSchool.name}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          </div>
          <ThemeToggle />
        </div>

        <AnimatePresence mode="wait">
          {level === "schools" && (
            <motion.div key="schools" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {/* Level 1: All Schools */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard icon={Building} label="Total Schools" value={schools.length} color="hsl(var(--primary))" index={0} />
                <StatCard icon={UserCog} label="Concern HODs" value={totalConcernHODs} color="#3b82f6" index={1} />
                <StatCard icon={ShieldCheck} label="School HODs" value={totalSchoolHODs} color="#8b5cf6" index={2} />
                <StatCard icon={Users} label="Total Staff" value={allStaff.length} color="#10b981" index={3} />
              </div>

              <div className="relative max-w-sm mb-6">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search schools..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSchools.map((school, i) => {
                  const cHods = school.staff.filter(s => s.role === "concern-hod").length;
                  const sHods = school.staff.filter(s => s.role === "school-hod").length;
                  return (
                    <motion.div key={school.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}>
                      <Card
                        className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
                        onClick={() => openSchool(school)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
                              {school.shortName}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <h3 className="font-semibold text-foreground text-sm mb-2">{school.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{cHods} Concern HOD{cHods !== 1 ? "s" : ""}</span>
                            <span>•</span>
                            <span>{sHods} School HOD{sHods !== 1 ? "s" : ""}</span>
                            <span>•</span>
                            <span>{school.staff.length} Total</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {level === "school" && currentSchool && (
            <motion.div key="school" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Level 2: Inside a School */}
              {(() => {
                const schoolData = schools.find(s => s.id === currentSchool.id)!;
                const cHods = schoolData.staff.filter(s => s.role === "concern-hod").length;
                const sHods = schoolData.staff.filter(s => s.role === "school-hod").length;
                const allSections = [...new Set(schoolData.staff.flatMap(s => s.sections))];
                return (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                      <StatCard icon={Users} label="Total Staff" value={schoolData.staff.length} color="hsl(var(--primary))" index={0} />
                      <StatCard icon={UserCog} label="Concern HODs" value={cHods} color="#3b82f6" index={1} />
                      <StatCard icon={ShieldCheck} label="School HODs" value={sHods} color="#8b5cf6" index={2} />
                      <StatCard icon={Layers} label="Sections Covered" value={allSections.length} color="#f59e0b" index={3} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search staff..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
                      </div>
                      <Button onClick={openAdd} size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add HOD
                      </Button>
                    </div>

                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Sections</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence>
                            {schoolStaff.map(member => (
                              <motion.tr
                                key={member.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-b transition-colors hover:bg-muted/50"
                              >
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{member.email}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColors[member.role]}`}>
                                    {roleLabels[member.role]}
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm">
                                  <div className="flex items-center gap-1.5">
                                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                                    {member.subject}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {member.sections.map(sec => (
                                      <span key={sec} className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                                        {sec}
                                      </span>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => openEdit(member)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)} className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                          {schoolStaff.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No staff members found</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add HOD"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Full Name</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Dr. Name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@lpu.in" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v: StaffMember["role"]) => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="concern-hod">Concern HOD</SelectItem>
                  <SelectItem value="school-hod">School HOD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Data Structures" />
            </div>
            <div>
              <Label>Sections (comma-separated)</Label>
              <Input value={form.sections} onChange={e => setForm(p => ({ ...p, sections: e.target.value }))} placeholder="K24BX, G24BX" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingStaff ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaff;
