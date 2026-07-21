// ============================================================
// KHỞI TẠO AN TOÀN
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

console.log('✅ MAI BANK loaded');
console.log('👤 User:', userName, 'ID:', userId);

// ============================================================
// DOM READY - CHỈ GỬI 1 LẦN DUY NHẤT
// ============================================================
let loaded = false;

document.addEventListener('DOMContentLoaded', function() {
    if (loaded) return;
    loaded = true;
    
    try {
        document.getElementById('user-name').textContent = userName;
        document.getElementById('user-id').textContent = 'ID: ' + userId;
        document.getElementById('profile-name').textContent = userName;
        document.getElementById('profile-id').textContent = '🆔 ' + userId;
        
        // CHỈ GỬI 1 LẦN DUY NHẤT
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
// GỬI DỮ LIỆU AN TOÀN
// ============================================================
function sendToBot(data) {
    try {
        if (tg && tg.sendData) {
            tg.sendData(JSON.stringify(data));
            console.log('📤 Sent:', data);
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
        const bank = 'BIDV';
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
        document.getElementById('order-bank').textContent = 'BIDV';
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
        tg.showAlert('✅ Đã gửi yêu cầu tạo VA!');
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
        
        tg.showAlert('✅ Đã lưu hồ sơ thành công!');
    } catch (e) {
        console.error('❌ saveProfile error:', e);
        tg.showAlert('❌ Lỗi lưu hồ sơ');
    }
}

// ============================================================
// RÚT TIỀN
// ============================================================
let photos = [];

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
        
        if (photos.length === 0) {
            tg.showAlert('❌ Vui lòng đính kèm ít nhất 1 ảnh lịch sử');
            return;
        }
        
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
    } catch (e) {
        console.error('❌ withdraw error:', e);
        tg.showAlert('❌ Lỗi rút tiền');
    }
}

// ============================================================
// XỬ LÝ ẢNH
// ============================================================
document.getElementById('photo-input').addEventListener('change', function(e) {
    try {
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
    } catch (e) {
        console.error('❌ photo error:', e);
    }
});

function renderPhotos() {
    try {
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
        
        document.querySelectorAll('.remove-photo').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                photos.splice(index, 1);
                renderPhotos();
            });
        });
    } catch (e) {
        console.error('❌ render photos error:', e);
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