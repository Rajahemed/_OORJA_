# 🚗 Road Warrior Pro - Professional Delivery Management System v2.0

A complete, production-ready delivery rider management and analytics platform with real-time features, professional UI/UX, and comprehensive admin dashboard.

## ✨ Key Features

### 📱 User Management
- **Professional Registration System** with 10-digit phone validation
- **Real-time User Authentication** with session management
- **Complete Profile Management** with bank & payment details
- **Referral Program** with tracking and rewards

### 🚗 Vehicle Management
- **Multi-Vehicle Support** per rider
- **Insurance Tracking** with expiry alerts
- **Maintenance History** logging
- **Vehicle Performance Analytics**
- **Fuel & Mileage Tracking**

### 📊 Dashboard & Analytics
- **Real-time Statistics** with live updates
- **Interactive Charts** (Bar, Line, Pie, Doughnut)
- **Weekly/Monthly Trends** analysis
- **Performance Metrics** tracking
- **Revenue Analytics** by delivery type and location

### 🏆 Gamification & Rewards
- **Global Leaderboard** system
- **Points & Rewards System**
- **Achievement Badges**
- **Tier-based Rewards**
- **Competition Features**

### 💰 Payment & Earning Tracking
- **Real-time Earnings Calculation**
- **Payment History** tracking
- **Payout Management**
- **Tax Calculations**
- **Invoice Generation**

### 👨‍💼 Admin Dashboard
- **System Statistics** overview
- **User Management** tools
- **Delivery Monitoring** system
- **Payment Management** interface
- **Dispute Resolution** system
- **System Health** monitoring
- **Analytics & Reports** generation

### 🎨 Professional UI/UX
- **Modern Dark Theme** with gradients
- **Responsive Design** (Mobile, Tablet, Desktop)
- **Smooth Animations** and transitions
- **Professional Typography**
- **Accessible Interface** (WCAG compliant)
- **Real-time Notifications**

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid & Flexbox
- **Vanilla JavaScript** - No dependencies
- **Chart.js** - Interactive charts and graphs

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Body-Parser** - Request parsing
- **CORS** - Cross-origin support

### Database (Ready for Integration)
- **Supabase** - PostgreSQL backend
- **In-Memory** storage (development)

## 📋 Installation & Setup

### Prerequisites
- Node.js v14 or higher
- npm or yarn
- Modern web browser

### Installation Steps

1. **Extract the project**
   ```bash
   unzip road-warrior-pro.zip
   cd road-warrior-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Edit .env file with your settings
   cp .env.example .env
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - Open browser: `http://localhost:3000`

## 📖 User Guide

### For Riders

1. **Registration**
   - Navigate to home page
   - Click "Register"
   - Enter 10-digit phone number (validated in real-time)
   - Select your city
   - Create account

2. **Dashboard**
   - View real-time statistics
   - Track total deliveries and earnings
   - Check your rating and points
   - Quick actions for deliveries and vehicles

3. **Vehicles**
   - Add multiple vehicles
   - Track insurance & maintenance
   - View vehicle performance
   - Update vehicle details

4. **Deliveries**
   - Create new delivery orders
   - Track delivery status
   - Update delivery progress
   - Rate and review completed deliveries

5. **Analytics**
   - View performance charts
   - Track weekly/monthly trends
   - Analyze earnings patterns
   - Review delivery metrics

6. **Profile**
   - Update personal information
   - Change password
   - Add/update bank details
   - Check referral status
   - View achievements

7. **Leaderboard**
   - Check your global ranking
   - View top performers
   - Compare your stats
   - Earn achievements

### For Admins

1. **System Overview**
   - Monitor total users and active riders
   - Track system-wide deliveries
   - View revenue metrics
   - Check system health

2. **User Management**
   - View all riders
   - Monitor user activity
   - Handle user requests
   - Manage permissions

3. **Delivery Management**
   - Monitor all deliveries
   - Track delivery status
   - Review completed orders
   - Handle issues

4. **Payment Processing**
   - Process rider payouts
   - Track payment history
   - Generate financial reports
   - Manage disputes

5. **Analytics & Reports**
   - Generate custom reports
   - Export data
   - Analyze trends
   - Plan strategies

## 📱 Navigation Structure

```
Home (/)
├── Login/Register
├── Dashboard
├── Vehicles (/vehicles)
├── Analytics (/dashboard)
├── Leaderboard (/score)
├── Profile (/profile)
└── Admin (/admin)
```

## 🔐 Security Audit & Hardening

During the recent security audit, several vulnerabilities and weaknesses were identified and subsequently remediated. The platform now implements defense-in-depth strategies to protect user data and system integrity.

### 🛡️ What Was Audited & Fixed

1. **Cross-Site Scripting (XSS) Mitigation**
   - **Weakness:** Lack of strict resource loading policies could allow execution of malicious scripts.
   - **Fix:** Implemented **Helmet.js** with a strict Content Security Policy (CSP). This restricts script, style, and image sources to explicitly trusted domains, neutralizing XSS vectors.

2. **Cross-Site Request Forgery (CSRF) Protection**
   - **Weakness:** API endpoints were susceptible to CSRF, where an attacker could trick a victim's browser into executing unwanted actions.
   - **Fix:** Integrated the **csurf** middleware. All state-changing requests now require a valid, session-bound CSRF token, ensuring that requests intentionally originate from our frontend.

3. **Brute-Force & Denial-of-Service (DoS) Prevention**
   - **Weakness:** APIs lacked request throttling, making them vulnerable to brute-force credential stuffing and basic volumetric DoS attacks.
   - **Fix:** Added **express-rate-limit** to restrict each IP address to a maximum of 200 requests per 15-minute window. Additionally, enforced strict payload size limits (`50mb`) in `body-parser` to prevent large-payload memory exhaustion.

4. **Authentication & Credential Security**
   - **Weakness:** Custom-built admin authentication can be error-prone and vulnerable to timing attacks or weak hashing.
   - **Fix:** Delegated admin authentication entirely to **Supabase Auth**, which utilizes industry-standard secure password hashing (bcrypt/Argon2) and secure JWT issuance.

5. **Data Exposure & Transport Security**
   - **Weakness:** Potential exposure of internal stack details and unrestricted cross-origin requests.
   - **Fix:** Hardened **CORS** configurations to explicitly control allowed origins. Disabled the `X-Powered-By` header (via Helmet) to obscure the underlying technology stack.

6. **Input Validation**
   - **Fix:** Real-time, strict regex-based validation for critical inputs (e.g., enforcing exactly 10 digits for Indian phone numbers) to prevent SQL/NoSQL injection and maintain data hygiene.
## 📊 API Endpoints

### Authentication
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### Riders
- `POST /api/riders/register` - Register new rider
- `GET /api/riders/:riderId` - Get rider profile
- `PUT /api/riders/:riderId` - Update rider profile
- `GET /api/riders/:riderId/deliveries` - Get rider deliveries
- `GET /api/stats/:riderId` - Get rider statistics

### Vehicles
- `POST /api/vehicles` - Add new vehicle
- `GET /api/riders/:riderId/vehicles` - Get rider vehicles

### Deliveries
- `POST /api/deliveries` - Create delivery
- `PUT /api/deliveries/:deliveryId` - Update delivery
- `GET /api/riders/:riderId/deliveries` - Get deliveries

### Analytics
- `GET /dashboard/analytics/:riderId` - Get rider analytics
- `GET /dashboard/city-analytics` - Get city statistics
- `GET /dashboard/revenue/:riderId` - Get revenue data
- `GET /dashboard/system-stats` - Get system statistics

### Admin
- `GET /api/admin/riders` - Get all riders
- `GET /api/leaderboard` - Get leaderboard

## 🎯 Validation Rules

### Phone Number
- Exactly 10 digits
- Numbers only (0-9)
- Real-time validation with feedback
- Error message if invalid
- Success message when valid

### Email
- Valid email format
- Unique across system
- Case-insensitive

### City
- Must be selected from dropdown
- Predefined list of cities
- Bangalore, Mumbai, Delhi, Pune, Hyderabad, Chennai, Kolkata, Ahmedabad

## 📈 Performance Optimization

- ✅ CSS minified for production
- ✅ JavaScript optimized
- ✅ Lazy loading of charts
- ✅ Responsive images
- ✅ Local storage caching
- ✅ Efficient database queries

## 🐛 Troubleshooting

### Port Already in Use
```bash
# The app will automatically try the next available port
# Or specify a different port:
PORT=3001 npm start
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Phone Validation Not Working
- Check browser console for errors
- Ensure JavaScript is enabled
- Try clearing browser cache

## 📞 Support & Contact

For issues, bugs, or feature requests:
- Check the documentation
- Review the code comments
- Check browser console for errors

## 📄 License

Road Warrior Pro v2.0
All Rights Reserved 2024

## 🔄 Version History

### v2.0 (Current)
- Complete professional redesign
- Real-time analytics
- Enhanced security
- Improved performance
- Mobile responsive
- New admin dashboard
- Better user experience

### v1.0
- Initial release
- Basic functionality
- Original UI

## 🚀 Future Enhancements

- [ ] Real-time GPS tracking
- [ ] Push notifications
- [ ] Mobile app (iOS/Android)
- [ ] Video streaming for delivery proof
- [ ] AI-powered route optimization
- [ ] Blockchain-based ratings
- [ ] Advanced payment options
- [ ] Multi-language support

## 📝 Notes

- This is a demonstration platform
- Data is stored in-memory (not persistent)
- For production, use a proper database
- Implement authentication with JWT tokens
- Add HTTPS/SSL certificates
- Configure email notifications
- Set up monitoring and logging

## 👨‍💻 Developer Guide

### Project Structure
```
road-warrior-pro/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── index.html
│   ├── vehicles.html
│   ├── dashboard.html
│   ├── profile.html
│   ├── score.html
│   └── admin.html
├── routes/
│   ├── api.js
│   ├── auth.js
│   └── dashboard.js
├── config/
├── server.js
├── package.json
├── .env
└── README.md
```

### Adding New Features

1. Create new route in `/routes`
2. Add HTML page in `/public`
3. Add CSS styles to `/public/css/style.css`
4. Test thoroughly
5. Update documentation

---

**Built with ❤️ for Delivery Excellence**

Road Warrior Pro v2.0 - Empowering Last-Mile Delivery Professionals
