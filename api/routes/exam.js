// api/routes/exam.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/fetch-semexam', async (req, res) => {
    try {
        const access_token = req.cookies.access_token;
        if (!access_token) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập trước' });
        }

        const response = await axios.post(
            `https://dkmh.hcmuaf.edu.vn/api/report/w-locdshockylichthisinhvien`,
            {
                filter: { is_tieng_anh: false },
                additional: {
                    paging: { limit: 100, page: 1 },
                    ordering: [{ name: null, order_type: null }]
                }
            },
            {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'authorization': `Bearer  ${access_token}`,
                    'content-type': 'application/json',
                    'Referer': 'https://dkmh.hcmuaf.edu.vn/public',
                    "sec-fetch-mode": "cors",
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

router.post('/fetch-exam', async (req, res) => {
    try {
        const { semester = 20242 } = req.body;
        const access_token = req.cookies.access_token;
        if (!access_token) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập trước' });
        }
        const response = await axios.post(
            'https://dkmh.hcmuaf.edu.vn/api/epm/w-locdslichthisvtheohocky',
            {
                filter: { hoc_ky: semester, is_giua_ky: false },
                additional: {
                    paging: { limit: 100, page: 1 },
                    ordering: [{ name: null, order_type: null }]
                }
            },
            {
                headers: {
                    'accept': 'application/json, text/plain, /',
                    'authorization': `Bearer ${access_token}`,
                    'content-type': 'application/json',
                    'Referer': 'https://dkmh.hcmuaf.edu.vn/',
                    'Referrer-Policy': 'strict-origin-when-cross-origin'
                }
            }
        );
        if (response.data) {
            return res.json({ success: true, data: response.data });
        } else {
            return res.status(404).json({ success: false, message: 'No exam schedule data found' });
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