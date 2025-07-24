/* ------------------------------------------------------------------
   app/api/webhooks/clerk/route.ts
   Clerk Webhook  →  Supabase 保存処理（Next.js / Node.js 用）
   - Svix で署名検証（svix-id / svix-timestamp / svix-signature）
------------------------------------------------------------------- */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

/* ---------- 1. 環境変数 ------------------------------------------------ */
const {
  CLERK_WEBHOOK_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!CLERK_WEBHOOK_SECRET) {
  throw new Error('❌ CLERK_WEBHOOK_SECRET が .env にありません');
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('❌ Supabase の URL / SERVICE_ROLE_KEY が .env にありません');
}

/* ---------- 2. Supabase クライアント ----------------------------------- */
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

/* ---------- 3. Svix Webhook 検証インスタンス --------------------------- */
const svix = new Webhook(CLERK_WEBHOOK_SECRET);

/* ---------- 4. API Route ---------------------------------------------- */
export async function POST(req: NextRequest) {
  /* 4‑1. 署名ヘッダーを取得 */
  const headers = {
    'svix-id':        req.headers.get('svix-id')        ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  };

  /* 4‑2. 生ボディ文字列を取得（verify に必須） */
  const rawBody = await req.text();

  /* 4‑3. 検証 */
  let event: any;
  try {
    event = svix.verify(rawBody, headers);   // 失敗すれば throw
  } catch (err) {
    console.error('❌ Webhook verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('📦 Webhook event type:', event.type);

  /* 4‑4. イベントタイプごとの処理 */
  switch (event.type) {
    
    /* ========== organization.created ================================= */

    case 'organization.created': {
      const clerkOrgId = event.data.id;
      const orgName = event.data.name;
      const createdAt = new Date(Number(event.data.created_at)).toISOString();
      const updatedAt = new Date(Number(event.data.updated_at)).toISOString();
    
      console.log('🏢 Creating organization:', orgName);
    
      // 1) 組織作成
      const { error: orgError } = await supabase.from('Organization').insert([
        {
          name: orgName,
          clerkOrganizationId: clerkOrgId,
          createdAt,
          updatedAt,
        },
      ]);
    
      if (orgError) {
        console.error('❌ Failed to insert Organization:', orgError);
        return NextResponse.json({ error: orgError.message }, { status: 500 });
      }
    
      // 2) Adminユーザー登録（ここを追加！）
      const adminUserId = event.data.created_by; // AdminユーザーのClerk ID
      const username = `user_${adminUserId.slice(-6)}`;
    
      // 再取得（organizationId）
      const { data: org } = await supabase
        .from('Organization')
        .select('id')
        .eq('clerkOrganizationId', clerkOrgId)
        .single();
    
      if (!org) {
        return NextResponse.json({ error: 'Organization not found after creation' }, { status: 500 });
      }
    
      // 重複チェック
      const { data: exists } = await supabase
        .from('User')
        .select('id')
        .eq('clerkUserId', adminUserId)
        .maybeSingle();
    
      if (!exists) {
        const { error: userError } = await supabase.from('User').insert([
          {
            username,
            clerkUserId: adminUserId,
            organizationId: org.id,
            createdAt,
            updatedAt,
          },
        ]);
        if (userError) {
          console.error('❌ Failed to insert Admin User:', userError);
          return NextResponse.json({ error: userError.message }, { status: 500 });
        }
      }
    
      return NextResponse.json({ message: 'Organization & Admin user created' });
    }
    
    // case 'organization.created': {
    //   const org = {
    //     clerkOrganizationId: event.data.id,
    //     name: event.data.name,
    //     createdAt: new Date(Number(event.data.created_at)).toISOString(),
    //     updatedAt: new Date(Number(event.data.updated_at)).toISOString(),
    //   };

    //   const { error } = await supabase.from('Organization').insert([org]);
    //   if (error) {
    //     console.error('❌ Supabase insert error:', error);
    //     return NextResponse.json({ error: error.message }, { status: 500 });
    //   }
    //   return NextResponse.json({ organization: org });
    // }

    /* ========== organization.updated ================================= */
    case 'organization.updated': {
      const { error } = await supabase
        .from('Organization')
        .update({
          name: event.data.name,
          updatedAt: new Date(Number(event.data.updated_at)).toISOString(),
        })
        .eq('clerkOrganizationId', event.data.id);

      if (error) {
        console.error('❌ Supabase update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: 'Organization updated' });
    }

    /* ========== organizationMembership.created ======================= */
    case 'organizationMembership.created': {
      console.log("🟢 organizationMembership.created が発火");
      const clerkUserId = event.data.public_user_data?.user_id;
      const clerkOrgId = event.data.organization?.id;

      console.log('🟡 STEP 0: event received - userId:', clerkUserId, 'orgId:', clerkOrgId);

      if (!clerkUserId || !clerkOrgId) {
        console.error('🔴 Missing user or org ID');
        return NextResponse.json({ error: 'Missing user or org ID' }, { status: 400 });
      }

      /* 1) Organization を取得 */
      const { data: org, error: orgError } = await supabase
        .from('"Organization"')
        .select('id')
        .eq('clerkOrganizationId', clerkOrgId)
        .single();

      if (orgError) {
        console.error('🔴 Failed to fetch organization:', orgError.message);
      } else {
        console.log('🟢 STEP 1: Organization found:', org);
      }

      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      /* 2) 既存ユーザー確認 */
      const { data: exists, error: existsError } = await supabase
        .from('"User"')
        .select('id')
        .eq('clerkUserId', clerkUserId)
        .maybeSingle();

      if (existsError) {
        console.error('🔴 Failed to check existing user:', existsError.message);
      } else if (exists) {
        console.log('🟡 STEP 2: User already exists:', exists.id);
        return NextResponse.json({ message: 'User already exists' });
      }

      /* 3) ユーザー挿入 */
      const newUser = {
        username: `user_${clerkUserId.slice(-6)}`,
        clerkUserId,
        organizationId: org.id,
        createdAt: new Date(Number(event.data.created_at)).toISOString(),
        updatedAt: new Date(Number(event.data.updated_at)).toISOString(),
      };

      console.log('🟢 STEP 3: Inserting user:', newUser);

      const { error: insertError } = await supabase
        .from('"User"')
        .insert([newUser]);

      if (insertError) {
        console.error('🔴 Supabase insert user error:', insertError.message, insertError.details);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      console.log('✅ STEP 4: User successfully inserted!');
      return NextResponse.json({ user: newUser });
    }


    /* ========== 未対応イベント ======================================= */
    default:
      console.log('⚠️ Unhandled event type:', event.type);
      return NextResponse.json({ message: 'Unhandled event type' });
  }
}
