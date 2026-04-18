import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, School, Users, BookOpen, Layers, Plus, Search, ArrowRight, Pencil, Trash2, IndianRupee, FileText, UserCheck } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/shared/DashboardSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import ThemeToggle from "@/components/dashboard/shared/ThemeToggle";

const programs = ["B.Tech CSE", "B.Tech AI", "B.Tech ECE", "B.Tech ME", "MCA", "M.Tech", "BCA", "MBA", "BBA", "B.Pharm", "LLB", "B.Arch", "B.Des", "B.Sc Agriculture", "B.Tech Aero"];

const schoolsData = [
  { id: "s1", name: "School of Computing & AI", short: "SCA", color: "from-blue-500 to-indigo-600", programs: ["B.Tech CSE", "B.Tech AI", "MCA", "M.Tech", "BCA"], sections: ["K24BX", "G24BX", "K23CS", "G23CS", "K24AI", "G24AI", "K22IT", "G22IT", "K24DS", "G24DS"], students: 320, hods: 4 },
  { id: "s2", name: "School of Computer Science & Engineering", short: "SCSE", color: "from-violet-500 to-purple-600", programs: ["B.Tech CSE", "MCA", "M.Tech"], sections: ["K24CE", "G24CE", "K23CE", "G23CE", "K22CE", "G22CE", "K24SE", "G24SE"], students: 280, hods: 3 },
  { id: "s3", name: "School of Agriculture", short: "SA", color: "from-green-500 to-emerald-600", programs: ["B.Sc Agriculture"], sections: ["K24AG", "G24AG", "K23AG", "G23AG", "K22AG", "G22AG"], students: 150, hods: 2 },
  { id: "s4", name: "School of Aeronautical Engineering", short: "SAE", color: "from-sky-500 to-cyan-600", programs: ["B.Tech Aero", "M.Tech"], sections: ["K24AE", "G24AE", "K23AE", "G23AE", "K22AE", "G22AE", "K24AP", "G24AP"], students: 190, hods: 2 },
  { id: "s5", name: "School of Business", short: "SB", color: "from-amber-500 to-orange-600", programs: ["MBA", "BBA"], sections: ["K24MB", "G24MB", "K23MB", "G23MB", "K24BB", "G24BB", "K23BB", "G23BB"], students: 240, hods: 3 },
  { id: "s6", name: "School of Law", short: "SL", color: "from-red-500 to-rose-600", programs: ["LLB"], sections: ["K24LW", "G24LW", "K23LW", "G23LW", "K22LW", "G22LW"], students: 130, hods: 2 },
  { id: "s7", name: "School of Pharmacy", short: "SP", color: "from-teal-500 to-green-600", programs: ["B.Pharm"], sections: ["K24PH", "G24PH", "K23PH", "G23PH", "K22PH", "G22PH", "K24PM", "G24PM"], students: 200, hods: 2 },
  { id: "s8", name: "School of Architecture", short: "SAR", color: "from-stone-500 to-zinc-600", programs: ["B.Arch"], sections: ["K24AR", "G24AR", "K23AR", "G23AR", "K22AR", "G22AR"], students: 110, hods: 1 },
  { id: "s9", name: "School of Hotel Management", short: "SHM", color: "from-pink-500 to-fuchsia-600", programs: ["BBA"], sections: ["K24HM", "G24HM", "K23HM", "G23HM", "K22HM", "G22HM"], students: 95, hods: 1 },
  { id: "s10", name: "School of Education", short: "SE", color: "from-yellow-500 to-amber-600", programs: ["B.Tech CSE"], sections: ["K24ED", "G24ED", "K23ED", "G23ED", "K22ED", "G22ED", "K24EP", "G24EP"], students: 175, hods: 2 },
  { id: "s11", name: "School of Design", short: "SD", color: "from-fuchsia-500 to-pink-600", programs: ["B.Des"], sections: ["K24DE", "G24DE", "K23DE", "G23DE", "K22DE", "G22DE"], students: 120, hods: 2 },
  { id: "s12", name: "School of Bioengineering", short: "SBE", color: "from-lime-500 to-green-600", programs: ["B.Tech CSE", "M.Tech"], sections: ["K24BE", "G24BE", "K23BE", "G23BE", "K22BE", "G22BE"], students: 140, hods: 2 },
  { id: "s13", name: "School of Chemical Engineering", short: "SCE", color: "from-orange-500 to-red-600", programs: ["B.Tech CSE", "M.Tech"], sections: ["K24CH", "G24CH", "K23CH", "G23CH", "K22CH", "G22CH", "K24CP", "G24CP"], students: 160, hods: 2 },
  { id: "s14", name: "School of Electronics & Communication", short: "SEC", color: "from-indigo-500 to-blue-600", programs: ["B.Tech ECE", "M.Tech"], sections: ["K24EC", "G24EC", "K23EC", "G23EC", "K22EC", "G22EC", "K24EL", "G24EL", "K24EM", "G24EM"], students: 230, hods: 3 },
  { id: "s15", name: "School of Mechanical Engineering", short: "SME", color: "from-slate-500 to-gray-600", programs: ["B.Tech ME", "M.Tech"], sections: ["K24MC", "G24MC", "K23MC", "G23MC", "K22MC", "G22MC", "K24MP", "G24MP"], students: 210, hods: 3 },
];

const generateStudents = (sectionCode: string, count: number) => {
  const firstNames = ["Aryan", "Priya", "Rahul", "Sneha", "Vikram", "Ananya", "Karan", "Ishita", "Rohan", "Meera", "Aditya", "Divya", "Harsh", "Pooja", "Nikhil", "Tanvi", "Siddharth", "Kavya", "Manish", "Riya", "Deepak", "Swati", "Ajay", "Neha", "Gaurav", "Shreya", "Amit", "Pallavi", "Varun", "Simran", "Rajat", "Ankita", "Kunal", "Jyoti", "Tarun", "Sonal", "Mohit", "Preeti", "Sumit", "Nisha", "Ashish", "Komal"];
  const lastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Verma", "Mehta", "Joshi", "Reddy", "Nair", "Das", "Mishra", "Rao", "Iyer", "Chauhan", "Malhotra", "Saxena", "Bhat", "Thakur", "Menon"];
  return Array.from({ length: count }, (_, i) => ({
    id: `${sectionCode}-${i + 1}`,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    regNo: `${sectionCode}${(1000 + i).toString()}`,
    email: `${firstNames[i % firstNames.length].toLowerCase()}${i}@lpu.in`,
    applications: Math.floor(Math.random() * 5),
    benefits: Math.floor(Math.random() * 15000),
  }));
};

type Level = "schools" | "school" | "section";

const AdminStudents = () => {
  const [level, setLevel] = useState<Level>("schools");
  const [selectedSchool, setSelectedSchool] = useState<typeof schoolsData[0] | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", regNo: "", email: "" });
  const [newSection, setNewSection] = useState("");
  const [customSections, setCustomSections] = useState<Record<string, string[]>>({});
  const [customStudents, setCustomStudents] = useState<Record<string, ReturnType<typeof generateStudents>>>({});

  const totalSchools = schoolsData.length;
  const totalSections = schoolsData.reduce((a, s) => a + s.sections.length, 0);
  const totalPrograms = programs.length;
  const totalStudents = schoolsData.reduce((a, s) => a + s.students, 0);

  const getAllSections = (school: typeof schoolsData[0]) => [
    ...school.sections,
    ...(customSections[school.id] || []),
  ];

  const getStudentsForSection = (section: string) => {
    const base = generateStudents(section, Math.floor(Math.random() * 20) + 25);
    return [...base, ...(customStudents[section] || [])];
  };

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.regNo || !selectedSection) return;
    const student = {
      id: `${selectedSection}-custom-${Date.now()}`,
      name: newStudent.name,
      regNo: newStudent.regNo,
      email: newStudent.email || `${newStudent.name.toLowerCase().replace(/\s/g, "")}@lpu.in`,
      applications: 0,
      benefits: 0,
    };
    setCustomStudents(prev => ({
      ...prev,
      [selectedSection]: [...(prev[selectedSection] || []), student],
    }));
    setNewStudent({ name: "", regNo: "", email: "" });
    setShowAddStudent(false);
  };

  const handleCreateSection = () => {
    if (!newSection || !selectedSchool) return;
    setCustomSections(prev => ({
      ...prev,
      [selectedSchool.id]: [...(prev[selectedSchool.id] || []), newSection.toUpperCase()],
    }));
    setNewSection("");
    setShowCreateSection(false);
  };

  const navigateToSchool = (school: typeof schoolsData[0]) => {
    setSelectedSchool(school);
    setLevel("school");
    setSelectedProgram("all");
  };

  const navigateToSection = (section: string) => {
    setSelectedSection(section);
    setLevel("section");
    setSearchQuery("");
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: "spring" as const, stiffness: 300, damping: 24 } }),
  };

  const renderBreadcrumb = () => (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink className="cursor-pointer" onClick={() => { setLevel("schools"); setSelectedSchool(null); setSelectedSection(null); }}>
            All Schools
          </BreadcrumbLink>
        </BreadcrumbItem>
        {(level === "school" || level === "section") && selectedSchool && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {level === "school" ? (
                <BreadcrumbPage>{selectedSchool.short}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink className="cursor-pointer" onClick={() => { setLevel("school"); setSelectedSection(null); }}>
                  {selectedSchool.short}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </>
        )}
        {level === "section" && selectedSection && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{selectedSection}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );

  const StatCard = ({ icon: Icon, label, value, color, index }: { icon: any; label: string; value: string | number; color: string; index: number }) => (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible">
      <Card className="relative overflow-hidden border-l-4" style={{ borderLeftColor: color }}>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderSchoolsLevel = () => {
    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={School} label="Total Schools" value={totalSchools} color="hsl(var(--primary))" index={0} />
          <StatCard icon={Layers} label="Total Sections" value={totalSections} color="#f59e0b" index={1} />
          <StatCard icon={BookOpen} label="Total Programs" value={totalPrograms} color="#10b981" index={2} />
          <StatCard icon={GraduationCap} label="Total Students" value={totalStudents} color="#8b5cf6" index={3} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schoolsData.map((school, i) => (
            <motion.div key={school.id} custom={i} variants={cardVariants} initial="hidden" animate="visible">
              <Card
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                onClick={() => navigateToSchool(school)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${school.color} text-white text-xs font-bold`}>
                        {school.short.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm leading-tight">{school.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{school.students} students · {school.sections.length} sections</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </>
    );
  };

  const renderSchoolLevel = () => {
    if (!selectedSchool) return null;
    const sections = getAllSections(selectedSchool);
    const filteredSections = selectedProgram === "all" ? sections : sections;

    return (
      <>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">{selectedSchool.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage sections, programs, and students</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={GraduationCap} label="Students" value={selectedSchool.students} color="hsl(var(--primary))" index={0} />
          <StatCard icon={UserCheck} label="HODs" value={selectedSchool.hods} color="#f59e0b" index={1} />
          <StatCard icon={Layers} label="Sections" value={sections.length} color="#10b981" index={2} />
          <StatCard icon={BookOpen} label="Programs" value={selectedSchool.programs.length} color="#8b5cf6" index={3} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {selectedSchool.programs.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreateSection(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Create Section
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {filteredSections.map((section, i) => (
              <motion.div
                key={section}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <Card
                  className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  onClick={() => navigateToSection(section)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-mono text-xs font-bold text-foreground">
                        {section}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{section}</p>
                        <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 20) + 25} students</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </>
    );
  };

  const renderSectionLevel = () => {
    if (!selectedSchool || !selectedSection) return null;
    const students = getStudentsForSection(selectedSection);
    const filtered = students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalApps = students.reduce((a, s) => a + s.applications, 0);
    const totalBenefits = students.reduce((a, s) => a + s.benefits, 0);

    return (
      <>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">Section {selectedSection}</h2>
          <p className="text-sm text-muted-foreground mt-1">{selectedSchool.name}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={GraduationCap} label="Students" value={students.length} color="hsl(var(--primary))" index={0} />
          <StatCard icon={FileText} label="Applications" value={totalApps} color="#f59e0b" index={1} />
          <StatCard icon={IndianRupee} label="Benefits Earned" value={`₹${totalBenefits.toLocaleString()}`} color="#10b981" index={2} />
          <StatCard icon={UserCheck} label="HODs Allocated" value={1} color="#8b5cf6" index={3} />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setShowAddStudent(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Student
          </Button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Reg No</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Applications</TableHead>
                  <TableHead className="text-right">Benefits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">{student.regNo}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{student.email}</TableCell>
                    <TableCell className="text-center">{student.applications}</TableCell>
                    <TableCell className="text-right">₹{student.benefits.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No students found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 ml-[70px] p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
            <p className="text-sm text-muted-foreground">Manage students across all schools and sections</p>
          </div>
          <ThemeToggle />
        </div>

        {renderBreadcrumb()}

        <AnimatePresence mode="wait">
          <motion.div key={level} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {level === "schools" && renderSchoolsLevel()}
            {level === "school" && renderSchoolLevel()}
            {level === "section" && renderSectionLevel()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student to {selectedSection}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Full Name</Label>
              <Input value={newStudent.name} onChange={e => setNewStudent(p => ({ ...p, name: e.target.value }))} placeholder="Enter student name" />
            </div>
            <div>
              <Label>Registration Number</Label>
              <Input value={newStudent.regNo} onChange={e => setNewStudent(p => ({ ...p, regNo: e.target.value }))} placeholder="e.g. K24BX1234" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={newStudent.email} onChange={e => setNewStudent(p => ({ ...p, email: e.target.value }))} placeholder="email@lpu.in" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStudent(false)}>Cancel</Button>
            <Button onClick={handleAddStudent}>Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Section Dialog */}
      <Dialog open={showCreateSection} onOpenChange={setShowCreateSection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Section in {selectedSchool?.short}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Section Code</Label>
              <Input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="e.g. K25BX" className="font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSection(false)}>Cancel</Button>
            <Button onClick={handleCreateSection}>Create Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudents;
