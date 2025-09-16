const express = require('express');
const router = express.Router();

router.post('/set-access-token', async (req, res) => {
    try {
        const { access_token } = req.body;
        
        if (!access_token) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing access_token in request body' 
            });
        }

        res.cookie('access_token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour
        });

        return res.json({ 
            success: true, 
            message: 'Access token set successfully' 
        });

    } catch (error) {
        console.error('Error setting access token cookie:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error setting access token' 
        });
    }
});

module.exports = router;