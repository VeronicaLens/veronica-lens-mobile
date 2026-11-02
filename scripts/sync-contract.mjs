import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const apiRoot = resolve(process.env.VERONICA_LENS_API_PATH ?? '../veronica-lens-api');
const source = resolve(apiRoot, 'src/docs/openapi.ts');
const target = resolve('contracts/openapi.v1.json');

const { openApiDocument } = await import(pathToFileURL(source).href);
if (!openApiDocument?.paths) {
  throw new Error(`No OpenAPI document exported by ${source}`);
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(openApiDocument, null, 2)}\n`);
console.log(`Contract written to ${target} from ${source}`);
