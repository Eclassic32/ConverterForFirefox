let convertTo;
let currencyNames;

document.addEventListener('mouseup', async function () {
    const selectedText = window.getSelection().toString().trim();
    const textCurrency = await isCurrencyInText(selectedText);

    if (textCurrency.currency == null) { return; }

    currencyNames = await getCurrencyData();    
    if (currencyNames[textCurrency.currency] == undefined) {
        console.log(`Currency code not found: ${textCurrency.currency}`);
        return;
    }

    browser.storage.local.get(['userCurrency']).then((result) => {
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
    // Prevent conversion of same currency
    if (convertTo == textCurrency.currency) {
        return;
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

async function fetchAPIdata(url, storageKey) {
    console.debug(`Fetching API data from the server: ${storageKey}, ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        let storageObject = {};
        storageObject[storageKey] = JSON.stringify(data);
        await browser.storage.local.set(storageObject);
        console.debug(`API data fetched and stored: ${storageKey}`);
        return data;
    } catch (error) {
        console.error('Error fetching API data:', error);
        return null;
    }
}

async function getCurrencyData(currencyCode = false) {
    const storageKey = (currencyCode) ? `conversion-${currencyCode}` : "conversion-currencyData";
    let savedData = await browser.storage.local.get(storageKey);
    const currentDate = new Date().toISOString().split('T')[0]; // Format current date as "YYYY-MM-DD"

    if (savedData[storageKey]) {
        savedData = JSON.parse(savedData[storageKey]);
        
        // --- This code is ment to check if the data is outdated, but API doenst have consistent/updated data??? ---
        // if (savedData.date === currentDate || !currencyCode) {
        if (!currencyCode) {
            return savedData;
        }
    }

    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies` + ((currencyCode) ? `/${currencyCode}.json` : `.min.json`);
    let APIdata = await fetchAPIdata(url, storageKey);
    if (APIdata == null) {
        const fallbackURL = `https://${currentDate}.currency-api.pages.dev/v1/currencies` + ((currencyCode) ? `/${currencyCode}.json` : `.min.json`);
        return await fetchAPIdata(fallbackURL, storageKey);
    }
    return APIdata;
}

async function isCurrencyInText(text) {
    let currency, amount;
    // Regular expression to match 3-letter currency codes (like USD, EUR)
    const currencyRegex = /\b[A-Z]{3}\b/i;
    const currencyMatch = text.match(currencyRegex);
    currency = currencyMatch ? (currencyMatch[0]).toLowerCase() : null;

    // Check if any unicode characters match
    if (!currency) {
        const response = await fetch(browser.runtime.getURL('unicode.json'));
        const unicodeData = await response.json();
        for (const entry of unicodeData) {
            if (text.includes(entry.unicode)) {
                currency = entry.main;
                break;
            }
        }
    }
    
    // Regular expression to match amounts (supporting commas and decimals)
    const amountRegex = /\b\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{1,2})?\b|\b\d+(?:[.,]\d{1,2})?\b/g;
    const amountMatch = text.match(amountRegex);
    if (amountMatch && amountMatch.length > 0) {
        let numberStr = amountMatch[0]; // Get the first match
        // Replace spaces and commas used as thousand separators
        numberStr = numberStr.replace(/[,\s]/g, '');
        // Replace comma as decimal separator with dot for correct float parsing
        numberStr = numberStr.replace(/,/, '.');
        // Parse the cleaned number string as a float
        amount = parseFloat(numberStr);
    }

    
    // Return either currency and amount or null
    if            ( currency == null || amount == null ){
        return    { currency:   null,   amount:   null };
    }
    console.debug({ currency: currency, amount: amount });
    return        { currency: currency, amount: amount };
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

    // Append the tooltip to the body
    document.body.appendChild(tooltip);
}