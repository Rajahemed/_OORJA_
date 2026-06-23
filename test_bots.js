async function simulateBots() {
  const url = 'http://localhost:3000/api/visitor/track';
  
  try {
    const res = await fetch('http://localhost:3000/api/csrf-token');
    const data = await res.json();
    const csrfToken = data.csrfToken;
    const cookie = res.headers.get('set-cookie').split(';')[0]; // simple extraction

    const sendBot = async (visitorId, userAgent, ip) => {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken,
          'Cookie': cookie,
          'X-Forwarded-For': ip
        },
        body: JSON.stringify({
          visitor_id: visitorId,
          session_id: 'sess_' + visitorId,
          user_agent: userAgent,
          current_page: '/',
          landing_page: '/'
        })
      });
      console.log('Sent:', visitorId);
    };

    await sendBot('bot_gpt_aws', 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0; +https://openai.com/gptbot', '54.241.142.25');
    await sendBot('bot_google', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', '66.249.66.1');
    await sendBot('dc_do_crawler', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '104.248.50.50');
    
  } catch(e) {
    console.error('Error:', e.message);
  }
}
simulateBots();
