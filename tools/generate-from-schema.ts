import 'source-map-support/register';
import * as fs from 'fs';
import * as path from 'path';
import { compileFromFile } from 'json-schema-to-typescript';

async function readDir(path : string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err)
                reject(err);
            else
                resolve(files);
        });
    });
}

async function writeFile(path : string, content : string) {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile(path, content, (err) => {
            if (err)
                reject();
            else
                resolve();
        })
    });
}

async function processSchema(inputFile : string, cwd : string, outputDir : string) {
    console.log(`Processing ${inputFile}...`);
    let result = await compileFromFile(inputFile, {
        cwd
    });
    let filename = path.basename(inputFile, '.json');
    await writeFile(`${outputDir}/${filename.replace(/_/g, '-')}.ts`, result);
}

async function main(args : string[]) {
    let [inputDir, outputDir] = args;

    console.log(`Reading from ${inputDir} and writing to ${outputDir}...`);
    for (let inputFile of await readDir(inputDir))
        await processSchema(path.join(inputDir, inputFile), inputDir, outputDir);
}

main(process.argv.slice(2));