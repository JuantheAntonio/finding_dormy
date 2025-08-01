// server.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from public directory

// Session configuration
app.use(session({
    secret: 'dormy-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 30 * 60 * 1000 // 30 minutes
    }
}));

// In-memory user database (in production, use a real database)
const users = {
    'admin': {
        password: 'password123',
        role: 'administrator',
        name: 'Admin User'
    },
    'user1': {
        password: 'mypass456',
        role: 'user',
        name: 'Regular User'
    },
    'dormy': {
        password: 'findme789',
        role: 'student',
        name: 'Dormy Student'
    },
    'student': {
        password: 'college123',
        role: 'student',
        name: 'College Student'
    }
};

// Routes
// This should come BEFORE the static middleware
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'preview.html'));
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Static middleware should come after specific routes
app.use(express.static('public'));

// Handle login POST request
app.post('/login', (req, res) => {
    const { username, password, remember } = req.body;
    
    // Validate input
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }
    
    // Check credentials
    const user = users[username.trim()];
    if (!user || user.password !== password) {
        return res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    }
    
    // Create session
    req.session.user = {
        username: username,
        name: user.name,
        role: user.role
    };
    
    // Extend session if "Remember Me" is checked
    if (remember) {
        req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }
    
    res.json({
        success: true,
        message: 'Login successful',
        user: {
            username: user.name,
            role: user.role
        }
    });
});

// Dashboard route (protected)
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard - Finding Dormy</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
                * {
                    margin: 0;
                    padding: 0;
                    font-family: 'Poppins', sans-serif;
                }
                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .dashboard {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(15px);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 20px;
                    padding: 40px;
                    text-align: center;
                    color: white;
                    max-width: 500px;
                }
                h1 { margin-bottom: 20px; }
                .user-info {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .logout-btn {
                    background: #ff4757;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                    margin-top: 20px;
                    transition: background 0.3s;
                }
                .logout-btn:hover {
                    background: #ff3742;
                }
            </style>
        </head>
        <body>
            <div class="dashboard">
                <h1>Welcome to Finding Dormy!</h1>
                <div class="user-info">
                    <h3>User Information</h3>
                    <p><strong>Name:</strong> ${req.session.user.name}</p>
                    <p><strong>Username:</strong> ${req.session.user.username}</p>
                    <p><strong>Role:</strong> ${req.session.user.role}</p>
                </div>
                <p>You have successfully logged in to the system.</p>
                <button class="logout-btn" onclick="logout()">Logout</button>
            </div>
            
            <script>
                function logout() {
                    fetch('/logout', { method: 'POST' })
                        .then(() => {
                            window.location.href = '/';
                        });
                }
            </script>
        </body>
        </html>
    `);
});

// Handle logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// API endpoint to check session status
app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({
            authenticated: false
        });
    }
});

// Handle 404
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p><a href="/">Go back to login</a></p>
    `);
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🚀 Finding Dormy Server is running!
    
    📍 Server: http://localhost:${PORT}
    🔐 Login Page: http://localhost:${PORT}/
    📊 Dashboard: http://localhost:${PORT}/dashboard
    
    Demo Accounts:
    ─────────────────────────────────
    👤 admin     | password123
    👤 user1     | mypass456  
    👤 dormy     | findme789  
    👤 student   | college123
    ─────────────────────────────────
    
    📝 Remember to create a 'public' folder and put your HTML file there!
    `);
});