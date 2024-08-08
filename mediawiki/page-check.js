/**
 * Copyright (c) 2024 Merlin Brandes (FatalMerlin) <merlin.brandes@gmail.com>
 * This code is subject to the MIT license.
 * For more information, see the LICENSE file at the root of this project.
 */

const https = require('node:https');
const fs = require('node:fs');

const adjectives = [
    'Congealed',
    'Humming',
    'Preserved',
    'Oily',
    'Pungent',
    'Hairy',
    'Gooey',
    'Bloody',
    'Writhing',
    'Pulsating',
    'Fresh',
    'Writhing',
    'Gelatinous',
    'Glutinous',
    'Tooth-studded',
    'Jellied',
    'Gummy',
    'Gluey',
    'Viscous',
];

const nouns = [
    'Remains',
    'Mould',
    'Flesh',
    'Fluids',
    'Worm-Meat',
    'Larva',
    'Nodule',
    'Spores',
    'Lump',
    'Lump',
    'Gelsack',
    'Tentacle',
    'Stalks',
    'Tendril',
    'Matter',
];

const names = [];

for (let adjective of adjectives) {
    for (let noun of nouns) {
        names.push(adjective + ' ' + noun);
    }
}

console.log('Found', names.length, 'names to check');

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function get(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let result = '';

            res.on('data', (data) => {
                result += data.toString();
            });

            res.on('end', () => {
                resolve({ body: result, ...res });
            });
        });
    });
}

async function query(name) {
    const nameUrlEncoded = encodeURIComponent(name);

    const res = await get(
        `https://nomanssky.fandom.com/api.php?action=query&format=json&titles=${nameUrlEncoded}`
    );

    if (res.statusCode !== 200) {
        console.error(
            'Error when fetching',
            name,
            ':',
            res.statusCode,
            res.body
        );
    }

    return JSON.parse(res.body);
}

async function save(found) {
    console.log('Saving', found.length, 'results');

    fs.writeFileSync('./page-check.json', JSON.stringify(found));
}

async function main() {
    const found = [];
    let index = 0;

    const _names = names;
    // const _names = names.slice(0, 10);
    // const _names = ['Recovered Item (LUMP)'];
    // const _names = ['Recovered Item (LUMP)', ...names.slice(0, 10)];

    for (let name of _names) {
        index++;

        const progress = Math.round((index / _names.length) * 100);
        console.log('Checking', name, '(', progress, '%)');

        const json = await query(name);
        const pageId = Object.keys(json.query.pages)[0];

        if (pageId !== '-1') {
            const url = `https://nomanssky.fandom.com/wiki/Special:Redirect/page/${pageId}`;
            // https://nomanssky.fandom.com/wiki/Special:Redirect/page/574015
            console.log('Found', name, 'at', url);

            found.push({
                name,
                pageId,
                url,
            });
        }

        await sleep(200);
    }

    await save(found);
}

main();
