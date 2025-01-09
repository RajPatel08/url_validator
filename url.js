const fs = require("fs");
const path = require("path");
const readline = require("readline");
const https = require("https");
const { URL } = require("url"); // Import URL module to easily work with URL parsing

const DATA_FILE = path.join(__dirname, "url_checks.json");

// Initialize the data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Function to load results from the file
function loadResults() {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
}

// Function to save results to the file
function saveResults(results) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(results, null, 2));
}

// Function to validate URL format
function isValidUrl(url) {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-])\/?$/;
    return urlRegex.test(url);
}

// Function to check if a URL is accessible
function checkUrlAccessibility(url) {
    return new Promise((resolve) => {
        https
            .get(url, (res) => {
                resolve(res.statusCode === 200 ? "Accessible" : "Blocked");
            })
            .on("error", () => {
                resolve("Blocked");
            });
    });
}

// Function to extract query parameters from a URL
function extractQueryParams(url) {
    const parsedUrl = new URL(url); // Parse the URL
    const params = new URLSearchParams(parsedUrl.search); // Get search params
    const paramObject = {};

    // Loop through parameters and convert to an object
    params.forEach((value, key) => {
        paramObject[key] = value;
    });

    return paramObject;
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

    // If the URL is accessible, extract search parameters
    let queryParams = {};
    if (status === "Accessible") {
        queryParams = extractQueryParams(url);
    }

    const results = loadResults();
    results.push({ url, status, queryParams });
    saveResults(results);

    console.log(`URL: ${url}\nStatus: ${status}`);
    if (status === "Accessible" && Object.keys(queryParams).length > 0) {
        console.log("Search Parameters:", queryParams);
    }

    showMenu();
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
            if (result.status === "Accessible") {
                // If queryParams exist, display them; otherwise, skip
                if (result.queryParams && Object.keys(result.queryParams).length > 0) {
                    console.log("  Search Parameters:", result.queryParams);
                }
            }
        });
    }
    showMenu();
}

// Start the application
showMenu();
