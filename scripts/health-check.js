const fs = require('fs');
const https = require('https');
const http = require('http');

const webringPath = 'webring.json';

function checkSite(site) {
    return new Promise((resolve) => {
        const url = site.link.includes('://') ? site.link : `https://${site.link}`;
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.get(url, { timeout: 10000 }, (res) => {
            resolve({ name: site.name, link: site.link, status: res.statusCode, ok: res.statusCode < 500 });
            res.resume();
        });
        
        req.on('error', (err) => {
            resolve({ name: site.name, link: site.link, status: null, ok: false, error: err.message });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({ name: site.name, link: site.link, status: null, ok: false, error: 'timeout' });
        });
    });
}

async function healthCheck() {
    const webring = JSON.parse(fs.readFileSync(webringPath, 'utf8'));
    const results = await Promise.all(webring.sites.map(checkSite));
    
    const failures = results.filter(r => !r.ok);
    
    if (failures.length > 0) {
        console.log('Health check FAILED:');
        failures.forEach(f => {
            console.log(`  - ${f.name} (${f.link}): ${f.error || f.status}`);
        });
        
        const failureMsg = failures.map(f => `- **${f.name}** (${f.link}): ${f.error || f.status}`).join('\n');
        const body = `## Health Check Failed\n\nThe following sites are down:\n\n${failureMsg}\n\n---\n_This issue was automatically created by the health check workflow._`;
        
        fs.writeFileSync('issue_body.md', body);
        process.exit(1);
    } else {
        console.log('Health check passed - all sites online');
    }
}

healthCheck();