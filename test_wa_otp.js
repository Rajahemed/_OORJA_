const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');

const app = express();
app.use(bodyParser.json());
app.use('/auth', authRoutes);

async function runTests() {
  console.log('Testing Send WhatsApp OTP...');
  const sendRes = await request(app)
    .post('/auth/send-otp')
    .send({ phone: '9999999999', channel: 'whatsapp' });
  
  console.log('Send OTP Response:', sendRes.body);

  if (sendRes.body.success) {
    console.log('Testing Verify OTP...');
    // In mock mode, the OTP is 123456
    const verifyRes = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: '9999999999', otp: '123456' });
    
    console.log('Verify OTP Response:', verifyRes.body);

    console.log('Testing Verify Invalid OTP...');
    const invalidVerifyRes = await request(app)
      .post('/auth/verify-otp')
      .send({ phone: '9999999999', otp: '000000' });
    
    console.log('Invalid Verify OTP Response:', invalidVerifyRes.body);
  } else {
    console.error('Failed to send OTP');
  }
}

runTests().catch(console.error);
