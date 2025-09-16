// public/script.js

document.getElementById('examsemForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Ngăn chặn submit form mặc định
    const examsemLabel = document.querySelector('#examsem').selectedOptions[0].label;
    document.getElementById('step3Message').textContent = `${examsemLabel} của bạn đã được lấy thành công!`;
});

// Global variables
let accessToken = '';
// let scheduleData = null;
let calendarEvents = [];
// let examData = null;
// DOM Elements
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step21 = document.getElementById('step21');
const step22 = document.getElementById('step22');
const step3 = document.getElementById('step3');
// const loginForm = document.getElementById('loginForm');
const semesterForm = document.getElementById('semesterForm');
const examsemSelect = document.getElementById('examsem');
const downloadBtn = document.getElementById('downloadBtn');
const importGoogleBtn = document.getElementById('importGoogleBtn');
const startOverBtn = document.getElementById('startOverBtn');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const errorEl = document.getElementById('error');
// const baseURL = `${window.location.protocol}//${window.location.host}`;
// Helper functions
function showStep(step) {
    // Hide all steps
    [step1, step2, step21, step22, step3].forEach(el => {
        el.classList.remove('active');
    });
    // Show requested step
    step.classList.add('active');
}

function showLoading(message = 'Đang xử lí...') {
    loading.style.display = 'block';
    loadingText.textContent = message;
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideError() {
    errorEl.style.display = 'none';
}
async function setAccessTokenCookie(token) {
    try {
        const response = await fetch('/api/set-access-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ access_token: token }) 
        });
        // First check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message;
            } catch (e) {
                errorMessage = `Server error (${response.status}): ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(data);
        if (!data.success) {
            throw new Error(data.message || 'Could not set Access Token');
        }

        return true;
    } catch (error) {
        console.error('Error setting Access Token:', error);
        showError(error.message || 'Error setting token. Please try again.');
        return false;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    showStep(step1);
});

manualTokenForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();

    const rawToken = accessTokenInput.value.trim();
    if (!rawToken) {
        showError('Vui lòng dán Access Token vào đây.');
        return;
    }

    let accessToken = rawToken;

    if (rawToken.startsWith('{') && rawToken.endsWith('}')) {
        try {
            const parsed = JSON.parse(rawToken);
            if (parsed.access_token) {
                accessToken = parsed.access_token;
            } else {
                showError('Chuỗi JSON không chứa "access_token". Vui lòng kiểm tra lại.');
                return;
            }
        } catch (parseError) {
            showError('Định dạng token không hợp lệ. Vui lòng dán chính xác giá trị của "access_token" hoặc cả chuỗi JSON nếu có.');
            return;
        }
    }


    showLoading('Đang xử lý Access Token...');
    const cookieSet = await setAccessTokenCookie(accessToken);

    if (cookieSet) {
        hideLoading();
        showStep(step2);
    } else {
        hideLoading();
    }
});

document.getElementById('examsemForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const examsemLabel = document.querySelector('#examsem').selectedOptions[0].label;
    document.getElementById('step3Message').textContent = `${examsemLabel} của bạn đã được lấy thành công!`;
});

async function fetchSemesters() {
    hideError();
    showLoading('Đang tìm kiếm các học kỳ có sẵn...');

    try {
        const response = await fetch('/api/fetch-semesters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // body: JSON.stringify({ access_token: accessToken })
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Không thể lấy học kỳ');
        }

        const semesterSelect = document.getElementById('semester');
        semesterSelect.innerHTML = ''; // Clear loading option

        if (data.data && data.data.ds_hoc_ky && data.data.ds_hoc_ky.length > 0) {
            // Add options for each semester
            data.data.ds_hoc_ky.forEach(semester => {
                const option = document.createElement('option');
                option.value = semester.hoc_ky;
                option.textContent = semester.ten_hoc_ky;
                semesterSelect.appendChild(option);
            });
        } else {
            // If no semesters found
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "Không có học kỳ nào có sẵn";
            option.disabled = true;
            option.selected = true;
            semesterSelect.appendChild(option);
        }

        hideLoading();
    } catch (error) {
        console.error('Lỗi tìm nạp học kỳ:', error);
        hideLoading();
        showError(error.message || 'Đã xảy ra lỗi khi tải học kỳ');

        // Add a default option if fetch fails
        const semesterSelect = document.getElementById('semester');
        semesterSelect.innerHTML = ''; // Clear loading option
        const option = document.createElement('option');
        option.value = "00000";
        option.textContent = "Chọn học kì";
        semesterSelect.appendChild(option);
    }
}
async function fetchSemExam() {
    hideError();
    showLoading('Đang tìm kiếm các học kỳ có sẵn...');

    try {
        const response = await fetch('/api/fetch-semexam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // body: JSON.stringify({ access_token: accessToken })
            body: JSON.stringify({})
        });

        const data = await response.json();
        // console.log(data);

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Không thể lấy học kỳ');
        }

        const semesterSelect = document.getElementById('exam');
        semesterSelect.innerHTML = ''; // Clear loading option

        if (data.data && data.data.ds_hoc_ky && data.data.ds_hoc_ky.length > 0) {
            // Add options for each semester
            data.data.ds_hoc_ky.forEach(semester => {
                const option = document.createElement('option');
                option.value = semester.hoc_ky;
                option.textContent = semester.ten_hoc_ky;
                semesterSelect.appendChild(option);
            });
        } else {
            // If no semesters found
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "Không có học kỳ nào có sẵn";
            option.disabled = true;
            option.selected = true;
            semesterSelect.appendChild(option);
        }

        hideLoading();
    } catch (error) {
        console.error('Lỗi tìm nạp học kỳ:', error);
        hideLoading();
        showError(error.message || 'Đã xảy ra lỗi khi tải học kỳ');

        // Add a default option if fetch fails
        const semesterSelect = document.getElementById('exam');
        semesterSelect.innerHTML = ''; // Clear loading option
        const option = document.createElement('option');
        option.value = "00000";
        option.textContent = "Chọn học kì";
        semesterSelect.appendChild(option);
    }
}
// Parse ICS to get events for Google Calendar
function parseEventsFromIcs(icsContent) {
    const events = [];
    const lines = icsContent.split('\n');
    let currentEvent = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === 'BEGIN:VEVENT') {
            currentEvent = {};
        } else if (line === 'END:VEVENT' && currentEvent) {
            events.push(currentEvent);
            currentEvent = null;
        } else if (currentEvent) {
            // Parse event properties
            if (line.startsWith('SUMMARY:')) {
                currentEvent.summary = line.substring(8);
            } else if (line.startsWith('DTSTART:')) {
                currentEvent.start = formatGoogleCalendarDate(line.substring(8));
            } else if (line.startsWith('DTEND:')) {
                currentEvent.end = formatGoogleCalendarDate(line.substring(6));
            } else if (line.startsWith('LOCATION:')) {
                currentEvent.location = line.substring(9);
            } else if (line.startsWith('DESCRIPTION:')) {
                currentEvent.description = line.substring(12);
            }
        }
    }

    return events;
}
// Format date for Google Calendar URL
function formatGoogleCalendarDate(isoDate) {
    // ISO 8601 format: YYYY-MM-DDTHH:MM:SS
    const dateTimeParts = isoDate.split('T');
    if (dateTimeParts.length !== 2) return '';

    const datePart = dateTimeParts[0]; // Extract the date (YYYY-MM-DD)
    const timePart = dateTimeParts[1]; // Extract the time (HH:MM:SS)

    const dateComponents = datePart.split('-');
    const timeComponents = timePart.split(':');

    if (dateComponents.length !== 3 || timeComponents.length !== 3) return '';

    const year = dateComponents[0];
    const month = dateComponents[1];
    const day = dateComponents[2];
    const hour = timeComponents[0];
    const minute = timeComponents[1];
    const second = timeComponents[2];
    return `${year}${month}${day}T${hour}${minute}${second}`;
}
// Generate Google Calendar URL for a single event
function generateGoogleCalendarUrl(event) {
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const action = 'TEMPLATE';

    let url = `${baseUrl}?action=${action}`;
    url += `&text=${encodeURIComponent(event.summary || 'Class')}`;

    if (event.start) url += `&dates=${event.start}`;
    if (event.end) url += `/${event.end}`;
    if (event.location) url += `&location=${encodeURIComponent(event.location)}`;
    if (event.description) url += `&details=${encodeURIComponent(event.description)}`;

    return url;
}

// Create Google Calendar for all events
function addToGoogleCalendar(events) {
    // Verify we have events
    if (!events || events.length === 0) {
        showError('Không có sự kiện nào để thêm vào lịch');
        return;
    }

    // If too many events, we'll need a different approach
    if (events.length > 10) {
        // For many events, use the ICS file approach
        createGoogleCalendarWithIcs();
        return;
    }

    // For a small number of events, open them one by one
    events.forEach((event, index) => {
        // Add a small delay between openings to prevent popup blocking
        setTimeout(() => {
            window.open(generateGoogleCalendarUrl(event), '_blank');
        }, index * 500);
    });
}

// Create a new Google Calendar and import events via ICS
function createGoogleCalendarWithIcs() {
    // Google Calendar import URL
    const importUrl = 'https://calendar.google.com/calendar/u/0/r/settings/createcalendar';

    // Open the calendar creation page
    window.open(importUrl, '_blank');

}

// Event handlers
// loginForm.addEventListener('submit', async function (e) {
//     e.preventDefault();
//     hideError();

//     const username = document.getElementById('username').value;
//     const password = document.getElementById('password').value;

//     if (!username || !password) {
//         showError('Vui lòng nhập cả tên người dùng và mật khẩu');
//         return;
//     }

//     showLoading('Đang đăng nhập...');

//     try {
//         const response = await fetch('/api/login', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ username, password })
//         });

//         const data = await response.json();

//         if (!response.ok || !data.success) {
//             throw new Error(data.message || 'Đăng nhập không thành công. Vui lòng kiểm tra thông tin đăng nhập của bạn.');
//         }

//         //accessToken = data.access_token;
//         hideLoading();

//         showStep(step2);
//     } catch (error) {
//         console.error('Lỗi đăng nhập:', error);
//         hideLoading();
//         showError(error.message || 'Đã xảy ra lỗi trong quá trình đăng nhập');
//     }
// });

semesterForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();

    const semester = document.getElementById('semester').value;

    if (!semester) {
        showError('Vui lòng nhập mã học kỳ');
        return;
    }

    showLoading('Đang lấy tkb...');

    try {
        const response = await fetch('/api/fetch-schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ semester })
            // body: JSON.stringify({ access_token: accessToken, semester })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Không thể lấy tkb');
        }

        scheduleData = data.data;
        hideLoading();
        showStep(step3);
        document.getElementById('googleCalendarInstructions').style.display = 'block';
    } catch (error) {
        console.error('Lỗi tkb tìm nạp:', error);
        hideLoading();
        showError(error.message || 'Đã xảy ra lỗi khi lấy lịch trình');
    }
});
examsemForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    hideError();

    if (examsemSelect.value === 'schedule') {
        hideLoading();
        await fetchSemesters();
        showStep(step21);
    } else if (examsemSelect.value === 'exam') {
        hideLoading();
        await fetchSemExam();
        showStep(step22);
    }
});
const examForm = document.getElementById('examForm');
examForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();
    const examSemester = document.getElementById('exam').value;
    if (!examSemester) {
        showError('Vui lòng chọn học kỳ');
        return;
    }
    showLoading('Đang lấy lịch thi...');
    try {
        const response = await fetch('/api/fetch-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ semester: examSemester })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Không thể lấy lịch thi');
        }
        examData = data.data;
        hideLoading();
        showStep(step3);
        document.getElementById('googleCalendarInstructions').style.display = 'block';
    } catch (error) {
        console.error('Lỗi lấy lịch thi:', error);
        hideLoading();
        showError(error.message || 'Đã xảy ra lỗi khi lấy lịch thi');
    }
});
downloadBtn.addEventListener('click', async function () {
    hideError();

    if (examsemSelect.value === 'schedule' && !scheduleData) {
        showError('Không có dữ liệu lịch trình nào có sẵn');
        return;
    } else if (examsemSelect.value === 'exam' && !examData) {
        showError('Không có dữ liệu lịch trình nào có sẵn');
        return;
    }
    showLoading('Đang chuẩn bị nhập Google Lịch...');

    try {
        if (examsemSelect.value === 'schedule' && !scheduleData) {
            showError('Không có dữ liệu lịch trình nào có sẵn');
            return;
        } else if (examsemSelect.value === 'exam' && !examData) {
            showError('Không có dữ liệu lịch trình nào có sẵn');
            return;
        }
        showLoading('Đang chuẩn bị nhập Google Lịch...');

        // First, get the ICS content
        const endpoint = examsemSelect.value === 'schedule' ? '/api/generate-ics' : '/api/generate-ics/exam';
        const data = examsemSelect.value === 'schedule' ? scheduleData : examData;
        // console.log(JSON.stringify({ data }))
        // Fetch ICS content
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data })
        });

        // console.log(response.data)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không tạo được tệp ICS');
        }

        // Get the blob from the response
        const blob = await response.blob();

        // Create a download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${examsemSelect.value}_exported.ics`;
        document.body.appendChild(a);
        a.click();

        hideLoading();
    } catch (error) {
        console.error('Lỗi tạo ICS:', error);
        hideLoading();
        showError(error.message || 'Đã xảy ra lỗi khi tạo tệp lịch');
    }
});

importGoogleBtn.addEventListener('click', async function () {
    hideError();

    if (examsemSelect.value === 'schedule' && !scheduleData) {
        showError('Không có dữ liệu lịch trình nào có sẵn');
        return;
    } else if (examsemSelect.value === 'exam' && !examData) {
        showError('Không có dữ liệu lịch trình nào có sẵn');
        return;
    }
    showLoading('Đang chuẩn bị nhập Google Lịch...');

    try {
        // First, get the ICS content
        const endpoint = examsemSelect.value === 'schedule' ? '/api/generate-ics' : '/api/generate-ics/exam';
        const data = examsemSelect.value === 'schedule' ? scheduleData : examData;

        // Fetch ICS content
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không tạo được dữ liệu lịch');
        }

        const icsContent = await response.text();

        // Download the file first (required for import)
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${examsemSelect.value}_exported.ics`;
        document.body.appendChild(a);
        a.click();
        // Parse the ICS content to get events
        const events = parseEventsFromIcs(icsContent);

        // Direct user to Google Calendar
        createGoogleCalendarWithIcs();

        hideLoading();
    } catch (error) {
        console.error('Lỗi nhập Google Lịch:', error);
        hideLoading();
        showError(error.message || 'Đã xảy ra lỗi khi chuẩn bị nhập Google Calendar');
    }
});

startOverBtn.addEventListener('click', function () {
    // Reset everything
    //accessToken = '';
    scheduleData = null;
    calendarEvents = [];
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('googleCalendarInstructions').style.display = 'none';
    hideError();
    showStep(step1);
});
document.getElementById('hideInstructionsBtn').addEventListener('click', function () {
    document.getElementById('googleCalendarInstructions').style.display = 'none';
});