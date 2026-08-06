import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const configuration = new Configuration({ apiKey: Deno.env.get('OPENAI_API_KEY') })
    const openai = new OpenAIApi(configuration)

    // 1. Generate embedding for user query
    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: query,
    })
    const [{ embedding }] = embeddingResponse.data.data

    // 2. Query Supabase via pgvector (match_products RPC)
    const { data: matchedProducts, error: matchError } = await supabaseClient.rpc(
      'match_products',
      {
        query_embedding: embedding,
        match_threshold: 0.78,
        match_count: 5,
      }
    )

    if (matchError) throw matchError

    // 3. Construct context
    let context = matchedProducts.map((p: any) => 
      `Product: ${p.name}, SKU: ${p.sku}, Stock: ${p.current_stock}, Price: $${p.selling_price}`
    ).join('\n')

    // 4. Generate response with LLM
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an AI Inventory Assistant. You answer questions strictly based on the provided inventory data. Do not hallucinate data. If the answer is not in the context, say 'I cannot find that in the current inventory data.' Format output in Markdown." },
        { role: "user", content: `Inventory Data:\n${context}\n\nQuestion: ${query}` }
      ],
    })

    const reply = completion.data.choices[0].message?.content

    return new Response(JSON.stringify({ reply }), {
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
