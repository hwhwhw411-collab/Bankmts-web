// Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id') || '';

console.log('🔄 MAI BANK App loaded');
console.log('👤 User ID:', userId);

// ============================================================
// GỬI DỮ LIỆU QUA TELEGRAM
// ============================================================
function sendToBot(data) {
    tg.sendData(JSON.stringify(data));
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    // Không cần load API nữa
});

// ============================================================
// CREATE VA
// ============================================================
async function createVA() {
    const name = document.getElementById('customer-name').value.trim();
    const bank = 'BIDV';
    const fee = 10;
    
    if (!name) {
        tg.showAlert('❌ Vui lòng nhập tên khách hàng');
        return;
    }
    
    // Tạo STK ngẫu nhiên
    const stk = '968' + Math.random().toString().slice(2, 17).padEnd(15, '0');
    
    // Gửi dữ liệu qua Telegram
    sendToBot({
        action: 'create_va',
        name: name,
        stk: stk,
        bank: bank,
        fee: fee
    });
    
    // Hiển thị loading
    document.getElementById('btn-create').textContent = '⏳ Đang xử lý...';
    document.getElementById('btn-create').disabled = true;
    
    // Đợi phản hồi từ bot (sẽ hiện trong chat)
    setTimeout(() => {
        document.getElementById('btn-create').textContent = '🔄 TẠO MÃ ĐƠN HÀNG';
        document.getElementById('btn-create').disabled = false;
        document.getElementById('customer-name').value = '';
        tg.showAlert('✅ Đã gửi yêu cầu! Kiểm tra chat bot.');
    }, 2000);
}

// ============================================================
// SAVE PROFILE
// ============================================================
async function saveProfile() {
    const stk = document.getElementById('edit-stk').value.trim();
    const owner = document.getElementById('edit-owner').value.trim();
    const bank = document.getElementById('edit-bank').value.trim();
    
    if (!stk || !owner || !bank) {
        tg.showAlert('❌ Vui lòng nhập đầy đủ thông tin');
        return;
    }
    
    sendToBot({
        action: 'save_profile',
        stk: stk,
        owner: owner,
        bank: bank
    });
    
    document.getElementById('btn-save-profile').textContent = '⏳ Đang lưu...';
    document.getElementById('btn-save-profile').disabled = true;
    
    setTimeout(() => {
        document.getElementById('btn-save-profile').textContent = '💾 LƯU TÀI KHOẢN';
        document.getElementById('btn-save-profile').disabled = false;
        tg.showAlert('✅ Đã gửi yêu cầu! Kiểm tra chat bot.');
    }, 1500);
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
    
    sendToBot({
        action: 'withdraw',
        amount: amount
    });
    
    document.getElementById('btn-withdraw').textContent = '⏳ Đang gửi...';
    document.getElementById('btn-withdraw').disabled = true;
    
    setTimeout(() => {
        document.getElementById('btn-withdraw').textContent = '💳 GỬI YÊU CẦU RÚT';
        document.getElementById('btn-withdraw').disabled = false;
        document.getElementById('withdraw-amount').value = '';
        calculateWithdraw();
        tg.showAlert('✅ Đã gửi yêu cầu! Kiểm tra chat bot.');
    }, 1500);
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
}