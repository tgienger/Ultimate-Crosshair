/* */ 
(function(process) {
  var semver = require("semver"),
      url = require("url"),
      path = require("path"),
      bitsre = /\/win-(x86|x64)\//,
      bitsreV3 = /\/win-(x86|ia32|x64)\//;
  function processRelease(argv, gyp, defaultVersion, defaultRelease) {
    var version = (semver.valid(argv[0]) && argv[0]) || gyp.opts.target || defaultVersion,
        versionSemver = semver.parse(version),
        overrideDistUrl = gyp.opts['dist-url'] || gyp.opts.disturl,
        isDefaultVersion,
        isIojs,
        name,
        distBaseUrl,
        baseUrl,
        libUrl32,
        libUrl64,
        tarballUrl;
    if (!versionSemver) {
      return {version: version};
    }
    version = versionSemver.version;
    isDefaultVersion = version === semver.parse(defaultVersion).version;
    if (!isDefaultVersion)
      defaultRelease = null;
    if (defaultRelease) {
      name = defaultRelease.name.replace(/io\.js/, 'iojs');
      isIojs = name === 'iojs';
    } else {
      isIojs = versionSemver.major >= 1 && versionSemver.major < 4;
      name = isIojs ? 'iojs' : 'node';
    }
    if (!overrideDistUrl) {
      if (isIojs && process.env.NVM_IOJS_ORG_MIRROR)
        overrideDistUrl = process.env.NVM_IOJS_ORG_MIRROR;
      else if (process.env.NVM_NODEJS_ORG_MIRROR)
        overrideDistUrl = process.env.NVM_NODEJS_ORG_MIRROR;
    }
    if (overrideDistUrl)
      distBaseUrl = overrideDistUrl.replace(/\/+$/, '');
    else
      distBaseUrl = isIojs ? 'https://iojs.org/download/release' : 'https://nodejs.org/dist';
    distBaseUrl += '/v' + version + '/';
    if (defaultRelease && defaultRelease.headersUrl && !overrideDistUrl) {
      baseUrl = url.resolve(defaultRelease.headersUrl, './');
      libUrl32 = resolveLibUrl(name, defaultRelease.libUrl || baseUrl || distBaseUrl, 'x86', versionSemver.major);
      libUrl64 = resolveLibUrl(name, defaultRelease.libUrl || baseUrl || distBaseUrl, 'x64', versionSemver.major);
      return {
        version: version,
        semver: versionSemver,
        name: name,
        baseUrl: baseUrl,
        tarballUrl: defaultRelease.headersUrl,
        shasumsUrl: url.resolve(baseUrl, 'SHASUMS256.txt'),
        versionDir: (name !== 'node' ? name + '-' : '') + version,
        libUrl32: libUrl32,
        libUrl64: libUrl64,
        libPath32: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(libUrl32).path)),
        libPath64: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(libUrl64).path))
      };
    }
    baseUrl = distBaseUrl;
    libUrl32 = resolveLibUrl(name, baseUrl, 'x86', versionSemver.major);
    libUrl64 = resolveLibUrl(name, baseUrl, 'x64', versionSemver.major);
    tarballUrl = url.resolve(baseUrl, name + '-v' + version + (versionSemver.major >= 3 ? '-headers' : '') + '.tar.gz');
    return {
      version: version,
      semver: versionSemver,
      name: name,
      baseUrl: baseUrl,
      tarballUrl: tarballUrl,
      shasumsUrl: url.resolve(baseUrl, 'SHASUMS256.txt'),
      versionDir: (name !== 'node' ? name + '-' : '') + version,
      libUrl32: libUrl32,
      libUrl64: libUrl64,
      libPath32: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(libUrl32).path)),
      libPath64: normalizePath(path.relative(url.parse(baseUrl).path, url.parse(libUrl64).path))
    };
  }
  function normalizePath(p) {
    return path.normalize(p).replace(/\\/g, '/');
  }
  function resolveLibUrl(name, defaultUrl, arch, versionMajor) {
    var base = url.resolve(defaultUrl, './'),
        hasLibUrl = bitsre.test(defaultUrl) || (versionMajor === 3 && bitsreV3.test(defaultUrl));
    if (!hasLibUrl) {
      if (versionMajor >= 1)
        return url.resolve(base, 'win-' + arch + '/' + name + '.lib');
      return url.resolve(base, (arch === 'x64' ? 'x64/' : '') + name + '.lib');
    }
    return defaultUrl.replace(versionMajor === 3 ? bitsreV3 : bitsre, '/win-' + arch + '/');
  }
  module.exports = processRelease;
})(require("process"));
