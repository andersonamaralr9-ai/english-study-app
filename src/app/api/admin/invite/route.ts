import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const { email, name, role = 'user', adminUserId } = await req.json()

  if (!email?.trim()) {
    return Response.json({ error: 'Email é obrigatório' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verify the requester is an admin
  const { data: adminSettings } = await supabaseAdmin
    .from('user_settings')
    .select('role')
    .eq('user_id', adminUserId)
    .single()

  if (!adminSettings || adminSettings.role !== 'admin') {
    return Response.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Create user with a temporary password
  const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password: tempPassword,
    email_confirm: true,
  })

  if (createError) {
    if (createError.message?.includes('already been registered')) {
      return Response.json({ error: 'Este email já está cadastrado' }, { status: 400 })
    }
    return Response.json({ error: createError.message }, { status: 400 })
  }

  if (newUser?.user) {
    // Create settings for the new user
    await supabaseAdmin.from('user_settings').insert({
      user_id: newUser.user.id,
      name: name?.trim() || '',
      role,
      level: 'A1',
      active: true,
    })
  }

  return Response.json({
    success: true,
    email: email.trim(),
    tempPassword,
    message: `Usuário criado! Senha temporária: ${tempPassword}`,
  })
}
