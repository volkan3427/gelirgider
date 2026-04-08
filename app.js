// Global State
let transactions = [];

// Categories defined from user's data
const expenseCategories = [
    "Ev", "Kişisel", "Yemek", "Market (Migros vb.)", "Kira", "Maaş", 
    "Ekrem abi", "Emrah", "Yaser", "Meran", "Harun", "Türkmenler", 
    "Barut", "Sandviç", "Metro", "Dükkan", "Kahve", "Tereyağ", "Çikolata", "Diğer"
];

const incomeCategories = [
    "Nakit", "Kart", "Diğer"
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('tr-TR', options);
    
    // Set default date in form
    document.getElementById('transDate').valueAsDate = new Date();

    loadData();
});

function loadData() {
    const saved = localStorage.getItem('gelirgider_data');
    if (saved) {
        transactions = JSON.parse(saved);
    }
    updateUI();
}

function saveData() {
    localStorage.setItem('gelirgider_data', JSON.stringify(transactions));
}

function updateUI() {
    const list = document.getElementById('transactionList');
    list.innerHTML = '';

    let tIncome = 0;
    let tExpense = 0;

    if (transactions.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-receipt"></i>
                <p>Henüz işlem bulunmuyor.</p>
            </div>
        `;
    } else {
        // Sort by date desc
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        transactions.forEach(t => {
            if (t.type === 'income') tIncome += t.amount;
            if (t.type === 'expense') tExpense += t.amount;

            const isIncome = t.type === 'income';
            
            // Format date correctly
            let dateStr = "Tarihsiz";
            if(t.date) {
                const dateObj = new Date(t.date);
                if(!isNaN(dateObj)) dateStr = dateObj.toLocaleDateString('tr-TR');
            }

            const html = `
                <div class="transaction-item ${t.type}-item">
                    <div class="tr-left">
                        <div class="tr-icon">
                            <i class="fa-solid ${isIncome ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                        </div>
                        <div class="tr-details">
                            <h4>${t.category}</h4>
                            <p>${dateStr} ${t.desc ? ' • ' + t.desc : ''}</p>
                        </div>
                    </div>
                    <div class="tr-right">
                        <div class="tr-amount">${isIncome ? '+' : '-'}₺${t.amount.toLocaleString('tr-TR', {minimumFractionDigits:2})}</div>
                        <button class="tr-delete" onclick="deleteTransaction('${t.id}')">Sil</button>
                    </div>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', html);
        });
    }

    const tBalance = tIncome - tExpense;

    document.getElementById('totalBalance').textContent = `₺${tBalance.toLocaleString('tr-TR', {minimumFractionDigits:2})}`;
    document.getElementById('totalIncome').textContent = `₺${tIncome.toLocaleString('tr-TR', {minimumFractionDigits:2})}`;
    document.getElementById('totalExpense').textContent = `₺${tExpense.toLocaleString('tr-TR', {minimumFractionDigits:2})}`;
}

function openModal(type) {
    const modal = document.getElementById('transactionModal');
    const title = document.getElementById('modalTitle');
    const typeInput = document.getElementById('transType');
    const select = document.getElementById('transCategory');

    typeInput.value = type;
    select.innerHTML = ''; // clear

    if (type === 'income') {
        title.textContent = 'Gelir Ekle';
        incomeCategories.forEach(c => {
            select.add(new Option(c, c));
        });
    } else {
        title.textContent = 'Gider Ekle';
        // Sort expenses alphabetically for easier finding
        [...expenseCategories].sort((a,b)=> a.localeCompare(b,'tr')).forEach(c => {
            select.add(new Option(c, c));
        });
    }

    // Reset amounts
    document.getElementById('transAmount').value = '';
    document.getElementById('transDesc').value = '';

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('transactionModal');
    modal.classList.remove('active');
}

function handleFormSubmit(e) {
    e.preventDefault();

    const type = document.getElementById('transType').value;
    const amountStr = document.getElementById('transAmount').value;
    const amount = parseFloat(amountStr);
    const category = document.getElementById('transCategory').value;
    const desc = document.getElementById('transDesc').value;
    const date = document.getElementById('transDate').value;

    if (!amount || amount <= 0) return alert('Lütfen geçerli bir tutar giriniz.');
    if (!date) return alert('Lütfen tarih seçiniz.');

    const newTrans = {
        id: Date.now().toString(),
        type,
        amount,
        category,
        desc,
        date
    };

    transactions.push(newTrans);
    saveData();
    updateUI();
    closeModal();
}

function deleteTransaction(id) {
    if (confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        updateUI();
    }
}

function clearData() {
    if(transactions.length === 0) return;
    if (confirm('Tüm verileri tamamen sıfırlamak (silmek) istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
        transactions = [];
        saveData();
        updateUI();
    }
}

// Close modal when clicking outside form
document.getElementById('transactionModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});
