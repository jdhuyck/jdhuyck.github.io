const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const config = {
  port: 3000,
  watchFiles: ['index.html', 'public/style.css'],
  liveServer: true
};

// Development server setup
if (config.liveServer) {
  const liveServer = require('live-server');

  const params = {
    port: config.port,
    host: 'localhost',
    root: '.',
    open: false,
    ignore: 'node_modules',
    file: 'index.html',
    wait: 1000,
    logLevel: 2
  };

  liveServer.start(params);
  console.log(`Server running at http://localhost:${config.port}`);
}

// File watcher for development
if (process.argv.includes('--watch')) {
  console.log('Watching files for changes...');
  
  config.watchFiles.forEach(file => {
    fs.watch(file, (eventType, filename) => {
      if (eventType === 'change') {
        console.log(`${filename} changed`);
        // Add any build/processing steps here
      }
    });
  });
}

// Utility functions
function minifyCSS() {
  // This would be implemented with a CSS minifier
  console.log('Minifying CSS...');
}

function validateHTML() {
  exec('npx html-validate index.html', (error, stdout, stderr) => {
    if (error) {
      console.error('HTML validation errors:');
      console.error(stdout);
      return;
    }
    console.log('HTML is valid');
  });
}

// Export for testing if needed
module.exports = {
  config,
  minifyCSS,
  validateHTML
};