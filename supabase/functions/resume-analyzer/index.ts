import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, jobDescription, mode } = await req.json();
    // mode: "analyze" | "jd-match"

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "analyze") {
      systemPrompt = `You are **ResumeIQ**, a brutal-honest senior HR reviewer who has reviewed 10,000+ resumes for top tech companies (Microsoft, Amazon, Google, Meta, Goldman Sachs). You think like BOTH an HR screener AND a career advisor.

## YOUR TASK
Analyze the resume text and provide a comprehensive review. Be honest, specific, and actionable.

## RESPONSE FORMAT (use this exact JSON structure)
Return ONLY valid JSON, no markdown fences:
{
  "overall_score": 72,
  "summary": "2-3 sentence executive summary of the candidate",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "extracted_skills": {
    "technical": ["Python", "React", "AWS"],
    "soft": ["Leadership", "Communication"],
    "tools": ["Git", "Docker", "Figma"]
  },
  "role_fitness": [
    {"role": "SDE-1 (Backend)", "fit_pct": 85, "reason": "Strong DSA + backend stack"},
    {"role": "Full Stack Developer", "fit_pct": 70, "reason": "Frontend needs improvement"},
    {"role": "Data Analyst", "fit_pct": 40, "reason": "No SQL/analytics experience"}
  ],
  "hr_red_flags": ["No quantified achievements", "Generic objective statement", "Gaps in timeline"],
  "improvements": [
    {"section": "Projects", "issue": "No metrics or impact shown", "fix": "Add numbers: 'Reduced load time by 40%' instead of 'Improved performance'"},
    {"section": "Skills", "issue": "Too many buzzwords", "fix": "Remove skills you can't discuss in depth. Keep 8-10 core skills."},
    {"section": "Experience", "issue": "Duty-focused, not impact-focused", "fix": "Use STAR format: Situation → Task → Action → Result"}
  ],
  "ats_score": 65,
  "ats_issues": ["Missing keywords for target roles", "Uses tables/columns that ATS can't parse"],
  "target_companies": [
    {"company": "Microsoft", "readiness": "medium", "gaps": ["Need system design projects", "Add Azure/cloud skills"]},
    {"company": "Amazon", "readiness": "low", "gaps": ["No leadership principles alignment", "Need scalability examples"]}
  ]
}

## RULES
- Be brutally honest but constructive
- Score realistically (most fresh grads are 40-65, not 80+)
- Think about ATS scanners, not just human readers
- Consider both Indian and global job markets
- If resume is sparse, say so directly`;

      userPrompt = `Analyze this resume:\n\n${resumeText}`;
    } else if (mode === "jd-match") {
      systemPrompt = `You are **ResumeIQ JD Matcher**, an AI that precisely matches resumes against job descriptions like a senior recruiter at a FAANG company.

## RESPONSE FORMAT (use this exact JSON structure)
Return ONLY valid JSON, no markdown fences:
{
  "match_score": 72,
  "verdict": "PARTIAL MATCH",
  "summary": "2-3 sentence summary of how well the candidate fits",
  "matched_skills": ["Python", "React", "AWS"],
  "missing_skills": ["Kubernetes", "System Design", "GraphQL"],
  "partial_skills": [{"skill": "Cloud", "has": "AWS basics", "needs": "Production-level cloud architecture"}],
  "experience_gap": "JD asks for 2+ years, candidate has ~1 year including internships",
  "education_match": true,
  "culture_fit_signals": ["Open source contributor - shows collaboration", "Hackathon winner - shows drive"],
  "deal_breakers": ["No experience with microservices", "Missing required certification"],
  "recommendations": [
    "Take a system design course (Grokking System Design) before applying",
    "Add a microservices project to your portfolio",
    "Get AWS Solutions Architect Associate certification"
  ],
  "interview_prep": [
    "Expect questions on distributed systems",
    "Prepare STAR stories about team leadership",
    "Review LLD patterns - they'll likely ask"
  ],
  "apply_recommendation": "APPLY WITH PREP",
  "apply_reason": "You have 60% of required skills. With 2-3 weeks of focused prep on missing areas, you'd be a competitive candidate."
}

## RULES
- Be realistic about match scores
- Identify deal-breakers vs nice-to-haves
- Give actionable next steps
- Consider both explicit and implicit JD requirements`;

      userPrompt = `Match this resume against the job description.\n\n## RESUME:\n${resumeText}\n\n## JOB DESCRIPTION:\n${jobDescription}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          { role: "user", content: userPrompt },
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

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse the JSON from AI response
    let parsed;
    try {
      // Remove markdown fences if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI analysis", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
