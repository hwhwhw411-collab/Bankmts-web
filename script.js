// Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id') || '';

// API Base URL
const API_BASE = window.location.origin;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    if (userId) {
        await loadUserData();
        await loadHistory();
    }
    setupEventListeners();
});

// ============================================================
// LOAD DATA
// ============================================================
async function loadUserData() {
    try {
        const res = await fetch(`${API_BASE}/api/user/${userId}`);
        const data = await res.json();
        
        if (data.status === 'success') {
            const user = data.user;
            const stats = data.stats;
            
            // Update profile
            document.getElementById('profile-name').textContent = user.fullname || 'Chưa có tên';
            document.getElementById('profile-id').textContent = user.telegram_id || '--';
            document.getElementById('profile-bank').textContent = user.bank || 'Chưa có';
            document.getElementById('profile-stk').textContent = user.stk || 'Chưa có';
            document.getElementById('profile-owner').textContent = user.owner_name || 'Chưa có';
            
            // Update stats
            document.getElementById('revenue-24h').textContent = formatCurrency(stats.total_revenue || 0);
            document.getElementById('total-withdrawn').textContent = formatCurrency(stats.total_withdrawn || 0);
            document.getElementById('balance').textContent = formatCurrency(stats.balance || 0);
            
            // Fill edit form
            document.getElementById('edit-owner').value = user.owner_name || '';
            document.getElementById('edit-stk').value = user.stk || '';
            document.getElementById('edit-bank').value = user.bank || 'BIDV';
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

async function loadHistory() {
    try {
        const res = await fetch(`${API_BASE}/api/va/history`);
        const data = await res.json();
        
        if (data.status === 'success') {
            const list = document.getElementById('history-list');
            list.innerHTML = '';
            
            data.data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <div>
                        <div class="name">${item.customer_name}</div>
                        <div class="bank">${item.bank}</div>
                    </div>
                    <div style="text-align:right">
                        <div class="bank">${item.stk}</div>
                        <div class="time">${formatDate(item.created_at)}</div>
                    </div>
                `;
                list.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// ============================================================
// CREATE VA
// ============================================================
async function createVA() {
    const name = document.getElementById('customer-name').value.trim();
    const bank = document.getElementById('bank-select').value;
    const fee = parseInt(document.getElementById('fee-slider').value);
    
    if (!name) {
        tg.showAlert('Vui lòng nhập tên khách hàng');
        return;
    }
    
    // Generate random STK (giả lập)
    const stk = '968' + Math.random().toString().slice(2, 18).padEnd(15, '0');
    
    try {
        const res = await fetch(`${API_BASE}/api/va/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_name: name, stk, bank, fee })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            const va = data.va;
            
            // Show result
            document.getElementById('order-code').textContent = va.order_code;
            document.getElementById('order-customer').textContent = va.customer_name;
            document.getElementById('order-stk').textContent = va.stk;
            document.getElementById('order-bank').textContent = va.bank;
            document.getElementById('order-fee').textContent = va.fee + '%';
            document.getElementById('order-result').classList.remove('hidden');
            
            tg.showAlert('✅ Tạo VA thành công!');
            
            // Clear input
            document.getElementById('customer-name').value = '';
            
            // Reload history
            await loadHistory();
        }
    } catch (error) {
        console.error('Error creating VA:', error);
        tg.showAlert('❌ Lỗi tạo VA');
    }
}

// ============================================================
// SAVE PROFILE
// ============================================================
async function saveProfile() {
    const stk = document.getElementById('edit-stk').value.trim();
    const owner = document.getElementById('edit-owner').value.trim();
    const bank = document.getElementById('edit-bank').value;
    
    if (!stk || !owner) {
        tg.showAlert('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/api/user/${userId}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stk, owner_name: owner, bank })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            tg.showAlert('✅ Lưu hồ sơ thành công!');
            await loadUserData();
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        tg.showAlert('❌ Lỗi lưu hồ sơ');
    }
}

// ============================================================
// WITHDRAW
// ============================================================
function calculateWithdraw() {
    const amount = parseInt(document.getElementById('withdraw-amount').value) || 0;
    const feePercent = 10;
    const feeFixed = 3000;
    
    const fee = Math.floor(amount * feePercent / 100) + feeFixed;
    const total = amount - fee;
    
    document.getElementById('wd-amount').textContent = formatCurrency(amount);
    document.getElementById('wd-fee').textContent = formatCurrency(fee);
    document.getElementById('wd-total').textContent = formatCurrency(total > 0 ? total : 0);
}

async function requestWithdraw() {
    const amount = parseInt(document.getElementById('withdraw-amount').value) || 0;
    
    if (amount < 50000) {
        tg.showAlert('❌ Số tiền tối thiểu là 50,000đ');
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/api/withdraw/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, photos: [] })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            tg.showAlert('✅ Đã gửi yêu cầu rút tiền!');
            document.getElementById('withdraw-amount').value = '';
            calculateWithdraw();
        }
    } catch (error) {
        console.error('Error requesting withdraw:', error);
        tg.showAlert('❌ Lỗi gửi yêu cầu');
    }
}

// ============================================================
// UI HELPERS
// ============================================================
function formatCurrency(value) {
    return value.toLocaleString('vi-VN') + 'đ';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn, .nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            document.querySelectorAll('.tab-btn, .nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll(`.tab-btn[data-tab="${tabId}"], .nav-btn[data-tab="${tabId}"]`)
                .forEach(b => b.classList.add('active'));
            
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Create VA
    document.getElementById('btn-create').addEventListener('click', createVA);
    
    // Save Profile
    document.getElementById('btn-save-profile').addEventListener('click', saveProfile);
    
    // Withdraw
    document.getElementById('withdraw-amount').addEventListener('input', calculateWithdraw);
    document.getElementById('btn-withdraw').addEventListener('click', requestWithdraw);
    
    // Fee slider
    document.getElementById('fee-slider').addEventListener('input', function() {
        document.querySelector('.fee-display').textContent = this.value + '%';
    });
}