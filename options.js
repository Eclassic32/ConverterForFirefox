
const userCurrencyInput = document.getElementById('userCurrency');
const saveButton = document.getElementById('saveButton');
const statusElement = document.getElementById('status');

// Load saved settings
browser.storage.sync.get(['userCurrency']).then((result) => {
    if (result.userCurrency) {
        userCurrencyInput.value = result.userCurrency;
    }
});

// Save settings
saveButton.addEventListener('click', function () {
    const userCurrency = userCurrencyInput.value;
    browser.storage.sync.set({ userCurrency: userCurrency });
    browser.storage.local.set({ userCurrency: userCurrency });

    statusUpdate();
});

function statusUpdate(classes = "visible", text = "Settings saved") {
    statusElement.classList.remove("hidden");
    statusElement.classList.add(classes);
    statusElement.textContent = text;

    setTimeout(function() {
        statusElement.classList.remove(classes);
        statusElement.classList.add("hidden");
    }, 3000); // 1000ms = 1 seconds
}