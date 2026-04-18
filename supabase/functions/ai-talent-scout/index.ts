import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, students } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const studentSummary = students.map((s: any, i: number) => 
      `${i+1}. ${s.name} | Branch: ${s.branch || 'N/A'} | CGPA: ${s.cgpa || 'N/A'} | Skills: ${(s.skills || []).join(', ') || 'N/A'} | Aptitude: ${s.aptitude_score || 'N/A'} | Programming: ${s.programming_score || 'N/A'} | Backlogs: ${s.backlogs || 0} | Status: ${s.placement_status || 'unplaced'} | ID: ${s.id}`
    ).join('\n');

    const systemPrompt = `You are an AI Talent Scout for a university placement platform. A recruiter is searching for candidates.

Given a list of student profiles and a recruiter's natural language query, return a JSON array of the top matching students ranked by relevance.

RULES:
- Analyze the query to understand what the recruiter wants (skills, CGPA threshold, branch, etc.)
- Rank students by how well they match the query
- Return at most 10 students
- For each student, provide a brief reason why they're a good match
- Return ONLY valid JSON, no markdown, no explanation outside JSON

Response format:
[
  {"id": "student-uuid", "rank": 1, "reason": "Strong React + Node.js skills, 9.2 CGPA, CSE branch"},
  ...
]`;

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
          { role: "user", content: `RECRUITER QUERY: "${query}"\n\nSTUDENT DATABASE:\n${studentSummary}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON from response
    let results;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      results = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      results = [];
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
