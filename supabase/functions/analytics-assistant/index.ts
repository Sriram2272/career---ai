import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch real data summary for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const [profilesRes, companiesRes, jobsRes, appsRes] = await Promise.all([
      sb.from("profiles").select("name, department, branch, school, section, cgpa, placement_status, graduation_year, skills, aptitude_score, programming_score, programme"),
      sb.from("companies").select("name, industry, package_min, package_max, is_active"),
      sb.from("job_postings").select("title, status, skills_required, eligible_branches, package_lpa, company_id"),
      sb.from("applications").select("status, student_id, job_posting_id, applied_at"),
    ]);

    const profiles = profilesRes.data || [];
    const companies = companiesRes.data || [];
    const jobs = jobsRes.data || [];
    const apps = appsRes.data || [];

    // Build summary
    const total = profiles.length;
    const placed = profiles.filter((p: any) => p.placement_status === "placed").length;
    const depts = [...new Set(profiles.map((p: any) => p.department || p.branch).filter(Boolean))];
    const deptStats = depts.map(d => {
      const ds = profiles.filter((p: any) => (p.department === d || p.branch === d));
      const dp = ds.filter((p: any) => p.placement_status === "placed").length;
      const avgCgpa = ds.length > 0 ? (ds.reduce((s: number, p: any) => s + (p.cgpa || 0), 0) / ds.length).toFixed(2) : "N/A";
      return `${d}: ${ds.length} students, ${dp} placed (${ds.length > 0 ? Math.round(dp/ds.length*100) : 0}%), avg CGPA ${avgCgpa}`;
    }).join("\n");

    const unplacedHighCgpa = profiles.filter((p: any) => p.placement_status !== "placed" && (p.cgpa || 0) >= 8)
      .map((p: any) => `${p.name} (${p.department || p.branch}, CGPA: ${p.cgpa})`)
      .slice(0, 20).join(", ");

    const dataContext = `
PLACEMENT DATABASE SUMMARY (live data):
- Total Students: ${total}, Placed: ${placed}, Rate: ${total > 0 ? Math.round(placed/total*100) : 0}%
- Active Companies: ${companies.filter((c: any) => c.is_active).length}
- Open Jobs: ${jobs.filter((j: any) => j.status === "open").length}
- Total Applications: ${apps.length}

DEPARTMENT BREAKDOWN:
${deptStats}

UNPLACED STUDENTS WITH HIGH CGPA (≥8):
${unplacedHighCgpa || "None found"}

TOP COMPANIES BY PACKAGE:
${companies.sort((a: any, b: any) => (b.package_max || 0) - (a.package_max || 0)).slice(0, 10).map((c: any) => `${c.name}: ${c.package_min || 0}-${c.package_max || 0} LPA (${c.industry})`).join("\n")}
`;

    const systemPrompt = `You are PlaceAI Analytics Assistant — an expert placement analytics advisor for a university placement cell.
You have access to LIVE placement data below. Answer questions using this data. Be specific with numbers.

CRITICAL FORMATTING RULES:
- When showing rankings, comparisons, or lists with numbers, ALWAYS use a proper markdown table.
- Every table MUST have one header row, one separator row, and each data row on its OWN new line.
- Never merge multiple rows into one line.
- Leave one blank line after every table before writing insights.
- Use short headers like Rank, Dept, Students, Placed, Rate, Avg CGPA.
- Use **bold** for key metrics and important numbers.
- Use bullet points for insights and recommendations.
- Never output raw pipe-separated text, pseudo-tables, or compressed inline rows.
- Prefer this exact structure:
  | Rank | Dept | Students | Placed | Rate | Avg CGPA |
  |------|------|----------|--------|------|----------|
  | 1 | CSE | 120 | 84 | 70% | 8.12 |
  | 2 | ECE | 98 | 60 | 61% | 7.88 |

  **Key insights:**
  - Insight 1
  - Insight 2

If asked about specific students, use the data. If data is insufficient, say so.
Keep responses concise and actionable — the admin wants quick insights, not essays.

${dataContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analytics-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
