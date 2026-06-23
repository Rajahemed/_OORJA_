const request = require('supertest');
const app = require('./server'); // This exports the Express app

async function runTests() {
  console.log("Starting OTP Login Tests...");
  
  // A test phone number
  const testPhone = "9999999999";

  try {
    // 0. Get CSRF Token
    const csrfRes = await request(app).get('/api/csrf-token');
    const csrfToken = csrfRes.body.csrfToken;
    const cookies = csrfRes.headers['set-cookie'];
    console.log("CSRF Token obtained:", csrfToken);

    // 1. Send OTP
    console.log("1. Sending OTP...");
    const sendOtpRes = await request(app)
      .post('/auth/send-otp')
      .set('Cookie', cookies)
      .set('CSRF-Token', csrfToken)
      .send({ _csrf: csrfToken, phone: testPhone });
    
    console.log("Send OTP Response:", sendOtpRes.body);

    // 2. Try Login with OTP
    console.log("2. Attempting Login with OTP...");
    const loginRes = await request(app)
      .post('/auth/login')
      .set('Cookie', cookies)
      .set('CSRF-Token', csrfToken)
      .send({ 
        _csrf: csrfToken,
        phone: testPhone,
        loginMethod: 'otp',
        otp: '123456' // Using the mock OTP fallback
      });
    
    console.log("Login Response:", loginRes.body);

  } catch (error) {
    console.error("Test failed:", error);
  }
  
  process.exit(0);
}

runTests();
