// Global State
let transactions = [];
let expenseChartInstance = null;

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

// ====== Reports & Sidebar Logic ======

function openSidebar() {
    document.getElementById('sidebarOverlay').classList.add('active');
    document.getElementById('reportsSidebar').classList.add('active');
    renderReports();
}

function closeSidebar() {
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.getElementById('reportsSidebar').classList.remove('active');
}

function renderReports() {
    // 1. Group expenses by category
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};

    expenses.forEach(t => {
        if (!categoryTotals[t.category]) categoryTotals[t.category] = 0;
        categoryTotals[t.category] += t.amount;
    });

    // 2. Sort categories by total expense (descending)
    const sortedCategories = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a]);

    // 3. Prepare Chart Data
    const chartLabels = [];
    const chartData = [];
    // Colors matching CSS theme (reds/oranges/pinks for expense)
    const baseColors = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#a855f7', '#6366f1', '#14b8a6', '#eab308'];
    const bgColors = [];

    const summaryList = document.getElementById('categorySummaryList');
    summaryList.innerHTML = '';

    if (sortedCategories.length === 0) {
        summaryList.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;text-align:center;">Gider bulunamadı.</p>';
        if (expenseChartInstance) expenseChartInstance.destroy();
        return;
    }

    sortedCategories.forEach((cat, index) => {
        const total = categoryTotals[cat];
        chartLabels.push(cat);
        chartData.push(total);
        
        const color = baseColors[index % baseColors.length];
        bgColors.push(color);

        // Build list item HTML
        const itemHtml = `
            <div class="sum-item" onclick="openCategoryDetail('${cat}', ${total})">
                <div class="sum-item-left">
                    <div class="sum-color-dot" style="background-color: ${color}"></div>
                    <span>${cat}</span>
                </div>
                <div class="sum-amount">₺${total.toLocaleString('tr-TR', {minimumFractionDigits:2})}</div>
            </div>
        `;
        summaryList.insertAdjacentHTML('beforeend', itemHtml);
    });

    // 4. Render Chart
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (expenseChartInstance) {
        expenseChartInstance.destroy(); // remove old instances
    }

    // Dynamic Chart.js text color depending on theme
    Chart.defaults.color = "#94a3b8";

    expenseChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // We have the custom list below
                }
            },
            cutout: '70%'
        }
    });
}

function openCategoryDetail(category, totalAmount) {
    const modal = document.getElementById('categoryDetailModal');
    const title = document.getElementById('detailModalTitle');
    const totalBox = document.getElementById('detailCategoryTotal');
    const list = document.getElementById('detailTransactionList');

    title.textContent = category + " Detayları";
    totalBox.textContent = `₺${totalAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})}`;
    list.innerHTML = '';

    // Filter tx matching exactly this category and type expense
    const categoryTx = transactions.filter(t => t.type === 'expense' && t.category === category);
    categoryTx.sort((a,b) => new Date(b.date) - new Date(a.date));

    categoryTx.forEach(t => {
        let dateStr = "Tarihsiz";
        if(t.date) {
            const dateObj = new Date(t.date);
            if(!isNaN(dateObj)) dateStr = dateObj.toLocaleDateString('tr-TR');
        }

        const html = `
            <div class="transaction-item expense-item" style="margin-bottom: 10px;">
                <div class="tr-left">
                    <div class="tr-icon"><i class="fa-solid fa-arrow-up"></i></div>
                    <div class="tr-details">
                        <h4>${t.category}</h4>
                        <p>${dateStr} ${t.desc ? ' • ' + t.desc : ''}</p>
                    </div>
                </div>
                <div class="tr-right">
                    <div class="tr-amount">-₺${t.amount.toLocaleString('tr-TR', {minimumFractionDigits:2})}</div>
                </div>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', html);
    });

    modal.classList.add('active');
}

function closeDetailModal() {
    document.getElementById('categoryDetailModal').classList.remove('active');
}
