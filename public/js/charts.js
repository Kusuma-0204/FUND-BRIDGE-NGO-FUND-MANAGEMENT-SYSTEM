/**
 * =============================================================================
 * FUND BRIDGE: Charts & Visualizations
 * Renders Inflow vs Outflow bar/line charts and Category Donut charts
 * =============================================================================
 */

const FB_CHARTS = (function() {
  let incomeExpenseChart = null;
  let categoryDonutChart = null;

  function renderIncomeExpenseChart(canvasId, monthlyData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Check if Chart.js is loaded
    if (typeof Chart !== 'undefined') {
      if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
      }

      const ctx = canvas.getContext('2d');
      incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: monthlyData.labels || ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
          datasets: [
            {
              label: 'Donations Inflow ($)',
              data: monthlyData.inflow || [45000, 78000, 92000, 115000, 140000, 162500],
              backgroundColor: '#0d9488',
              borderRadius: 6
            },
            {
              label: 'Disbursed Expenses ($)',
              data: monthlyData.outflow || [38000, 62000, 74000, 89000, 110000, 124800],
              backgroundColor: '#f59e0b',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } }
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#ffffff',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#94a3b8',
                font: { family: 'Plus Jakarta Sans' },
                callback: function(val) { return '$' + val.toLocaleString(); }
              }
            }
          }
        }
      });
    }
  }

  function renderCategoryDonutChart(canvasId, categoryMap) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (typeof Chart !== 'undefined') {
      if (categoryDonutChart) {
        categoryDonutChart.destroy();
      }

      const labels = Object.keys(categoryMap || {
        'Education Aid': 45000,
        'Healthcare & Relief': 38000,
        'Disaster Food Supplies': 25000,
        'Clean Water Wells': 16800
      });

      const values = Object.values(categoryMap || {
        'Education Aid': 45000,
        'Healthcare & Relief': 38000,
        'Disaster Food Supplies': 25000,
        'Clean Water Wells': 16800
      });

      const ctx = canvas.getContext('2d');
      categoryDonutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: [
              '#0d9488',
              '#f59e0b',
              '#3b82f6',
              '#10b981',
              '#8b5cf6',
              '#ec4899'
            ],
            borderColor: '#0f172a',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } }
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#ffffff',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              callbacks: {
                label: function(item) {
                  return ` ${item.label}: $${item.raw.toLocaleString()}`;
                }
              }
            }
          },
          cutout: '70%'
        }
      });
    }
  }

  return {
    renderIncomeExpenseChart,
    renderCategoryDonutChart
  };
})();

window.FB_CHARTS = FB_CHARTS;
