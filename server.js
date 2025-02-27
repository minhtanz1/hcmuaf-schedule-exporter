// server.js - Main server file
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ical = require('ical-generator');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const crypto = require('crypto');
// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true }
}));
// Routes
app.get('/', (req, res) => {
  console.log(path.join(__dirname, '/public', 'styles.css'));
  res.sendFile(path.join(__dirname, '/public', 'index.html'));
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const response = await axios.post('https://dkmh.hcmuaf.edu.vn/api/auth/login', 
      `username=${username}&password=${password}&grant_type=password`,
      {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'content-type': 'text/plain'
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      // Success - return token to client
      // console.log(response)
      req.session.access_token = response.data.access_token;
      return res.json({ success: true });
      // return res.json({ success: true, access_token: response.data.access_token });
    } else {
      return res.status(401).json({ success: false, message: 'Login failed' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});
app.post('/api/fetch-semesters', async (req, res) => {
  try {
    // const { access_token } = req.body;
    
    // if (!access_token) {
    //   return res.status(400).json({ success: false, message: 'Access token is required' });
    if (!req.session.access_token) {
      return res.status(401).json({ success: false, message: 'Please log in first' });
    }
    
    const response = await axios.post(
      'https://dkmh.hcmuaf.edu.vn/api/sch/w-locdshockytkbuser',
      {},
      {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'authorization': `Bearer  ${req.session.access_token}`,
          'content-type': 'application/json',
          'Referer': 'https://dkmh.hcmuaf.edu.vn/public/',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }
    );
    
    if (response.data && response.data.data) {
      return res.json({ success: true, data: response.data.data });
    } else {
      return res.status(404).json({ success: false, message: 'No semester data found' });
    }
  } catch (error) {
    console.error('Semester fetch error:', error.message);
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ success: false, message: 'Unauthorized - please log in again' });
    }
    return res.status(500).json({ success: false, message: 'Server error fetching semesters' });
  }
});
// Fetch schedule endpoint
app.post('/api/fetch-schedule', async (req, res) => {
  try {
    // const { access_token, semester = 20242 } = req.body;
    
    // if (!access_token) {
    //   return res.status(400).json({ success: false, message: 'Access token is required' });
    const { semester = 20242 } = req.body;
    
    if (!req.session.access_token) {
      return res.status(401).json({ success: false, message: 'Please log in first' });
    }
    
    const response = await axios.post(
      'https://dkmh.hcmuaf.edu.vn/api/sch/w-locdstkbtuanusertheohocky',
      {
        filter: { hoc_ky: semester, ten_hoc_ky: "" },
        additional: {
          paging: { limit: 100, page: 1 },
          ordering: [{ name: null, order_type: null }]
        }
      },
      {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'authorization': `Bearer ${req.session.access_token}`,
          'content-type': 'application/json',
          'Referer': 'https://dkmh.hcmuaf.edu.vn/public/',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      }
    );
    
    if (response.data) {
      return res.json({ success: true, data: response.data });
    } else {
      return res.status(404).json({ success: false, message: 'No schedule data found' });
    }
  } catch (error) {
    console.error('Schedule fetch error:', error.message);
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ success: false, message: 'Unauthorized - please log in again' });
    }
    return res.status(500).json({ success: false, message: 'Server error fetching schedule' });
  }
});

// Generate ICS file endpoint
app.post('/api/generate-ics', (req, res) => {
  try {
    const { scheduleData } = req.body;
    
    if (!scheduleData || !scheduleData.data) {
      return res.status(400).json({ success: false, message: 'Schedule data is required' });
    }
    
    // Create calendar
    const calendar = ical({ name: 'TKB NLU' });
    
    // Define lesson periods by their start and end times
    const periods = {};
    scheduleData.data.ds_tiet_trong_ngay.forEach(tiet => {
      if (tiet.gio_bat_dau) {
        periods[tiet.tiet] = [tiet.gio_bat_dau, tiet.gio_ket_thuc];
      }
    });
    
    // Iterate through weeks
    scheduleData.data.ds_tuan_tkb.forEach(week => {
      // Iterate through scheduled classes
      week.ds_thoi_khoa_bieu.forEach(lesson => {
        const lessonDate = new Date(lesson.ngay_hoc.split('T')[0]);
        const [startTime, endTime] = periods[lesson.tiet_bat_dau] || ['00:00', '00:00'];
        
        // Parse start and end times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Create start and end dates
        const startDate = new Date(lessonDate);
        startDate.setHours(startHour, startMinute, 0);
        
        const endDate = new Date(lessonDate);
        endDate.setHours(endHour, endMinute, 0);
        
        // Add event to calendar
        calendar.createEvent({
          start: startDate,
          end: endDate,
          summary: lesson.ten_mon,
          location: lesson.ma_phong,
          description: `Giảng viên: ${lesson.ten_giang_vien}\nMã lớp: ${lesson.ma_lop}`
        });
      });
    });
    
    // Generate ICS content
    const icsContent = calendar.toString();
    
    // Return ICS content to client
    res.set('Content-Type', 'text/calendar');
    res.set('Content-Disposition', 'attachment; filename=tkb_exported.ics');
    return res.send(icsContent);
  } catch (error) {
    console.error('ICS generation error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error generating ICS file' });
  }
});
app.post('/api/google-calendar-urls', (req, res) => {
  try {
    const { scheduleData } = req.body;
    
    if (!scheduleData || !scheduleData.data) {
      return res.status(400).json({ success: false, message: 'Schedule data is required' });
    }
    
    // Define lesson periods by their start and end times
    const periods = {};
    scheduleData.data.ds_tiet_trong_ngay.forEach(tiet => {
      if (tiet.gio_bat_dau) {
        periods[tiet.tiet] = [tiet.gio_bat_dau, tiet.gio_ket_thuc];
      }
    });
    
    // Store event data for Google Calendar
    const events = [];
    
    // Iterate through weeks
    scheduleData.data.ds_tuan_tkb.forEach(week => {
      // Iterate through scheduled classes
      week.ds_thoi_khoa_bieu.forEach(lesson => {
        const lessonDate = new Date(lesson.ngay_hoc.split('T')[0]);
        const [startTime, endTime] = periods[lesson.tiet_bat_dau] || ['00:00', '00:00'];
        
        // Parse start and end times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Create start and end dates
        const startDate = new Date(lessonDate);
        startDate.setHours(startHour, startMinute, 0);
        
        const endDate = new Date(lessonDate);
        endDate.setHours(endHour, endMinute, 0);
        
        // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
        const startFormatted = startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/g, '');
        const endFormatted = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/g, '');
        
        // Create event object
        const event = {
          summary: lesson.ten_mon,
          start: startFormatted,
          end: endFormatted,
          location: lesson.ma_phong,
          description: `Giảng viên: ${lesson.ten_giang_vien}\nMã lớp: ${lesson.ma_lop}`
        };
        
        events.push(event);
      });
    });
    
    // Return the event data
    return res.json({ success: true, events });
  } catch (error) {
    console.error('Google Calendar URL generation error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error generating Google Calendar URLs' });
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});