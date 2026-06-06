import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const workspaceRoot = resolve(projectRoot, '..');
const androidBuildGradle = join(projectRoot, 'android', 'app', 'build.gradle');
const distDir = join(projectRoot, 'dist');
const tmpRoot = join(projectRoot, '.live-update-tmp');

const config = {
  host: process.env.LIVE_UPDATE_HOST ?? '43.108.10.167',
  user: process.env.LIVE_UPDATE_USER ?? 'root',
  sshKey: process.env.LIVE_UPDATE_SSH_KEY ?? resolve(process.env.HOME ?? '', 'Downloads', 'SSH.pem'),
  remoteRoot: process.env.LIVE_UPDATE_REMOTE_ROOT ?? '/www/wwwroot/ulink/uploads/app-updates/live',
  channel: process.env.LIVE_UPDATE_CHANNEL ?? 'production',
  platform: process.env.LIVE_UPDATE_PLATFORM ?? 'android',
  notes: process.env.LIVE_UPDATE_NOTES ?? '',
  publicBaseUrl: process.env.LIVE_UPDATE_PUBLIC_BASE_URL ?? 'http://43.108.10.167',
};

function log(message) {
  process.stdout.write(`${message}\n`);
}

function requireFile(path, label) {
  if (!existsSync(path)) {
    throw new Error(`${label} not found: ${path}`);
  }
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    stdio: 'pipe',
    ...options,
  });
}

function parseAndroidVersion() {
  const content = readFileSync(androidBuildGradle, 'utf8');
  const versionNameMatch = content.match(/versionName\s+"([^"]+)"/);
  const versionCodeMatch = content.match(/versionCode\s+(\d+)/);
  if (!versionNameMatch || !versionCodeMatch) {
    throw new Error('Unable to read versionName/versionCode from android/app/build.gradle');
  }
  return {
    versionName: versionNameMatch[1],
    versionCode: Number(versionCodeMatch[1]),
  };
}

function computeSha256(filePath) {
  const buffer = readFileSync(filePath);
  return createHash('sha256').update(buffer).digest('hex');
}

function createBundleId(versionName, versionCode) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  let gitSha = 'nogit';
  try {
    gitSha = String(run('git', ['rev-parse', '--short', 'HEAD'], { cwd: workspaceRoot })).trim();
  } catch {
    gitSha = 'nogit';
  }
  return `android-${versionName}-${versionCode}-${stamp}-${gitSha}`;
}

function buildWebAssets() {
  log('Building frontend dist...');
  execFileSync('npm', ['run', 'build'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

function packageBundle(bundleZipPath) {
  log('Packaging live update bundle...');
  rmSync(bundleZipPath, { force: true });
  execFileSync('zip', ['-qr', bundleZipPath, '.'], {
    cwd: distDir,
    stdio: 'inherit',
  });
}

function writeManifest(manifestPath, manifest) {
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function uploadFiles(remoteDir, files) {
  log(`Uploading bundle to ${config.user}@${config.host}:${remoteDir}`);
  execFileSync(
    'ssh',
    ['-i', config.sshKey, '-o', 'StrictHostKeyChecking=no', `${config.user}@${config.host}`, `mkdir -p '${remoteDir}'`],
    { stdio: 'inherit' },
  );
  execFileSync(
    'scp',
    ['-i', config.sshKey, '-o', 'StrictHostKeyChecking=no', ...files, `${config.user}@${config.host}:${remoteDir}/`],
    { stdio: 'inherit' },
  );
}

async function verifyManifest(versionName, versionCode) {
  const query = new URLSearchParams({
    platform: config.platform,
    channel: config.channel,
    versionName,
    versionCode: String(versionCode),
  });
  const url = `${config.publicBaseUrl}/api/v1/app-updates/live/latest?${query.toString()}`;
  log(`Verifying manifest via ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Manifest verification failed with status ${response.status}`);
  }
  const payload = await response.json();
  if (!payload?.data?.bundleId) {
    throw new Error('Manifest verification failed: no bundle returned');
  }
  return payload.data;
}

async function main() {
  requireFile(config.sshKey, 'SSH key');
  requireFile(androidBuildGradle, 'Android build.gradle');

  const { versionName, versionCode } = parseAndroidVersion();
  const bundleId = createBundleId(versionName, versionCode);
  const remoteDir = `${config.remoteRoot}/${config.platform}/${config.channel}`;

  rmSync(tmpRoot, { recursive: true, force: true });
  mkdirSync(tmpRoot, { recursive: true });

  buildWebAssets();

  const bundleFileName = `${bundleId}.zip`;
  const bundleZipPath = join(tmpRoot, bundleFileName);
  packageBundle(bundleZipPath);

  const checksum = computeSha256(bundleZipPath);
  const manifest = {
    bundleId,
    artifactType: 'zip',
    bundlePath: bundleFileName,
    checksum,
    versionName,
    versionCode,
    minVersionCode: versionCode,
    notes: config.notes || `Live update published for ${versionName} (${versionCode})`,
  };
  const manifestPath = join(tmpRoot, 'latest.json');
  writeManifest(manifestPath, manifest);

  uploadFiles(remoteDir, [bundleZipPath, manifestPath]);

  const verified = await verifyManifest(versionName, versionCode);
  log('');
  log('Live update published successfully.');
  log(`bundleId: ${verified.bundleId}`);
  log(`downloadUrl: ${verified.downloadUrl}`);
  log(`checksum: ${verified.checksum ?? checksum}`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
