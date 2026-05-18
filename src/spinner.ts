const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const INTERVAL_MS = 80;

export class Spinner {
  private frame = 0;
  private timer: NodeJS.Timeout | null = null;
  private isTTY: boolean;

  constructor(private message: string) {
    this.isTTY = Boolean(process.stderr.isTTY);
  }

  start(): void {
    if (!this.isTTY) return;
    process.stderr.write('\x1B[?25l'); // hide cursor
    this.render();
    this.timer = setInterval(() => this.render(), INTERVAL_MS);
  }

  stop(finalMessage?: string): void {
    if (!this.isTTY) return;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    process.stderr.write('\r\x1B[K'); // clear line
    process.stderr.write('\x1B[?25h'); // show cursor
    if (finalMessage) {
      process.stderr.write(finalMessage + '\n');
    }
  }

  private render(): void {
    const frame = FRAMES[this.frame % FRAMES.length];
    this.frame++;
    process.stderr.write(`\r${frame} ${this.message}`);
  }
}
