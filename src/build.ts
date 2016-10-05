import { BuildContext, BuildOptions } from './util/interfaces';
import { generateContext, generateBuildOptions } from './util/config';
import { bundle, bundleUpdate } from './bundle';
import { clean } from './clean';
import { minify } from './minify';
import { copy } from './copy';
import { lint } from './lint';
import { Logger } from './util/logger';
import { ngc } from './ngc';
import { sass, sassUpdate } from './sass';


export function build(context: BuildContext, options: BuildOptions) {
  context = generateContext(context);
  options = generateBuildOptions(options);

  const logger = new Logger(`build ${(options.isProd ? 'prod' : 'dev')}`);

  const promises: Promise<any>[] = [];

  if (options.isProd) {
    // production build
    promises.push(buildProd(context, options));

  } else {
    // dev build
    promises.push(buildDev(context, options));
  }

  return Promise.all(promises).then(() => {
    // congrats, we did it!  (•_•) / ( •_•)>⌐■-■ / (⌐■_■)
    return logger.finish();

  }).catch((err: Error) => {
    logger.fail(err);
    return Promise.reject(err);
  });
}


function buildProd(context: BuildContext, options: BuildOptions) {
  // sync empty the www directory
  clean(context);

  // async tasks
  // these can happen all while other tasks are running
  const copyPromise = copy(context);
  const lintPromise = lint(context);

  return ngc(context, options).then(() => {
    return bundle(context, options);

  }).then(() => {
    return sass(context);

  }).then(() => {
    return minify(context);

  }).then(() => {
    // ensure the async tasks have fully completed before resolving
    return Promise.all([
      copyPromise,
      lintPromise
    ]);
  });
}


function buildDev(context: BuildContext, options: BuildOptions) {
  // sync empty the www directory
  clean(context);

  // async tasks
  // these can happen all while other tasks are running
  const copyPromise = copy(context);
  const lintPromise = lint(context);

  return bundle(context, options).then(() => {
    return sass(context);

  }).then(() => {
    // ensure the async tasks have fully completed before resolving
    return Promise.all([
      copyPromise,
      lintPromise
    ]);
  });
}


export function buildUpdate(event: string, path: string, context: BuildContext, options: BuildOptions) {
  return bundleUpdate(event, path, context, options, true).then(() => {
    return sassUpdate(event, path, context, options, true);
  });
}
