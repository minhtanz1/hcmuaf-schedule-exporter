// api/routes/auth.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/login', async (req, res) => {
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
            res.cookie('access_token', response.data.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600000 // 1 giờ
            });
            return res.json({ success: true });
        } else {
            return res.status(401).json({ success: false, message: 'Login failed' });
        }

    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

module.exports = router;