// Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id') || '';

console.log('✅ MAI BANK loaded');
console.log('👤 User ID:', userId);

// ============================================================
// GỬI DỮ LIỆU QUA TELEGRAM (KHÔNG GỌI API)
// ============================================================
function sendToBot(data) {
    try {
        tg.sendData(JSON.stringify(data));
        console.log('📤 Sent:', data);
    } catch (e) {
        console.error('❌ Send error:', e);
        tg.showAlert('❌ Lỗi gửi dữ liệu! Vui lòng thử lại.');
    }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// ============================================================
// TẠO VA
// ============================================================
function createVA() {
    const name = document.getElementById('customer-name').value.trim();
    const bank = 'BIDV';
    const fee = 10;
    
    if (!name) {
        tg.showAlert('❌ Vui lòng nhập tên khách hàng');
        return;
    }
    
    // Tạo STK ngẫu nhiên
    const stk = '968' + Math.random().toString().slice(2, 17).padEnd(15, '0');
    const orderCode = 'DH' + Date.now().toString().slice(-15);
    
    // Hiển thị kết quả ngay trên Mini App
    document.getElementById('order-code').textContent = orderCode;
    document.getElementById('order-customer').textContent = name;
    document.getElementById('order-stk').textContent = stk;
    document.getElementById('order-bank').textContent = 'BIDV';
    document.getElementById('order-fee').textContent = '10%';
    document.getElementById('order-result').classList.remove('hidden');
    
    // Gửi dữ liệu về bot
    sendToBot({
        action: 'create_va',
        name: name,
        stk: stk,
        bank: bank,
        fee: fee,
        order_code: orderCode
    });
    
    // Xóa input
    document.getElementById('customer-name').value = '';
    
    // Thông báo
    tg.showAlert('✅ Đã gửi yêu cầu tạo VA!\nKiểm tra chat bot để xác nhận.');
}

// ============================================================
// LƯU HỒ SƠ
// ============================================================
function saveProfile() {
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
    
    // Gửi dữ liệu về bot
    sendToBot({
        action: 'save_profile',
        stk: stk,
        owner: owner,
        bank: bank
    });
    
    // Cập nhật giao diện
    document.getElementById('profile-stk').textContent = stk;
    document.getElementById('profile-owner').textContent = owner;
    document.getElementById('profile-bank').textContent = bank;
    
    tg.showAlert('✅ Đã gửi yêu cầu lưu hồ sơ!\nKiểm tra chat bot để xác nhận.');
}

// ============================================================
// RÚT TIỀN
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

function requestWithdraw() {
    const amount = parseInt(document.getElementById('withdraw-amount').value) || 0;
    
    if (amount < 50000) {
        tg.showAlert('❌ Số tiền tối thiểu là 50,000đ');
        return;
    }
    
    if (amount > 100000000) {
        tg.showAlert('❌ Số tiền tối đa là 100,000,000đ');
        return;
    }
    
    // Gửi dữ liệu về bot
    sendToBot({
        action: 'withdraw',
        amount: amount
    });
    
    document.getElementById('withdraw-amount').value = '';
    calculateWithdraw();
    
    tg.showAlert('✅ Đã gửi yêu cầu rút tiền!\nKiểm tra chat bot để xác nhận.');
}

// ============================================================
// UI HELPERS
// ============================================================
function formatCurrency(value) {
    return value.toLocaleString('vi-VN') + '₫';
}

// ============================================================
// TAB SWITCH
// ============================================================
function setupEventListeners() {
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
    
    document.getElementById('btn-create').addEventListener('click', createVA);
    document.getElementById('btn-save-profile').addEventListener('click', saveProfile);
    document.getElementById('withdraw-amount').addEventListener('input', calculateWithdraw);
    document.getElementById('btn-withdraw').addEventListener('click', requestWithdraw);
}