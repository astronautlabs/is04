import * as fs from 'fs';

export async function readDir(path : string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err)
                reject(err);
            else
                resolve(files);
        });
    });
}

export async function writeFile(name : string, content : string) {
    await new Promise<void>((res, rej) => {
        fs.writeFile(name, content, e => e ? rej(e) : res());
    });
}

export async function readFile(name : string) {
    return await new Promise<string>((res, rej) => {
        fs.readFile(name, (e, d) => e ? rej(e) : res(d.toString()))
    });
}

export async function readJsonFile<T = any>(name : string): Promise<T> {
    return JSON.parse(await readFile(name));
}
