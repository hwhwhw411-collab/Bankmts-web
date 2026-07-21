// Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id') || '';

// API Base URL - Dùng IP VPS của bạn
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
            
            document.getElementById('profile-name').textContent = user.fullname || '---';
            document.getElementById('profile-id').textContent = user.telegram_id || '---';
            document.getElementById('profile-bank').textContent = user.bank || '---';
            document.getElementById('profile-stk').textContent = user.stk || '---';
            document.getElementById('profile-owner').textContent = user.owner_name || '---';
            
            document.getElementById('edit-owner').value = user.owner_name || '';
            document.getElementById('edit-stk').value = user.stk || '';
            document.getElementById('edit-bank').value = user.bank || '';
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
            
            if (data.data.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:#4a5568;padding:20px;">Chưa có VA nào</div>';
                return;
            }
            
            data.data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <div>
                        <div class="name">${item.customer_name || '---'}</div>
                        <div class="bank">${item.bank || 'BIDV'}</div>
                    </div>
                    <div style="text-align:right">
                        <div class="bank">${item.stk || '---'}</div>
                        <div class="time">${item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : ''}</div>
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
        tg.showAlert('❌ Vui lòng nhập tên khách hàng');
        return;
    }
    
    // Tạo STK ngẫu nhiên 15 số
    const stk = '968' + Math.random().toString().slice(2, 17).padEnd(15, '0');
    
    try {
        const res = await fetch(`${API_BASE}/api/va/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_name: name, stk, bank, fee })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            const va = data.va;
            
            document.getElementById('order-code').textContent = va.order_code;
            document.getElementById('order-customer').textContent = va.customer_name;
            document.getElementById('order-stk').textContent = va.stk;
            document.getElementById('order-bank').textContent = va.bank;
            document.getElementById('order-fee').textContent = va.fee + '%';
            document.getElementById('order-result').classList.remove('hidden');
            
            tg.showAlert('✅ Tạo VA thành công!');
            document.getElementById('customer-name').value = '';
            await loadHistory();
        } else {
            tg.showAlert('❌ ' + (data.message || 'Lỗi tạo VA'));
        }
    } catch (error) {
        console.error('Error creating VA:', error);
        tg.showAlert('❌ Lỗi kết nối server');
    }
}

// ============================================================
// SAVE PROFILE
// ============================================================
async function saveProfile() {
    const stk = document.getElementById('edit-stk').value.trim();
    const owner = document.getElementById('edit-owner').value.trim();
    const bank = document.getElementById('edit-bank').value.trim();
    
    if (!stk) {
        tg.showAlert('❌ Vui lòng nhập số tài khoản');
        return;
    }
    if (!owner) {
        tg.showAlert('❌ Vui lòng nhập tên chủ tài khoản');
        return;
    }
    if (!bank) {
        tg.showAlert('❌ Vui lòng nhập tên ngân hàng');
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
        } else {
            tg.showAlert('❌ ' + (data.message || 'Lỗi lưu hồ sơ'));
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        tg.showAlert('❌ Lỗi kết nối server');
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
    
    if (amount > 100000000) {
        tg.showAlert('❌ Số tiền tối đa là 100,000,000đ');
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/api/withdraw/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, user_id: userId })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            tg.showAlert('✅ Đã gửi yêu cầu rút tiền!');
            document.getElementById('withdraw-amount').value = '';
            calculateWithdraw();
        } else {
            tg.showAlert('❌ ' + (data.message || 'Lỗi gửi yêu cầu'));
        }
    } catch (error) {
        console.error('Error requesting withdraw:', error);
        tg.showAlert('❌ Lỗi kết nối server');
    }
}

// ============================================================
// UI HELPERS
// ============================================================
function formatCurrency(value) {
    return value.toLocaleString('vi-VN') + '₫';
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
    
    // Fee slider - mặc định 10%
    document.getElementById('fee-slider').value = 10;
    document.querySelector('.fee-display').textContent = '10%';
    document.getElementById('fee-slider').addEventListener('input', function() {
        document.querySelector('.fee-display').textContent = this.value + '%';
    });
}