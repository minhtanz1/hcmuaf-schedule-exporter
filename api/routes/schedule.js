// api/routes/schedule.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/fetch-semesters', async (req, res) => {
    try {
        const access_token = req.cookies.access_token;
        if (!access_token) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập trước' });
        }

        const response = await axios.post(
            'https://dkmh.hcmuaf.edu.vn/api/sch/w-locdshockytkbuser',
            {},
            {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'authorization': `Bearer  ${access_token}`,
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
        console.error('Semester fetch error:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            if (error.response.status === 401) {
                return res.status(401).json({ success: false, message: 'Unauthorized - please log in again' });
            }
        }
        return res.status(500).json({ success: false, message: 'Server error fetching semesters' });
    }
});


router.post('/fetch-schedule', async (req, res) => {
    try {
        const { semester = 20242 } = req.body;
        const access_token = req.cookies.access_token;
        if (!access_token) {
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
                    'authorization': `Bearer ${access_token}`,
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


module.exports = router;