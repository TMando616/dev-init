/**
 * CodeRunner
 * 
 * ユーザーのJavaScriptコードを隔離されたIframe内で安全に実行するためのユーティリティ。
 */

export interface RunResult {
  logs: string[];
  error?: string;
}

export class CodeRunner {
  private iframe: HTMLIFrameElement | null = null;

  /**
   * 実行環境となるIframeを初期化
   */
  private initIframe(): HTMLIFrameElement {
    if (this.iframe) {
      document.body.removeChild(this.iframe);
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox.add('allow-scripts');
    document.body.appendChild(iframe);
    this.iframe = iframe;
    return iframe;
  }

  /**
   * コードを実行し、ログをキャプチャする
   */
  public async run(code: string): Promise<RunResult> {
    const iframe = this.initIframe();
    const logs: string[] = [];

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ logs, error: 'Error: Execution timed out (Possible infinite loop)' });
        if (this.iframe) {
          document.body.removeChild(this.iframe);
          this.iframe = null;
        }
      }, 3000); // 3秒でタイムアウト

      // Iframe内の窓口
      const win = iframe.contentWindow;
      if (!win) {
        clearTimeout(timeout);
        resolve({ logs, error: 'Error: Could not access execution context' });
        return;
      }

      // console.log をオーバーライド
      win.console.log = (...args: unknown[]) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' && arg !== null ? JSON.stringify(arg) : String(arg)
        ).join(' '));
      };

      // console.error をオーバーライド
      win.console.error = (...args: unknown[]) => {
        logs.push(`Error: ${args.join(' ')}`);
      };

      // エラーハンドリング
      win.onerror = (message) => {
        clearTimeout(timeout);
        resolve({ logs, error: String(message) });
        return true;
      };

      try {
        // コードの実行
        const script = win.document.createElement('script');
        script.textContent = `
          try {
            ${code}
          } catch (e) {
            console.error((e as Error).message);
          }
        `;
        win.document.body.appendChild(script);
        
        // 実行完了（非同期処理は追えないが、同期的な実行はここで終わる）
        clearTimeout(timeout);
        resolve({ logs });
      } catch (e: unknown) {
        clearTimeout(timeout);
        resolve({ logs, error: (e as Error).message });
      }
    });
  }
}

export const runner = new CodeRunner();
