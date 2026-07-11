async function test() {
  const res = await fetch('https://habit-tracker-pro-azure.vercel.app//api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'password' })
  });
  console.log('Status:', res.status);
  console.log('OK:', res.ok);
  const text = await res.text();
  console.log('Body:', text);
}

test();
