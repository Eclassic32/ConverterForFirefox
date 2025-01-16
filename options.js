
const userCurrencyInput = document.getElementById('userCurrency');
const saveButton = document.getElementById('saveButton');
const statusElement = document.getElementById('status');

// Load saved settings
browser.storage.local.get(['userCurrency']).then((result) => {
    if (result.userCurrency) {
        userCurrencyInput.value = (result.userCurrency).toUpperCase();
    }
});

// Save settings
saveButton.addEventListener('click', async function () {
    let savedData = {};
    
    // Validate currency code
    if (userCurrencyInput.value == "") {
        statusUpdate("visible error", "Currency code cannot be empty");
        return;
    }
    const currencyNames = await browser.storage.local.get("conversion-currencyData");;    
    if (currencyNames[userCurrencyInput.value] == undefined) {
        statusUpdate("visible error", `Currency code not found: ${textCurrency.currency}`);
        return;
    }
    savedData.userCurrency = userCurrencyInput.value.toLowerCase();

    // Save settings
    browser.storage.local.set(savedData);
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