// Mock for @tauri-apps/plugin-dialog in browser dev mode
// Opens real browser file picker, returns fake paths for backend mock
export async function open(options?: any): Promise<string | string[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options?.filters?.[0]?.extensions?.map((e: string) => `.${e}`).join(',') || '*/*';
    input.multiple = options?.multiple || false;
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', () => {
      const files = input.files;
      if (files && files.length > 0) {
        // Return fake absolute paths for mock backend
        const paths = Array.from(files).map((f) => `/mock/pdfs/${f.name}`);
        resolve(options?.multiple ? paths : paths[0] || null);
      } else {
        resolve(null);
      }
      document.body.removeChild(input);
    });

    input.addEventListener('cancel', () => {
      resolve(null);
      document.body.removeChild(input);
    });

    input.click();
  });
}

export async function save(_options?: any): Promise<string | null> {
  console.log('[Mock] save dialog');
  return null;
}

export async function message(_message: string, _options?: any): Promise<void> {
  alert(_message);
}

export async function ask(_message: string, _options?: any): Promise<boolean> {
  return window.confirm(_message);
}

export async function confirm(_message: string, _options?: any): Promise<boolean> {
  return window.confirm(_message);
}