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
      const messageHandler = (event: MessageEvent) => {
        // 実行用Iframeからのメッセージのみを処理
        if (event.source !== iframe.contentWindow) return;
        
        const { type, payload } = event.data;
        if (type === 'log') {
          logs.push(payload);
        } else if (type === 'error') {
          logs.push(`Error: ${payload}`);
        } else if (type === 'finished') {
          cleanup();
          resolve({ logs });
        } else if (type === 'runtimeError') {
          cleanup();
          resolve({ logs, error: payload });
        }
      };

      window.addEventListener('message', messageHandler);

      const timeout = setTimeout(() => {
        cleanup();
        resolve({ logs, error: 'Error: Execution timed out (Possible infinite loop)' });
      }, 3000);

      const cleanup = () => {
        clearTimeout(timeout);
        window.removeEventListener('message', messageHandler);
        if (this.iframe && this.iframe.parentNode) {
          document.body.removeChild(this.iframe);
        }
        this.iframe = null;
      };

      // Iframe内で実行するHTML/JS
      // console.log等をオーバーライドして親ウィンドウにメッセージを送る
      const srcdoc = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body>
          <script>
            (function() {
              const post = (type, payload) => {
                window.parent.postMessage({ type, payload }, '*');
              };

              console.log = (...args) => {
                post('log', args.map(arg => 
                  typeof arg === 'object' && arg !== null ? 
                  (function() { 
                    try { return JSON.stringify(arg); } 
                    catch(e) { return String(arg); } 
                  })() : String(arg)
                ).join(' '));
              };

              console.error = (...args) => {
                post('error', args.join(' '));
              };

              window.onerror = (message, source, lineno, colno, error) => {
                post('runtimeError', error ? error.message : String(message));
                return true;
              };

              try {
                ${code}
                // 実行完了を通知
                setTimeout(() => post('finished'), 10);
              } catch (e) {
                post('runtimeError', e.message);
              }
            })();
          </script>
        </body>
        </html>
      `;

      iframe.srcdoc = srcdoc;
    });
  }
}

export const runner = new CodeRunner();
