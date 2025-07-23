import { createClient } from 'npm:@supabase/supabase-js'
import { verifyWebhook } from 'npm:@clerk/backend/webhooks'

Deno.serve(async (req) => {
  const webhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET')
  if (!webhookSecret) {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  let event
  try {
    event = await verifyWebhook(req, { signingSecret: webhookSecret })
    console.log('event')
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  console.log('env SUPABASE_URL:', supabaseUrl)
  console.log('env SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'loaded' : 'missing')

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response('Supabase credentials not configured', { status: 500 })
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  switch (event.type) {
    case 'organization.created': {
      const orgPayload = {
        clerkOrganizationId: event.data.id,
        name: event.data.name,
        createdAt: new globalThis.Date(Number(event.data.created_at)).toISOString(),
        updatedAt: new globalThis.Date(Number(event.data.updated_at)).toISOString(),
      }

      const { data, error } = await supabase
        .from('Organization')
        .insert([orgPayload])
        .select()
        .single()

      if (error) {
        console.log('📦 organization.created payload:', JSON.stringify(event.data, null, 2));
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }

      return new Response(JSON.stringify({ organization: data }), { status: 200 })
    }

    case 'organization.updated': {
      const { data: org, error } = await supabase
        .from('Organization')
        .update({
          name: event.data.name,
          updatedAt: new Date(event.data.updated_at).toISOString(),
        })
        .eq('clerkOrganizationId', event.data.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Failed to update organization:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }

      return new Response(JSON.stringify({ organization: org }), { status: 200 })
    }

    case 'organizationMembership.created': {
      const clerkUserId = event.data.public_user_data?.user_id
      const clerkOrgId = event.data.organization?.id

      if (!clerkUserId || !clerkOrgId) {
        console.error('❌ Missing required Clerk data:', { clerkUserId, clerkOrgId })
        return new Response('Missing user or organization ID', { status: 400 })
      }

      const { data: org, error: orgError } = await supabase
        .from('Organization')
        .select('id')
        .eq('clerkOrganizationId', clerkOrgId)
        .single()

      if (orgError || !org) {
        console.error('❌ Organization not found:', orgError)
        return new Response('Organization not found', { status: 404 })
      }

      const organizationId = org.id

      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('clerkUserId', clerkUserId)
        .maybeSingle()

      if (existingUser) {
        console.log('✅ User already exists.')
        return new Response(JSON.stringify({ message: 'User already exists' }), { status: 200 })
      }

      const newUser = {
        username: `user_${clerkUserId.slice(-6)}`,
        clerkUserId,
        organizationId,
        createdAt: new Date(event.data.created_at).toISOString(),
        updatedAt: new Date(event.data.updated_at).toISOString(),
      }

      const { data: insertedUser, error: insertError } = await supabase
        .from('User')
        .insert([newUser])
        .select()
        .single()

      if (insertError) {
        console.error('❌ Failed to insert user:', insertError)
        return new Response(JSON.stringify({ error: insertError.message }), { status: 500 })
      }

      return new Response(JSON.stringify({ user: insertedUser }), { status: 200 })
    }

    default: {
      console.log('⚠️ Unhandled event type:', event.type)
      return new Response(JSON.stringify({ message: 'Unhandled event type' }), { status: 200 })
    }
  }
})
