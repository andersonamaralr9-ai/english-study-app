import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function verifyAdmin(supabaseAdmin: any, adminUserId: string) {
  const { data } = await supabaseAdmin.from('user_settings').select('role').eq('user_id', adminUserId).single()
  return data?.role === 'admin'
}

export async function POST(req: Request) {
  const body = await req.json()
  const { action = 'create', adminUserId } = body
  const supabaseAdmin = getAdminClient()

  if (!await verifyAdmin(supabaseAdmin, adminUserId)) {
    return Response.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Single user creation
  if (action === 'create') {
    const { email, name, role = 'user', sendEmail = false } = body

    if (!email?.trim()) return Response.json({ error: 'Email é obrigatório' }, { status: 400 })

    if (sendEmail) {
      // Invite by email — Supabase sends the email automatically
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim())

      if (inviteError) {
        if (inviteError.message?.includes('already been registered')) {
          return Response.json({ error: 'Este email já está cadastrado' }, { status: 400 })
        }
        return Response.json({ error: inviteError.message }, { status: 400 })
      }

      if (inviteData?.user) {
        await supabaseAdmin.from('user_settings').upsert({
          user_id: inviteData.user.id, name: name?.trim() || '', role, level: 'A1', active: true,
        }, { onConflict: 'user_id' })
      }

      return Response.json({ success: true, email: email.trim(), method: 'email', message: `Convite enviado por email para ${email.trim()}` })
    } else {
      // Create with temp password
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.trim(), password: tempPassword, email_confirm: true,
      })

      if (createError) {
        if (createError.message?.includes('already been registered')) {
          return Response.json({ error: 'Este email já está cadastrado' }, { status: 400 })
        }
        return Response.json({ error: createError.message }, { status: 400 })
      }

      if (newUser?.user) {
        await supabaseAdmin.from('user_settings').upsert({
          user_id: newUser.user.id, name: name?.trim() || '', role, level: 'A1', active: true,
        }, { onConflict: 'user_id' })
      }

      return Response.json({ success: true, email: email.trim(), tempPassword, method: 'password' })
    }
  }

  // Bulk import
  if (action === 'bulk') {
    const { users, sendEmail = false } = body as { users: { email: string; name: string }[]; sendEmail: boolean; adminUserId: string }
    const results: { email: string; status: string; tempPassword?: string }[] = []

    for (const u of users) {
      if (!u.email?.trim()) continue
      try {
        if (sendEmail) {
          const { data: inviteData, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(u.email.trim())
          if (error) { results.push({ email: u.email, status: error.message }); continue }
          if (inviteData?.user) {
            await supabaseAdmin.from('user_settings').upsert({
              user_id: inviteData.user.id, name: u.name?.trim() || '', role: 'user', level: 'A1', active: true,
            }, { onConflict: 'user_id' })
          }
          results.push({ email: u.email, status: 'Convite enviado por email' })
        } else {
          const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
          const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
            email: u.email.trim(), password: tempPassword, email_confirm: true,
          })
          if (error) { results.push({ email: u.email, status: error.message }); continue }
          if (newUser?.user) {
            await supabaseAdmin.from('user_settings').upsert({
              user_id: newUser.user.id, name: u.name?.trim() || '', role: 'user', level: 'A1', active: true,
            }, { onConflict: 'user_id' })
          }
          results.push({ email: u.email, status: 'Criado', tempPassword })
        }
      } catch (e) {
        results.push({ email: u.email, status: 'Erro: ' + (e as Error).message })
      }
    }

    return Response.json({ success: true, results })
  }

  // Delete user
  if (action === 'delete') {
    const { userId } = body
    if (!userId) return Response.json({ error: 'userId é obrigatório' }, { status: 400 })

    await supabaseAdmin.from('user_settings').delete().eq('user_id', userId)
    await supabaseAdmin.from('vocab_words').delete().eq('user_id', userId)
    await supabaseAdmin.from('study_sessions').delete().eq('user_id', userId)
    await supabaseAdmin.from('test_results').delete().eq('user_id', userId)
    await supabaseAdmin.from('conversations').delete().eq('user_id', userId)
    await supabaseAdmin.from('writing_entries').delete().eq('user_id', userId)
    await supabaseAdmin.from('user_classes').delete().eq('user_id', userId)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ success: true })
  }

  // Toggle active
  if (action === 'toggle-active') {
    const { userId, active } = body
    await supabaseAdmin.from('user_settings').update({ active }).eq('user_id', userId)
    return Response.json({ success: true })
  }

  return Response.json({ error: 'Ação inválida' }, { status: 400 })
}
