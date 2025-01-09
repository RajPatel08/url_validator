const fs = require("fs");
const path = require("path");
const readline = require("readline");
const https = require("https");

const DATA_FILE = path.join(__dirname, "url_checks.json");

// Initialize the data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Function to load results from the file
function loadResults() {
    try {
        const data = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading results:", error);
        return [];
    }
}

// Function to save results to the file
function saveResults(results) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(results, null, 2));
    } catch (error) {
        console.error("Error saving results:", error);
    }
}

// Function to validate URL format
function isValidUrl(url) {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return urlRegex.test(url);
}

// Function to check if a URL is accessible
function checkUrlAccessibility(url) {
    return new Promise((resolve) => {
        // Ensure the URL has a protocol (https://) if missing
        if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
        }

        https
            .get(url, (res) => {
                resolve(res.statusCode === 200 ? "Accessible" : "Blocked");
            })
            .on("error", (err) => {
                console.error("Error checking URL:", err);
                resolve("Blocked");
            });
    });
}

// CLI Interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Main Menu
function showMenu() {
    console.log("\n--- URL Checker CLI Application ---");
    console.log("1. Check a URL");
    console.log("2. View URL Results");
    console.log("3. Exit");
    rl.question("Choose an option: ", handleUserInput);
}

// Handle user input
function handleUserInput(option) {
    switch (option) {
        case "1":
            rl.question("Enter a URL to check: ", processUrl);
            break;
        case "2":
            viewResults();
            break;
        case "3":
            console.log("Goodbye!");
            rl.close();
            break;
        default:
            console.log("Invalid option. Please try again.");
            showMenu();
    }
}

// Process URL input
async function processUrl(url) {
    if (!isValidUrl(url)) {
        console.log("Invalid URL format.");
        showMenu();
        return;
    }

    console.log("Checking URL...");
    const status = await checkUrlAccessibility(url);
    const results = loadResults();

    // Store the URL and its status
    results.push({ url, status });
    saveResults(results);

    console.log(`URL: ${url}\nStatus: ${status}`);
    showMenu(); // Show the menu after processing
}

// View saved results
function viewResults() {
    const results = loadResults();
    if (results.length === 0) {
        console.log("\nNo URL checks have been performed yet.");
    } else {
        console.log("\n--- URL Check Results ---");
        results.forEach((result, index) => {
            console.log(`${index + 1}. URL: ${result.url} | Status: ${result.status}`);
        });
    }
    showMenu();
}

// Start the application
showMenu();
