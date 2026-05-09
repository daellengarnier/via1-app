"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/game/highscore/route";
exports.ids = ["app/api/game/highscore/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fgame%2Fhighscore%2Froute&page=%2Fapi%2Fgame%2Fhighscore%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgame%2Fhighscore%2Froute.ts&appDir=%2FUsers%2Fyvesgarnier%2FApps%2Fvia1-app%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fyvesgarnier%2FApps%2Fvia1-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fgame%2Fhighscore%2Froute&page=%2Fapi%2Fgame%2Fhighscore%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgame%2Fhighscore%2Froute.ts&appDir=%2FUsers%2Fyvesgarnier%2FApps%2Fvia1-app%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fyvesgarnier%2FApps%2Fvia1-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_yvesgarnier_Apps_via1_app_src_app_api_game_highscore_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/game/highscore/route.ts */ \"(rsc)/./src/app/api/game/highscore/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/game/highscore/route\",\n        pathname: \"/api/game/highscore\",\n        filename: \"route\",\n        bundlePath: \"app/api/game/highscore/route\"\n    },\n    resolvedPagePath: \"/Users/yvesgarnier/Apps/via1-app/src/app/api/game/highscore/route.ts\",\n    nextConfigOutput,\n    userland: _Users_yvesgarnier_Apps_via1_app_src_app_api_game_highscore_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/game/highscore/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZnYW1lJTJGaGlnaHNjb3JlJTJGcm91dGUmcGFnZT0lMkZhcGklMkZnYW1lJTJGaGlnaHNjb3JlJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGZ2FtZSUyRmhpZ2hzY29yZSUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRnl2ZXNnYXJuaWVyJTJGQXBwcyUyRnZpYTEtYXBwJTJGc3JjJTJGYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj0lMkZVc2VycyUyRnl2ZXNnYXJuaWVyJTJGQXBwcyUyRnZpYTEtYXBwJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PXN0YW5kYWxvbmUmcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDb0I7QUFDakc7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92aWExLWFwcC8/MDkwNCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMveXZlc2dhcm5pZXIvQXBwcy92aWExLWFwcC9zcmMvYXBwL2FwaS9nYW1lL2hpZ2hzY29yZS9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJzdGFuZGFsb25lXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2dhbWUvaGlnaHNjb3JlL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvZ2FtZS9oaWdoc2NvcmVcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2dhbWUvaGlnaHNjb3JlL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL3l2ZXNnYXJuaWVyL0FwcHMvdmlhMS1hcHAvc3JjL2FwcC9hcGkvZ2FtZS9oaWdoc2NvcmUvcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2dhbWUvaGlnaHNjb3JlL3JvdXRlXCI7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHNlcnZlckhvb2tzLFxuICAgICAgICBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIG9yaWdpbmFsUGF0aG5hbWUsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fgame%2Fhighscore%2Froute&page=%2Fapi%2Fgame%2Fhighscore%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgame%2Fhighscore%2Froute.ts&appDir=%2FUsers%2Fyvesgarnier%2FApps%2Fvia1-app%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fyvesgarnier%2FApps%2Fvia1-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/game/highscore/route.ts":
/*!*********************************************!*\
  !*** ./src/app/api/game/highscore/route.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET),\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./src/lib/auth.ts\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n\n\n\n\n// GET /api/game/highscore — Top 20 einzelne Spiele + eigener Bestwert\nasync function GET() {\n    const session = await (0,next_auth__WEBPACK_IMPORTED_MODULE_1__.getServerSession)(_lib_auth__WEBPACK_IMPORTED_MODULE_2__.authOptions);\n    if (!session?.user?.id) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Unauthorized\"\n        }, {\n            status: 401\n        });\n    }\n    const [meBest, topScores] = await Promise.all([\n        _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.gameScore.findFirst({\n            where: {\n                userId: session.user.id\n            },\n            orderBy: {\n                score: \"desc\"\n            },\n            select: {\n                score: true\n            }\n        }),\n        _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.gameScore.findMany({\n            orderBy: {\n                score: \"desc\"\n            },\n            take: 20,\n            include: {\n                user: {\n                    select: {\n                        id: true,\n                        name: true\n                    }\n                }\n            }\n        })\n    ]);\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        myScore: meBest?.score ?? 0,\n        topScore: topScores[0]?.score ?? 0,\n        topPlayer: topScores[0]?.user.name ?? null,\n        leaderboard: topScores.map((s)=>({\n                name: s.user.name,\n                score: s.score,\n                date: s.createdAt.toISOString(),\n                isMe: s.user.id === session.user.id\n            }))\n    });\n}\n// POST /api/game/highscore — jeder Spielstand wird gespeichert\nasync function POST(req) {\n    const session = await (0,next_auth__WEBPACK_IMPORTED_MODULE_1__.getServerSession)(_lib_auth__WEBPACK_IMPORTED_MODULE_2__.authOptions);\n    if (!session?.user?.id) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Unauthorized\"\n        }, {\n            status: 401\n        });\n    }\n    const body = await req.json();\n    const score = typeof body.score === \"number\" ? Math.floor(body.score) : 0;\n    if (score <= 0) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Invalid score\"\n        }, {\n            status: 400\n        });\n    }\n    const prevBest = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.gameScore.findFirst({\n        where: {\n            userId: session.user.id\n        },\n        orderBy: {\n            score: \"desc\"\n        },\n        select: {\n            score: true\n        }\n    });\n    const previousBest = prevBest?.score ?? 0;\n    const isNewRecord = score > previousBest;\n    await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.gameScore.create({\n        data: {\n            userId: session.user.id,\n            score\n        }\n    });\n    // User.gameHighScore zusaetzlich aktualisieren (Badge auf Home)\n    if (isNewRecord) {\n        await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.user.update({\n            where: {\n                id: session.user.id\n            },\n            data: {\n                gameHighScore: score\n            }\n        });\n    }\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        score,\n        isNewRecord,\n        previousBest\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9nYW1lL2hpZ2hzY29yZS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQTJDO0FBQ0U7QUFDSjtBQUNIO0FBRXRDLHNFQUFzRTtBQUMvRCxlQUFlSTtJQUNwQixNQUFNQyxVQUFVLE1BQU1KLDJEQUFnQkEsQ0FBQ0Msa0RBQVdBO0lBQ2xELElBQUksQ0FBQ0csU0FBU0MsTUFBTUMsSUFBSTtRQUN0QixPQUFPUCxxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO1lBQUVDLE9BQU87UUFBZSxHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUNwRTtJQUVBLE1BQU0sQ0FBQ0MsUUFBUUMsVUFBVSxHQUFHLE1BQU1DLFFBQVFDLEdBQUcsQ0FBQztRQUM1Q1gsK0NBQU1BLENBQUNZLFNBQVMsQ0FBQ0MsU0FBUyxDQUFDO1lBQ3pCQyxPQUFPO2dCQUFFQyxRQUFRYixRQUFRQyxJQUFJLENBQUNDLEVBQUU7WUFBQztZQUNqQ1ksU0FBUztnQkFBRUMsT0FBTztZQUFPO1lBQ3pCQyxRQUFRO2dCQUFFRCxPQUFPO1lBQUs7UUFDeEI7UUFDQWpCLCtDQUFNQSxDQUFDWSxTQUFTLENBQUNPLFFBQVEsQ0FBQztZQUN4QkgsU0FBUztnQkFBRUMsT0FBTztZQUFPO1lBQ3pCRyxNQUFNO1lBQ05DLFNBQVM7Z0JBQ1BsQixNQUFNO29CQUFFZSxRQUFRO3dCQUFFZCxJQUFJO3dCQUFNa0IsTUFBTTtvQkFBSztnQkFBRTtZQUMzQztRQUNGO0tBQ0Q7SUFFRCxPQUFPekIscURBQVlBLENBQUNRLElBQUksQ0FBQztRQUN2QmtCLFNBQVNmLFFBQVFTLFNBQVM7UUFDMUJPLFVBQVVmLFNBQVMsQ0FBQyxFQUFFLEVBQUVRLFNBQVM7UUFDakNRLFdBQVdoQixTQUFTLENBQUMsRUFBRSxFQUFFTixLQUFLbUIsUUFBUTtRQUN0Q0ksYUFBYWpCLFVBQVVrQixHQUFHLENBQUMsQ0FBQ0MsSUFBTztnQkFDakNOLE1BQU1NLEVBQUV6QixJQUFJLENBQUNtQixJQUFJO2dCQUNqQkwsT0FBT1csRUFBRVgsS0FBSztnQkFDZFksTUFBTUQsRUFBRUUsU0FBUyxDQUFDQyxXQUFXO2dCQUM3QkMsTUFBTUosRUFBRXpCLElBQUksQ0FBQ0MsRUFBRSxLQUFLRixRQUFRQyxJQUFJLENBQUNDLEVBQUU7WUFDckM7SUFDRjtBQUNGO0FBRUEsK0RBQStEO0FBQ3hELGVBQWU2QixLQUFLQyxHQUFZO0lBQ3JDLE1BQU1oQyxVQUFVLE1BQU1KLDJEQUFnQkEsQ0FBQ0Msa0RBQVdBO0lBQ2xELElBQUksQ0FBQ0csU0FBU0MsTUFBTUMsSUFBSTtRQUN0QixPQUFPUCxxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO1lBQUVDLE9BQU87UUFBZSxHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUNwRTtJQUVBLE1BQU00QixPQUFRLE1BQU1ELElBQUk3QixJQUFJO0lBQzVCLE1BQU1ZLFFBQVEsT0FBT2tCLEtBQUtsQixLQUFLLEtBQUssV0FBV21CLEtBQUtDLEtBQUssQ0FBQ0YsS0FBS2xCLEtBQUssSUFBSTtJQUN4RSxJQUFJQSxTQUFTLEdBQUc7UUFDZCxPQUFPcEIscURBQVlBLENBQUNRLElBQUksQ0FBQztZQUFFQyxPQUFPO1FBQWdCLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQ3JFO0lBRUEsTUFBTStCLFdBQVcsTUFBTXRDLCtDQUFNQSxDQUFDWSxTQUFTLENBQUNDLFNBQVMsQ0FBQztRQUNoREMsT0FBTztZQUFFQyxRQUFRYixRQUFRQyxJQUFJLENBQUNDLEVBQUU7UUFBQztRQUNqQ1ksU0FBUztZQUFFQyxPQUFPO1FBQU87UUFDekJDLFFBQVE7WUFBRUQsT0FBTztRQUFLO0lBQ3hCO0lBQ0EsTUFBTXNCLGVBQWVELFVBQVVyQixTQUFTO0lBQ3hDLE1BQU11QixjQUFjdkIsUUFBUXNCO0lBRTVCLE1BQU12QywrQ0FBTUEsQ0FBQ1ksU0FBUyxDQUFDNkIsTUFBTSxDQUFDO1FBQzVCQyxNQUFNO1lBQ0ozQixRQUFRYixRQUFRQyxJQUFJLENBQUNDLEVBQUU7WUFDdkJhO1FBQ0Y7SUFDRjtJQUVBLGdFQUFnRTtJQUNoRSxJQUFJdUIsYUFBYTtRQUNmLE1BQU14QywrQ0FBTUEsQ0FBQ0csSUFBSSxDQUFDd0MsTUFBTSxDQUFDO1lBQ3ZCN0IsT0FBTztnQkFBRVYsSUFBSUYsUUFBUUMsSUFBSSxDQUFDQyxFQUFFO1lBQUM7WUFDN0JzQyxNQUFNO2dCQUFFRSxlQUFlM0I7WUFBTTtRQUMvQjtJQUNGO0lBRUEsT0FBT3BCLHFEQUFZQSxDQUFDUSxJQUFJLENBQUM7UUFDdkJZO1FBQ0F1QjtRQUNBRDtJQUNGO0FBQ0YiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly92aWExLWFwcC8uL3NyYy9hcHAvYXBpL2dhbWUvaGlnaHNjb3JlL3JvdXRlLnRzP2YxZmUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSBcIm5leHQvc2VydmVyXCI7XG5pbXBvcnQgeyBnZXRTZXJ2ZXJTZXNzaW9uIH0gZnJvbSBcIm5leHQtYXV0aFwiO1xuaW1wb3J0IHsgYXV0aE9wdGlvbnMgfSBmcm9tIFwiQC9saWIvYXV0aFwiO1xuaW1wb3J0IHsgcHJpc21hIH0gZnJvbSBcIkAvbGliL3ByaXNtYVwiO1xuXG4vLyBHRVQgL2FwaS9nYW1lL2hpZ2hzY29yZSDigJQgVG9wIDIwIGVpbnplbG5lIFNwaWVsZSArIGVpZ2VuZXIgQmVzdHdlcnRcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQoKSB7XG4gIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBnZXRTZXJ2ZXJTZXNzaW9uKGF1dGhPcHRpb25zKTtcbiAgaWYgKCFzZXNzaW9uPy51c2VyPy5pZCkge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIlVuYXV0aG9yaXplZFwiIH0sIHsgc3RhdHVzOiA0MDEgfSk7XG4gIH1cblxuICBjb25zdCBbbWVCZXN0LCB0b3BTY29yZXNdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgIHByaXNtYS5nYW1lU2NvcmUuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7IHVzZXJJZDogc2Vzc2lvbi51c2VyLmlkIH0sXG4gICAgICBvcmRlckJ5OiB7IHNjb3JlOiBcImRlc2NcIiB9LFxuICAgICAgc2VsZWN0OiB7IHNjb3JlOiB0cnVlIH0sXG4gICAgfSksXG4gICAgcHJpc21hLmdhbWVTY29yZS5maW5kTWFueSh7XG4gICAgICBvcmRlckJ5OiB7IHNjb3JlOiBcImRlc2NcIiB9LFxuICAgICAgdGFrZTogMjAsXG4gICAgICBpbmNsdWRlOiB7XG4gICAgICAgIHVzZXI6IHsgc2VsZWN0OiB7IGlkOiB0cnVlLCBuYW1lOiB0cnVlIH0gfSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0pO1xuXG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7XG4gICAgbXlTY29yZTogbWVCZXN0Py5zY29yZSA/PyAwLFxuICAgIHRvcFNjb3JlOiB0b3BTY29yZXNbMF0/LnNjb3JlID8/IDAsXG4gICAgdG9wUGxheWVyOiB0b3BTY29yZXNbMF0/LnVzZXIubmFtZSA/PyBudWxsLFxuICAgIGxlYWRlcmJvYXJkOiB0b3BTY29yZXMubWFwKChzKSA9PiAoe1xuICAgICAgbmFtZTogcy51c2VyLm5hbWUsXG4gICAgICBzY29yZTogcy5zY29yZSxcbiAgICAgIGRhdGU6IHMuY3JlYXRlZEF0LnRvSVNPU3RyaW5nKCksXG4gICAgICBpc01lOiBzLnVzZXIuaWQgPT09IHNlc3Npb24udXNlci5pZCxcbiAgICB9KSksXG4gIH0pO1xufVxuXG4vLyBQT1NUIC9hcGkvZ2FtZS9oaWdoc2NvcmUg4oCUIGplZGVyIFNwaWVsc3RhbmQgd2lyZCBnZXNwZWljaGVydFxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxOiBSZXF1ZXN0KSB7XG4gIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBnZXRTZXJ2ZXJTZXNzaW9uKGF1dGhPcHRpb25zKTtcbiAgaWYgKCFzZXNzaW9uPy51c2VyPy5pZCkge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIlVuYXV0aG9yaXplZFwiIH0sIHsgc3RhdHVzOiA0MDEgfSk7XG4gIH1cblxuICBjb25zdCBib2R5ID0gKGF3YWl0IHJlcS5qc29uKCkpIGFzIHsgc2NvcmU/OiB1bmtub3duIH07XG4gIGNvbnN0IHNjb3JlID0gdHlwZW9mIGJvZHkuc2NvcmUgPT09IFwibnVtYmVyXCIgPyBNYXRoLmZsb29yKGJvZHkuc2NvcmUpIDogMDtcbiAgaWYgKHNjb3JlIDw9IDApIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJJbnZhbGlkIHNjb3JlXCIgfSwgeyBzdGF0dXM6IDQwMCB9KTtcbiAgfVxuXG4gIGNvbnN0IHByZXZCZXN0ID0gYXdhaXQgcHJpc21hLmdhbWVTY29yZS5maW5kRmlyc3Qoe1xuICAgIHdoZXJlOiB7IHVzZXJJZDogc2Vzc2lvbi51c2VyLmlkIH0sXG4gICAgb3JkZXJCeTogeyBzY29yZTogXCJkZXNjXCIgfSxcbiAgICBzZWxlY3Q6IHsgc2NvcmU6IHRydWUgfSxcbiAgfSk7XG4gIGNvbnN0IHByZXZpb3VzQmVzdCA9IHByZXZCZXN0Py5zY29yZSA/PyAwO1xuICBjb25zdCBpc05ld1JlY29yZCA9IHNjb3JlID4gcHJldmlvdXNCZXN0O1xuXG4gIGF3YWl0IHByaXNtYS5nYW1lU2NvcmUuY3JlYXRlKHtcbiAgICBkYXRhOiB7XG4gICAgICB1c2VySWQ6IHNlc3Npb24udXNlci5pZCxcbiAgICAgIHNjb3JlLFxuICAgIH0sXG4gIH0pO1xuXG4gIC8vIFVzZXIuZ2FtZUhpZ2hTY29yZSB6dXNhZXR6bGljaCBha3R1YWxpc2llcmVuIChCYWRnZSBhdWYgSG9tZSlcbiAgaWYgKGlzTmV3UmVjb3JkKSB7XG4gICAgYXdhaXQgcHJpc21hLnVzZXIudXBkYXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBzZXNzaW9uLnVzZXIuaWQgfSxcbiAgICAgIGRhdGE6IHsgZ2FtZUhpZ2hTY29yZTogc2NvcmUgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7XG4gICAgc2NvcmUsXG4gICAgaXNOZXdSZWNvcmQsXG4gICAgcHJldmlvdXNCZXN0LFxuICB9KTtcbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJnZXRTZXJ2ZXJTZXNzaW9uIiwiYXV0aE9wdGlvbnMiLCJwcmlzbWEiLCJHRVQiLCJzZXNzaW9uIiwidXNlciIsImlkIiwianNvbiIsImVycm9yIiwic3RhdHVzIiwibWVCZXN0IiwidG9wU2NvcmVzIiwiUHJvbWlzZSIsImFsbCIsImdhbWVTY29yZSIsImZpbmRGaXJzdCIsIndoZXJlIiwidXNlcklkIiwib3JkZXJCeSIsInNjb3JlIiwic2VsZWN0IiwiZmluZE1hbnkiLCJ0YWtlIiwiaW5jbHVkZSIsIm5hbWUiLCJteVNjb3JlIiwidG9wU2NvcmUiLCJ0b3BQbGF5ZXIiLCJsZWFkZXJib2FyZCIsIm1hcCIsInMiLCJkYXRlIiwiY3JlYXRlZEF0IiwidG9JU09TdHJpbmciLCJpc01lIiwiUE9TVCIsInJlcSIsImJvZHkiLCJNYXRoIiwiZmxvb3IiLCJwcmV2QmVzdCIsInByZXZpb3VzQmVzdCIsImlzTmV3UmVjb3JkIiwiY3JlYXRlIiwiZGF0YSIsInVwZGF0ZSIsImdhbWVIaWdoU2NvcmUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/game/highscore/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth.ts":
/*!*************************!*\
  !*** ./src/lib/auth.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(bcryptjs__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n\n\n\nconst DEMO_MODE = !process.env.DATABASE_URL;\nconst authOptions = {\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            name: \"Credentials\",\n            credentials: {\n                email: {\n                    label: \"E-Mail\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Passwort\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) {\n                    return null;\n                }\n                // Demo mode: any @via1.ch email with password \"via1\"\n                if (DEMO_MODE) {\n                    if (credentials.email.endsWith(\"@via1.ch\") && credentials.password === \"via1\") {\n                        const name = credentials.email.split(\"@\")[0];\n                        return {\n                            id: name,\n                            name: name.charAt(0).toUpperCase() + name.slice(1),\n                            email: credentials.email,\n                            roles: [\n                                \"ADMIN\"\n                            ]\n                        };\n                    }\n                    return null;\n                }\n                // Production mode: check against database\n                const user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.user.findUnique({\n                    where: {\n                        email: credentials.email.trim().toLowerCase()\n                    }\n                });\n                if (!user || !user.password || !user.passwordSet) {\n                    return null;\n                }\n                const isValid = await bcryptjs__WEBPACK_IMPORTED_MODULE_1___default().compare(credentials.password, user.password);\n                if (!isValid) {\n                    return null;\n                }\n                return {\n                    id: user.id,\n                    name: user.name,\n                    email: user.email,\n                    roles: user.roles\n                };\n            }\n        })\n    ],\n    session: {\n        strategy: \"jwt\"\n    },\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                token.roles = user.roles;\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                session.user.id = token.sub;\n                session.user.roles = token.roles;\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/login\"\n    },\n    secret: process.env.NEXTAUTH_SECRET\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL2F1dGgudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFDa0U7QUFDcEM7QUFDUTtBQUV0QyxNQUFNRyxZQUFZLENBQUNDLFFBQVFDLEdBQUcsQ0FBQ0MsWUFBWTtBQUVwQyxNQUFNQyxjQUErQjtJQUMxQ0MsV0FBVztRQUNUUiwyRUFBbUJBLENBQUM7WUFDbEJTLE1BQU07WUFDTkMsYUFBYTtnQkFDWEMsT0FBTztvQkFBRUMsT0FBTztvQkFBVUMsTUFBTTtnQkFBUTtnQkFDeENDLFVBQVU7b0JBQUVGLE9BQU87b0JBQVlDLE1BQU07Z0JBQVc7WUFDbEQ7WUFDQSxNQUFNRSxXQUFVTCxXQUFXO2dCQUN6QixJQUFJLENBQUNBLGFBQWFDLFNBQVMsQ0FBQ0QsYUFBYUksVUFBVTtvQkFDakQsT0FBTztnQkFDVDtnQkFFQSxxREFBcUQ7Z0JBQ3JELElBQUlYLFdBQVc7b0JBQ2IsSUFDRU8sWUFBWUMsS0FBSyxDQUFDSyxRQUFRLENBQUMsZUFDM0JOLFlBQVlJLFFBQVEsS0FBSyxRQUN6Qjt3QkFDQSxNQUFNTCxPQUFPQyxZQUFZQyxLQUFLLENBQUNNLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTt3QkFDNUMsT0FBTzs0QkFDTEMsSUFBSVQ7NEJBQ0pBLE1BQU1BLEtBQUtVLE1BQU0sQ0FBQyxHQUFHQyxXQUFXLEtBQUtYLEtBQUtZLEtBQUssQ0FBQzs0QkFDaERWLE9BQU9ELFlBQVlDLEtBQUs7NEJBQ3hCVyxPQUFPO2dDQUFDOzZCQUFRO3dCQUNsQjtvQkFDRjtvQkFDQSxPQUFPO2dCQUNUO2dCQUVBLDBDQUEwQztnQkFDMUMsTUFBTUMsT0FBTyxNQUFNckIsK0NBQU1BLENBQUNxQixJQUFJLENBQUNDLFVBQVUsQ0FBQztvQkFDeENDLE9BQU87d0JBQUVkLE9BQU9ELFlBQVlDLEtBQUssQ0FBQ2UsSUFBSSxHQUFHQyxXQUFXO29CQUFHO2dCQUN6RDtnQkFFQSxJQUFJLENBQUNKLFFBQVEsQ0FBQ0EsS0FBS1QsUUFBUSxJQUFJLENBQUNTLEtBQUtLLFdBQVcsRUFBRTtvQkFDaEQsT0FBTztnQkFDVDtnQkFFQSxNQUFNQyxVQUFVLE1BQU01Qix1REFBYyxDQUNsQ1MsWUFBWUksUUFBUSxFQUNwQlMsS0FBS1QsUUFBUTtnQkFHZixJQUFJLENBQUNlLFNBQVM7b0JBQ1osT0FBTztnQkFDVDtnQkFFQSxPQUFPO29CQUNMWCxJQUFJSyxLQUFLTCxFQUFFO29CQUNYVCxNQUFNYyxLQUFLZCxJQUFJO29CQUNmRSxPQUFPWSxLQUFLWixLQUFLO29CQUNqQlcsT0FBT0MsS0FBS0QsS0FBSztnQkFDbkI7WUFDRjtRQUNGO0tBQ0Q7SUFDRFMsU0FBUztRQUNQQyxVQUFVO0lBQ1o7SUFDQUMsV0FBVztRQUNULE1BQU1DLEtBQUksRUFBRUMsS0FBSyxFQUFFWixJQUFJLEVBQUU7WUFDdkIsSUFBSUEsTUFBTTtnQkFDUlksTUFBTWIsS0FBSyxHQUFHQyxLQUFLRCxLQUFLO1lBQzFCO1lBQ0EsT0FBT2E7UUFDVDtRQUNBLE1BQU1KLFNBQVEsRUFBRUEsT0FBTyxFQUFFSSxLQUFLLEVBQUU7WUFDOUIsSUFBSUosUUFBUVIsSUFBSSxFQUFFO2dCQUNoQlEsUUFBUVIsSUFBSSxDQUFDTCxFQUFFLEdBQUdpQixNQUFNQyxHQUFHO2dCQUMzQkwsUUFBUVIsSUFBSSxDQUFDRCxLQUFLLEdBQUdhLE1BQU1iLEtBQUs7WUFDbEM7WUFDQSxPQUFPUztRQUNUO0lBQ0Y7SUFDQU0sT0FBTztRQUNMQyxRQUFRO0lBQ1Y7SUFDQUMsUUFBUW5DLFFBQVFDLEdBQUcsQ0FBQ21DLGVBQWU7QUFDckMsRUFBRSIsInNvdXJjZXMiOlsid2VicGFjazovL3ZpYTEtYXBwLy4vc3JjL2xpYi9hdXRoLnRzPzY2OTIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBOZXh0QXV0aE9wdGlvbnMgfSBmcm9tIFwibmV4dC1hdXRoXCI7XG5pbXBvcnQgQ3JlZGVudGlhbHNQcm92aWRlciBmcm9tIFwibmV4dC1hdXRoL3Byb3ZpZGVycy9jcmVkZW50aWFsc1wiO1xuaW1wb3J0IGJjcnlwdCBmcm9tIFwiYmNyeXB0anNcIjtcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9wcmlzbWFcIjtcblxuY29uc3QgREVNT19NT0RFID0gIXByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTDtcblxuZXhwb3J0IGNvbnN0IGF1dGhPcHRpb25zOiBOZXh0QXV0aE9wdGlvbnMgPSB7XG4gIHByb3ZpZGVyczogW1xuICAgIENyZWRlbnRpYWxzUHJvdmlkZXIoe1xuICAgICAgbmFtZTogXCJDcmVkZW50aWFsc1wiLFxuICAgICAgY3JlZGVudGlhbHM6IHtcbiAgICAgICAgZW1haWw6IHsgbGFiZWw6IFwiRS1NYWlsXCIsIHR5cGU6IFwiZW1haWxcIiB9LFxuICAgICAgICBwYXNzd29yZDogeyBsYWJlbDogXCJQYXNzd29ydFwiLCB0eXBlOiBcInBhc3N3b3JkXCIgfSxcbiAgICAgIH0sXG4gICAgICBhc3luYyBhdXRob3JpemUoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgaWYgKCFjcmVkZW50aWFscz8uZW1haWwgfHwgIWNyZWRlbnRpYWxzPy5wYXNzd29yZCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVtbyBtb2RlOiBhbnkgQHZpYTEuY2ggZW1haWwgd2l0aCBwYXNzd29yZCBcInZpYTFcIlxuICAgICAgICBpZiAoREVNT19NT0RFKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgY3JlZGVudGlhbHMuZW1haWwuZW5kc1dpdGgoXCJAdmlhMS5jaFwiKSAmJlxuICAgICAgICAgICAgY3JlZGVudGlhbHMucGFzc3dvcmQgPT09IFwidmlhMVwiXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gY3JlZGVudGlhbHMuZW1haWwuc3BsaXQoXCJAXCIpWzBdITtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGlkOiBuYW1lLFxuICAgICAgICAgICAgICBuYW1lOiBuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zbGljZSgxKSxcbiAgICAgICAgICAgICAgZW1haWw6IGNyZWRlbnRpYWxzLmVtYWlsLFxuICAgICAgICAgICAgICByb2xlczogW1wiQURNSU5cIl0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByb2R1Y3Rpb24gbW9kZTogY2hlY2sgYWdhaW5zdCBkYXRhYmFzZVxuICAgICAgICBjb25zdCB1c2VyID0gYXdhaXQgcHJpc21hLnVzZXIuZmluZFVuaXF1ZSh7XG4gICAgICAgICAgd2hlcmU6IHsgZW1haWw6IGNyZWRlbnRpYWxzLmVtYWlsLnRyaW0oKS50b0xvd2VyQ2FzZSgpIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghdXNlciB8fCAhdXNlci5wYXNzd29yZCB8fCAhdXNlci5wYXNzd29yZFNldCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNWYWxpZCA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKFxuICAgICAgICAgIGNyZWRlbnRpYWxzLnBhc3N3b3JkLFxuICAgICAgICAgIHVzZXIucGFzc3dvcmRcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaWQ6IHVzZXIuaWQsXG4gICAgICAgICAgbmFtZTogdXNlci5uYW1lLFxuICAgICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxuICAgICAgICAgIHJvbGVzOiB1c2VyLnJvbGVzIGFzIHN0cmluZ1tdLFxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgc2Vzc2lvbjoge1xuICAgIHN0cmF0ZWd5OiBcImp3dFwiLFxuICB9LFxuICBjYWxsYmFja3M6IHtcbiAgICBhc3luYyBqd3QoeyB0b2tlbiwgdXNlciB9KSB7XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICB0b2tlbi5yb2xlcyA9IHVzZXIucm9sZXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW47XG4gICAgfSxcbiAgICBhc3luYyBzZXNzaW9uKHsgc2Vzc2lvbiwgdG9rZW4gfSkge1xuICAgICAgaWYgKHNlc3Npb24udXNlcikge1xuICAgICAgICBzZXNzaW9uLnVzZXIuaWQgPSB0b2tlbi5zdWIgYXMgc3RyaW5nO1xuICAgICAgICBzZXNzaW9uLnVzZXIucm9sZXMgPSB0b2tlbi5yb2xlcyBhcyBzdHJpbmdbXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZXNzaW9uO1xuICAgIH0sXG4gIH0sXG4gIHBhZ2VzOiB7XG4gICAgc2lnbkluOiBcIi9sb2dpblwiLFxuICB9LFxuICBzZWNyZXQ6IHByb2Nlc3MuZW52Lk5FWFRBVVRIX1NFQ1JFVCxcbn07XG4iXSwibmFtZXMiOlsiQ3JlZGVudGlhbHNQcm92aWRlciIsImJjcnlwdCIsInByaXNtYSIsIkRFTU9fTU9ERSIsInByb2Nlc3MiLCJlbnYiLCJEQVRBQkFTRV9VUkwiLCJhdXRoT3B0aW9ucyIsInByb3ZpZGVycyIsIm5hbWUiLCJjcmVkZW50aWFscyIsImVtYWlsIiwibGFiZWwiLCJ0eXBlIiwicGFzc3dvcmQiLCJhdXRob3JpemUiLCJlbmRzV2l0aCIsInNwbGl0IiwiaWQiLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsInNsaWNlIiwicm9sZXMiLCJ1c2VyIiwiZmluZFVuaXF1ZSIsIndoZXJlIiwidHJpbSIsInRvTG93ZXJDYXNlIiwicGFzc3dvcmRTZXQiLCJpc1ZhbGlkIiwiY29tcGFyZSIsInNlc3Npb24iLCJzdHJhdGVneSIsImNhbGxiYWNrcyIsImp3dCIsInRva2VuIiwic3ViIiwicGFnZXMiLCJzaWduSW4iLCJzZWNyZXQiLCJORVhUQVVUSF9TRUNSRVQiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.ts":
/*!***************************!*\
  !*** ./src/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\n// Prisma Client Singleton — vermeidet, dass bei Hot-Reload in\n// development viele Client-Instanzen erzeugt werden.\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n    log:  true ? [\n        \"error\",\n        \"warn\"\n    ] : 0\n});\nif (true) {\n    globalForPrisma.prisma = prisma;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBOEM7QUFFOUMsOERBQThEO0FBQzlELHFEQUFxRDtBQUNyRCxNQUFNQyxrQkFBa0JDO0FBSWpCLE1BQU1DLFNBQ1hGLGdCQUFnQkUsTUFBTSxJQUN0QixJQUFJSCx3REFBWUEsQ0FBQztJQUNmSSxLQUFLQyxLQUFzQyxHQUFHO1FBQUM7UUFBUztLQUFPLEdBQUcsQ0FBUztBQUM3RSxHQUFHO0FBRUwsSUFBSUEsSUFBcUMsRUFBRTtJQUN6Q0osZ0JBQWdCRSxNQUFNLEdBQUdBO0FBQzNCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdmlhMS1hcHAvLi9zcmMvbGliL3ByaXNtYS50cz8wMWQ3Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gXCJAcHJpc21hL2NsaWVudFwiO1xuXG4vLyBQcmlzbWEgQ2xpZW50IFNpbmdsZXRvbiDigJQgdmVybWVpZGV0LCBkYXNzIGJlaSBIb3QtUmVsb2FkIGluXG4vLyBkZXZlbG9wbWVudCB2aWVsZSBDbGllbnQtSW5zdGFuemVuIGVyemV1Z3Qgd2VyZGVuLlxuY29uc3QgZ2xvYmFsRm9yUHJpc21hID0gZ2xvYmFsVGhpcyBhcyB1bmtub3duIGFzIHtcbiAgcHJpc21hOiBQcmlzbWFDbGllbnQgfCB1bmRlZmluZWQ7XG59O1xuXG5leHBvcnQgY29uc3QgcHJpc21hID1cbiAgZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA/P1xuICBuZXcgUHJpc21hQ2xpZW50KHtcbiAgICBsb2c6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcImRldmVsb3BtZW50XCIgPyBbXCJlcnJvclwiLCBcIndhcm5cIl0gOiBbXCJlcnJvclwiXSxcbiAgfSk7XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHtcbiAgZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA9IHByaXNtYTtcbn1cbiJdLCJuYW1lcyI6WyJQcmlzbWFDbGllbnQiLCJnbG9iYWxGb3JQcmlzbWEiLCJnbG9iYWxUaGlzIiwicHJpc21hIiwibG9nIiwicHJvY2VzcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/bcryptjs","vendor-chunks/oauth","vendor-chunks/object-hash","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/lru-cache","vendor-chunks/cookie","vendor-chunks/oidc-token-hash","vendor-chunks/@panva"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fgame%2Fhighscore%2Froute&page=%2Fapi%2Fgame%2Fhighscore%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgame%2Fhighscore%2Froute.ts&appDir=%2FUsers%2Fyvesgarnier%2FApps%2Fvia1-app%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fyvesgarnier%2FApps%2Fvia1-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();