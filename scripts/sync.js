const fs = require('fs');
const path = require('path');

const webringPath = path.join(__dirname, '..', 'webring.json');
const indexPath = path.join(__dirname, '..', 'index.html');

function sync() {
    const webring = JSON.parse(fs.readFileSync(webringPath, 'utf8'));
    let index = fs.readFileSync(indexPath, 'utf8');

    const memberList = webring.sites.map(site => {
        const id = site.name.toLowerCase().replace(/\s+/g, '-');
        const url = site.link.includes('://') ? site.link : `https://${site.link}`;
        return `\t\t\t<li data-lang="en" id="${id}">\n\t\t\t\t<a href="${url}">${site.name}</a>\n\t\t\t</li>`;
    }).join('\n');

    const startMarker = '<!-- members-start -->';
    const endMarker = '<!-- members-end -->';
    const regex = new RegExp(`${startMarker}[\\s\\S]*${endMarker}`);

    if (!index.includes(startMarker) || !index.includes(endMarker)) {
        console.error('Markers not found in index.html. Please add <!-- members-start --> and <!-- members-end -->.');
        process.exit(1);
    }

    index = index.replace(regex, `${startMarker}\n${memberList}\n\t\t\t${endMarker}`);
    fs.writeFileSync(indexPath, index);
    console.log('Successfully synced index.html with webring.json');
}

sync();
