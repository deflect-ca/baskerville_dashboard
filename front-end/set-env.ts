// import { writeFile } from 'fs';
const fs = require('fs');
const writeFile = fs.writeFile;
// Configure Angular `environment.ts` file path
const targetPath = './src/environments/environment.prod.ts';
// Load node modules
const colors = require('colors');
require('dotenv').config();
// `environment.ts` file structure
const envConfigFile = `export const environment = {
   baseApiUrl: '${process.env.API_BASE_URL}',
   socketUrl: '${process.env.SOCKET_URL}',
   maxFileSize: 50,
   submitMethod: 'local'
};
`;
console.log(colors.magenta('The file `environment.prod.ts` will be written with the following content: \n'));
console.log(colors.grey(envConfigFile));
writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    throw console.error(err);
  } else {
    console.log(colors.magenta(`Angular environment.ts file generated correctly at ${targetPath} \n`));
  }
});
