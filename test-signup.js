async function test() {
  const email = `test_${Date.now()}@test.com`;
  
  // 1. Signup
  const res1 = await fetch('https://habit-tracker-pro-azure.vercel.app/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email, password: 'password' })
  });
  console.log('Signup Status:', res1.status);
  console.log('Signup Response:', await res1.text());

  // 2. Login
  const res2 = await fetch('https://habit-tracker-pro-azure.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password' })
  });
  console.log('Login Status:', res2.status);
  const data = await res2.json();
  console.log('Login Response keys:', Object.keys(data));
  console.log('Token exists?', !!data.token);
}

test();
