import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const docker = new Docker();

export type DockerResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
};

export type TestCaseWithIO = {
  id: number;
  input: string;
};

const DEFAULT_TIMEOUT_MS = 10000; // 10s
const MEMORY_LIMIT = 512 * 1024 * 1024; // 512MB
const BATCH_MEMORY_LIMIT = 1024 * 1024 * 1024; // 1GB

/**
 * Docker ログ形式 (8バイトヘッダ) を考慮してデマルチプレクスする
 */
function demuxDockerLogs(buffer: Buffer): { stdout: string; stderr: string } {
  let stdout = '';
  let stderr = '';
  let offset = 0;
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break;
    const type = buffer.readUInt8(offset);
    const size = buffer.readUInt32BE(offset + 4);
    offset += 8;

    const end = Math.min(offset + size, buffer.length);
    const chunk = buffer.toString('utf8', offset, end);

    if (type === 1) stdout += chunk;
    else if (type === 2) stderr += chunk;

    offset += size;
  }
  return { stdout, stderr };
}

/**
 * 単一のコンテナでコードを実行する
 */
export async function runCode(
  image: string,
  code: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<DockerResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esolang-test-'));
  const imageSegments = image.split('/');
  const cmd = imageSegments[imageSegments.length - 1];
  if (!cmd) throw new Error(`Invalid image name: ${image}`);

  try {
    const codeFileName = 'code';
    const codePath = path.join(tmpDir, codeFileName);
    await fs.writeFile(codePath, code, 'utf8');

    const container = await docker.createContainer({
      Image: image,
      Cmd: [cmd, `/volume/${codeFileName}`],
      HostConfig: {
        Binds: [`${tmpDir}:/volume:ro`],
        Memory: MEMORY_LIMIT,
        MemorySwap: MEMORY_LIMIT,
        Ulimits: [
          {
            Name: 'nofile',
            Soft: 65535,
            Hard: 65535,
          },
          {
            Name: 'nproc',
            Soft: 4096,
            Hard: 8192,
          },
        ],
        NetworkMode: 'none',
      },
    });

    const start = Date.now();
    await container.start();

    const waitPromise = container.wait();
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timeout: true }), timeoutMs)
    );

    const result: any = await Promise.race([waitPromise, timeoutPromise]);
    const end = Date.now();

    let exitCode = -1;
    let isTimeout = false;

    if (result && result.timeout) {
      isTimeout = true;
      await container.kill().catch(() => {});
      exitCode = 137; // SIGKILL
    } else {
      exitCode = result.StatusCode;
    }

    const logBuffer = (await container.logs({ stdout: true, stderr: true })) as Buffer;
    const { stdout, stderr } = demuxDockerLogs(logBuffer);

    await container.remove({ force: true });

    return {
      stdout,
      stderr: isTimeout ? `${stderr}\nTime Limit Exceeded` : stderr,
      exitCode,
      durationMs: end - start,
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

/**
 * 単一のコンテナで全テストケースを一括実行する
 */
export async function runAllTestCasesInSingleContainer(
  image: string,
  code: string,
  testCases: TestCaseWithIO[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS * 2 // バッチ実行なので長めに設定
): Promise<Record<number, DockerResult>> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esolang-worker-'));
  const imageSegments = image.split('/');
  const cmd = imageSegments[imageSegments.length - 1];
  if (!cmd) throw new Error(`Invalid image name: ${image}`);

  try {
    const codeFileName = 'code.bf';
    const codePath = path.join(tmpDir, codeFileName);
    await fs.writeFile(codePath, code, 'utf8');

    const scriptLines: string[] = [];
    for (const tc of testCases) {
      const base = String(tc.id);
      const inputPath = path.join(tmpDir, `INPUT_${base}`);
      await fs.writeFile(inputPath, tc.input, 'utf8');

      scriptLines.push(
        `${cmd} /volume/${codeFileName} < /volume/INPUT_${base} > /volume/OUTPUT_${base} 2>/volume/ERR_${base}; echo $? > /volume/EXIT_${base}`
      );
    }

    const scriptPath = path.join(tmpDir, 'run_all.sh');
    await fs.writeFile(scriptPath, scriptLines.join('\n'), { mode: 0o755 });

    const container = await docker.createContainer({
      Image: image,
      Cmd: ['sh', '/volume/run_all.sh'],
      HostConfig: {
        Binds: [`${tmpDir}:/volume:rw`],
        Memory: BATCH_MEMORY_LIMIT,
        MemorySwap: BATCH_MEMORY_LIMIT,
        Ulimits: [
          {
            Name: 'nofile',
            Soft: 65535,
            Hard: 65535,
          },
          {
            Name: 'nproc',
            Soft: 4096,
            Hard: 8192,
          },
        ],
        NetworkMode: 'none',
      },
    });

    const start = Date.now();
    await container.start();

    const waitPromise = container.wait();
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timeout: true }), timeoutMs)
    );

    const result: any = await Promise.race([waitPromise, timeoutPromise]);
    const end = Date.now();

    if (result && result.timeout) {
      await container.kill().catch(() => {});
    }

    await container.remove({ force: true });

    const results: Record<number, DockerResult> = {};
    for (const tc of testCases) {
      const base = String(tc.id);
      const outPath = path.join(tmpDir, `OUTPUT_${base}`);
      const errPath = path.join(tmpDir, `ERR_${base}`);
      const exitPath = path.join(tmpDir, `EXIT_${base}`);

      const [stdoutBuf, stderrBuf, exitText] = await Promise.all([
        fs.readFile(outPath).catch(() => Buffer.alloc(0)),
        fs.readFile(errPath).catch(() => Buffer.alloc(0)),
        fs.readFile(exitPath, 'utf8').catch(() => '-1'),
      ]);

      const exitCodeValue = parseInt(String(exitText).trim(), 10);
      results[tc.id] = {
        stdout: stdoutBuf.toString('utf8'),
        stderr: stderrBuf.toString('utf8'),
        exitCode: Number.isNaN(exitCodeValue) ? -1 : exitCodeValue,
        durationMs: end - start,
      };
    }
    return results;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
