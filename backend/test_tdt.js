const https = require('https');
const fs = require('fs');

const TDT_KEY = '7cb53ffa2906c78ebf9b7fe4e63cdff4';
const x = 1689;
const y = 776;
const z = 11;

// URL variations to test
const urls = [
    // 1. img_w with TILEMATRIXSET=w (My current implementation)
    `https://t0.tianditu.gov.cn/img_w/wmts?tk=${TDT_KEY}&SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILECOL=${x}&TILEROW=${y}&TILEMATRIX=${z}`,
    
    // 2. img_c with TILEMATRIXSET=c (Lat/Lon) - shouldn't work for Mapbox directly but maybe valid upstream?
    `https://t0.tianditu.gov.cn/img_c/wmts?tk=${TDT_KEY}&SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILECOL=${x}&TILEROW=${y}&TILEMATRIX=${z}`
];

function testUrl(url, index) {
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    };

    console.log(`Testing URL ${index + 1}: ${url}`);

    https.get(url, options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        console.log(`Content-Length: ${res.headers['content-length']}`);

        let data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => {
            const buffer = Buffer.concat(data);
            console.log(`Downloaded ${buffer.length} bytes`);
            
            // Check for common error signatures
            const str = buffer.slice(0, 100).toString();
            console.log(`First 100 chars: ${str}`);
            
            if (str.includes('xml') || str.includes('html') || str.includes('forbidden')) {
                console.log('Result appears to be text/XML error, not image.');
            } else {
                console.log('Result appears to be binary (likely image).');
            }
            console.log('---');
        });
    }).on('error', err => {
        console.error('Error fetching:', err);
    });
}

urls.forEach((url, i) => testUrl(url, i));
