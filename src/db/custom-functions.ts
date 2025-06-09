// This script will populate the db with custom functions in 0001_custom_functions.sql
import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

async function runPsqlFile() {
  return new Promise<void>((resolve, reject) => {
    const psql = spawn('psql', [
      '-h', process.env.RDS_UIUC_POSTGRES_ENDPOINT as string,
      '-U', process.env.RDS_UIUC_POSTGRES_USERNAME as string,
      '-d', 'postgres',
      '-f', './src/db/migrations/0001_custom_functions.sql'
    ], {
      env: {
        ...process.env,
        PGPASSWORD: process.env.RDS_UIUC_POSTGRES_PASSWORD,  
      }
    });

    psql.stdout.on('data', data => console.log(data.toString()));
    psql.stderr.on('data', data => console.error(data.toString()));
    psql.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`psql exited with code ${code}`));
    });
  });
}

runPsqlFile()
  .then(() => console.log('Done'))
  .catch(err => console.error(err));