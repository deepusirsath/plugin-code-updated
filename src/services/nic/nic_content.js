let emailId = ""

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "initializeNicScript") {
        console.log("Initializing NIC email script");
        chrome.storage.local.set({ registration: true });
        chrome.storage.local.get("registration", (data) => {
            if (chrome.runtime.lastError) {
                return;
            }
            if (data.registration) {
                setTimeout(() => { }, 500);
                console.log("Registration data found:", data.registration);
                initializeSetupListener();
            }
        });
        return true;
    }
});

function initializeSetupListener() {
    setupMailItemClickListeners();
    findEmailId();
    setTimeout(() => {
        disableButtonDiv();
    },500);

}


let lastClickedMailId = null;
let lastClickTime = 0;
const setupMailItemClickListeners = () => {
    const mailListContainer = document.getElementById('zl__CLV-main__rows');

    if (!mailListContainer) {
        console.log("Mail list container not found, will retry later");
        setTimeout(setupMailItemClickListeners, 1000);
        return;
    }

    mailListContainer.addEventListener('click', (event) => {
        const mailItem = event.target.closest('li.RowDouble');
        if (mailItem) {
            const isOdd = mailItem.classList.contains('RowOdd');
            const isEven = mailItem.classList.contains('RowEven');

            if (isOdd || isEven) {
                const mailId = mailItem.id;
                const currentTime = Date.now();
                if (mailId === lastClickedMailId && (currentTime - lastClickTime) < 300) {
                    return;
                }
                lastClickedMailId = mailId;
                lastClickTime = currentTime;

                // Extract relevant information from the mail item
                const subjectElement = mailItem.querySelector('[id$="__su"] span:first-child');
                const senderElement = mailItem.querySelector('[id$="__pa__0"]');
                const dateElement = mailItem.querySelector('[id$="__dt"]');
                const mailInfo = {
                    id: mailId,
                    subject: subjectElement ? subjectElement.textContent : 'Unknown Subject',
                    sender: senderElement ? senderElement.textContent : 'Unknown Sender',
                    date: dateElement ? dateElement.textContent : 'Unknown Date',
                    rowType: isOdd ? 'RowOdd' : 'RowEven'
                };

                console.log('Mail item clicked:', mailInfo);

                // Increase delay to allow more time for DOM elements to load
                setTimeout(() => {
                    console.log("Mail info found lets extract the funcrtion");
                    ExtractIDForEMLFile();
                }, 1500); // Increased from 1000 to 2000ms
            }
        }
    });
};


let data = {};

function ExtractIDForEMLFile() {
    const let1 = document.querySelectorAll(".date");
    console.log("Extracting ID for EML file from date elements:", let1);
    let latest = { date: null, id: null, number: null };

    let1.forEach(el => {
        const dateText = el.innerText;
        const date = new Date(dateText);
        const id = el.id || "";

        // Extract the number from the ID using RegExp
        const match = id.match(/main_MSGC(\d+)__header_dateCell/);
        const number = match ? match[1] : null;

        if (!latest.date || date > latest.date) {
            latest.date = date;
            latest.id = id;
            latest.number = number;
        }
    });
    data = {
        latestDate: latest.date.toString(),
        elementId: latest.id,
        extractedNumber: latest.number,
        userName: "Ekvayu"
    };
    generateUniqueId(latest.date.toString(), latest.id, latest.number, emailId);
    console.log("Data extracted for EML file:", data);
}

function generateUniqueId(latestDate, elementId, extractedNumber, userName) {
    console.log("Generating unique ID for EML file with data:", latestDate, elementId, extractedNumber, userName);
    const date = new Date(latestDate);
    const formattedDate = date.getFullYear().toString() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0') +
        String(date.getHours()).padStart(2, '0') +
        String(date.getMinutes()).padStart(2, '0') +
        String(date.getSeconds()).padStart(2, '0');
    const safeUser = userName.replace(/\W+/g, '').toLowerCase();
    console.log(`MessageId : uid_${safeUser}_${extractedNumber}_${formattedDate}`);
}

function findEmailId() {
    // Try to extract email from the page source
    console.log("Finding email ID from page source");
    const pageSource = document.documentElement.innerHTML;
    const emailRegex = /zimbraPrefFromAddress":"([^"]+)"/;
    const match = pageSource.match(emailRegex);

    if (match && match[1]) {
        emailId = match[1];
        console.log("Found email:", emailId);
    }
    return null;
}

function disableButtonDiv() {
    const buttonDivs = document.querySelectorAll(".ZmMsgListExpand");
    if (buttonDivs && buttonDivs.length > 0) {
        buttonDivs.forEach(buttonDiv => {
            buttonDiv.style.pointerEvents = "none";
            buttonDiv.style.opacity = "0.5";
            buttonDiv.style.cursor = "not-allowed";
        });
        console.log(`${buttonDivs.length} button divs have been disabled.`);
    } else {
        console.log("Button divs not found.");
    }
}
