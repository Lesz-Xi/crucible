import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SCMRetriever } from "@/lib/services/scm-retrieval";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 1. Check DB Access
    const { count, error } = await supabase
      .from("causal_models")
      .select("*", { count: "exact", head: true });

    // Debug: Fetch ALL domains
    const { data: rowDebug } = await supabase
        .from("causal_models")
        .select("domain");


    if (error) {
      return NextResponse.json({ 
        status: "error", 
        step: "db_access", 
        message: error.message 
      }, { status: 500 });
    }

    // 2. Check SCM Retrieval & Hydration
    const retriever = new SCMRetriever();
    // Use 'forest_ecology' as it's the primary seed domain
    const context = await retriever.retrieve("forest_ecology", supabase);

    if (!context.tier2) {
      return NextResponse.json({
        status: "error",
        step: "template_instantiation",
        message: "Could not create Tier 2 template"
      }, { status: 500 });
    }

    const structure = context.tier2.getFullStructure();
    
    return NextResponse.json({
      status: "success",
      db_count: count,
      hydration: {
        total_nodes: structure.nodes.length,
        total_edges: structure.edges.length,
        innate_nodes: context.tier2.getInnateStructure().nodes.length, // Checking old method too if it exists, or just logic
        is_hydrated: structure.nodes.length > 4 // Assuming innate has 4
      },
      sample_node: structure.nodes.length > 4 ? structure.nodes[structure.nodes.length - 1] : "Only Innate",
      raw_debug: rowDebug
    });

  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: err.message,
      stack: err.stack
    }, { status: 500 });
  }
}
