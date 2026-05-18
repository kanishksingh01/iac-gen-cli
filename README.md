# iac-gen-cli

Generate Terraform HCL and Ansible playbooks from natural language using AI.

A CLI companion to the [IaC Generator web app](https://iac-generator.vercel.app), powered by Groq's `llama-3.3-70b-versatile` model.

## Installation

```bash
npm install -g iac-gen-cli
```

Or run without installing:

```bash
npx iac-gen-cli "create an S3 bucket with versioning"
```

## Setup

Get a free API key from [console.groq.com](https://console.groq.com), then export it:

```bash
export GROQ_API_KEY=your_key_here
```

Add it to your shell profile (`~/.bashrc`, `~/.zshrc`) to persist it.

## Usage

```
iac-gen <description> [options]

Arguments:
  description    Natural language description of the infrastructure to generate

Options:
  -c, --cloud <cloud>    Target cloud provider: aws, gcp, azure  (default: "aws")
  -o, --output <file>    Write output to a file instead of stdout
  -f, --format <format>  Output format: terraform, ansible       (default: "terraform")
  -v, --version          Print the current version
  -h, --help             Display help
```

## Examples

### Generate Terraform for AWS

```bash
iac-gen "create an S3 bucket with versioning enabled" --cloud aws
```

### Write output to a file

```bash
iac-gen "deploy a GKE cluster with 3 nodes" --cloud gcp --output cluster.tf
```

### Generate for Azure

```bash
iac-gen "create a virtual network with two subnets" --cloud azure --output network.tf
```

### Generate an Ansible playbook

```bash
iac-gen "install and configure nginx with SSL" --format ansible --output nginx.yml
```

### Combine flags

```bash
iac-gen "nginx on EC2 behind an ALB" --cloud aws --format terraform --output ec2-alb.tf
```

## Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key (preferred) |
| `IAC_GEN_API_KEY` | Alternative env var name |

## Output behavior

- Without `--output`: prints generated code to **stdout** (pipe-friendly)
- With `--output <file>`: writes to the specified file, confirms path on **stderr**
- Spinner and status messages always go to **stderr** so stdout stays clean

## Pipe-friendly usage

Since all status output goes to stderr, you can safely pipe stdout:

```bash
iac-gen "RDS PostgreSQL instance" --cloud aws > database.tf
```

## License

MIT — see [LICENSE](./LICENSE)
