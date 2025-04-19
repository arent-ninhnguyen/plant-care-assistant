// This special endpoint ensures cookies are fully cleared during sign out
export default function handler(req, res) {
  // Clear session cookie
  res.setHeader('Set-Cookie', [
    'next-auth.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
    'next-auth.csrf-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
    'next-auth.callback-url=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'
  ]);
  
  res.status(200).json({ success: true, message: 'Cookies cleared' });
} 