# NFT CSV PARSER

This tool takes a CSV containing records of NFTs from different teams and generates CHIP-0007 compatible JSONs for each NFT, hash the JSONs and also store the sha256 hash of the JSON in a new output CSV

## Installation

Run npm install to install the dependencies

## Run

npm run start

## Usage

node src/script.js --file [csv file path] --output [output directory for the JSON files]

### Options

1. --help Show help
2. --file, -f The path to the input CSV file (required)
3. --output, -o The path to the output directory for the JSON files (required)

### Example

The program requires the input CSV file to be passed as a command-line argument using the -f or --file option. You can also use the -o or --output option to specify the folder to store the generated JSON files. This makes it easier to organize the output files

node script.js -f newOutput.csv -o jsonNFTs

This command will generate a newOutput.output.csv file and a folder jsonNFTs with the JSONs stored inside
