import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const departments = ["CSE", "ECE", "ME", "CE", "IT"];
const schools: Record<string, string> = {
  CSE: "School of Computer Science", ECE: "School of Electronics",
  ME: "School of Mechanical Engineering", CE: "School of Civil Engineering",
  IT: "School of Computer Science",
};
const sections4th = ["K21EA", "K21EB", "K21EC", "K21ED", "K21FA", "K21FB"];
const skillSets: Record<string, string[][]> = {
  CSE: [
    ["React", "JavaScript", "Node.js", "SQL", "Git"],
    ["Python", "Django", "PostgreSQL", "Docker", "AWS"],
    ["Java", "Spring Boot", "Microservices", "Kafka", "Redis"],
    ["C++", "DSA", "System Design", "OOP", "Competitive Programming"],
    ["TypeScript", "React", "GraphQL", "MongoDB", "CI/CD"],
    ["Go", "Kubernetes", "Terraform", "Linux", "Prometheus"],
    ["Python", "Flask", "REST APIs", "MySQL", "Jenkins"],
    ["JavaScript", "Vue.js", "Firebase", "Tailwind CSS", "Figma"],
    ["Rust", "WebAssembly", "C", "Algorithms", "Embedded"],
    ["Swift", "iOS", "Xcode", "Core Data", "UIKit"],
  ],
  ECE: [
    ["MATLAB", "Signal Processing", "Verilog", "VLSI", "PCB Design"],
    ["Embedded C", "Arduino", "IoT", "Sensors", "RTOS"],
    ["Python", "Image Processing", "OpenCV", "NumPy", "Deep Learning"],
    ["FPGA", "SystemVerilog", "Cadence", "Xilinx", "ASIC"],
    ["LabVIEW", "Control Systems", "PLC", "SCADA", "Automation"],
    ["5G", "Wireless", "Antenna Design", "RF Engineering", "Spectrum Analysis"],
    ["Raspberry Pi", "Linux", "C++", "Robotics", "ROS"],
    ["VLSI", "Synopsys", "Physical Design", "STA", "DFT"],
    ["DSP", "Communication Systems", "Modulation", "OFDM", "LTE"],
    ["Power Electronics", "Simulink", "Motor Control", "Inverters", "EV"],
  ],
  ME: [
    ["AutoCAD", "SolidWorks", "CATIA", "GD&T", "3D Printing"],
    ["ANSYS", "FEA", "CFD", "Thermal Analysis", "Meshing"],
    ["Python", "MATLAB", "Numerical Methods", "Optimization", "Data Analysis"],
    ["CNC Programming", "G-Code", "Manufacturing", "Lean", "Six Sigma"],
    ["Creo", "NX", "Sheet Metal Design", "Tolerance Analysis", "BOM"],
    ["Thermodynamics", "Heat Transfer", "HVAC", "Fluid Mechanics", "Piping"],
    ["Robotics", "PLC", "Automation", "Hydraulics", "Pneumatics"],
    ["Material Science", "Metallurgy", "Composites", "Polymers", "Testing"],
    ["Project Management", "MS Project", "SAP", "ERP", "Supply Chain"],
    ["Additive Manufacturing", "3D Scanning", "Reverse Engineering", "Rapid Prototyping", "CAM"],
  ],
  CE: [
    ["AutoCAD", "STAAD Pro", "ETABS", "Revit", "BIM"],
    ["Surveying", "GPS", "GIS", "Remote Sensing", "Drone Mapping"],
    ["Concrete Design", "Steel Design", "Foundation", "Geotechnical", "Soil Mechanics"],
    ["PRIMAVERA", "MS Project", "Estimation", "Costing", "BOQ"],
    ["Water Resources", "Hydrology", "Irrigation", "Hydraulics", "WTP Design"],
    ["Transportation", "Highway Design", "Traffic", "Pavement", "IRC Codes"],
    ["Environmental Engineering", "STP", "EIA", "Waste Management", "Pollution"],
    ["Structural Analysis", "SAP2000", "SAFE", "Prestressed Concrete", "Seismic"],
    ["Construction Management", "Quality Control", "Safety", "LEAN Construction", "Contracts"],
    ["Smart Cities", "Urban Planning", "Sustainability", "Green Building", "LEED"],
  ],
  IT: [
    ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    ["Python", "Machine Learning", "TensorFlow", "Pandas", "Scikit-learn"],
    ["Java", "Spring Boot", "Hibernate", "JUnit", "Maven"],
    ["Node.js", "Express", "MongoDB", "Socket.io", "Redis"],
    ["AWS", "Lambda", "S3", "DynamoDB", "CloudFormation"],
    ["DevOps", "Docker", "Kubernetes", "GitHub Actions", "Ansible"],
    ["Cybersecurity", "Ethical Hacking", "Networking", "Wireshark", "Firewalls"],
    ["Flutter", "Dart", "Firebase", "REST APIs", "Mobile UI"],
    ["Blockchain", "Solidity", "Ethereum", "Web3.js", "Smart Contracts"],
    ["Data Engineering", "Spark", "Airflow", "Kafka", "Snowflake"],
  ],
};

const firstNames = ["Aarav", "Vivaan", "Aditya", "Ananya", "Ishaan", "Priya", "Rohan", "Sneha", "Arjun", "Kavya",
  "Rahul", "Meera", "Vikram", "Tanvi", "Siddharth", "Neha", "Karan", "Pooja", "Dev", "Riya",
  "Harsh", "Simran", "Mohit", "Shreya", "Nikhil", "Anjali", "Gaurav", "Divya", "Pavan", "Sonal",
  "Akash", "Trisha", "Manish", "Swati", "Rajat", "Nidhi", "Kunal", "Pallavi", "Sahil", "Tanya",
  "Varun", "Kriti", "Amit", "Bhavna", "Deepak", "Ritika", "Jay", "Maitri", "Tushar", "Lavanya"];
const lastNames = ["Sharma", "Patel", "Kumar", "Singh", "Reddy", "Gupta", "Verma", "Nair", "Joshi", "Malik",
  "Chauhan", "Mehta", "Rao", "Bhat", "Pillai", "Das", "Mishra", "Agarwal", "Saxena", "Tiwari"];

const preferredRolesByDept: Record<string, string[]> = {
  CSE: ["SDE", "Full Stack Developer", "Backend Developer", "Frontend Developer", "DevOps Engineer"],
  ECE: ["Embedded Engineer", "VLSI Designer", "IoT Engineer", "Hardware Engineer", "RF Engineer"],
  ME: ["Design Engineer", "CAE Analyst", "Manufacturing Engineer", "Project Engineer", "Quality Engineer"],
  CE: ["Structural Engineer", "Site Engineer", "Design Engineer", "Project Manager", "Estimator"],
  IT: ["SDE", "Data Engineer", "Cloud Engineer", "Cybersecurity Analyst", "Mobile Developer"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const phase = body.phase || "staff";
    const start = body.start || 1;
    const count = body.count || 20;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: string[] = [];

    const ensureProfileAndRole = async (userId: string, name: string, role: string, extra: Record<string, any> = {}) => {
      await adminClient.from("profiles").upsert({
        id: userId, name,
        department: extra.department || null, school: extra.school || null,
        registration_number: extra.regNo || null, section: extra.section || null,
        branch: extra.branch || null, stream: extra.stream || null, programme: extra.programme || "B.Tech",
        cgpa: extra.cgpa || null, skills: extra.skills || null,
        tenth_percent: extra.tenth_percent || null, twelfth_percent: extra.twelfth_percent || null,
        graduation_year: extra.graduation_year || null, backlogs: extra.backlogs ?? 0,
        placement_status: extra.placement_status || "unplaced",
        preferred_roles: extra.preferred_roles || null,
        aptitude_score: extra.aptitude_score ?? 50,
        programming_score: extra.programming_score ?? 50,
      }, { onConflict: "id" });

      if (role !== "student") {
        await adminClient.from("user_roles").delete().eq("user_id", userId);
        await adminClient.from("user_roles").insert({ user_id: userId, role });
      }
    };

    const createUser = async (email: string, password: string, name: string, role: string, extra: Record<string, any> = {}) => {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { name },
      });
      if (authError) {
        if (authError.message?.includes("already been registered")) {
          const { data: users } = await adminClient.auth.admin.listUsers();
          const existing = users?.users?.find(u => u.email === email);
          if (existing) {
            await ensureProfileAndRole(existing.id, name, role, extra);
            results.push(`FIXED ${email}`);
            return existing.id;
          }
          results.push(`EXISTS-NOID ${email}`);
          return null;
        }
        results.push(`FAIL ${email}: ${authError.message}`);
        return null;
      }
      const userId = authData.user.id;
      await ensureProfileAndRole(userId, name, role, extra);
      results.push(`OK ${email}`);
      return userId;
    };

    if (phase === "staff") {
      const staff = [
        { email: "hod.cse@lpu.in", name: "Dr. Rajesh Kumar", role: "concern-hod", department: "CSE", school: "School of Computer Science" },
        { email: "hod.ece@lpu.in", name: "Dr. Anita Verma", role: "concern-hod", department: "ECE", school: "School of Electronics" },
        { email: "hod.me@lpu.in", name: "Dr. Suresh Patel", role: "concern-hod", department: "ME", school: "School of Mechanical Engineering" },
        { email: "hod.ce@lpu.in", name: "Dr. Kavita Singh", role: "concern-hod", department: "CE", school: "School of Civil Engineering" },
        { email: "hod.it@lpu.in", name: "Dr. Vikram Reddy", role: "concern-hod", department: "IT", school: "School of Computer Science" },
        { email: "schoolhod@lpu.in", name: "Dr. Meena Sharma", role: "school-hod", department: "CSE", school: "School of Computer Science" },
        { email: "daa@lpu.in", name: "Prof. Ashok Mittal", role: "daa", department: "CSE", school: "School of Computer Science" },
        { email: "admin@lpu.in", name: "Admin User", role: "admin", department: "CSE", school: "School of Computer Science" },
      ];
      for (const s of staff) {
        await createUser(s.email, "Demo@123", s.name, s.role, { department: s.department, school: s.school });
      }
    }

    if (phase === "students") {
      for (let i = start; i < start + count && i <= 50; i++) {
        const deptIndex = Math.floor((i - 1) / 10);
        const dept = departments[deptIndex] || departments[0];
        const inDeptIndex = (i - 1) % 10;
        const section = sections4th[(i - 1) % sections4th.length];
        const regNo = `1240${(7000 + i).toString()}`;

        // Varied CGPA: some high, some mid, some low
        const cgpaDistribution = [9.4, 8.8, 8.2, 7.6, 7.1, 6.5, 9.1, 8.5, 7.8, 6.9];
        const cgpa = cgpaDistribution[inDeptIndex] + (Math.random() * 0.4 - 0.2);

        const skills = (skillSets[dept] || skillSets["CSE"])[inDeptIndex];
        const roles = preferredRolesByDept[dept] || preferredRolesByDept["CSE"];

        const fName = firstNames[(i - 1) % firstNames.length];
        const lName = lastNames[(i - 1) % lastNames.length];
        const name = `${fName} ${lName}`;

        // Varied scores
        const aptScores = [92, 78, 85, 65, 71, 55, 88, 73, 60, 45];
        const progScores = [95, 82, 70, 88, 60, 75, 90, 55, 80, 68];
        const backlogDist = [0, 0, 0, 0, 1, 0, 0, 2, 0, 0];

        const placed = inDeptIndex < 2; // top 2 per branch placed

        await createUser(`student${i}@lpu.in`, "Demo@123", name, "student", {
          department: dept, school: schools[dept], regNo, section, branch: dept,
          stream: "Engineering", programme: "B.Tech",
          cgpa: Math.round(cgpa * 10) / 10,
          skills,
          preferred_roles: [roles[inDeptIndex % roles.length]],
          tenth_percent: Math.round(70 + Math.random() * 25),
          twelfth_percent: Math.round(65 + Math.random() * 30),
          graduation_year: 2025,
          backlogs: backlogDist[inDeptIndex],
          placement_status: placed ? "placed" : "unplaced",
          aptitude_score: aptScores[inDeptIndex] + Math.round(Math.random() * 5 - 2),
          programming_score: progScores[inDeptIndex] + Math.round(Math.random() * 5 - 2),
        });
      }
    }

    if (phase === "recruiter-data") {
      // Create companies
      const companyData = [
        { name: "Google India", industry: "Technology", package_min: 25, package_max: 45, locations: ["Bangalore", "Hyderabad"], website: "https://google.com" },
        { name: "Microsoft", industry: "Technology", package_min: 20, package_max: 40, locations: ["Noida", "Hyderabad"], website: "https://microsoft.com" },
        { name: "Amazon", industry: "E-Commerce", package_min: 18, package_max: 35, locations: ["Bangalore", "Chennai"], website: "https://amazon.in" },
        { name: "Infosys", industry: "IT Services", package_min: 4, package_max: 8, locations: ["Mysore", "Pune", "Bangalore"], website: "https://infosys.com" },
        { name: "TCS", industry: "IT Services", package_min: 3.5, package_max: 7, locations: ["Mumbai", "Chennai", "Kolkata"], website: "https://tcs.com" },
        { name: "Flipkart", industry: "E-Commerce", package_min: 16, package_max: 30, locations: ["Bangalore"], website: "https://flipkart.com" },
        { name: "Tata Motors", industry: "Automotive", package_min: 6, package_max: 14, locations: ["Pune", "Jamshedpur"], website: "https://tatamotors.com" },
        { name: "L&T Construction", industry: "Construction", package_min: 5, package_max: 12, locations: ["Mumbai", "Chennai"], website: "https://lntecc.com" },
      ];

      const companyIds: string[] = [];
      for (const c of companyData) {
        // Check if exists
        const { data: existing } = await adminClient.from("companies").select("id").eq("name", c.name).maybeSingle();
        if (existing) {
          companyIds.push(existing.id);
          results.push(`COMPANY EXISTS ${c.name}`);
        } else {
          const { data: inserted, error } = await adminClient.from("companies").insert({
            name: c.name, industry: c.industry, package_min: c.package_min, package_max: c.package_max,
            locations: c.locations, website: c.website, is_active: true,
          }).select("id").single();
          if (inserted) {
            companyIds.push(inserted.id);
            results.push(`COMPANY OK ${c.name}`);
          } else {
            results.push(`COMPANY FAIL ${c.name}: ${error?.message}`);
          }
        }
      }

      // Create job postings
      const jobData = [
        { title: "Software Development Engineer", company: 0, package_lpa: 35, branches: ["CSE", "IT"], skills: ["React", "Node.js", "JavaScript", "SQL"], min_cgpa: 7.5, type: "full-time", days: 14 },
        { title: "SDE Intern", company: 1, package_lpa: 20, branches: ["CSE", "IT", "ECE"], skills: ["Java", "Spring Boot", "DSA"], min_cgpa: 7, type: "internship", days: 10 },
        { title: "Data Analyst", company: 2, package_lpa: 22, branches: ["CSE", "IT", "ECE"], skills: ["Python", "SQL", "Data Analysis", "Pandas"], min_cgpa: 7, type: "full-time", days: 21 },
        { title: "Graduate Engineer Trainee", company: 3, package_lpa: 4.5, branches: ["CSE", "ECE", "ME", "CE", "IT"], skills: ["Communication", "Problem Solving"], min_cgpa: 6, type: "full-time", days: 7 },
        { title: "Systems Engineer", company: 4, package_lpa: 3.6, branches: ["CSE", "ECE", "ME", "CE", "IT"], skills: ["Programming", "Aptitude"], min_cgpa: 6, type: "full-time", days: 5 },
        { title: "Frontend Developer", company: 5, package_lpa: 18, branches: ["CSE", "IT"], skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"], min_cgpa: 7.5, type: "full-time", days: 18 },
        { title: "Mechanical Design Engineer", company: 6, package_lpa: 8, branches: ["ME"], skills: ["AutoCAD", "SolidWorks", "CATIA", "GD&T"], min_cgpa: 6.5, type: "full-time", days: 12 },
        { title: "Site Engineer", company: 7, package_lpa: 6, branches: ["CE"], skills: ["AutoCAD", "STAAD Pro", "Surveying"], min_cgpa: 6, type: "full-time", days: 15 },
        { title: "ML Engineer", company: 0, package_lpa: 40, branches: ["CSE", "IT", "ECE"], skills: ["Python", "TensorFlow", "Machine Learning", "Deep Learning"], min_cgpa: 8, type: "full-time", days: 20 },
        { title: "Embedded Systems Engineer", company: 1, package_lpa: 15, branches: ["ECE"], skills: ["Embedded C", "RTOS", "Arduino", "IoT"], min_cgpa: 7, type: "full-time", days: 16 },
      ];

      const jobIds: string[] = [];
      for (const j of jobData) {
        if (!companyIds[j.company]) continue;
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + j.days);

        const { data: existingJob } = await adminClient.from("job_postings").select("id").eq("title", j.title).eq("company_id", companyIds[j.company]).maybeSingle();
        if (existingJob) {
          jobIds.push(existingJob.id);
          results.push(`JOB EXISTS ${j.title}`);
        } else {
          const { data: inserted, error } = await adminClient.from("job_postings").insert({
            title: j.title, company_id: companyIds[j.company], package_lpa: j.package_lpa,
            eligible_branches: j.branches, skills_required: j.skills, min_cgpa: j.min_cgpa,
            job_type: j.type, status: "open", deadline: deadline.toISOString(),
            max_applications: 100,
            interview_process: [
              { step: 1, name: "Online Assessment" },
              { step: 2, name: "Technical Interview" },
              { step: 3, name: "HR Interview" },
            ],
          }).select("id").single();
          if (inserted) {
            jobIds.push(inserted.id);
            results.push(`JOB OK ${j.title}`);
          } else {
            results.push(`JOB FAIL ${j.title}: ${error?.message}`);
          }
        }
      }

      // Create applications — fetch all student profiles
      const { data: allStudents } = await adminClient.from("profiles").select("id, branch, cgpa, skills").limit(50);
      if (allStudents && jobIds.length > 0) {
        const statuses = ["applied", "applied", "applied", "shortlisted", "shortlisted", "interviewing", "hired", "rejected"];
        let appCount = 0;

        for (const job of jobData) {
          const jobId = jobIds[jobData.indexOf(job)];
          if (!jobId) continue;

          // Find eligible students
          const eligible = allStudents.filter(s =>
            job.branches.includes(s.branch || "") && (s.cgpa || 0) >= job.min_cgpa
          );

          // Each job gets 5-8 random applications
          const numApps = Math.min(eligible.length, 5 + Math.floor(Math.random() * 4));
          const shuffled = eligible.sort(() => Math.random() - 0.5).slice(0, numApps);

          for (const student of shuffled) {
            // Check if application exists
            const { data: existingApp } = await adminClient.from("applications")
              .select("id").eq("student_id", student.id).eq("job_posting_id", jobId).maybeSingle();
            if (existingApp) continue;

            const matchScore = Math.round(40 + Math.random() * 55);
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const appliedDaysAgo = Math.floor(Math.random() * 20);
            const appliedAt = new Date();
            appliedAt.setDate(appliedAt.getDate() - appliedDaysAgo);

            await adminClient.from("applications").insert({
              student_id: student.id, job_posting_id: jobId,
              status, ai_match_score: matchScore,
              applied_at: appliedAt.toISOString(),
            });
            appCount++;
          }
        }
        results.push(`APPLICATIONS: ${appCount} created`);
      }
    }

    return new Response(JSON.stringify({ success: true, phase, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
