// api/routes/ics.js
const express = require('express');
const ical = require('ical-generator');
const strftime = require('strftime');
const router = express.Router();


router.post('/generate-ics', (req, res) => {
    try {
        const scheduleData = req.body;

        if (!scheduleData || !scheduleData.data) {
            return res.status(400).json({ success: false, message: 'Schedule data is required' });
        }

        // Create calendar
        const calendar = ical({ name: 'TKB NLU' });

        // Define lesson periods by their start and end times
        const periods = {};
        scheduleData.data.data.ds_tiet_trong_ngay.forEach(tiet => {
            if (tiet.gio_bat_dau) {
                periods[tiet.tiet] = {
                    start: tiet.gio_bat_dau,
                    duration: tiet.so_phut
                };
            }
        });

        const addMinutes = (time, minutes) => {
            const [hours, mins] = time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, mins + minutes);
            return date.toTimeString().slice(0, 5);
        };
        // Iterate through weeks
        scheduleData.data.data.ds_tuan_tkb.forEach(week => {
            // Iterate through scheduled classes
            week.ds_thoi_khoa_bieu.forEach(lesson => {
                const lessonDateStr = strftime('%Y-%m-%d', new Date(lesson.ngay_hoc.split('T')[0])); // "YYYY-MM-DD"
                
                const startPeriod = lesson.tiet_bat_dau;
                const numPeriods = lesson.so_tiet;
                // Get start and end times from the periods object (defaults to "00:00" if not found)
                let startTime = periods[startPeriod]?.start || '00:00';
                let totalMinutes = 0;
                
                for (let i = 0; i < numPeriods-1; i++) {
                    totalMinutes += periods[startPeriod + i]?.duration || 0;
                }
                const endTime = addMinutes(startTime, totalMinutes);
                // Create Date objects by combining the lesson date and the time strings.
                const startDate = `${lessonDateStr}T${startTime}:00`;
                const endDate = `${lessonDateStr}T${endTime}:00`;
                // Add event to calendar
                calendar.createEvent({
                    start: startDate,
                    end: endDate,
                    summary: lesson.ten_mon,
                    location: lesson.ma_phong,
                    description: `Giảng viên: ${lesson.ten_giang_vien}\nMã lớp: ${lesson.ma_lop}\nMã nhóm: ${lesson.ma_nhom}\nThông tin tuần: ${week.thong_tin_tuan}`,
                    timezone: 'Asia/Ho_Chi_Minh'
                });
            });
        });

        // Generate ICS content
        let icsContent = calendar.toString();

        res.set('Content-Type', 'text/calendar');
        res.set('Content-Disposition', 'attachment; filename=tkb_exported.ics');
        return res.send(icsContent);

    } catch (error) {
        console.error('ICS generation error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error generating ICS file' });
    }
});

router.post('/generate-ics/exam', (req, res) => {
    try {
        const examData = req.body;

        if (!examData) {
            return res.status(400).json({ success: false, message: 'Schedule data is required' });
        }

        // Create calendar
        const calendar = ical({ name: 'EXAM NLU' });

        // Helper functions for exam time calculation and date parsing
        function addMinutes(timeStr, minutesToAdd) {
            let [hoursStr, minutesStr] = timeStr.split(':');
            let hours = parseInt(hoursStr);
            let minutes = parseInt(minutesStr);
            minutes += parseInt(minutesToAdd);
            hours += Math.floor(minutes / 60);
            minutes %= 60;
            hours %= 24;
            return hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0')
        }
        function parseVietnameseDate(dateStr) {
            if (!dateStr || typeof dateStr !== 'string') {
                console.error('Invalid date string:', dateStr);
                return null;
            }
            const parts = dateStr.split('/');
            if (parts.length !== 3) {
                console.error('Date string does not match expected format (DD/MM/YYYY):', dateStr);
                return null;
            }
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }

        examData.data.data.ds_lich_thi.forEach(subject => {
            const subjectDateStr = parseVietnameseDate(subject.ngay_thi); // "YYYY-MM-DD"
            const startTime = subject.gio_bat_dau;
            const endTime = addMinutes(startTime, subject.so_phut)

            // Create Date objects by combining the lesson date and the time strings.
            const startDate = `${subjectDateStr}T${startTime}:00`;
            const endDate = `${subjectDateStr}T${endTime}:00`;

            // Add event to calendar
            calendar.createEvent({
                start: startDate,
                end: endDate,
                summary: subject.ten_mon,
                location: `${subject.ma_phong} - ${subject.dia_diem_thi}`,
                description: `Ghép thi: ${subject.ghep_thi}\nTổ thi: ${subject.to_thi}\nMã nhóm: ${subject.nhom_thi}\nSĩ số: ${subject.si_so}\n`,
                timezone: 'Asia/Ho_Chi_Minh'
            });
        });

        // Generate ICS content
        let icsContent = calendar.toString();

        res.set('Content-Type', 'text/calendar');
        res.set('Content-Disposition', 'attachment; filename=exam_exported.ics');
        return res.send(icsContent);

    } catch (error) {
        console.error('ICS generation error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error generating ICS file' });
    }
});


module.exports = router;