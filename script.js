// ============================================================
// KHỞI TẠO TELEGRAM WEBAPP
// ============================================================
let tg;
try {
    tg = window.Telegram.WebApp;
    tg.expand();
} catch (e) {
    tg = {
        initDataUnsafe: { user: {} },
        sendData: function(data) { console.log('📤 Sent:', data); },
        showAlert: function(msg) { alert(msg); }
    };
}

const user = (tg.initDataUnsafe && tg.initDataUnsafe.user) || {};
const userId = user.id || '';
const userName = user.first_name || 'User';

console.log('✅ TẠO BANK loaded');

// ============================================================
// DOM READY
// ============================================================
let loaded = false;

document.addEventListener('DOMContentLoaded', function() {
    if (loaded) return;
    loaded = true;
    
    try {
        document.getElementById('profile-name').textContent = userName;
        
        if (userId) {
            sendToBot({
                action: 'get_profile',
                user_id: userId
            });
        }
        
        setupEventListeners();
    } catch (e) {
        console.error('❌ Lỗi init:', e);
    }
});

// ============================================================
// GỬI DỮ LIỆU QUA TELEGRAM
// ============================================================
function sendToBot(data) {
    try {
        if (tg && tg.sendData) {
            const jsonData = JSON.stringify(data);
            console.log('📤 Sent:', jsonData);
            tg.sendData(jsonData);
        } else {
            console.log('⚠️ Không có sendData');
        }
    } catch (e) {
        console.error('❌ Send error:', e);
    }
}

// ============================================================
// TẠO VA
// ============================================================
function createVA() {
    try {
        const name = document.getElementById('customer-name').value.trim();
        const bank = document.getElementById('bank-select').value;
        const fee = 10;
        
        if (!name) {
            tg.showAlert('❌ Vui lòng nhập tên khách hàng');
            return;
        }
        
        const stk = '968' + Math.random().toString().slice(2, 17).padEnd(15, '0');
        const orderCode = 'DH' + Date.now().toString().slice(-15);
        
        document.getElementById('order-code').textContent = orderCode;
        document.getElementById('order-customer').textContent = name;
        document.getElementById('order-stk').textContent = stk;
        document.getElementById('order-bank').textContent = bank;
        document.getElementById('order-fee').textContent = '10%';
        document.getElementById('order-result').classList.remove('hidden');
        
        sendToBot({
            action: 'create_va',
            name: name,
            stk: stk,
            bank: bank,
            fee: fee,
            order_code: orderCode
        });
        
        document.getElementById('customer-name').value = '';
        tg.showAlert('✅ Đã gửi yêu cầu tạo VA! Kiểm tra chat bot.');
    } catch (e) {
        console.error('❌ createVA error:', e);
        tg.showAlert('❌ Lỗi tạo VA');
    }
}

// ============================================================
// LƯU HỒ SƠ
// ============================================================
function saveProfile() {
    try {
        const stk = document.getElementById('edit-stk').value.trim();
        const owner = document.getElementById('edit-owner').value.trim();
        const bank = document.getElementById('edit-bank').value.trim();
        
        if (!stk || !owner || !bank) {
            tg.showAlert('❌ Vui lòng nhập đầy đủ thông tin');
            return;
        }
        
        document.getElementById('profile-stk').textContent = stk;
        document.getElementById('profile-owner').textContent = owner;
        document.getElementById('profile-bank').textContent = bank;
        
        sendToBot({
            action: 'save_profile',
            stk: stk,
            owner: owner,
            bank: bank
        });
        
        tg.showAlert('✅ Đã lưu hồ sơ thành công! Kiểm tra chat bot.');
    } catch (e) {
        console.error('❌ saveProfile error:', e);
        tg.showAlert('❌ Lỗi lưu hồ sơ');
    }
}

// ============================================================
// RÚT TIỀN
// ============================================================
function calculateWithdraw() {
    try {
        const amount = parseInt(document.getElementById('withdraw-amount').value) || 0;
        const feePercent = 10;
        const feeFixed = 3000;
        const fee = Math.floor(amount * feePercent / 100) + feeFixed;
        const total = amount - fee;
        
        document.getElementById('wd-amount').textContent = formatCurrency(amount);
        document.getElementById('wd-fee').textContent = formatCurrency(fee);
        document.getElementById('wd-total').textContent = formatCurrency(total > 0 ? total : 0);
    } catch (e) {
        console.error('❌ calculate error:', e);
    }
}

function requestWithdraw() {
    try {
        const amount = parseInt(document.getElementById('withdraw-amount').value) || 0;
        
        if (amount < 50000) {
            tg.showAlert('❌ Số tiền tối thiểu là 50,000đ');
            return;
        }
        
        if (amount > 100000000) {
            tg.showAlert('❌ Số tiền tối đa là 100,000,000đ');
            return;
        }
        
        const data = {
            action: 'withdraw',
            amount: amount
        };
        
        console.log('📤 Sending withdraw:', data);
        sendToBot(data);
        
        document.getElementById('withdraw-amount').value = '';
        calculateWithdraw();
        
        tg.showAlert('✅ Đã gửi yêu cầu rút tiền!\n📸 Vui lòng gửi ẢNH LỊCH SỬ qua chat bot.');
        
    } catch (e) {
        console.error('❌ withdraw error:', e);
        tg.showAlert('❌ Lỗi rút tiền: ' + e.message);
    }
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
    try {
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
    } catch (e) {
        console.error('❌ setup error:', e);
    }
}