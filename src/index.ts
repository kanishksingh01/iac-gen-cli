#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { generate, Cloud, Format } from './generate';
import { Spinner } from './spinner';

const pkg = require('../package.json') as { version: string; description: string };

const program = new Command();

program
  .name('iac-gen')
  .description(pkg.description)
  .version(pkg.version, '-v, --version', 'Print the current version')
  .argument('<description>', 'Natural language description of the infrastructure to generate')
  .option(
    '-c, --cloud <cloud>',
    'Target cloud provider: aws, gcp, azure',
    'aws'
  )
  .option(
    '-o, --output <file>',
    'Write output to a file instead of stdout'
  )
  .option(
    '-f, --format <format>',
    'Output format: terraform, ansible',
    'terraform'
  )
  .addHelpText(
    'after',
    `
Examples:
  $ iac-gen "create an S3 bucket with versioning" --cloud aws
  $ iac-gen "deploy a GKE cluster with 3 nodes" --cloud gcp --output cluster.tf
  $ iac-gen "nginx on EC2 with ALB" --cloud aws --format terraform
  $ iac-gen "install and configure nginx" --format ansible --output playbook.yml

Environment variables:
  GROQ_API_KEY       Groq API key (preferred)
  IAC_GEN_API_KEY    Alternative API key env var

Get a free Groq API key at: https://console.groq.com`
  )
  .action(async (description: string, options: { cloud: string; output?: string; format: string }) => {
    const cloud = options.cloud as Cloud;
    const format = options.format as Format;

    const validClouds: Cloud[] = ['aws', 'gcp', 'azure'];
    if (!validClouds.includes(cloud)) {
      process.stderr.write(
        chalk.red(`Error: Invalid cloud "${cloud}". Must be one of: ${validClouds.join(', ')}\n`)
      );
      process.exit(1);
    }

    const validFormats: Format[] = ['terraform', 'ansible'];
    if (!validFormats.includes(format)) {
      process.stderr.write(
        chalk.red(`Error: Invalid format "${format}". Must be one of: ${validFormats.join(', ')}\n`)
      );
      process.exit(1);
    }

    const spinner = new Spinner(
      `Generating ${format} for ${cloud.toUpperCase()}...`
    );

    spinner.start();

    let result: string;
    try {
      result = await generate(description, cloud, format);
      spinner.stop(chalk.green('Done.'));
    } catch (err) {
      spinner.stop();
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(chalk.red(`Error: ${message}\n`));
      process.exit(1);
    }

    if (options.output) {
      const outPath = path.resolve(process.cwd(), options.output);
      try {
        fs.writeFileSync(outPath, result + '\n', 'utf8');
        process.stderr.write(chalk.green(`Output written to ${outPath}\n`));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(chalk.red(`Error writing file: ${message}\n`));
        process.exit(1);
      }
    } else {
      process.stdout.write(result + '\n');
    }
  });

program.parse(process.argv);
