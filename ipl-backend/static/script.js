document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------
    // STATE & CONSTANTS
    // ------------------------------------------------
    let currentUser = null;
    let dreamTeam = [];
    const container = document.getElementById('page-container');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const introOverlay = document.getElementById('intro-overlay');

    // ------------------------------------------------
    // UTILITIES
    // ------------------------------------------------
    const formatNumber = n => new Intl.NumberFormat().format(n || 0);
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const animateIn = (el) => {
        if (!window.motion || !el) return;
        motion.animate(el, { opacity: [0, 1], y: [20, 0] }, { duration: 0.6, easing: "ease-out" });
    };

    const updateIcons = () => {
        if (window.lucide) lucide.createIcons();
    };

    // ------------------------------------------------
    // NAVIGATION
    // ------------------------------------------------
    window.handleLogoClick = function() {
        if (currentUser) navigate('dashboard');
        else navigate('landing');
    };

    window.closeModal = function(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    };

    window.navigate = function(page) {
        if (introOverlay) introOverlay.classList.add('hidden');
        
        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.toggle('active', li.dataset.page === page);
        });

        // Auto-close any modals on page change
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));

        container.innerHTML = "";
        
        if (page === 'landing') renderLanding();
        else if (page === 'auth') renderAuth();
        else if (page === 'dashboard') renderDashboard();
        else if (page === 'batting') renderScouting('batting');
        else if (page === 'bowling') renderScouting('bowling');
        else if (page === 'all_rounder') renderScouting('all_rounder');
        else if (page === 'matrix') renderMatrix();
        else if (page === 'dream_team') renderDreamTeam();
        else if (page === 'auction') renderAuction();
        else if (page === 'contact') renderContact();
        else if (page === 'admin_users') renderUserManagement();

        updateIcons();
    };

    // ------------------------------------------------
    // AUTHENTICATION
    // ------------------------------------------------
    function updateHeaderAuth() {
        const headerAuth = document.getElementById('auth-mockup');
        if (!headerAuth) return;
        if (currentUser) {
            headerAuth.innerHTML = `
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="text-align: right;">
                        <div style="font-size: 14px; font-weight: 600;">${currentUser.username}</div>
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">${currentUser.role}</div>
                    </div>
                    <button class="btn-ghost" style="padding: 8px 16px; font-size: 12px; color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2);" onclick="logout()">
                        <i data-lucide="log-out" style="width: 14px; height: 14px;"></i> Logout
                    </button>
                </div>
            `;
        } else {
            headerAuth.innerHTML = `
                <button class="btn-ghost" onclick="navigate('auth')">Sign In</button>
                <button class="btn-primary" onclick="navigate('auth')">Sign Up</button>
            `;
        }
        updateIcons();
    }

    window.logout = function() {
        currentUser = null;
        localStorage.removeItem('ipl_user');
        updateHeaderAuth();
        navigate('landing');
    };

    // ------------------------------------------------
    // RENDERERS
    // ------------------------------------------------
    function renderLanding() {
        const layout = document.querySelector('.layout');
        if (layout) layout.classList.add('hidden');
        

        const landing = document.createElement('div');
        landing.id = 'dynamic-intro';
        landing.className = 'intro-overlay';
        landing.innerHTML = `
            <div style="text-align: center; max-width: 800px; padding: 20px;">
                <h1 style="font-size: 80px; font-weight: 800; line-height: 0.9; margin-bottom: 24px; font-family: 'Outfit';">IPL SOLVER<span class="text-accent">.</span></h1>
                <p class="text-muted" style="font-size: 20px; margin-bottom: 48px; font-weight: 400;">The next generation of cricket decision analytics. Data meets intuition.</p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button class="btn-primary" style="padding: 16px 40px; font-size: 16px; border-radius: 12px;" onclick="navigate('auth')">Enter Platform</button>
                    <button class="btn-ghost" style="padding: 16px 40px; font-size: 16px; border-radius: 12px;" onclick="window.open('https://github.com', '_blank')">Documentation</button>
                </div>
            </div>
        `;
        document.body.appendChild(landing);
        animateIn(landing.querySelector('div'));
    }

    window.renderAuth = function(mode = 'login') {
        const intros = document.querySelectorAll('.intro-overlay');
        intros.forEach(i => i.remove());
        
        let auth = document.querySelector('.auth-page');
        if (!auth) {
            auth = document.createElement('div');
            auth.className = 'auth-page';
            document.body.appendChild(auth);
        }

        auth.innerHTML = `
            <div class="auth-container" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 24px; padding: 40px; width: 100%; max-width: 440px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); text-align: left;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <i data-lucide="bar-chart-3" class="text-accent" style="width: 40px; height: 40px; margin-bottom: 16px;"></i>
                    <h2 style="font-size: 28px; font-weight: 700; font-family: 'Outfit';">IPL Solver <span class="text-accent">Access</span></h2>
                </div>

                <div style="display: flex; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 12px; margin-bottom: 32px; border: 1px solid var(--border);">
                    <button id="tab-login" class="btn-ghost" style="flex: 1; border: none; padding: 10px; border-radius: 8px; ${mode === 'login' ? 'background: var(--accent); color: var(--bg-deep);' : 'color: var(--text-muted);'}" onclick="renderAuth('login')">Sign In</button>
                    <button id="tab-signup" class="btn-ghost" style="flex: 1; border: none; padding: 10px; border-radius: 8px; ${mode === 'signup' ? 'background: var(--accent); color: var(--bg-deep);' : 'color: var(--text-muted);'}" onclick="renderAuth('signup')">Sign Up</button>
                </div>

                <div id="auth-form" class="auth-form">
                    ${mode === 'login' ? renderLoginForm() : renderSignupForm()}
                </div>
            </div>
        `;
        animateIn(auth.querySelector('.auth-container'));
        updateIcons();
    };

    window.renderLoginForm = function() {
        return `
            <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                <label style="flex: 1; cursor: pointer;">
                    <input type="radio" name="auth-role" value="user" checked style="display:none;" onchange="updateAuthUI()">
                    <div class="role-card active" id="role-user">User</div>
                </label>
                <label style="flex: 1; cursor: pointer;">
                    <input type="radio" name="auth-role" value="admin" style="display:none;" onchange="updateAuthUI()">
                    <div class="role-card" id="role-admin">Admin</div>
                </label>
            </div>
            <div class="form-group">
                <label>Identity</label>
                <input type="text" id="auth-user" placeholder="Username">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="auth-pass" placeholder="••••••••">
            </div>
            <div class="form-group hidden" id="login-passkey-group">
                <label>Admin Passkey</label>
                <input type="password" id="auth-secret" placeholder="Invite key">
            </div>
            <button class="btn-primary" style="width: 100%; padding: 14px; margin-top: 12px; border-radius: 10px;" onclick="handleLogin()">Sign In to Dashboard</button>
            <style>
                .role-card { padding: 12px; text-align: center; border-radius: 10px; border: 1px solid var(--border); color: var(--text-muted); font-size: 14px; font-weight: 600; transition: all 0.2s; }
                .role-card.active { border-color: var(--accent); color: var(--accent); background: rgba(6, 182, 212, 0.05); }
            </style>
        `;
    }

    window.renderSignupForm = function() {
        return `
            <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                <label style="flex: 1; cursor: pointer;">
                    <input type="radio" name="auth-role-signup" value="user" checked style="display:none;" onchange="updateAuthUI()">
                    <div class="role-card active" id="role-user-signup">User</div>
                </label>
                <label style="flex: 1; cursor: pointer;">
                    <input type="radio" name="auth-role-signup" value="admin" style="display:none;" onchange="updateAuthUI()">
                    <div class="role-card" id="role-admin-signup">Admin</div>
                </label>
            </div>
            <div class="form-group">
                <label>Username</label>
                <input type="text" id="signup-user" placeholder="Choose username">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="signup-email" placeholder="email@example.com">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="signup-pass" placeholder="••••••••">
            </div>
            <div class="form-group hidden" id="signup-admin-key-group">
                <label>Admin Invite Key</label>
                <input type="password" id="signup-admin-key" placeholder="Invite key">
            </div>
            <button class="btn-primary" style="width: 100%; padding: 14px; margin-top: 12px; border-radius: 10px;" onclick="handleSignup()">Create Account</button>
        `;
    }

    window.updateAuthUI = function() {
        const roleLogin = document.querySelector('input[name="auth-role"]:checked');
        const roleSignup = document.querySelector('input[name="auth-role-signup"]:checked');
        
        if (roleLogin) {
            document.querySelectorAll('[id^="role-"]').forEach(el => el.classList.remove('active'));
            document.getElementById(`role-${roleLogin.value}`).classList.add('active');
            document.getElementById('login-passkey-group').classList.toggle('hidden', roleLogin.value !== 'admin');
        }
        
        if (roleSignup) {
            document.querySelectorAll('[id^="role-"]').forEach(el => el.classList.remove('active'));
            document.getElementById(`role-${roleSignup.value}-signup`).classList.add('active');
            document.getElementById('signup-admin-key-group').classList.toggle('hidden', roleSignup.value !== 'admin');
        }
    };

    window.handleLogin = async function() {
        const username = document.getElementById('auth-user').value;
        const password = document.getElementById('auth-pass').value;
        const role = document.querySelector('input[name="auth-role"]:checked').value;
        const admin_key = role === 'admin' ? document.getElementById('auth-secret').value : null;

        if (!username || !password) { alert("Please enter credentials."); return; }
        if (role === 'admin' && !admin_key) { alert("Admin passkey required."); return; }
        
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password, role, admin_key })
            });
            const data = await res.json();
            
            if (res.ok) {
                currentUser = data.user;
                localStorage.setItem('ipl_user', JSON.stringify(currentUser));
                updateHeaderAuth();
                const authPage = document.querySelector('.auth-page');
                if (authPage) authPage.remove();
                
                const layout = document.querySelector('.layout');
                if (layout) layout.classList.remove('hidden');

                navigate('dashboard');
            } else {
                alert(data.error || "Access Denied");
            }
        } catch(e) { console.error(e); alert("System Connectivity Error"); }
    };

    window.handleSignup = async function() {
        const username = document.getElementById('signup-user').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-pass').value;
        const role = document.querySelector('input[name="auth-role-signup"]:checked').value;
        const admin_key = document.getElementById('signup-admin-key').value;
        
        if (!username || !email || !password) { alert("Please fill all fields."); return; }
        if (role === 'admin' && !admin_key) { alert("Admin invite key required."); return; }
        
        try {
            const res = await fetch('/api/signup', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, email, password, role, admin_key })
            });
            const data = await res.json();
            
            if (res.ok) {
                alert("Account created! Please sign in.");
                renderAuth('login');
            } else {
                alert(data.error || "Signup failed");
            }
        } catch(e) { console.error(e); alert("System Connectivity Error"); }
    };

    async function renderDashboard() {
        if (!currentUser) { navigate('auth'); return; }
        
        pageTitle.textContent = `${getGreeting()}, ${currentUser.username}`;
        pageSubtitle.textContent = currentUser.role === 'admin' ? "Platform control center and aggregate data intelligence." : "Your personalized IPL insights and squad analytics.";
        
        if (currentUser.role === 'admin') {
            await renderAdminDashboard();
        } else {
            renderUserDashboard();
        }
    }

    async function renderAdminDashboard() {
        container.innerHTML = `
            <div class="dash-grid">
                <div class="glass-card">
                    <div class="stat-label">Platform Users</div>
                    <div class="stat-value" id="stat-users">...</div>
                </div>
                <div class="glass-card">
                    <div class="stat-label">Unique Players</div>
                    <div class="stat-value" id="stat-players">...</div>
                </div>
                <div class="glass-card">
                    <div class="stat-label">Total Records</div>
                    <div class="stat-value" id="stat-records">...</div>
                </div>
                <div class="glass-card">
                    <div class="stat-label">Active Inquiries</div>
                    <div class="stat-value" id="stat-msgs">...</div>
                </div>
            </div>

            <div class="grid-2" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; margin-top: 40px;">
                <div class="glass-card">
                    <h3 style="margin-bottom: 24px; font-size: 18px;">Trending Players</h3>
                    <div style="height: 300px; position: relative;">
                        <canvas id="trending-chart"></canvas>
                    </div>
                </div>
                <div class="glass-card">
                    <h3 style="margin-bottom: 24px; font-size: 18px;">Administrative Tools</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="btn-ghost" style="width: 100%; text-align: left; display: flex; align-items: center; gap: 12px;" onclick="navigate('admin_users')">
                            <i data-lucide="users" style="width: 18px;"></i> User Management Registry
                        </button>
                        <button class="btn-ghost" style="width: 100%; text-align: left; display: flex; align-items: center; gap: 12px;" onclick="window.fetchAdminLogs()">
                            <i data-lucide="scroll" style="width: 18px;"></i> System Transaction Logs
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        animateIn(container);
        updateIcons();

        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            if (res.ok) {
                document.getElementById('stat-users').textContent = formatNumber(data.total_users);
                document.getElementById('stat-players').textContent = formatNumber(data.unique_players);
                document.getElementById('stat-records').textContent = formatNumber(data.total_records);
                document.getElementById('stat-msgs').textContent = formatNumber(data.total_messages);
            }

            const trendingRes = await fetch('/api/admin/trending');
            const trending = await trendingRes.json();
            if (trending && trending.length > 0) {
                const ctx = document.getElementById('trending-chart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: trending.map(t => t.player),
                        datasets: [{
                            label: 'Searches',
                            data: trending.map(t => t.views),
                            backgroundColor: '#06b6d4',
                            borderRadius: 6
                        }]
                    },
                    options: {
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
                            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
                        }
                    }
                });
            }
        } catch(e) { console.error(e); }
    }

    window.fetchAdminLogs = async function() {
        pageTitle.textContent = "System Transaction Logs";
        container.innerHTML = `<div class="glass-card"><div id="log-wrapper" class="table-container">Retrieving system logs...</div></div>`;
        try {
            const res = await fetch('/api/admin/logs');
            const logs = await res.json();
            if (logs.length === 0) {
                document.getElementById('log-wrapper').innerHTML = `<div style="padding:40px; text-align:center;">No recent transactions detected.</div>`;
                return;
            }
            let html = `<table><thead><tr><th>Identity</th><th>Email</th><th>Activity</th><th>Timestamp</th></tr></thead><tbody>`;
            logs.forEach(l => {
            const dateOnly = l.created_at ? l.created_at.split('T')[0] : 'N/A';
                html += `<tr><td>${l.name}</td><td>${l.email}</td><td>${l.message}</td><td>${dateOnly}</td></tr>`;
            });
            html += `</tbody></table>`;
            document.getElementById('log-wrapper').innerHTML = html;
        } catch(e) { console.error(e); }
    };


    async function renderUserDashboard() {
        container.innerHTML = `
            <div class="dash-grid" id="stats-summary">
                <div class="glass-card" style="display: flex; align-items: center; gap: 20px;">
                    <div style="background: rgba(6, 182, 212, 0.1); padding: 12px; border-radius: 12px;">
                        <i data-lucide="layers" style="color: var(--accent); width: 24px; height: 24px;"></i>
                    </div>
                    <div>
                        <div class="stat-label">Saved Squads</div>
                        <div class="stat-value" id="user-stat-squads">...</div>
                    </div>
                </div>
                <div class="glass-card" style="display: flex; align-items: center; gap: 20px;">
                    <div style="background: rgba(139, 92, 246, 0.1); padding: 12px; border-radius: 12px;">
                        <i data-lucide="zap" style="color: #8b5cf6; width: 24px; height: 24px;"></i>
                    </div>
                    <div>
                        <div class="stat-label">Analytics Explored</div>
                        <div class="stat-value" id="user-stat-analytics">...</div>
                    </div>
                </div>
            </div>

            <h3 style="margin-top: 40px; margin-bottom: 24px; font-size: 18px;">Quick Selection</h3>
            <div class="dash-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="glass-card hover-card" onclick="navigate('batting')" style="cursor:pointer; text-align: center; padding: 32px;">
                    <i data-lucide="target" style="width: 32px; height: 32px; color: var(--accent); margin-bottom: 16px;"></i>
                    <div style="font-weight: 600;">Batting Scouting</div>
                </div>
                <div class="glass-card hover-card" onclick="navigate('bowling')" style="cursor:pointer; text-align: center; padding: 32px;">
                    <i data-lucide="wind" style="width: 32px; height: 32px; color: #10b981; margin-bottom: 16px;"></i>
                    <div style="font-weight: 600;">Bowling Scouting</div>
                </div>
                <div class="glass-card hover-card" onclick="navigate('matrix')" style="cursor:pointer; text-align: center; padding: 32px;">
                    <i data-lucide="grid" style="width: 32px; height: 32px; color: #f59e0b; margin-bottom: 16px;"></i>
                    <div style="font-weight: 600;">Intelligence Matrix</div>
                </div>
                <div class="glass-card hover-card" onclick="navigate('dream_team')" style="cursor:pointer; text-align: center; padding: 32px;">
                    <i data-lucide="users" style="width: 32px; height: 32px; color: #8b5cf6; margin-bottom: 16px;"></i>
                    <div style="font-weight: 600;">Draft Registry</div>
                </div>
            </div>

            <div id="dynamic-trending-section" style="margin-top: 40px;">
                <div class="glass-card">
                    <h3 style="margin-bottom: 24px; font-size: 18px;">Global Trending Players</h3>
                    <div id="trending-hero-content" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                        <div class="loader-ripple" style="width: 40px; height: 40px;"><div></div><div></div></div>
                        <p class="text-muted">Loading platform telemetry...</p>
                    </div>
                </div>
            </div>

            </style>
        `;
        animateIn(container);
        updateIcons();
        fetchGlobalTrending();
        fetchUserDashboardStats();
    }

    async function fetchUserDashboardStats() {
        if (!currentUser) return;
        try {
            const res = await fetch(`/api/user/stats?user_id=${currentUser.id}`);
            const data = await res.json();
            if (res.ok) {
                document.getElementById('user-stat-squads').textContent = data.saved_squads || 0;
                document.getElementById('user-stat-analytics').textContent = data.analytics_explored || 0;
            }
        } catch (e) { console.error("Failed to fetch user stats", e); }
    }

    async function fetchGlobalTrending() {
        const trendingContainer = document.getElementById('trending-hero-content');
        if (!trendingContainer) return;

        try {
            const res = await fetch('/api/admin/trending');
            const data = await res.json();
            if (data && data.length > 0) {
                const topPlayers = data.slice(0, 3);
                trendingContainer.innerHTML = topPlayers.map((top, index) => {
                    const initials = top.player.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                    const rankLabel = index === 0 ? "Top Target" : index === 1 ? "Strong Interest" : "Rising Popularity";
                    
                    return `
                        <div style="display: flex; align-items: center; gap: 20px; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--border);">
                            <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: var(--accent); border: 1px solid var(--accent); flex-shrink: 0;">${initials}</div>
                            <div>
                                <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); cursor: pointer;" onclick="showPlayerProfile('${top.player}')">${top.player}</div>
                                <div class="text-muted" style="font-size: 11px; margin-bottom: 4px;">Scouted ${top.views} times</div>
                                <span class="text-accent" style="font-size: 10px; font-weight: 700; text-transform: uppercase; background: rgba(6,182,212,0.1); padding: 2px 8px; border-radius: 20px;">${rankLabel}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                trendingContainer.innerHTML = `<p class="text-muted">Insufficient telemetry for trending status.</p>`;
            }
        } catch (e) {
            console.error("Trending fetch failure:", e);
        }
    }

    // ------------------------------------------------
    // USER MANAGEMENT
    // ------------------------------------------------
    async function renderUserManagement() {
        pageTitle.textContent = "Registry Management";
        pageSubtitle.textContent = "Monitor and manage system users and roles.";
        
        container.innerHTML = `<div class="glass-card">
            <div id="user-table-wrapper" class="table-container">
                <div style="padding: 40px; text-align: center;">Retrieving user registry...</div>
            </div>
        </div>`;
        
        try {
            const res = await fetch('/api/admin/users');
            const users = await res.json();
            
            let html = `<table>
                <thead>
                    <tr>
                        <th style="width: 35%;">Identity</th>
                        <th style="width: 15%;">Role</th>
                        <th style="width: 15%;">Status</th>
                        <th style="width: 35%;">Management</th>
                    </tr>
                </thead>
                <tbody>
            `;
            
            users.forEach(u => {
                html += `
                    <tr style="vertical-align: middle;">
                        <td>
                            <div style="font-weight: 600;">${u.username}</div>
                            <div class="text-muted" style="font-size: 11px;">${u.email}</div>
                        </td>
                        <td><span class="text-accent" style="text-transform: uppercase; font-size: 11px; font-weight: 700; letter-spacing: 0.1em;">${u.role}</span></td>
                        <td>${u.is_suspended ? '<span style="color:var(--danger)">Suspended</span>' : '<span style="color:var(--success)">Active</span>'}</td>
                        <td>
                            <div style="display:flex; gap: 8px; align-items: center;">
                                <button class="btn-ghost" style="padding: 6px 16px; font-size: 11px; width: 100px;" onclick="toggleSuspension(${u.id}, ${u.is_suspended})">
                                    ${u.is_suspended ? 'Reactivate' : 'Suspend'}
                                </button>
                                <button class="btn-ghost" style="padding: 6px 16px; font-size: 11px; width: 120px;" onclick="resetPass(${u.id})">Reset Password</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
            document.getElementById('user-table-wrapper').innerHTML = html;
        } catch(e) { console.error(e); }
    }

    window.toggleSuspension = async function(id, current) {
        if (!confirm(`Confirm change of status for this identity?`)) return;
        try {
            const res = await fetch('/api/admin/user/status', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({user_id: id, is_suspended: !current})
            });
            if (res.ok) renderUserManagement();
        } catch(e) { console.error(e); }
    };

    window.resetPass = async function(id) {
        const np = prompt("Enter new temporary password:");
        if(!np) return;
        try {
            const res = await fetch('/api/admin/user/reset_password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({user_id: id, new_password: np})
            });
            if (res.ok) alert("Password reset successful.");
        } catch(e) { console.error(e); }
    };

    // ------------------------------------------------
    // SCOUTING VIEWS
    // ------------------------------------------------
    async function renderScouting(type) {
        pageTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ') + " Scouting";
        pageSubtitle.textContent = `High-fidelity performance metrics for ${type} analysis.`;
        
        container.innerHTML = `
            <div class="glass-card" style="margin-bottom: 24px; padding: 24px;">
                <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end;">
                    <div class="form-group" style="margin: 0; flex: 1; min-width: 200px;">
                        <label style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; display: block;">SEARCH BY NAME</label>
                        <input type="text" id="scout-search" placeholder="Type identity..." style="height: 44px;" onkeyup="applyScoutingFilters()">
                    </div>
                    ${type === 'batting' || type === 'all_rounder' ? `
                    <div style="min-width: 120px;">
                        <label id="label-runs" style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; display: block;">MIN RUNS: 0</label>
                        <input type="range" id="filter-runs" min="0" max="2500" value="0" style="width: 100%;" oninput="applyScoutingFilters()">
                    </div>` : ''}
                    
                    ${type === 'batting' ? `
                    <div style="min-width: 120px;">
                        <label id="label-sr" style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; display: block;">MIN SR: 0</label>
                        <input type="range" id="filter-sr" min="0" max="250" value="0" style="width: 100%;" oninput="applyScoutingFilters()">
                    </div>
                    <div style="min-width: 120px;">
                        <label id="label-avg" style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; display: block;">MIN AVG: 0</label>
                        <input type="range" id="filter-avg" min="0" max="100" value="0" style="width: 100%;" oninput="applyScoutingFilters()">
                    </div>` : ''}

                    ${type === 'bowling' || type === 'all_rounder' ? `
                    <div style="min-width: 120px;">
                        <label id="label-wickets" style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; display: block;">MIN WICKETS: 0</label>
                        <input type="range" id="filter-wickets" min="0" max="150" value="0" style="width: 100%;" oninput="applyScoutingFilters()">
                    </div>` : ''}

                    ${type === 'bowling' ? `
                    <div style="min-width: 120px;">
                        <label id="label-econ" style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; display: block;">MAX ECON: 15</label>
                        <input type="range" id="filter-econ" min="0" max="15" step="0.5" value="15" style="width: 100%;" oninput="applyScoutingFilters()">
                    </div>
                    <div style="min-width: 120px;">
                        <label id="label-bowl-sr" style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; display: block;">MAX SR: 50</label>
                        <input type="range" id="filter-bowl-sr" min="0" max="50" value="50" style="width: 100%;" oninput="applyScoutingFilters()">
                    </div>` : ''}
                  </div>
                </div>
            </div>
            <div id="scouting-table-container">
                <div class="glass-card" style="min-height: 400px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                    <div class="loader-ripple"><div></div><div></div></div>
                    <p class="text-muted" style="margin-top: 24px; font-weight: 500;">SYNCHRONIZING ENGINE...</p>
                </div>
            </div>
        `;
        updateIcons();
        
        try {
            const res = await fetch(`/api/${type}`);
            const data = await res.json();
            currentScoutingData = data;
            currentScoutingType = type;
            applyScoutingFilters();
        } catch(e) { console.error(e); document.getElementById('scouting-table-container').innerHTML = '<div class="glass-card">Engine sync failed.</div>'; }
    }

    window.applyScoutingFilters = function() {
        const query = document.getElementById('scout-search').value.toLowerCase();
        const minRuns = parseInt(document.getElementById('filter-runs')?.value || 0);
        const minSR = parseInt(document.getElementById('filter-sr')?.value || 0);
        const minAvg = parseInt(document.getElementById('filter-avg')?.value || 0);
        const minWickets = parseInt(document.getElementById('filter-wickets')?.value || 0);
        const maxEcon = parseFloat(document.getElementById('filter-econ')?.value || 15);
        const maxSR = parseInt(document.getElementById('filter-bowl-sr')?.value || 999);

        if (document.getElementById('label-runs')) document.getElementById('label-runs').textContent = `MIN RUNS: ${minRuns}`;
        if (document.getElementById('label-sr')) document.getElementById('label-sr').textContent = `MIN SR: ${minSR}`;
        if (document.getElementById('label-avg')) document.getElementById('label-avg').textContent = `MIN AVG: ${minAvg}`;
        if (document.getElementById('label-wickets')) document.getElementById('label-wickets').textContent = `MIN WICKETS: ${minWickets}`;
        if (document.getElementById('label-econ')) document.getElementById('label-econ').textContent = `MAX ECON: ${maxEcon}`;
        if (document.getElementById('label-bowl-sr')) document.getElementById('label-bowl-sr').textContent = `MAX SR: ${maxSR}`;

        const filtered = currentScoutingData.filter(p => {
            const name = (p.player || p.bowler || "").toLowerCase();
            const matchesSearch = name.includes(query);
            const matchesRuns = (p.runs || 0) >= minRuns;
            const matchesSR = (p.strike_rate || 0) >= minSR;
            const matchesWickets = (p.wickets || 0) >= minWickets;
            const matchesEcon = (p.economy || 0) <= maxEcon;
            
            if (currentScoutingType === 'batting') return matchesSearch && matchesRuns && matchesSR && (p.avg >= minAvg);
            if (currentScoutingType === 'bowling') return matchesSearch && matchesWickets && matchesEcon && (p.strike_rate <= maxSR);
            return matchesSearch && matchesRuns && matchesWickets; // allrounder
        });

        renderScoutingTable(filtered, currentScoutingType);
    };

    function renderScoutingTable(players, type) {
        let html = `
            <div class="glass-card">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Player Profile</th>
                                ${type === 'batting' ? '<th>Matches</th><th>Runs</th><th>SR</th><th>Avg</th><th>Bnd %</th>' : ''}
                                ${type === 'bowling' ? '<th>Matches</th><th>Wickets</th><th>Economy</th><th>SR</th>' : ''}
                                ${type === 'all_rounder' ? '<th>Matches</th><th>Runs</th><th>Wickets</th><th>Avg</th><th>Economy</th>' : ''}
                                <th>Registry</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        if (players.length === 0) {
            html += `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted);">No records match these criteria.</td></tr>`;
        } else {
            players.forEach(p => {
                const name = p.player || p.bowler;
                html += `
                    <tr>
                        <td style="font-weight: 600;">
                            <span class="player-link" onclick="showPlayerProfile('${name}')">${name}</span>
                        </td>
                        ${type === 'batting' ? `<td>${p.matches || 0}</td><td>${p.runs}</td><td>${(p.strike_rate || 0).toFixed(1)}</td><td>${(p.avg || 0).toFixed(1)}</td><td>${(p.boundary_pct || 0).toFixed(1)}%</td>` : ''}
                        ${type === 'bowling' ? `<td>${p.matches || 0}</td><td>${p.wickets}</td><td>${(p.economy || 0).toFixed(2)}</td><td>${(p.strike_rate || 0).toFixed(2)}</td>` : ''}
                        ${type === 'all_rounder' ? `<td>${p.matches || 0}</td><td>${p.runs || 0}</td><td>${p.wickets || 0}</td><td>${(p.avg || 0).toFixed(1)}</td><td>${(p.economy || 0).toFixed(2)}</td>` : ''}
                        <td>
                            <button class="btn-ghost" style="padding: 6px 16px; font-size: 11px; display: flex; align-items: center; gap: 8px;" onclick="addToDreamTeam('${name}', '${type}')">
                                <i data-lucide="plus" style="width: 14px;"></i> Build Squad
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        
        html += `</tbody></table></div></div>`;
        document.getElementById('scouting-table-container').innerHTML = html;
        updateIcons();
    }

    window.showPlayerProfile = async function(name) {
        const modal = document.getElementById('player-modal');
        const body = document.getElementById('modal-body');
        modal.classList.add('active');
        body.innerHTML = '<div style="padding: 100px; text-align: center;"><div class="loader-ripple"><div></div><div></div></div></div>';
        
        try {
            const url = currentUser ? `/player/${name}?user_id=${currentUser.id}` : `/player/${name}`;
            const res = await fetch(url);
            const data = await res.json();
            
            const currentPage = document.querySelector('.nav-links li.active')?.dataset.page;
            const hideBatting = currentPage === 'bowling';
            
            let battingRows = "";
            let totalRuns = 0;
            if (data.batting) {
                data.batting.forEach(s => {
                    totalRuns += s.runs;
                    battingRows += `<tr><td>${s.season}</td><td>${s.runs}</td><td>${s.balls}</td><td>${(s.strike_rate || 0).toFixed(1)}</td></tr>`;
                });
            }

            let bowlingRows = "";
            let totalWickets = 0;
            if (data.bowling) {
                data.bowling.forEach(s => {
                    totalWickets += s.wickets;
                    bowlingRows += `<tr><td>${s.season}</td><td>${s.wickets}</td><td>${(s.economy || 0).toFixed(1)}</td></tr>`;
                });
            }

            body.innerHTML = `
                <div style="padding: 32px;">
                    <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                        <div>
                            <h2 style="font-size: 32px; font-family: 'Outfit'; font-weight: 800;">${name}</h2>
                            <p class="text-muted">Player Performance History</p>
                        </div>
                    </div>

                    ${(!hideBatting && data.batting.length > 0) ? `
                        <h4 style="margin-bottom: 12px; color: var(--accent);">Batting Stats</h4>
                        <div class="table-container" style="margin-bottom: 24px;">
                            <table>
                                <thead><tr><th>Season</th><th>Runs</th><th>Balls</th><th>SR</th></tr></thead>
                                <tbody>${battingRows}</tbody>
                            </table>
                        </div>
                    ` : ''}

                    ${data.bowling.length > 0 ? `
                        <h4 style="margin-bottom: 12px; color: var(--accent);">Bowling Stats</h4>
                        <div class="table-container">
                            <table>
                                <thead><tr><th>Season</th><th>Wickets</th><th>Economy</th></tr></thead>
                                <tbody>${bowlingRows}</tbody>
                            </table>
                        </div>
                    ` : ''}
                    
                    ${data.batting.length === 0 && data.bowling.length === 0 ? '<p class="text-muted">No historical dataset available for this player.</p>' : ''}
                </div>
            `;
        } catch(e) {
            body.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--danger);">Failed to retrieve player datasets.</div>';
        }
    };

    // ------------------------------------------------
    // DREAM TEAM V2
    // ------------------------------------------------
    window.addToDreamTeam = function(name, type) {
        if (dreamTeam.find(p => p.name === name)) { alert("Player already in registry."); return; }
        if (dreamTeam.length >= 11) { alert("Maximum squad limit reached (11)."); return; }
        dreamTeam.push({ name, type });
        alert(`${name} added to squad.`);
    };

    function renderDreamTeam() {
        pageTitle.textContent = "Smart Squad Logic";
        pageSubtitle.textContent = "AI-assisted squad optimization and management.";
        
        let listHtml = "";
        if (dreamTeam.length === 0) {
            listHtml = '<div style="padding:80px; text-align:center;"><i data-lucide="info" style="width:40px; height:40px; margin-bottom:16px; opacity:0.2;"></i><p class="text-muted">Registry is empty. Use scouting views to identify high-impact players.</p></div>';
        } else {
            listHtml = `<table><thead><tr><th>Identity</th><th>Metric Profile</th><th>Management</th></tr></thead><tbody>`;
            dreamTeam.forEach((p, idx) => {
                listHtml += `<tr>
                    <td style="font-weight:600;">${p.name}</td>
                    <td><span class="text-accent" style="font-size: 11px; font-weight:700; text-transform:uppercase;">${p.type}</span></td>
                    <td><button class="btn-ghost" style="color:var(--danger); border:none;" onclick="removeFromTeam(${idx})">Dismiss</button></td>
                </tr>`;
            });
            listHtml += "</tbody></table>";
        }

        container.innerHTML = `
            <div class="glass-card" style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 24px;">
                    <div>
                        <h3 style="margin: 0; font-size: 18px;">Draft Capacity: ${dreamTeam.length}/11</h3>
                        <p class="text-muted" style="font-size: 12px; margin-top: 4px;">Standard tournament roster limits apply.</p>
                    </div>

                    <button class="btn-ghost" style="display: flex; align-items: center; gap: 8px;" onclick="saveTeam()">
                        <i data-lucide="save" style="width: 16px;"></i> Save your dream squad
                    </button>
                </div>
            </div>
            <div class="glass-card">
                <div id="dream-team-list" class="table-container">${listHtml}</div>
            </div>
        `;
        updateIcons();
        animateIn(container);
    }

    window.removeFromTeam = function(idx) {
        dreamTeam.splice(idx, 1);
        renderDreamTeam();
    };


    window.saveTeam = async function() {
        if (!currentUser) return;
        try {
            const res = await fetch('/api/team/save', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({user_id: currentUser.id, dream_team: JSON.stringify(dreamTeam)})
            });
            if (res.ok) alert("Data secured successfully.");
            // Refresh stats if on dashboard
            if (document.getElementById('user-stat-squads')) fetchUserDashboardStats();
        } catch(e) { console.error(e); }
    };

    window.autoGenerateTeam = async function() {
        try {
            const btn = document.querySelector('button[onclick="autoGenerateTeam()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" style="width:16px;"></i> Analyzing Patterns...`;
            updateIcons();
            
            const res = await fetch('/api/team_of_tournament');
            const data = await res.json();
            
            dreamTeam = [];
            if(data) {
                const batters = data.batters || [];
                const bowlers = data.bowlers || [];
                const players = Array.isArray(data) ? data : [...batters, ...bowlers];
                
                players.slice(0, 11).forEach(p => {
                    const name = p.player;
                    if (name) dreamTeam.push({ name, type: 'Algorithmic Optimization' });
                });
            }
            
            renderDreamTeam();
            btn.innerHTML = originalText;
            updateIcons();
            alert("✨ Optimal 11-player squad generated using tournament datasets.");
        } catch(e) { 
            console.error(e); 
            alert("Algorithm execution failed."); 
            const btn = document.querySelector('button[onclick="autoGenerateTeam()"]');
            if (btn) {
                btn.innerHTML = `<i data-lucide="cpu" style="width: 16px;"></i> Generate your dream 11`;
                updateIcons();
            }
        }
    };

    async function renderMatrix() {
        pageTitle.textContent = "Intelligence Matrix";
        pageSubtitle.textContent = "Cross-referenced categorization of the global player pool.";
        
        container.innerHTML = `
            <div class="glass-card" style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                    <div style="flex: 1; min-width: 300px;">
                        <h3 style="font-size: 18px; margin-bottom: 8px;">Player Impact Matrix</h3>
                        <p class="text-muted">Visualizing the balance between consistency and explosiveness.</p>
                    </div>
                    <div class="form-group" style="margin: 0; min-width: 250px;">
                        <input type="text" id="matrix-search" placeholder="Search a specific player (e.g. MS Dhoni)..." style="height: 44px;" onkeyup="updateMatrixSearch()">
                    </div>
                </div>
            </div>

            <div class="glass-card" style="margin-bottom: 24px; height: 350px; position: relative;">
                <canvas id="matrix-scatter-chart"></canvas>
            </div>

            <div class="glass-card">
                <div id="matrix-stats-container">
                    <div style="text-align: center; padding: 40px; color: var(--text-muted);">Initializing datasets...</div>
                </div>
                <div id="matrix-table-container" class="table-container" style="margin-top: 24px;"></div>
            </div>
        `;

        animateIn(container);
        updateIcons();

        try {
            const res = await fetch('/api/matrix');
            const data = await res.json();
            
            if (!res.ok || data.error) {
                console.error("Matrix API Error:", data.error || res.statusText);
                throw new Error(data.error || "Matrix fetch failed");
            }
            
            window.matrixData = data; 
            
            const scatterCanvas = document.getElementById('matrix-scatter-chart');
            if (scatterCanvas) {
                renderMatrixChart(data);
                updateMatrixStats(data);
            }
        } catch(e) { 
            console.error("Matrix catch block:", e);
            const statsContainer = document.getElementById('matrix-stats-container');
            if (statsContainer) statsContainer.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger);">Matrix Engine Failure: ${e.message}</div>`;
        }
    }

    function renderMatrixChart(data, highlightName = "") {
        const canvas = document.getElementById('matrix-scatter-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (window.matrixChart) window.matrixChart.destroy();

        const datasets = [
            { label: 'Superstar', color: '#06b6d4', data: [] },
            { label: 'Anchor', color: '#8b5cf6', data: [] },
            { label: 'Wildcard', color: '#f59e0b', data: [] },
            { label: 'Replacement', color: '#94a3b8', data: [] }
        ];

        data.forEach(p => {
            const point = { x: p.norm_cons, y: p.norm_exp, player: p.player, cat: p.matrix_category };
            if (p.matrix_category === 'Superstar') datasets[0].data.push(point);
            else if (p.matrix_category === 'Anchor') datasets[1].data.push(point);
            else if (p.matrix_category === 'Wildcard') datasets[2].data.push(point);
            else datasets[3].data.push(point);
        });

        window.matrixChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: datasets.map(d => ({
                    label: d.label,
                    data: d.data,
                    backgroundColor: d.color,
                    pointRadius: (ctx) => {
                        const p = ctx.raw;
                        if (highlightName && p && p.player.toLowerCase() === highlightName.toLowerCase()) return 10;
                        return 4;
                    },
                    pointHoverRadius: 12
                }))
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.raw.player} (${ctx.raw.cat})`
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Consistency', color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    y: { title: { display: true, text: 'Explosiveness', color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                },
                onClick: (e, items) => {
                    if (items.length > 0) {
                        const idx = items[0].index;
                        const dsIdx = items[0].datasetIndex;
                        const player = window.matrixChart.data.datasets[dsIdx].data[idx].player;
                        showPlayerProfile(player);
                    }
                }
            }
        });
    }

    function updateMatrixStats(data) {
        const container = document.getElementById('matrix-stats-container');
        const tableContainer = document.getElementById('matrix-table-container');
        if (!container || !tableContainer) return;

        const superstars = data.filter(p => p.matrix_category === 'Superstar').length;
        const anchors = data.filter(p => p.matrix_category === 'Anchor').length;
        const wildcards = data.filter(p => p.matrix_category === 'Wildcard').length;
        const replacements = data.filter(p => p.matrix_category === 'Replacement Level' || p.matrix_category === 'Replacement').length;

        container.innerHTML = `
            <div style="display: flex; gap: 24px; padding: 12px; border-bottom: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: #06b6d4;"></div>
                    <span>Superstars: ${superstars}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: #8b5cf6;"></div>
                    <span>Anchors: ${anchors}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></div>
                    <span>Wildcards: ${wildcards}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: #94a3b8;"></div>
                    <span>Replacement: ${replacements}</span>
                </div>
            </div>
        `;

        renderMatrixTable(data);
    }

    function renderMatrixTable(players) {
        const tableContainer = document.getElementById('matrix-table-container');
        if (!tableContainer) return;

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Category</th>
                        <th>Runs</th>
                        <th>Strike Rate</th>
                    </tr>
                </thead>
                <tbody>
        `;

        players.slice(0, 50).forEach(p => {
            const catClass = p.matrix_category.toLowerCase().replace(' ', '-');
            html += `
                <tr>
                    <td style="font-weight: 600;">${p.player}</td>
                    <td><span class="badge badge-${catClass}" style="padding: 4px 12px; border-radius: 20px; font-size: 11px; background: rgba(255,255,255,0.05);">${p.matrix_category}</span></td>
                    <td>${p.runs || 0}</td>
                    <td>${(p.strike_rate || 0).toFixed(2)}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        tableContainer.innerHTML = html;
    }

    window.updateMatrixSearch = function() {
        const query = document.getElementById('matrix-search').value.toLowerCase();
        if (!window.matrixData) return;

        if (!query) {
            renderMatrixChart(window.matrixData);
            renderMatrixTable(window.matrixData);
            updateMatrixStats(window.matrixData);
            return;
        }

        const filtered = window.matrixData.filter(p => p.player.toLowerCase().includes(query));
        // Clear non-searched players from chart
        renderMatrixChart(filtered, filtered.length > 0 ? filtered[0].player : "");
        renderMatrixTable(filtered);
        updateMatrixStats(filtered);
    };

    function renderAuction() {
        pageTitle.textContent = "Auction Predictor";
        pageSubtitle.textContent = "Smart recommendations based on age risk and trajectories.";
        container.innerHTML = `
            <div class="glass-card" style="margin-bottom: 24px;">
                <div class="form-group" style="margin-bottom: 0; max-width: 100%;">
                    <input type="text" id="auction-search" placeholder="Search by player name... (e.g. Virat)" style="height: 44px;" onkeyup="updateAuctionSearch()">
                </div>
            </div>
            <div class="glass-card">
                <div id="auction-table-container" class="table-container">
                    <div style="text-align: center; padding: 40px; color: var(--text-muted);">Retrieving market intelligence...</div>
                </div>
            </div>
        `;
        animateIn(container);
        loadAuctionData();
    }

    async function loadAuctionData() {
        const container = document.getElementById('auction-table-container');
        try {
            const res = await fetch('/api/matrix');
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Auction data sync failed");
            window.auctionData = data;
            renderAuctionTable(data);
        } catch(e) { 
            console.error("Auction Error:", e);
            container.innerHTML = `<div class="text-center p-4" style="color:var(--danger)">Market intelligence sync failed: ${e.message}</div>`; 
        }
    }

    function renderAuctionTable(data) {
        const container = document.getElementById('auction-table-container');
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Age</th>
                        <th>Nationality</th>
                        <th>Risk Profile</th>
                        <th>3-Year Trajectory</th>
                        <th>Recommendation</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(p => {
            const age = p.age ? Math.floor(p.age) : 25;
            const country = p.birth_country || 'India';
            
            // Dynamic Risk Profile
            let risk = { label: 'Peak Prime (Minimal Risk)', color: '#06b6d4' };
            if (age < 25) risk = { label: 'Young Talent (Low Risk)', color: '#4ade80' };
            else if (age >= 32 && age <= 35) risk = { label: 'Experienced (Moderate Risk)', color: '#f59e0b' };
            else if (age > 35) risk = { label: 'Veteran (High Risk)', color: '#f43f5e' };

            // Dynamic Trajectory
            let trajectory = "📈 Improving";
            if (age >= 30 && age <= 34) trajectory = "📊 Stable";
            else if (age >= 35) trajectory = "📉 Declining";

            // Dynamic Recommendation (Refined Logic)
            let rec = { label: 'Budget Fill / Backup', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
            const cat = (p.matrix_category || "").toLowerCase();
            
            if (cat.includes('superstar')) {
                if (age > 35) rec = { label: 'Veteran Legend / Strategic Use', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' };
                else rec = { label: 'Must Buy / High Priority', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' };
            } 
            else if (cat.includes('anchor')) {
                if (age > 35) rec = { label: 'Experienced Reliability / Backup', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
                else rec = { label: 'Strategic Buy / Stable', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
            } 
            else if (cat.includes('wildcard')) {
                if (age < 25) rec = { label: 'Rising Star / Potential', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
                else rec = { label: 'High Reward / Risk', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
            }
            else {
                // Replacement Level
                if (age > 35 && trajectory.includes("Declining")) {
                    rec = { label: 'Avoid / Non-Essential', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' };
                } else {
                    rec = { label: 'Budget Fill / Backup', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
                }
            }

            html += `
                <tr>
                    <td style="font-weight: 600;">${p.player}</td>
                    <td>${age}</td>
                    <td>${country}</td>
                    <td><span style="color: ${risk.color};">${risk.label}</span></td>
                    <td>${trajectory}</td>
                    <td><span style="padding: 4px 12px; border-radius: 20px; background: ${rec.bg}; color: ${rec.color}; font-size: 11px; font-weight: 600;">${rec.label}</span></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    window.updateAuctionSearch = function() {
        const query = document.getElementById('auction-search').value.toLowerCase();
        if(!window.auctionData) return;
        
        if(!query) {
            renderAuctionTable(window.auctionData);
            return;
        }
        
        const filtered = window.auctionData.filter(p => (p.player || "").toLowerCase().includes(query));
        renderAuctionTable(filtered);
    };

    window.predictValue = async function() {
        const name = document.getElementById('auction-player').value;
        if(!name) return;
        const res = await fetch(`/api/predict/${name}`);
        const data = await res.json();
        const div = document.getElementById('auction-result');
        if (data.estimated_price_cr) {
            div.innerHTML = `
                <div style="padding: 24px; background: rgba(6, 182, 212, 0.05); border-radius: 16px; border: 1px solid var(--border); text-align: center;">
                    <div class="stat-label">Projected Market Price</div>
                    <div class="stat-value text-accent" style="font-size: 40px; margin-top: 8px;">₹${data.estimated_price_cr.toFixed(2)} Cr</div>
                </div>
            `;
        } else {
            div.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--danger); font-size: 14px;">Data unavailable for this identity.</div>`;
        }
    };

    function renderContact() {
        pageTitle.textContent = "Secure Communication";
        pageSubtitle.textContent = "Encrypted channel for partnership and technical feedback.";
        container.innerHTML = `
            <div class="glass-card" style="max-width: 500px;">
                <div class="form-group">
                    <label>Sender Name</label>
                    <input type="text" id="contact-name" placeholder="Name">
                </div>
                <div class="form-group">
                    <label>Return Email</label>
                    <input type="email" id="contact-email" placeholder="email@address.com">
                </div>
                <div class="form-group">
                    <label>Detailed Inquiry</label>
                    <textarea id="contact-msg" style="width:100%; height: 120px; background: rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:12px; color:white; padding:12px; font-family:inherit; font-size:14px; resize:none;"></textarea>
                </div>
                <button class="btn-primary" style="width:100%; border-radius:10px;" onclick="submitContact()">Transfer Message</button>
            </div>
        `;
        animateIn(container);
    }

    window.submitContact = async function() {
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const msg = document.getElementById('contact-msg').value;
        if(!name || !email || !msg) { alert("Incomplete input detected."); return; }
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name, email, message: msg})
            });
            if (res.ok) {
                alert("Communication received. Metadata logged.");
                document.getElementById('contact-name').value = "";
                document.getElementById('contact-email').value = "";
                document.getElementById('contact-msg').value = "";
            }
        } catch(e) { console.error(e); }
    };


    document.querySelectorAll('.nav-links li').forEach(li => {
        li.addEventListener('click', () => { navigate(li.dataset.page); });
    });

    // Initialize UI State
    updateHeaderAuth();
    if (currentUser) navigate('dashboard');
    else navigate('landing');
});
