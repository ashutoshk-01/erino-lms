const fs = require('fs');
const path = require('path');

// Ensure build directory exists
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

// Create runtime config with environment variables
const runtimeConfig = {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'https://erino-lms-production.up.railway.app/api'
};

fs.writeFileSync(
    path.join(buildDir, 'runtime-config.js'),
    `window.RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig)};`
);
