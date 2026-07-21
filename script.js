// Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Get user data from Telegram
const user = tg.initDataUnsafe?.user || {};
const userId = user.id || '';
const userName = user.first_name || 'User';

console.log('✅ MAI BANK loaded');
console.log('👤 User:', userName, 'ID:', userId);

// ============================================================
// HIỂN THỊ THÔNG TIN USER
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Hiển thị tên và ID
    document.getElementById('user-name').textContent = userName;
    document.getElementById('user-id').textContent = 'ID: ' + userId;
    document.getElementById('profile-name').textContent = userName;
    document.getElementById('profile-id').textContent = '🆔 ' + userId;
    
    // Load dữ liệu từ bot (nếu có)
    loadUserData();
    setupEventListeners();
});

// ============================================================
// GỬI DỮ LIỆU QUA TELEGRAM
// ============================================================
function sendToBot(data) {
    try {
        tg.sendData(JSON.stringify(data));
        console.log('📤 Sent:', data);
    } catch (e) {
        console.error('❌ Send error:', e);
        tg.showAlert('❌ Lỗi gửi dữ liệu!');
    }
}

// ============================================================
// LOAD USER DATA (từ bot qua WebApp)
// ============================================================
function loadUserData() {
    // Gửi yêu cầu lấy dữ liệu user
    sendToBot({
        action: 'get_profile',
        user_id: userId
    });
}

// ============================================================
// HIỂN THỊ KẾT QUẢ TỪ BOT
// ============================================================
// Nhận dữ liệu từ bot qua WebApp (phía bot gửi lại)
// Bot sẽ gửi qua tg.sendData khi có dữ liệu

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
    
    const stk = '968' + Math.random().toString().slice(2, 17).padEnd(15, '0');
    const orderCode = 'DH' + Date.now().toString().slice(-15);
    
    // Hiển thị kết quả ngay
    document.getElementById('order-code').textContent = orderCode;
    document.getElementById('order-customer').textContent = name;
    document.getElementById('order-stk').textContent = stk;
    document.getElementById('order-bank').textContent = 'BIDV';
    document.getElementById('order-fee').textContent = '10%';
    document.getElementById('order-result').classList.remove('hidden');
    
    // Gửi về bot
    sendToBot({
        action: 'create_va',
        name: name,
        stk: stk,
        bank: bank,
        fee: fee,
        order_code: orderCode
    });
    
    document.getElementById('customer-name').value = '';
    tg.showAlert('✅ Đã gửi yêu cầu tạo VA!');
}

// ============================================================
// LƯU HỒ SƠ - HIỂN THỊ NGAY TRÊN MINI APP
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
    
    // Cập nhật giao diện ngay
    document.getElementById('profile-stk').textContent = stk;
    document.getElementById('profile-owner').textContent = owner;
    document.getElementById('profile-bank').textContent = bank;
    
    // Hiển thị thông báo thành công
    document.getElementById('profile-result').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('profile-result').classList.add('hidden');
    }, 3000);
    
    // Gửi về bot
    sendToBot({
        action: 'save_profile',
        stk: stk,
        owner: owner,
        bank: bank
    });
    
    tg.showAlert('✅ Đã lưu hồ sơ thành công!');
}

// ============================================================
// RÚT TIỀN - CÓ ĐÍNH KÈM ẢNH
// ============================================================
let photos = [];

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

// Xử lý chọn ảnh
document.getElementById('photo-input').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    const maxPhotos = 5;
    
    if (photos.length + files.length > maxPhotos) {
        tg.showAlert(`❌ Chỉ được đính kèm tối đa ${maxPhotos} ảnh`);
        return;
    }
    
    files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
            tg.showAlert('❌ Ảnh quá lớn (tối đa 5MB)');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            photos.push(event.target.result);
            renderPhotos();
        };
        reader.readAsDataURL(file);
    });
    
    this.value = '';
});

function renderPhotos() {
    const container = document.getElementById('photo-list');
    container.innerHTML = '';
    
    photos.forEach((src, index) => {
        const div = document.createElement('div');
        div.className = 'photo-item';
        div.innerHTML = `
            <img src="${src}" alt="Photo ${index + 1}">
            <button class="remove-photo" data-index="${index}">✕</button>
        `;
        container.appendChild(div);
    });
    
    // Xóa ảnh
    document.querySelectorAll('.remove-photo').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            photos.splice(index, 1);
            renderPhotos();
        });
    });
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
    
    if (photos.length === 0) {
        tg.showAlert('❌ Vui lòng đính kèm ít nhất 1 ảnh lịch sử');
        return;
    }
    
    // Hiển thị thông báo thành công
    document.getElementById('withdraw-result').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('withdraw-result').classList.add('hidden');
    }, 3000);
    
    // Gửi về bot
    sendToBot({
        action: 'withdraw',
        amount: amount,
        photos: photos
    });
    
    document.getElementById('withdraw-amount').value = '';
    photos = [];
    renderPhotos();
    calculateWithdraw();
    
    tg.showAlert('✅ Đã gửi yêu cầu rút tiền!');
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