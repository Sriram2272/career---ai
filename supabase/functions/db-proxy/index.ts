import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, query } = await req.json();

    if (action === "test") {
      // Test connection only
      const { data: setting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "external_db_connection_string")
        .single();

      if (!setting?.value) {
        return new Response(JSON.stringify({ error: "No connection string configured" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use the Deno postgres driver
      const { Client } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
      const client = new Client(setting.value);
      await client.connect();
      const result = await client.queryObject("SELECT 1 as connected");
      await client.end();

      return new Response(JSON.stringify({ success: true, message: "Connection successful!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "query") {
      if (!query || typeof query !== "string") {
        return new Response(JSON.stringify({ error: "Query is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Only allow SELECT queries for safety
      const trimmed = query.trim().toUpperCase();
      if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("SHOW") && !trimmed.startsWith("\\D")) {
        return new Response(JSON.stringify({ error: "Only SELECT/SHOW queries are allowed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: setting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "external_db_connection_string")
        .single();

      if (!setting?.value) {
        return new Response(JSON.stringify({ error: "No connection string configured" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { Client } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
      const client = new Client(setting.value);
      await client.connect();
      const result = await client.queryObject(query);
      await client.end();

      return new Response(JSON.stringify({
        success: true,
        rows: result.rows,
        columns: result.columns?.map((c: any) => c.name) || [],
        rowCount: result.rows.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'test' or 'query'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DB Proxy error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
