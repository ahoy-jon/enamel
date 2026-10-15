/** A deliberately small JSON-RPC client for typescript-language-server. */
type Json = Record<string, unknown>;
type Position = { line: number; character: number };
type DocumentSymbol = {
  name: string;
  kind: number;
  selectionRange: { start: Position };
  children?: DocumentSymbol[];
};
type FunctionShape = {
  parameters: Record<string, string>;
  returnType: string;
  async: boolean;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const functionSymbol = 12; // LSP SymbolKind.Function

class LspClient {
  #id = 0;
  #buffer = new Uint8Array();
  #pending = new Map<
    number,
    { resolve: (result: unknown) => void; reject: (error: Error) => void }
  >();
  #process = new Deno.Command("npx", {
    args: ["--no-install", "typescript-language-server", "--stdio"],
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  }).spawn();
  #writer = this.#process.stdin.getWriter();
  #reader = this.#process.stdout.getReader();

  constructor() {
    void this.#receive();
  }

  async request(method: string, params: Json): Promise<unknown> {
    const id = ++this.#id;
    const response = new Promise<unknown>((resolve, reject) =>
      this.#pending.set(id, { resolve, reject })
    );
    await this.#send({ jsonrpc: "2.0", id, method, params });
    return response;
  }

  notify(method: string, params: Json): Promise<void> {
    return this.#send({ jsonrpc: "2.0", method, params });
  }

  async close(): Promise<void> {
    await this.#writer.close();
    await this.#reader.cancel();
  }

  async #send(message: Json): Promise<void> {
    const body = encoder.encode(JSON.stringify(message));
    await this.#writer.write(
      join(encoder.encode(`Content-Length: ${body.length}\r\n\r\n`), body),
    );
  }

  async #receive(): Promise<void> {
    try {
      while (true) {
        const { value, done } = await this.#reader.read();
        if (done) return;
        this.#buffer = join(this.#buffer, value);
        this.#drain();
      }
    } catch (error) {
      for (const { reject } of this.#pending.values()) reject(error as Error);
    }
  }

  #drain(): void {
    const endOfHeader = encoder.encode("\r\n\r\n");
    while (true) {
      const boundary = find(this.#buffer, endOfHeader);
      if (boundary < 0) return;
      const header = decoder.decode(this.#buffer.slice(0, boundary));
      const length = Number(/Content-Length: (\d+)/i.exec(header)?.[1]);
      if (!Number.isInteger(length)) {
        throw new Error(`Invalid LSP header: ${header}`);
      }
      const start = boundary + endOfHeader.length;
      if (this.#buffer.length < start + length) return;
      const message = JSON.parse(
        decoder.decode(this.#buffer.slice(start, start + length)),
      ) as Json;
      this.#buffer = this.#buffer.slice(start + length);
      if (typeof message.id !== "number") continue;
      const pending = this.#pending.get(message.id);
      if (!pending) continue;
      this.#pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(JSON.stringify(message.error)));
      } else pending.resolve(message.result);
    }
  }
}

function join(left: Uint8Array, right: Uint8Array): Uint8Array {
  const output = new Uint8Array(left.length + right.length);
  output.set(left);
  output.set(right, left.length);
  return output;
}

function find(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function hoverText(result: unknown): string {
  const contents = (result as { contents?: unknown })?.contents;
  if (typeof contents === "string") return contents;
  if (Array.isArray(contents)) return contents.map(hoverText).join("\n");
  return contents && typeof contents === "object" && "value" in contents
    ? String((contents as { value: unknown }).value)
    : "";
}

function signature(name: string, hover: string): FunctionShape {
  const text = hover.replace(/```(?:typescript|ts)?\s*|```/g, "").trim();
  const match = new RegExp(
    `(?:async\\s+)?function\\s+${name}\\s*\\(([^)]*)\\)\\s*:\\s*([^\\n]+)`,
  ).exec(text);
  if (!match) {
    throw new Error(`Unsupported hover for ${name}: ${JSON.stringify(hover)}`);
  }
  const parameters = match[1] === "" ? {} : Object.fromEntries(
    match[1].split(", ").map((item) => {
      const parameter = /^(\w+\??):\s*(.+)$/.exec(item.trim());
      if (!parameter) throw new Error(`Unsupported parameter: ${item}`);
      return [parameter[1], parameter[2]];
    }),
  );
  const returnType = match[2].trim();
  return { parameters, returnType, async: returnType.startsWith("Promise<") };
}

function flatten(symbols: DocumentSymbol[]): DocumentSymbol[] {
  return symbols.flatMap((
    symbol,
  ) => [symbol, ...flatten(symbol.children ?? [])]);
}

const files = Deno.args;
if (!files.length) {
  throw new Error("Usage: extract.ts <TypeScript source files...>");
}
const root = Deno.cwd();
const lsp = new LspClient();
try {
  await lsp.request("initialize", {
    processId: null,
    rootUri: `file://${root}`,
    capabilities: {
      textDocument: {
        documentSymbol: { hierarchicalDocumentSymbolSupport: true },
        hover: { contentFormat: ["markdown", "plaintext"] },
      },
    },
  });
  await lsp.notify("initialized", {});
  const functions: Record<string, FunctionShape> = {};
  for (const file of files.sort()) {
    const uri = `file://${root}/${file}`;
    const text = await Deno.readTextFile(file);
    await lsp.notify("textDocument/didOpen", {
      textDocument: { uri, languageId: "typescript", version: 1, text },
    });
    const symbols = await lsp.request("textDocument/documentSymbol", {
      textDocument: { uri },
    }) as DocumentSymbol[];
    for (
      const symbol of flatten(symbols).filter((item) =>
        item.kind === functionSymbol
      )
    ) {
      const hover = await lsp.request("textDocument/hover", {
        textDocument: { uri },
        position: symbol.selectionRange.start,
      });
      functions[symbol.name] = signature(symbol.name, hoverText(hover));
    }
  }
  const lines = [
    "// Code generated by tools/extract.ts; DO NOT EDIT.",
    "// Regenerate with: mise run extract",
    "package envelope",
    "",
    "observation: {",
    "\tfunctions: {",
  ];
  for (
    const [name, fn] of Object.entries(functions).sort(([a], [b]) =>
      a.localeCompare(b)
    )
  ) {
    lines.push(`\t\t${JSON.stringify(name)}: {`);
    lines.push(
      `\t\t\tparameters: {${
        Object.entries(fn.parameters).map(([parameter, type]) =>
          `${parameter}: ${JSON.stringify(type)}`
        ).join(", ")
      }}`,
    );
    const promise = /^Promise<(.+)>$/.exec(fn.returnType);
    lines.push(
      promise
        ? `\t\t\treturn: "Promise": ${JSON.stringify(promise[1])}`
        : `\t\t\treturn: ${JSON.stringify(fn.returnType)}`,
      `\t\t\tasync: ${fn.async}`,
      "\t\t}",
    );
  }
  lines.push("\t}", "}", "");
  await Deno.writeTextFile("extract.gen.cue", lines.join("\n"));
} finally {
  await lsp.close();
}
