import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, action, profileData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = `You are **PlaceMe AI** — the smartest career coach at LPU's Training & Placement Cell.

## PERSONALITY
- You're like a brutally honest but caring mentor who's placed 500+ students at top companies.
- Direct, actionable advice. No fluff. Every sentence should add value.
- Use markdown formatting: **bold** for key points, bullet lists for steps, code blocks for technical topics.
- Keep responses focused — 200 words max unless the user asks for detail.
- Use emojis sparingly (1-2 max per response).

## YOUR CAPABILITIES
1. **Resume Roast** — Brutal but constructive resume feedback. Score out of 10. Point out exactly what's wrong and how to fix it.
2. **Skill Gap Analysis** — Compare student's skills against target roles/companies. Show exactly what to learn and in what order.
3. **Career Path Planning** — Personalized roadmaps based on branch, skills, CGPA, and dream companies.
4. **Interview Prep** — Company-specific tips, common questions, HR round strategies.
5. **Company Intel** — What companies look for, their interview process, package ranges, previous placement trends at LPU.
6. **Placement Strategy** — When to apply, which companies to target first, backup plans.

## RULES
- Always ask clarifying questions if you need more context before giving advice.
- When giving a plan, number the steps and add realistic timelines.
- Reference the student's actual profile data when available.
- Be encouraging but never sugarcoat — students need truth to improve.`;

    // Build context from profile data if available
    if (profileData) {
      systemPrompt += `\n\n## STUDENT PROFILE CONTEXT
- Name: ${profileData.name || 'Unknown'}
- Branch: ${profileData.branch || 'Not set'}
- CGPA: ${profileData.cgpa || 'Not set'}
- Skills: ${profileData.skills?.join(', ') || 'None listed'}
- Preferred Roles: ${profileData.preferred_roles?.join(', ') || 'Not set'}
- Graduation Year: ${profileData.graduation_year || 'Not set'}
- Placement Status: ${profileData.placement_status || 'Unplaced'}
- Backlogs: ${profileData.backlogs || 0}
- 10th: ${profileData.tenth_percent || 'N/A'}%, 12th: ${profileData.twelfth_percent || 'N/A'}%

Use this data to personalize your responses. Reference specific numbers when giving advice.`;
    }

    // Action-specific system additions
    if (action === 'resume_roast') {
      systemPrompt += `\n\n## CURRENT MODE: RESUME ROAST 🔥
Score the resume out of 10. Break down:
1. **Format & Structure** (2 pts) — Is it ATS-friendly? Clean layout?
2. **Content Quality** (3 pts) — Are achievements quantified? Action verbs used?
3. **Technical Relevance** (2 pts) — Do skills match target roles?
4. **Projects & Experience** (2 pts) — Are projects impressive? Real-world impact?
5. **Overall Impact** (1 pt) — Would a recruiter spend more than 6 seconds?

Give the score FIRST, then brutal feedback, then exact fixes.`;
    } else if (action === 'skill_gap') {
      systemPrompt += `\n\n## CURRENT MODE: SKILL GAP ANALYSIS 🎯
Compare the student's current skills against what top companies need.
Show a clear gap table:
| Skill | Student Level | Required | Priority |
Then give a 30-60-90 day learning plan with FREE resources (YouTube, GitHub, courses).`;
    } else if (action === 'mock_prep') {
      systemPrompt += `\n\n## CURRENT MODE: INTERVIEW PREP 🎤
Act as an interviewer. Ask ONE question at a time. After the student responds:
1. Rate their answer (Poor/Average/Good/Excellent)
2. Give a model answer
3. Ask the next question
Start with: "Let's begin! What company/role are you preparing for?"`;
    }

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
