let convertTo = "kzt";
let currencyNames;

document.addEventListener('mouseup', async function () {
    const selectedText = window.getSelection().toString().trim();
    const textCurrency = isCurrencyInText(selectedText);

    if (textCurrency.currency == null) { return; }

    currencyNames = await getCurrencyData();    
    if (currencyNames[textCurrency.currency] == undefined) {
        console.log(`Currency code not found: ${textCurrency.currency}`);
        return;
    }

    browser.storage.sync.get(['userCurrency']).then((result) => {
        if (result.userCurrency && convertTo != result.userCurrency) {
            convertTo = result.userCurrency;
            console.log(`User currency is set to: ${convertTo}`);
            
        }
    });

    // Remove existing tooltip if any
    let existingTooltip = document.getElementById('currencyconverter-popup');
    if (existingTooltip) {
        existingTooltip.remove();
    }

    let conversion = {  fromCurrency: textCurrency.currency, 
                        toCurrency: convertTo, 
                        fullRates: null,
                        conversionRate: null, 
                        amountFrom: textCurrency.amount,
                        amountTo: null};

    // Fetch conversion rate
    conversion.fullRates = await getCurrencyData(textCurrency.currency);
    conversion.conversionRate = conversion.fullRates[conversion.fromCurrency][conversion.toCurrency];
    conversion.amountTo = conversion.amountFrom * conversion.conversionRate;

    console.debug(conversion);
    createTooltip(`${conversion.amountFrom.toFixed(2)} ${currencyNames[conversion.fromCurrency]} = ${conversion.amountTo.toFixed(2)} ${currencyNames[conversion.toCurrency]}`);
    
});

document.addEventListener('mousedown', function(){
    // Remove existing tooltip if any
    let existingTooltip = document.getElementById('currencyconverter-popup');
    if (existingTooltip) {
        existingTooltip.remove();
    }
});

async function fetchAndStoreCurrencyData(url, storageKey) {
    console.log(`Fetching currency data from the server: ${storageKey}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        let storageObject = {};
        storageObject[storageKey] = JSON.stringify(data);
        await browser.storage.local.set(storageObject);
        return data;
    } catch (error) {
        console.error('Error fetching currency data:', error);
        return null;
    }
}

async function getCurrencyData(currencyCode = false) {
    const storageKey = (currencyCode) ? `conversion-${currencyCode}` : "conversion-currencyData";
    let savedData = await browser.storage.local.get(storageKey);

    // Check if the key exists in the returned object and if it contains actual data
    if (savedData[storageKey]) {
        savedData = JSON.parse(savedData[storageKey]);
        const savedDate = savedData.date;
        const currentDate = new Date().toISOString().split('T')[0]; // Format current date as "YYYY-MM-DD"
        
        if (savedDate === currentDate || !currencyCode) {
            return savedData;
        }
    }

    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies` + ((currencyCode) ? `/${currencyCode}.json` : `.min.json`);
    return await fetchAndStoreCurrencyData(url, storageKey);
}

function isCurrencyInText(text){
    // Regular expression to match 3-letter currency codes (like USD, EUR)
    const currencyRegex = /\b[A-Z]{3}\b/;
    
    // Regular expression to match amounts (supporting commas and decimals)
    const amountRegex = /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/;

    // Extract currency code
    const currencyMatch = text.match(currencyRegex);
    const currency = currencyMatch ? (currencyMatch[0]).toLowerCase() : null;

    // Extract amount
    const amountMatch = text.match(amountRegex);
    const amount = amountMatch ? parseFloat(amountMatch[0].replace(/,/g, '')) : null;

    if (currency == null || amount == null) {
        return {currency: null, amount: null};
    }
    console.debug({currency: currency, amount: amount});

    return {currency: currency, amount: amount};
}

function createTooltip(text = "DebugText") {
    // Create a tooltip element
    let tooltip = document.createElement('div');
    tooltip.id = 'currencyconverter-popup';
    tooltip.innerText = text;

    // Get selection coordinates
    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Set tooltip position near selected text
    tooltip.style.position = 'absolute';
    tooltip.style.top = `${rect.bottom + window.scrollY}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    // tooltip.style.backgroundColor = '#ffeb3b';
    // tooltip.style.border = '1px solid #000';
    // tooltip.style.padding = '5px';
    // tooltip.style.zIndex = '1000';

    // Append the tooltip to the body
    document.body.appendChild(tooltip);
}