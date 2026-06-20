const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');

// Helper to get days of week
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Dashboard analytics (Evaluates actual database details combined with seed/mock fallbacks)
router.get('/analytics/:riderId', async (req, res) => {
  try {
    const { riderId } = req.params;
    
    // Find actual stats for this rider
    const { data: riderRowsDash } = await supabase.from('riders').select('*').eq('id', riderId);
    const rider = riderRowsDash && riderRowsDash.length > 0 ? riderRowsDash[0] : null;
    const actualRefsCount = rider ? (rider.referrals || 0) : 0;
    const actualPointsCount = rider ? (rider.totalPoints || 0) : 0;

    // Distribute actual referrals/points across weekly data points
    const weeklyData = DAYS.map((day, idx) => {
      // Base mock values for visual richness
      const baseReferrals = [1, 2, 0, 3, 2, 4, 1][idx];
      const basePoints = [10, 15, 10, 25, 20, 40, 30][idx];

      let addedRefs = 0;
      let addedPoints = 0;

      // Overlay actual user data on the current day
      if (idx === (new Date().getDay() + 6) % 7) {
        addedRefs = actualRefsCount;
        addedPoints = actualPointsCount;
      }

      return {
        day,
        referrals: baseReferrals + addedRefs,
        points: basePoints + addedPoints
      };
    });

    const analytics = {
      weeklyData,
      thisWeek: {
        referrals: actualRefsCount,
        points: actualPointsCount,
        rating: rider ? rider.rating : 5.0
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get city-wise referral count analytics
router.get('/city-analytics', async (req, res) => {
  try {
    const cityCounts = {
      Bangalore: 42,
      Mumbai: 28,
      Delhi: 35,
      Pune: 18,
      Hyderabad: 24
    };

    const { data: riders } = await supabase.from('riders').select('city');
    const riderList = riders || [];

    // Increment based on actual registered riders in DB per city
    for (let rider of riderList) {
      let rawCity = (rider.city || 'Bangalore').trim();
      const city = rawCity.charAt(0).toUpperCase() + rawCity.slice(1).toLowerCase();
      if (cityCounts[city] !== undefined) {
        cityCounts[city]++;
      } else {
        cityCounts[city] = 1;
      }
    }

    const cities = Object.keys(cityCounts).map(name => ({
      name,
      referrals: cityCounts[name]
    }));

    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get login/logout analytics
router.get('/login-analytics', async (req, res) => {
  try {
    // Generate mock data for the last 7 days
    const loginData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Adjust to match Mon-Sun
      
      const logins = Math.floor(Math.random() * 50) + 100;
      const logouts = Math.floor(logins * (Math.random() * 0.4 + 0.5)); // logouts usually a bit less than logins

      loginData.push({
        day,
        logins,
        logouts
      });
    }

    res.json({
      success: true,
      data: loginData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get revenue analytics
router.get('/revenue/:riderId', async (req, res) => {
  try {
    const { riderId } = req.params;

    // Filter actual deliveries
    const { data: deliveries } = await supabase.from('deliveries').select('*').eq('riderId', riderId).eq('status', 'completed');
    const actualDeliveries = deliveries || [];

    const currentMonthIdx = new Date().getMonth();
    const monthStats = {};
    MONTHS.forEach(m => {
      monthStats[m] = { revenue: 0, deliveries: 0 };
    });

    actualDeliveries.forEach(d => {
      const date = new Date(d.endTime || d.createdAt);
      const monthName = MONTHS[date.getMonth()];
      monthStats[monthName].revenue += d.amount || 0;
      monthStats[monthName].deliveries += 1;
    });

    const revenueData = MONTHS.map((month, idx) => {
      // Mock history for previous months, add actuals to the current month
      const isPast = idx < currentMonthIdx;
      const isCurrent = idx === currentMonthIdx;

      let baseRevenue = isPast ? Math.floor(Math.random() * 2000) + 1500 : 0;
      let baseDeliveries = isPast ? Math.floor(baseRevenue / 40) : 0;

      return {
        month,
        revenue: baseRevenue + monthStats[month].revenue,
        deliveries: baseDeliveries + monthStats[month].deliveries
      };
    });

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get system-wide statistics (Admin Dashboard)
router.get('/system-stats', async (req, res) => {
  try {
    const { data: riders, count } = await supabase.from('riders').select('*', { count: 'exact' });
    const ridersCount = count || 0;
    const riderList = riders || [];

    let activeRidersCount = 0;
    let totalDeliveriesCount = 0;
    let totalEarningsCount = 0;
    let ratingsSum = 0;
    let ratingsCount = 0;

    for (let rider of riderList) {
      if (rider.isActive) activeRidersCount++;
      totalDeliveriesCount += rider.totalDeliveries || 0;
      totalEarningsCount += (rider.totalDeliveries || 0) * 50; // Average earnings
      if (rider.rating) {
        ratingsSum += rider.rating;
        ratingsCount++;
      }
    }

    // Blend with platform seed statistics (to simulate large database metrics)
    const stats = {
      totalRiders: 2450 + ridersCount,
      activeRiders: 850 + activeRidersCount,
      totalDeliveries: 125000 + totalDeliveriesCount,
      totalEarnings: 2400000 + totalEarningsCount,
      averageRating: ratingsCount > 0 ? (ratingsSum / ratingsCount).toFixed(1) : '4.8',
      topCity: 'Bangalore',
      peakHours: ['12:00 PM', '7:00 PM'],
      averageDeliveryTime: '24 mins',
      successRate: '96.2%'
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
