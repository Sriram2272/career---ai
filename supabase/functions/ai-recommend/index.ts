import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Criteria sheets embedded as system knowledge
const CRITERIA_KNOWLEDGE = `
## ATTENDANCE BENEFIT CRITERIA
- Students participating in university-recognized events get attendance relaxation
- National/International level: Up to 15 days attendance benefit
- State/University level: Up to 10 days attendance benefit  
- Department level: Up to 5 days attendance benefit
- Must have supporting documents (certificates, invitation letters)
- Minimum 60% attendance required before applying
- Not applicable for lab/practical sessions unless HOD approves

## DUTY LEAVE CRITERIA
- Applicable for students representing university in official capacity
- Inter-university competitions: Duty leave for event duration + travel
- Conference presentations: Duty leave for conference days
- Hackathons: Duty leave if university-sponsored or national level
- Internship: Duty leave for mandatory internship periods
- Documentation required: Official invitation, travel proof, participation certificate

## GRADE UPGRADE CRITERIA  
- Research Paper (Scopus/SCI indexed): Up to 1 grade upgrade in related subject
- National level Hackathon Winner (Top 3): Up to 1 grade upgrade
- International certification (AWS/Google/Azure): Grade upgrade in relevant subject
- Patent filed/granted: 1 grade upgrade in project-related subject
- NPTEL Elite/Gold certificate: Grade upgrade in corresponding subject
- Minimum current grade must be C or above
- Only one grade upgrade per semester allowed

## INTERNSHIP BEYOND CURRICULUM CRITERIA
- Minimum 8 weeks internship at recognized organization
- Must be beyond curriculum requirements
- Stipend-based internship with ≥₹10,000/month: Extra academic credits
- Research internship at IIT/NIT/IISc: Academic credits + grade upgrade
- International internship: Academic credits + attendance benefit
- Startup internship: CCA credits if startup is DIPP registered
- Documentation: Offer letter, completion certificate, project report
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, achievement, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are the **EduRev AI Benefits Advisor** for Lovely Professional University (LPU).

## PERSONALITY & TONE
- You are warm, friendly, encouraging, and slightly playful — like a helpful senior who genuinely cares.
- Use casual language, emojis sparingly (1-2 per message max), and short sentences.
- NEVER write long paragraphs or walls of text. Keep every response **under 4-5 short lines** unless the user explicitly asks for detail.
- Use bullet points only when listing 3+ items. Prefer flowing conversation over structured reports.
- Celebrate achievements! Be genuinely excited about what students have accomplished.
- Ask follow-up questions to keep the conversation going naturally.

## KNOWLEDGE
${CRITERIA_KNOWLEDGE}

## AVAILABLE BENEFITS
CCA Credits, Extra Academic Credits, Project Recognition, Grade Upgradation, Merit Certificate, Scholarship Eligibility, CA Exam Exemption, Attendance Benefit, Duty Leave.

## RULES
- When recommending benefits, mention the benefit name in **bold** with a brief one-line reason.
- Add a confidence % only when analyzing a specific achievement.
- If you need more info, ask — don't assume.
- Keep it conversational. You're chatting, not writing a report.
- First message for analysis should be SHORT: state 2-3 top benefits with one-liner reasoning, then ask if they want details.`;

    const messages = [
      { role: "system", content: systemPrompt },
    ];

    if (achievement && category) {
      messages.push({
        role: "user",
        content: `Analyze this achievement and recommend benefits:\n\nAchievement: ${achievement}\nCategory: ${category}\n\nPlease provide:\n1. Eligible benefits with confidence scores\n2. Which criteria each benefit falls under\n3. Any additional recommendations`,
      });
    }

    if (message) {
      messages.push({ role: "user", content: message });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
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
