const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const csv = require('fast-csv');
const createCsvWriter =
  require('csv-writer').createObjectCsvWriter;

const argv = yargs(hideBin(process.argv))
  .option('file', {
    alias: 'f',
    demandOption: true,
    describe: 'Path to input CSV file',
    type: 'string',
  })
  .option('output', {
    alias: 'o',
    demandOption: true,
    describe: 'Path to output the JSON files',
    type: 'string',
    default: '.',
  })
  .usage(
    `Usage: $0 --file <csv file path> --output <output directory for the new JSON files>`
  ).argv;

let csvWriter;
let teamName = '';
const nfts = [];
const data = [];
const filePath = argv.file;
const filename = path.basename(filePath, '.csv');
const outputDir = argv.output;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.createReadStream(filePath)
  .pipe(csv.parse({ headers: true }))
  .on('headers', (headers) => {
    headers.push('Hashed');
    console.log(headers);

    csvWriter = createCsvWriter({
      path: `${filename}.output.csv`,
      header: headers,
    });

    const headerRow = {};
    headers.forEach((col) => {
      headerRow[col] = col;
    });

    headerRow['Hashed'] = 'Hashed';
    data.push(headerRow);
  })
  .on('data', (row) => {
    const temp = row['Series Number'] ?? '';
    if (temp.toLowerCase().startsWith('team')) {
      teamName = temp;
    }

    if (row['Filename']) {
      nfts.push({ ...row, Team: teamName });
      data.push(row);
    } else {
      // this is an incomplete row or not a valid NFT
      data.push(row);
    }
  })
  .on('close', () => {
    // Process the NFTs
    nfts.forEach((nft) => {
      const jsonData = {
        format: 'CHIP-0007',
        name: nft['Name'],
        description: nft['Description'],
        minting_tool: nft['Team'],
        sensitive_content: false,
        series_number: parseInt(nft['Series Number']),
        series_total: nfts.length,
        attributes: [
          {
            trait_type: 'gender',
            value: nft['Gender'],
          },
        ],
        collection: {
          name: 'Zuri NFT Tickets for Free Lunch',
          id: 'b774f676-c1d5-422e-beed-00ef5510c64d',
          attributes: [
            {
              type: 'description',
              value:
                'Rewards for accomplishments during HNGi9.',
            },
          ],
        },
      };

      // Add more attributes field if available
      if (nft['Attributes']) {
        nft['Attributes']
          .split(',')
          .forEach((attribute) => {
            if (attribute) {
              try {
                const values = attribute.split(':');
                const traitType = values[0].trim();
                const value = values[1].trim();

                jsonData['attributes'].push({
                  trait_type: traitType,
                  value: value,
                });
              } catch (err) {
                // this was most likely caused by bad input
                console.log(
                  'Invalid attribute format:',
                  attribute,
                  'of NFT:',
                  nft
                );
              }
            }
          });
      }

      const stringifiedJson = JSON.stringify(jsonData);

      // Hash the JSON data
      const hashedJson = crypto
        .createHash('sha256')
        .update(stringifiedJson)
        .digest('hex');

      // Create the JSON file
      fs.writeFileSync(
        `${outputDir}/${nft['Filename']}.json`,
        stringifiedJson
      );

      // Store the hash and the record to our list
      nft['Hashed'] = hashedJson;
    });

    // Write the CSV
    csvWriter
      .writeRecords(data)
      .then(() => console.log('Processing done!'))
      .catch((err) => {
        console.log('You have an error!', err);
      });
  })
  .on('error', (err) => {
    console.log('You have an error!', err);
  });
