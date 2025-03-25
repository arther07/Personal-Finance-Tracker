// Initialize charts
let expenseChart = null;
let balanceChart = null;
let trendChart = null;

// Store transactions
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const transactionsList = document.getElementById('transactionsList');
const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpenses = document.getElementById('totalExpenses');

// Initialize the application
function init() {
    try {
        setupCharts();
        updateUI();
        renderTransactions();
    } catch (error) {
        console.error('Error initializing application:', error);
        showError('Failed to initialize the application. Please refresh the page.');
    }
}

// Setup Chart.js charts
function setupCharts() {
    try {
        // Destroy existing charts if they exist
        if (expenseChart) expenseChart.destroy();
        if (balanceChart) balanceChart.destroy();
        if (trendChart) trendChart.destroy();

        // Expense Categories Chart
        const expenseCtx = document.getElementById('expenseChart').getContext('2d');
        expenseChart = new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF6384',
                        '#36A2EB'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                return `₹${value.toLocaleString('en-IN')}`;
                            }
                        }
                    }
                }
            }
        });

        // Income vs Expenses Chart
        const balanceCtx = document.getElementById('balanceChart').getContext('2d');
        balanceChart = new Chart(balanceCtx, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#28a745', '#dc3545'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                return `₹${value.toLocaleString('en-IN')}`;
                            }
                        }
                    }
                }
            }
        });

        // Trend Chart
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Income',
                        data: [],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Expenses',
                        data: [],
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.1,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                return `${context.dataset.label}: ₹${value.toLocaleString('en-IN')}`;
                            }
                        }
                    }
                }
            }
        });

        // Mark charts as loaded
        document.querySelectorAll('.chart-container').forEach(container => {
            container.classList.add('loaded');
        });

    } catch (error) {
        console.error('Error setting up charts:', error);
        showError('Failed to initialize charts. Please refresh the page.');
    }
}

// Handle form submission
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        const amount = parseFloat(document.getElementById('amount').value);
        if (isNaN(amount) || amount <= 0) {
            showError('Please enter a valid amount');
            return;
        }

        const transaction = {
            id: Date.now(),
            description: document.getElementById('description').value.trim(),
            amount: amount,
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            date: new Date().toISOString()
        };

        transactions.push(transaction);
        saveTransactions();
        updateUI();
        renderTransactions();
        transactionForm.reset();
        showSuccess('Transaction added successfully!');
    } catch (error) {
        console.error('Error adding transaction:', error);
        showError('Failed to add transaction. Please try again.');
    }
});

// Save transactions to localStorage
function saveTransactions() {
    try {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (error) {
        console.error('Error saving transactions:', error);
        showError('Failed to save transactions. Please check your browser storage settings.');
    }
}

// Update UI elements
function updateUI() {
    try {
        const { total, income, expenses } = calculateTotals();
        
        totalBalance.textContent = formatCurrency(total);
        totalIncome.textContent = formatCurrency(income);
        totalExpenses.textContent = formatCurrency(expenses);

        updateCharts();
    } catch (error) {
        console.error('Error updating UI:', error);
        showError('Failed to update the interface. Please refresh the page.');
    }
}

// Calculate totals
function calculateTotals() {
    return transactions.reduce((acc, transaction) => {
        if (transaction.type === 'income') {
            acc.income += transaction.amount;
        } else {
            acc.expenses += transaction.amount;
        }
        acc.total = acc.income - acc.expenses;
        return acc;
    }, { total: 0, income: 0, expenses: 0 });
}

// Update charts with current data
function updateCharts() {
    try {
        if (!expenseChart || !balanceChart || !trendChart) {
            setupCharts();
        }

        // Update expense categories chart
        const expenseData = calculateExpenseCategories();
        if (expenseData.labels.length > 0) {
            expenseChart.data.labels = expenseData.labels;
            expenseChart.data.datasets[0].data = expenseData.data;
            expenseChart.update('none'); // Use 'none' mode for better performance
        }

        // Update income vs expenses chart
        const { income, expenses } = calculateTotals();
        balanceChart.data.datasets[0].data = [income, expenses];
        balanceChart.update('none');

        // Update trend chart
        const trendData = calculateTrendData();
        if (trendData.labels.length > 0) {
            trendChart.data.labels = trendData.labels;
            trendChart.data.datasets[0].data = trendData.income;
            trendChart.data.datasets[1].data = trendData.expenses;
            trendChart.update('none');
        }
    } catch (error) {
        console.error('Error updating charts:', error);
        showError('Failed to update charts. Please refresh the page.');
    }
}

// Calculate expense categories
function calculateExpenseCategories() {
    const categories = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

    return {
        labels: Object.keys(categories),
        data: Object.values(categories)
    };
}

// Calculate trend data
function calculateTrendData() {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const monthlyData = {};
    
    sortedTransactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
            monthlyData[monthYear].income += transaction.amount;
        } else {
            monthlyData[monthYear].expenses += transaction.amount;
        }
    });

    return {
        labels: Object.keys(monthlyData),
        income: Object.values(monthlyData).map(data => data.income),
        expenses: Object.values(monthlyData).map(data => data.expenses)
    };
}

// Render transactions list
function renderTransactions() {
    try {
        transactionsList.innerHTML = '';
        if (transactions.length === 0) {
            transactionsList.innerHTML = '<div class="no-transactions">No transactions yet</div>';
            return;
        }

        transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(transaction => {
                const transactionElement = document.createElement('div');
                transactionElement.className = `transaction-item ${transaction.type}`;
                transactionElement.innerHTML = `
                    <div class="transaction-info">
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-category">${transaction.category}</div>
                        <div class="transaction-date">${formatDate(transaction.date)}</div>
                    </div>
                    <div class="transaction-amount ${transaction.type === 'income' ? 'income' : 'expense'}">
                        ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
                    </div>
                `;
                transactionsList.appendChild(transactionElement);
            });
    } catch (error) {
        console.error('Error rendering transactions:', error);
        showError('Failed to display transactions. Please refresh the page.');
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init); 