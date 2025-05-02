const button = document.getElementById('toggle');
const counter = document.getElementById('counter');
const todayCounter = document.getElementById('today');
const weekCounter = document.getElementById('week');
const totalCounter = document.getElementById('total');

chrome.storage.local.get('adblockEnabled', (data) => {
  const enabled = data.adblockEnabled ?? true;
  updateButton(enabled);
});

button.onclick = () => {
  chrome.storage.local.get('adblockEnabled', (data) => {
    const enabled = !(data.adblockEnabled ?? true);
    chrome.storage.local.set({ adblockEnabled: enabled }, () => {
      chrome.runtime.sendMessage({ toggle: enabled });
      updateButton(enabled);
    });
  });
};

function updateButton(enabled) {
  button.textContent = enabled ? 'Turn OFF' : 'Turn ON';
  button.className = enabled ? '' : 'off';
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function updateCounters(newAdsBlocked = 0) {
  const now = new Date();
  const todayDate = now.toDateString();
  const weekNumber = getWeekNumber(now);

  chrome.storage.local.get(['adBlockStats', 'blockedCount'], (result) => {
    let stats = result.adBlockStats || {
      total: 0,
      today: { date: todayDate, count: 0 },
      week: { weekNumber: weekNumber, count: 0 }
    };

    // Atualiza a data se for um novo dia
    if (stats.today.date !== todayDate) {
      stats.today = { date: todayDate, count: 0 };
    }

    // Atualiza a semana se for uma nova semana
    if (stats.week.weekNumber !== weekNumber) {
      stats.week = { weekNumber: weekNumber, count: 0 };
    }

    // Atualiza os contadores
    const blockedCount = result.blockedCount || 0;
    const countDifference = blockedCount - stats.total;
    
    stats.total = blockedCount;
    stats.today.count += countDifference;
    stats.week.count += countDifference;

    // Salva os dados atualizados
    chrome.storage.local.set({ adBlockStats: stats }, () => {
      updateUI(stats);
    });
  });
}

function updateUI(stats) {
  counter.innerHTML = `Blocked ads: <span class="counter-number">${stats.total.toLocaleString()}</span>`;
  todayCounter.textContent = stats.today.count.toLocaleString();
  weekCounter.textContent = stats.week.count.toLocaleString();
  totalCounter.textContent = stats.total.toLocaleString();
}

updateCounters();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.updateCounters) {
    updateCounters();
  }
});

// Atualiza os contadores periodicamente (opcional)
setInterval(updateCounters, 30000);