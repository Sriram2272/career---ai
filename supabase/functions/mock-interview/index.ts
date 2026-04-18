const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, config, phase } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";

    if (phase === "generate_questions") {
      systemPrompt = `You are an expert technical interviewer. Generate exactly ${config.questionCount || 5} interview questions for a ${config.difficulty || "medium"} difficulty ${config.domain || "general"} interview for a ${config.jobType || "Software Engineer"} role.

Include a mix of question types. For coding questions, include a clear problem statement with input/output examples and constraints.

Return ONLY a valid JSON array of objects, no markdown, no explanation. Each object must have:
- "question": the question text (for coding questions, include examples and constraints)
- "type": one of "technical", "behavioral", "situational", "coding"
- "expectedTopics": array of 3-5 key topics a good answer should cover
- "difficulty": "easy", "medium", or "hard"
- "timeLimit": time in seconds (coding: 300-600, others: 120-180 based on difficulty)

Example format:
[{"question":"...","type":"technical","expectedTopics":["topic1","topic2"],"difficulty":"medium","timeLimit":150}]`;
    } else if (phase === "evaluate_answer") {
      systemPrompt = `You are a senior interviewer evaluating a candidate's answer. Be fair but rigorous.

Return ONLY valid JSON with these fields:
- "score": number 1-10
- "strengths": array of 1-3 specific things done well
- "improvements": array of 1-3 specific things to improve
- "modelAnswer": a brief ideal answer (3-4 sentences)
- "verdict": one of "Excellent", "Good", "Average", "Needs Improvement", "Poor"`;
    } else if (phase === "evaluate_code") {
      systemPrompt = `You are a senior coding interviewer evaluating a candidate's code/pseudocode solution. Be fair and give partial credit.

IMPORTANT RULES FOR PARTIAL MARKING:
- If the approach/logic is correct but syntax is wrong → give 60-80% credit
- If pseudocode captures the right algorithm → give 50-70% credit  
- If only brute force but works → give 40-60% credit
- If partial solution with correct direction → give 30-50% credit
- If completely wrong or empty → give 0-20% credit
- If optimal solution with clean code → give 90-100% credit

Return ONLY valid JSON with these fields:
- "score": number 1-10
- "codeQuality": one of "Optimal", "Efficient", "Acceptable", "Brute Force", "Partial", "Incorrect"
- "timeComplexity": string like "O(n)", "O(n log n)", etc. or "N/A" if pseudocode
- "spaceComplexity": string like "O(1)", "O(n)", etc. or "N/A" if pseudocode
- "strengths": array of 1-3 specific things done well (logic, approach, edge cases, etc.)
- "improvements": array of 1-3 specific things to improve
- "modelAnswer": the optimal code solution (keep it concise, 10-20 lines max)
- "verdict": one of "Excellent", "Good", "Average", "Needs Improvement", "Poor"
- "partialCreditNotes": string explaining what partial credit was given and why
- "isPseudocode": boolean - true if the answer appears to be pseudocode rather than actual code
- "approachCorrect": boolean - true if the overall approach/algorithm is correct even if code has issues`;
    } else if (phase === "final_report") {
      systemPrompt = `You are generating a detailed final mock interview report card. Analyze all the Q&A pairs provided carefully.

Return ONLY valid JSON:
- "overallScore": number 1-100
- "grade": "A+", "A", "B+", "B", "C+", "C", "D", or "F"
- "summary": 3-4 sentence detailed overall assessment
- "strengths": array of top 3-5 strengths shown across all answers
- "weaknesses": array of top 3-5 areas to improve
- "hireRecommendation": "Strong Hire", "Hire", "Lean Hire", "Lean No Hire", "No Hire"
- "tips": array of 5 actionable tips for improvement
- "categoryScores": object with scores for different categories like {"technical": 75, "communication": 80, "problemSolving": 70, "coding": 65, "behavioral": 85}
- "detailedFeedback": array of objects, one per question, each having {"questionIndex": 0, "question": "...", "score": 8, "verdict": "Good", "keyTakeaway": "one line summary of performance on this question"}`;
    }

    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
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
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
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
    const content = data.choices?.[0]?.message?.content || "";
    
    let parsed;
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = content;
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
