'use strict';
// The build versions static URLs; local development keeps ordinary paths.
globalThis.SiteAssets={url(path){const version=document.documentElement.dataset.assetVersion;return version?path+'?v='+version:path;}};
