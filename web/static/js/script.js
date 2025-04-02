let currentAccount = '';
let refreshInterval;
const chartInstances = {};

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.classList.add('message-fade');
    setTimeout(() => {
        errorElement.style.display = 'none';
        errorElement.classList.remove('message-fade');
    }, 5000);
}

function showSuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    successElement.textContent = message;
    successElement.style.display = 'block';
    successElement.classList.add('message-fade');
    setTimeout(() => {
        successElement.style.display = 'none';
        successElement.classList.remove('message-fade');
    }, 5000);
}

// Check for existing login on page load
window.addEventListener('load', () => {
    const accountId = document.cookie
        .split('; ')
        .find(row => row.startsWith('account_id='))
        ?.split('=')[1];
    
    if (accountId) {
        handleLogin(accountId);
    }
    //setInterval(refreshPublicStats, 5000);
});

async function refreshPublicStats() {
    const response = await fetch('/');
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    
    const statsScript = Array.from(doc.scripts)
        .find(script => script.textContent.includes('window.stats'));
    
    if (statsScript) {
        const statsMatch = statsScript.textContent.match(/window\.stats = (.*?);/);
        if (statsMatch) {
            window.stats = JSON.parse(statsMatch[1]);
            createCharts();
        }
    }
}

async function register() {
    const response = await fetch('/register', { method: 'POST' });
    const data = await response.json();
    await handleLogin(data.account_id);
}

async function handleLogin(accountId) {
    currentAccount = accountId;
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('url-section').style.display = 'block';
    document.getElementById('current-account-display').textContent = accountId;
    loadAnalytics();
    refreshInterval = setInterval(loadAnalytics, 5000);
}

async function login() {
    const accountId = document.getElementById('account-id').value;
    const response = await fetch('/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({account_id: accountId})
    });
    
    if (response.ok) {
        await handleLogin(accountId);
    } else {
        showError('auth-error', 'Invalid account ID');
    }
}

async function logout() {
    clearInterval(refreshInterval);
    const response = await fetch('/logout', { method: 'POST' });
    
    if (response.ok) {
        currentAccount = '';
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('url-section').style.display = 'none';
        document.getElementById('account-id').value = '';
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '';
        resultDiv.style.display = 'none';
    }
}

function isValidUrl(url) {
    if (!url || !url.trim()) return false;
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

async function createShortUrl() {
    const url = document.getElementById('url-input').value;
    const resultDiv = document.getElementById('result');
    
    if (!isValidUrl(url)) {
        showError('url-error', 'Please enter a valid URL starting with http:// or https://');
        return;
    }

    const response = await fetch('/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            account_id: currentAccount,
            url: url
        })
    });
    
    const data = await response.json();
    
    if (response.ok) {
        const shortUrl = `${window.location.origin}${data.short_url}`;
        showSuccess('url-success', `URL shortened successfully!`);
        resultDiv.innerHTML = `<p>Short URL: <a href="${shortUrl}" target="_blank">${shortUrl}</a></p>`;
        resultDiv.style.display = 'block';
        document.getElementById('url-input').value = '';
        loadAnalytics();
    } else {
        showError('url-error', data.error);
        resultDiv.style.display = 'none';
    }
}

let deleteCallback = null;

function showDeleteDialog(shortId) {
    const dialog = document.getElementById('deleteDialog');
    dialog.style.display = 'flex';
    
    const confirmBtn = document.getElementById('confirmDelete');
    deleteCallback = async () => {
        const response = await fetch(`/delete/${shortId}`, { method: 'DELETE' });
        
        if (response.ok) {
            showSuccess('url-success', 'Link deleted successfully');
            loadAnalytics();
        } else {
            const data = await response.json();
            showError('url-error', data.error || 'Failed to delete link');
        }
        closeDeleteDialog();
    };
    
    confirmBtn.onclick = deleteCallback;
}

function closeDeleteDialog() {
    const dialog = document.getElementById('deleteDialog');
    dialog.style.display = 'none';
    deleteCallback = null;
}

async function loadAnalytics() {
    if (!currentAccount) {
        console.log("No account ID available");
        return;
    }

    const response = await fetch(`/analytics/${currentAccount}`);
    if (!response.ok) {
        console.error(`Failed to fetch analytics: ${response.status}`);
        return;
    }

    const data = await response.json();
    if (!data) {
        console.error("Invalid analytics data format");
        return;
    }

    const analyticsDiv = document.getElementById('analytics');
    analyticsDiv.innerHTML = '<h2>Your Analytics</h2>';
    if (!data.links || data.links.length === 0) {
        analyticsDiv.innerHTML += '<p>No links created yet.</p>';
        return;
    }

    const analytics = data.analytics || [];
    
    const openDetails = Array.from(document.querySelectorAll('details[open]')).map(
        detail => detail.getAttribute('data-visit-id')
    );
    
    data.links.forEach(link => {
        const linkAnalytics = analytics.filter(a => a.link_id === link.short_id);
        const clicks = linkAnalytics.length;
        const shortUrl = `${window.location.origin}/l/${link.short_id}`;
        
        analyticsDiv.innerHTML += `
            <div class="link-stats">
                <div class="link-header">
                    <h3>Short URL: <a href="${shortUrl}" target="_blank">${link.short_id}</a></h3>
                    <button onclick="showDeleteDialog('${link.short_id}')" class="delete-btn">Delete</button>
                </div>
                <p>Target: <a href="${link.target_url}" target="_blank">${link.target_url}</a></p>
                <p>Total Clicks: ${clicks}</p>
                <table class="analytics-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>IP (Port)</th>
                            <th>Location</th>
                            <th>Device Info</th>
                            <th>Browser Info</th>
                            <th>Additional Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linkAnalytics.map(visit => {
                            const visitId = `${link.short_id}-${visit.timestamp.$date || visit.timestamp}`;
                            return `
                                <tr>
                                    <td>${new Date(visit.timestamp.$date || visit.timestamp).toLocaleString()}</td>
                                    <td>
                                        ${visit.ip}<br>
                                        Port: ${visit.remote_port}<br>
                                        ${visit.ip_version}
                                    </td>
                                    <td>
                                        Country: ${visit.country}<br>
                                        ISP: ${visit.isp}
                                    </td>
                                    <td>
                                        OS: ${visit.platform}<br>
                                        Screen: ${visit.screen_size}<br>
                                        Window: ${visit.window_size}
                                    </td>
                                    <td>
                                        ${visit.browser} ${visit.version}<br>
                                        Lang: ${visit.language}
                                    </td>
                                    <td>
                                        <details data-visit-id="${visitId}" ${openDetails.includes(visitId) ? 'open' : ''}>
                                            <summary>More Info</summary>
                                            <p>User Agent: ${visit.user_agent}</p>
                                            <p>Referrer: ${visit.referrer}</p>
                                            <p>Accept: ${visit.accept}</p>
                                            <p>Accept-Language: ${visit.accept_language}</p>
                                            <p>Accept-Encoding: ${visit.accept_encoding}</p>
                                        </details>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    });
}

function createCharts() {
    if (!window.stats?.chart_data) return;
    
    const chartConfigs = {
        'ipChart': {
            data: window.stats.chart_data.ip_versions,
            title: 'IP Versions'
        },
        'osChart': {
            data: window.stats.chart_data.os_stats,
            title: 'Operating Systems'
        },
        'countryChart': {
            data: window.stats.chart_data.country_stats,
            title: 'Countries'
        },
        'ispChart': {
            data: window.stats.chart_data.isp_stats,
            title: 'ISPs'
        }
    };

    Object.entries(chartConfigs).forEach(([chartId, config]) => {
        const ctx = document.getElementById(chartId);
        if (ctx) {
            if (chartInstances[chartId]) {
                chartInstances[chartId].destroy();
            }
            
            chartInstances[chartId] = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: config.data.map(item => item._id || 'Unknown'),
                    datasets: [{
                        data: config.data.map(item => item.count),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                            '#FF9F40', '#4BC0C0', '#9966FF', '#C9CBCF', '#36A2EB'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#ffffff'
                            }
                        },
                        title: {
                            display: true,
                            text: config.title,
                            color: '#ffffff'
                        }
                    }
                }
            });
        }
    });
}

// Add event listener to close dialog when clicking outside
document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('deleteDialog');
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            closeDeleteDialog();
        }
    });
});
