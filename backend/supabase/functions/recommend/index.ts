import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Example naive logic: Find products where current_stock <= min_stock
    const { data: lowStockProducts, error } = await supabaseClient
      .from('products')
      .select('id, name, current_stock, min_stock, sku')
      .lte('current_stock', 'min_stock')

    if (error) throw error

    // Generate recommendations
    const recommendations = lowStockProducts.map(p => ({
      title: `Restock needed for ${p.name}`,
      description: `Stock level (${p.current_stock}) has dropped below the minimum threshold (${p.min_stock}). Suggest ordering more to avoid stockouts.`,
      confidence_score: 0.95,
      supporting_data: p,
      status: 'Pending'
    }))

    // Save to ai_recommendations table
    if (recommendations.length > 0) {
      await supabaseClient.from('ai_recommendations').insert(recommendations)
    }

    return new Response(JSON.stringify({ message: `Generated ${recommendations.length} recommendations.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
