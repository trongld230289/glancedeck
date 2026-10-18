"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
var claude_code_1 = require("claude-code");
var core_1 = require("./core");
var queue_1 = require("./queue");
var sessions_1 = require("./sessions");
var PANE = 'glancedeck';
var PANE_COLUMNS = 58;
var COUNTDOWN_MS = 5000;
// Hue names a block; inside a block, color only says state: lantern waits on you, ember works, jade is done.
var C = {
    queue: '#5EE6E6',
    queueLit: '#167A80',
    queueDeep: '#0D3B40',
    sessions: '#FFC857',
    agents: '#8EA2FF',
    log: '#7A8194',
    text: '#E6E8EE',
    dim: '#8B93A7',
    faint: '#4A5060',
    jade: '#7EE0A1',
    ember: '#FF9F6B',
    rose: '#F39BD0',
    alarm: '#FF7A7A',
    ink: '#000000',
};
var DEFAULT_VIEW = {
    collapsed: [],
    logTab: 'this',
    expandedAgent: null,
    focusBlock: 'queue',
    selected: null,
    editing: null,
    picking: null,
    messageTo: null,
};
var view = (0, claude_code_1.atom)({ plugin: 'glancedeck', key: 'view' }, DEFAULT_VIEW);
var agents = (0, claude_code_1.atom)({ plugin: 'glancedeck', key: 'agents' }, []);
var log = (0, claude_code_1.atom)({ plugin: 'glancedeck', key: 'log' }, []);
var queue = (0, claude_code_1.atom)({ plugin: 'glancedeck', key: 'queue' }, queue_1.EMPTY_QUEUE);
var runtime = (0, claude_code_1.atom)({ plugin: 'glancedeck', key: 'runtime' }, queue_1.IDLE);
var others = (0, claude_code_1.atom)({ plugin: 'glancedeck', key: 'others' }, []);
var self = (0, claude_code_1.atom)({ plugin: 'glancedeck', key: 'self' }, null);
var NO_TURN = { startedAt: null, endedAt: null, model: '', edits: 0, errors: 0, agents: 0, reason: null };
var turn = (0, claude_code_1.atom)({ plugin: 'glancedeck', key: 'turn' }, NO_TURN);
var setTurn = function ($, change) { return (0, claude_code_1.update)($, turn, function (t) { return change(__assign(__assign({}, NO_TURN), t)); }); };
var BLOCK_OF_KEY = { q: 'queue', s: 'sessions', a: 'agents', l: 'log' };
var setView = function ($, change) { return (0, claude_code_1.update)($, view, function (v) { return change(__assign(__assign({}, DEFAULT_VIEW), v)); }); };
var setAgents = function ($, change) { return (0, claude_code_1.update)($, agents, function (a) { return change(a !== null && a !== void 0 ? a : []); }); };
var setRuntime = function ($, change) { return (0, claude_code_1.update)($, runtime, function (r) { return change(__assign(__assign({}, queue_1.IDLE), r)); }); };
var say = function ($, line) { return __awaiter(void 0, void 0, void 0, function () {
    var at;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, $.clock.now()];
            case 1:
                at = _a.sent();
                return [4 /*yield*/, (0, claude_code_1.update)($, log, function (l) { return (0, core_1.pushLog)(l !== null && l !== void 0 ? l : [], __assign(__assign({}, line), { at: at })); })];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
/** Bookkeeping after the engine has acted: a failure here is logged, never passed on to the call. */
var quietly = function ($, what, fn) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fn()];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                $.ui.log("glancedeck: ".concat(what, " failed: ").concat(error_1 instanceof Error ? error_1.message : String(error_1)), { to: 'debug' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var toggle = function (list, item) { return (list.includes(item) ? list.filter(function (x) { return x !== item; }) : __spreadArray(__spreadArray([], list, true), [item], false)); };
/** `agent 2` for the second card of this session, or `agent` when it has no card. */
function agentLabel($, id) {
    return __awaiter(this, void 0, void 0, function () {
        var i;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, claude_code_1.read)($, agents)];
                case 1:
                    i = ((_a = (_b.sent())) !== null && _a !== void 0 ? _a : []).findIndex(function (c) { return c.id === id; });
                    return [2 /*return*/, i >= 0 ? "agent ".concat(i + 1) : 'agent'];
            }
        });
    });
}
function openPane($) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, $.ui.open({ id: PANE, title: 'GLANCEDECK', columns: PANE_COLUMNS, rows: 12 })];
        });
    });
}
function openFile($, path) {
    return __awaiter(this, void 0, void 0, function () {
        var isWindows, argv, ran;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.env.get('OS')];
                case 1:
                    isWindows = (_a.sent()) === 'Windows_NT';
                    argv = isWindows ? ['cmd', '/c', 'code', '-g', path] : ['code', '-g', path];
                    return [4 /*yield*/, $.process.run(argv, { timeoutMs: 10000 }).catch(function () { return null; })];
                case 2:
                    ran = _a.sent();
                    if (!ran || ran.exitCode !== 0)
                        $.ui.toast("glancedeck: could not open ".concat((0, core_1.basename)(path), " (is `code` on PATH?)"));
                    return [2 /*return*/];
            }
        });
    });
}
// The countdown's timer lives with this copy of the module; a reload drops it and the countdown with it.
var timer = null;
var made = 0;
// While the 5h window holds the queue: the timer that looks again at the reset, and whether it was said.
var resetTimer = null;
var usageHeld = false;
// ---------------------------------------------------------------- the queue, persisted per project
/** The folder every account's glancedeck shares: in the home folder, outside any CLAUDE_CONFIG_DIR. */
function sharedDir($) {
    return __awaiter(this, void 0, void 0, function () {
        var home, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, $.env.get('USERPROFILE')];
                case 1:
                    if (!((_b = (_c.sent())) !== null && _b !== void 0)) return [3 /*break*/, 2];
                    _a = _b;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, $.env.get('HOME')];
                case 3:
                    _a = (_c.sent());
                    _c.label = 4;
                case 4:
                    home = _a;
                    return [2 /*return*/, home ? "".concat(home.replace(/\\/g, '/'), "/.glancedeck") : null];
            }
        });
    });
}
function queueKey($) {
    return __awaiter(this, void 0, void 0, function () {
        var cwd;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.session.cwd().catch(function () { return null; })];
                case 1:
                    cwd = _a.sent();
                    return [2 /*return*/, cwd ? (0, queue_1.projectKey)(cwd) : null];
            }
        });
    });
}
function queuePath($, key) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, dir, k, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, sharedDir($)];
                case 1:
                    _b = [_d.sent()];
                    if (!(key !== null && key !== void 0)) return [3 /*break*/, 2];
                    _c = key;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, queueKey($)];
                case 3:
                    _c = (_d.sent());
                    _d.label = 4;
                case 4:
                    _a = _b.concat([_c]), dir = _a[0], k = _a[1];
                    return [2 /*return*/, dir && k ? "".concat(dir, "/queues/").concat(k, ".json") : null];
            }
        });
    });
}
function readQueueFile($, path) {
    return __awaiter(this, void 0, void 0, function () {
        var text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.fs.read(path).catch(function () { return null; })];
                case 1:
                    text = _a.sent();
                    try {
                        return [2 /*return*/, (0, queue_1.normalizeQueue)(typeof text === 'string' ? JSON.parse(text) : null)];
                    }
                    catch (_b) {
                        return [2 /*return*/, (0, queue_1.normalizeQueue)(null)];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/** Puts a prompt in another session's queue: that session's glancedeck sends it as the person's words. */
function queueInto($, key, text, atFront) {
    return __awaiter(this, void 0, void 0, function () {
        var path, q, now, item, items;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, queuePath($, key)];
                case 1:
                    path = _a.sent();
                    if (!path)
                        return [2 /*return*/];
                    return [4 /*yield*/, readQueueFile($, path)];
                case 2:
                    q = _a.sent();
                    return [4 /*yield*/, $.clock.now()];
                case 3:
                    now = _a.sent();
                    made += 1;
                    item = { id: (0, queue_1.newId)(now, made), text: text, ifOk: false, addedAt: now };
                    items = atFront ? __spreadArray([item], q.items, true) : __spreadArray(__spreadArray([], q.items, true), [item], false);
                    return [4 /*yield*/, $.fs.write(path, "".concat(JSON.stringify(__assign(__assign({}, q), { items: items }), null, 2), "\n"))];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// ---------------------------------------------------------------- heartbeat: this session for the others to see
var HEARTBEAT_MS = 5000;
var ticker = null;
var startedAt = 0;
var status = { kind: 'idle', since: 0 };
function playAlert($) {
    return __awaiter(this, void 0, void 0, function () {
        var os, argv;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.env.get('OS')];
                case 1:
                    os = _a.sent();
                    argv = os === 'Windows_NT'
                        ? ['powershell', '-NoProfile', '-Command', '[System.Media.SystemSounds]::Exclamation.Play(); Start-Sleep -Milliseconds 600']
                        : ['afplay', '/System/Library/Sounds/Glass.aiff'];
                    return [4 /*yield*/, $.process.run(argv, { timeoutMs: 5000 }).catch(function () { return null; })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/** Writes this session's heartbeat, reads everyone's, and acts on what changed. */
function tick($_1) {
    return __awaiter(this, arguments, void 0, function ($, isGone) {
        var dir, key, _a, id, cwd, configDir, rt0, own, cards, now, rt, lines, kind, last, beat, entries, beats, _i, entries_1, entry, text, h, isOwner, _b, _c, due, mark, who;
        var _d, _e;
        if (isGone === void 0) { isGone = false; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, sharedDir($)];
                case 1:
                    dir = _f.sent();
                    return [4 /*yield*/, queueKey($)];
                case 2:
                    key = _f.sent();
                    if (!dir || !key)
                        return [2 /*return*/];
                    return [4 /*yield*/, Promise.all([
                            $.session.id(),
                            $.session.cwd(),
                            $.env.get('CLAUDE_CONFIG_DIR'),
                            (0, claude_code_1.read)($, runtime),
                            (0, claude_code_1.read)($, log),
                            (0, claude_code_1.read)($, agents),
                            $.clock.now(),
                        ])];
                case 3:
                    _a = _f.sent(), id = _a[0], cwd = _a[1], configDir = _a[2], rt0 = _a[3], own = _a[4], cards = _a[5], now = _a[6];
                    rt = __assign(__assign({}, queue_1.IDLE), rt0);
                    lines = own !== null && own !== void 0 ? own : [];
                    kind = rt.isAsking ? 'waiting' : rt.isTurnRunning || rt.background.length > 0 ? 'working' : 'idle';
                    if (kind !== status.kind)
                        status = { kind: kind, since: now };
                    last = __spreadArray([], lines, true).reverse().find(function (l) { return l.who === 'main' || l.who === 'agent'; });
                    beat = {
                        sessionId: id,
                        project: (0, core_1.basename)(cwd),
                        cwd: cwd,
                        queueKey: key,
                        account: (0, sessions_1.accountOf)(configDir),
                        status: kind,
                        activity: kind === 'waiting' ? ((_d = rt.question) !== null && _d !== void 0 ? _d : 'chờ bạn') : ((_e = last === null || last === void 0 ? void 0 : last.text) !== null && _e !== void 0 ? _e : ''),
                        since: status.since,
                        startedAt: startedAt,
                        updatedAt: isGone ? 0 : now,
                        log: lines.filter(function (l) { return l.who !== 'peer'; }).slice(-20),
                        agents: (0, sessions_1.sharedAgents)(cards !== null && cards !== void 0 ? cards : [], now),
                    };
                    return [4 /*yield*/, $.fs.write("".concat(dir, "/sessions/").concat(id, ".json"), JSON.stringify(beat))];
                case 4:
                    _f.sent();
                    if (isGone)
                        return [2 /*return*/];
                    return [4 /*yield*/, $.fs.list("".concat(dir, "/sessions")).catch(function () { return []; })];
                case 5:
                    entries = _f.sent();
                    beats = [];
                    _i = 0, entries_1 = entries;
                    _f.label = 6;
                case 6:
                    if (!(_i < entries_1.length)) return [3 /*break*/, 9];
                    entry = entries_1[_i];
                    if (entry.kind !== 'file' || !entry.name.endsWith('.json') || now - entry.mtimeMs > 60000)
                        return [3 /*break*/, 8];
                    return [4 /*yield*/, $.fs.read("".concat(dir, "/sessions/").concat(entry.name)).catch(function () { return null; })];
                case 7:
                    text = _f.sent();
                    h = typeof text === 'string' ? (0, sessions_1.parseHeartbeat)(text) : null;
                    if (h)
                        beats.push(h);
                    _f.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 6];
                case 9: return [4 /*yield*/, (0, claude_code_1.update)($, others, function () { return beats.filter(function (h) { return h.sessionId !== id; }); })];
                case 10:
                    _f.sent();
                    return [4 /*yield*/, (0, claude_code_1.update)($, self, function () { return beat; })
                        // Two sessions on one repo share its queue: only the one that started first sends it.
                    ];
                case 11:
                    _f.sent();
                    isOwner = (0, sessions_1.isQueueOwner)(beats, beat, now);
                    if (!(isOwner !== rt.isQueueOwner)) return [3 /*break*/, 15];
                    if (!!isOwner) return [3 /*break*/, 13];
                    return [4 /*yield*/, cancelCountdown($, 'turn')];
                case 12:
                    _f.sent();
                    _f.label = 13;
                case 13: return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { isQueueOwner: isOwner })); })];
                case 14:
                    _f.sent();
                    _f.label = 15;
                case 15:
                    if (!!rt.countdown) return [3 /*break*/, 18];
                    return [4 /*yield*/, loadQueue($)];
                case 16:
                    _f.sent();
                    return [4 /*yield*/, maybeStart($)];
                case 17:
                    _f.sent();
                    _f.label = 18;
                case 18:
                    _b = 0, _c = (0, sessions_1.dueAlerts)(beats, id, now);
                    _f.label = 19;
                case 19:
                    if (!(_b < _c.length)) return [3 /*break*/, 24];
                    due = _c[_b];
                    mark = "".concat(dir, "/alerts/").concat(due.key, ".json");
                    return [4 /*yield*/, $.fs.exists(mark)];
                case 20:
                    if (_f.sent())
                        return [3 /*break*/, 23];
                    return [4 /*yield*/, $.fs.write(mark, JSON.stringify({ at: now, by: id }))];
                case 21:
                    _f.sent();
                    who = "".concat(due.beat.project).concat(due.beat.account ? " @".concat(due.beat.account) : '');
                    $.ui.toast("glancedeck: ".concat(who, " ch\u1EDD b\u1EA1n \u0111\u00E3 3 ph\u00FAt: ").concat(due.beat.activity), { timeoutMs: 10000 });
                    return [4 /*yield*/, playAlert($)];
                case 22:
                    _f.sent();
                    _f.label = 23;
                case 23:
                    _b++;
                    return [3 /*break*/, 19];
                case 24: return [2 /*return*/];
            }
        });
    });
}
function loadQueue($) {
    return __awaiter(this, void 0, void 0, function () {
        var path, text, _a, parsed, q;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, queuePath($)];
                case 1:
                    path = _b.sent();
                    if (!path) return [3 /*break*/, 3];
                    return [4 /*yield*/, $.fs.read(path).catch(function () { return null; })];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = null;
                    _b.label = 4;
                case 4:
                    text = _a;
                    parsed = null;
                    try {
                        parsed = typeof text === 'string' ? JSON.parse(text) : null;
                    }
                    catch (_c) {
                        parsed = null;
                    }
                    q = (0, queue_1.normalizeQueue)(parsed);
                    return [4 /*yield*/, (0, claude_code_1.update)($, queue, function () { return q; })];
                case 5:
                    _b.sent();
                    return [2 /*return*/, q];
            }
        });
    });
}
function saveQueue($, q) {
    return __awaiter(this, void 0, void 0, function () {
        var path;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, claude_code_1.update)($, queue, function () { return q; })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, queuePath($)];
                case 2:
                    path = _a.sent();
                    if (!path) return [3 /*break*/, 4];
                    return [4 /*yield*/, $.fs.write(path, "".concat(JSON.stringify(q, null, 2), "\n"))];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, q];
            }
        });
    });
}
function changeQueue($, change) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _a = saveQueue;
                    _b = [$];
                    _c = change;
                    _d = queue_1.normalizeQueue;
                    return [4 /*yield*/, (0, claude_code_1.read)($, queue)];
                case 1: return [2 /*return*/, _a.apply(void 0, _b.concat([_c.apply(void 0, [_d.apply(void 0, [_e.sent()])])]))];
            }
        });
    });
}
function cancelCountdown($, why) {
    return __awaiter(this, void 0, void 0, function () {
        var rt, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = [__assign({}, queue_1.IDLE)];
                    return [4 /*yield*/, (0, claude_code_1.read)($, runtime)];
                case 1:
                    rt = __assign.apply(void 0, _a.concat([(_b.sent())]));
                    if (!rt.countdown)
                        return [2 /*return*/];
                    timer === null || timer === void 0 ? void 0 : timer.cancel();
                    timer = null;
                    return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { countdown: null })); })];
                case 2:
                    _b.sent();
                    if (!(why === 'cancel')) return [3 /*break*/, 4];
                    return [4 /*yield*/, changeQueue($, function (q) { return (__assign(__assign({}, q), { paused: true, pauseReason: 'cancel' })); })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    if (!(why !== 'turn')) return [3 /*break*/, 6];
                    return [4 /*yield*/, say($, { who: 'queue', label: 'queue', text: why === 'typed' ? 'huỷ lần gửi: bạn đang gõ' : 'huỷ lần gửi, queue dừng' })];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
/** Reads this account's 5-hour window afresh; the plain call is free. */
function refreshUsage($) {
    return __awaiter(this, void 0, void 0, function () {
        var u;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.session.usage().catch(function () { return null; })];
                case 1:
                    u = _a.sent();
                    if (!u) return [3 /*break*/, 3];
                    return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { fiveHour: (0, queue_1.fiveHourOf)(u.rateLimits) })); })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/** The queue waits on the 5h window: say so once, and look again when the window resets. */
function holdForUsage($, rt, now) {
    return __awaiter(this, void 0, void 0, function () {
        var w, until;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    w = rt.fiveHour;
                    if (!w)
                        return [2 /*return*/];
                    if (!!usageHeld) return [3 /*break*/, 2];
                    usageHeld = true;
                    until = w.resetsAt ? " \u0111\u1EBFn ".concat((0, core_1.fmtClock)(w.resetsAt).slice(0, 5)) : '';
                    $.ui.toast("glancedeck: queue d\u1EEBng v\u00EC 5h \u0111\u00E3 d\u00F9ng ".concat(w.percent, "%").concat(until, "."));
                    return [4 /*yield*/, say($, { who: 'queue', label: 'queue', text: "d\u1EEBng: 5h ".concat(w.percent, "% > ").concat(queue_1.USAGE_LIMIT, "%").concat(until) })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    resetTimer === null || resetTimer === void 0 ? void 0 : resetTimer.cancel();
                    resetTimer = w.resetsAt
                        ? $.clock.after(Math.max(1000, w.resetsAt - now + 2000), function () { return void quietly($, 'usage resume', function () { return maybeStart($); }); })
                        : null;
                    return [2 /*return*/];
            }
        });
    });
}
/** Starts the head item's countdown when the session is free for it. */
function maybeStart($) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, q, rt, _b, _c, _d, now, head;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, refreshUsage($)];
                case 1:
                    _e.sent();
                    _b = queue_1.normalizeQueue;
                    return [4 /*yield*/, (0, claude_code_1.read)($, queue)];
                case 2:
                    _c = [_b.apply(void 0, [_e.sent()])];
                    _d = [__assign({}, queue_1.IDLE)];
                    return [4 /*yield*/, (0, claude_code_1.read)($, runtime)];
                case 3:
                    _a = _c.concat([__assign.apply(void 0, _d.concat([(_e.sent())]))]), q = _a[0], rt = _a[1];
                    return [4 /*yield*/, $.clock.now()];
                case 4:
                    now = _e.sent();
                    if (!(0, queue_1.isUsageBlocked)(rt, now)) return [3 /*break*/, 7];
                    if (!(q.items.length > 0 && !q.paused)) return [3 /*break*/, 6];
                    return [4 /*yield*/, holdForUsage($, rt, now)];
                case 5:
                    _e.sent();
                    _e.label = 6;
                case 6: return [2 /*return*/];
                case 7:
                    if (!usageHeld) return [3 /*break*/, 9];
                    usageHeld = false;
                    resetTimer === null || resetTimer === void 0 ? void 0 : resetTimer.cancel();
                    resetTimer = null;
                    if (!(q.items.length > 0)) return [3 /*break*/, 9];
                    return [4 /*yield*/, say($, { who: 'queue', label: 'queue', text: 'chạy lại: cửa sổ 5h đã reset' })];
                case 8:
                    _e.sent();
                    _e.label = 9;
                case 9:
                    if (!(0, queue_1.shouldStart)(q, rt, now))
                        return [2 /*return*/];
                    head = q.items[0];
                    if (!head)
                        return [2 /*return*/];
                    return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { countdown: { id: head.id, endsAt: now + COUNTDOWN_MS } })); })];
                case 10:
                    _e.sent();
                    timer === null || timer === void 0 ? void 0 : timer.cancel();
                    timer = $.clock.after(COUNTDOWN_MS, function () { return void quietly($, 'queue send', function () { return sendHead($, head.id, false); }); });
                    return [2 /*return*/];
            }
        });
    });
}
/** Sends the head item now (the countdown ran out, or send-now), or holds it on a failed --if-ok. */
function sendHead($, id, isForced) {
    return __awaiter(this, void 0, void 0, function () {
        var q, rt, _a, now, result;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    timer === null || timer === void 0 ? void 0 : timer.cancel();
                    timer = null;
                    return [4 /*yield*/, loadQueue($)];
                case 1:
                    q = _b.sent();
                    _a = [__assign({}, queue_1.IDLE)];
                    return [4 /*yield*/, (0, claude_code_1.read)($, runtime)];
                case 2:
                    rt = __assign.apply(void 0, _a.concat([(_b.sent())]));
                    return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { countdown: null })); })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, $.clock.now()];
                case 4:
                    now = _b.sent();
                    result = (0, queue_1.fire)(q, rt, id, now, isForced);
                    if (result.kind === 'none')
                        return [2 /*return*/];
                    return [4 /*yield*/, saveQueue($, result.queue)];
                case 5:
                    _b.sent();
                    if (!(result.kind === 'block')) return [3 /*break*/, 7];
                    $.ui.toast("glancedeck: ch\u01B0a g\u1EEDi \"".concat((0, core_1.shorten)(result.item.text, 40), "\": l\u01B0\u1EE3t tr\u01B0\u1EDBc c\u00F3 l\u1ED7i (--if-ok). Queue \u0111\u00E3 d\u1EEBng."));
                    return [4 /*yield*/, say($, { who: 'queue', label: 'queue', text: "gi\u1EEF l\u1EA1i (--if-ok): ".concat((0, core_1.shorten)(result.item.text, 40)), isError: true })];
                case 6:
                    _b.sent();
                    return [2 /*return*/];
                case 7: return [4 /*yield*/, say($, { who: 'queue', label: 'queue', text: "g\u1EEDi: ".concat((0, core_1.shorten)(result.item.text, 60)) })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, $.prompt.submit({ text: result.item.text, asUser: true })];
                case 9:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function addItem($, text, ifOk) {
    return __awaiter(this, void 0, void 0, function () {
        var now, item;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.clock.now()];
                case 1:
                    now = _a.sent();
                    made += 1;
                    item = { id: (0, queue_1.newId)(now, made), text: text, ifOk: ifOk, addedAt: now };
                    return [4 /*yield*/, changeQueue($, function (q) { return (__assign(__assign({}, q), { items: __spreadArray(__spreadArray([], q.items, true), [item], false) })); })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, maybeStart($)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, item];
            }
        });
    });
}
function resume($) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, changeQueue($, function (q) { return (__assign(__assign({}, q), { paused: false, pauseReason: null, items: q.items.map(function (_a) {
                            var _ = _a.isBlocked, i = __rest(_a, ["isBlocked"]);
                            return i;
                        }) })); })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, maybeStart($)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function pause($) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, cancelCountdown($, 'turn')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, changeQueue($, function (q) { return (__assign(__assign({}, q), { paused: true, pauseReason: 'user' })); })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/** Puts the focus ring on a text field that just appeared: autoFocus only acts when the pane first takes the keys. */
function focusInput($, key) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, quietly($, 'focus', function () { return $.ui.focus({ requestId: PANE, key: key }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function sendNow($) {
    return __awaiter(this, void 0, void 0, function () {
        var q, _a, head;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = queue_1.normalizeQueue;
                    return [4 /*yield*/, (0, claude_code_1.read)($, queue)];
                case 1:
                    q = _a.apply(void 0, [_b.sent()]);
                    head = q.items[0];
                    if (!head) return [3 /*break*/, 3];
                    return [4 /*yield*/, sendHead($, head.id, true)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
var register = function (on) {
    // ---------------------------------------------------------------- session
    on('session.start', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var started;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.command.register({
                        name: 'glancedeck',
                        description: 'GLANCEDECK pane: queue, other sessions, agents and log',
                        argumentHint: '[open|close]',
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, $.command.register({
                            name: 'q',
                            description: 'Queue a prompt for this project; it is sent when Claude is free',
                            argumentHint: '[--if-ok] <text> | list | clear | pause | resume',
                            immediate: true,
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, next(e)];
                case 3:
                    started = _a.sent();
                    return [4 /*yield*/, quietly($, 'queue load', function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, setRuntime($, function () { return queue_1.IDLE; })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, loadQueue($)];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, $.clock.now()];
                case 5:
                    startedAt = _a.sent();
                    status = { kind: 'idle', since: startedAt };
                    ticker === null || ticker === void 0 ? void 0 : ticker.cancel();
                    ticker = $.clock.every(HEARTBEAT_MS, function () { return void quietly($, 'heartbeat', function () { return tick($); }); });
                    void quietly($, 'heartbeat', function () { return tick($); });
                    void openPane($).catch(function () { return undefined; });
                    return [2 /*return*/, started];
            }
        });
    }); });
    on('session.end', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(e.reason !== 'clear')) return [3 /*break*/, 2];
                    ticker === null || ticker === void 0 ? void 0 : ticker.cancel();
                    ticker = null;
                    return [4 /*yield*/, quietly($, 'heartbeat off', function () { return tick($, true); })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (!(e.reason === 'clear')) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, claude_code_1.update)($, agents, function () { return []; })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, claude_code_1.update)($, log, function () { return []; })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, claude_code_1.update)($, turn, function () { return NO_TURN; })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, setView($, function (v) { return (__assign(__assign({}, v), { expandedAgent: null })); })];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [2 /*return*/, next(e)];
            }
        });
    }); });
    on('command.run', { command: 'glancedeck' }, function ($, e) { return __awaiter(void 0, void 0, void 0, function () {
        var opened;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(e.args.trim() === 'close')) return [3 /*break*/, 2];
                    return [4 /*yield*/, $.ui.close({ id: PANE })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { text: 'GLANCEDECK closed.' }];
                case 2: return [4 /*yield*/, openPane($)];
                case 3:
                    opened = _a.sent();
                    return [2 /*return*/, { text: opened.isPlaced ? 'GLANCEDECK opened. Focus it with ctrl+x tab.' : "GLANCEDECK is not shown yet: ".concat(opened.reason) }];
            }
        });
    }); });
    on('command.run', { command: 'q' }, function ($, e) { return __awaiter(void 0, void 0, void 0, function () {
        var cmd, item_1, q, _a, at, q, _b, now, sent, lines;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    cmd = (0, queue_1.parseQ)(e.args);
                    if (cmd.kind === 'help') {
                        return [2 /*return*/, { text: 'Usage: /q <text> · /q --if-ok <text> · /q list · /q clear · /q pause · /q resume' }];
                    }
                    if (!(cmd.kind === 'add')) return [3 /*break*/, 3];
                    return [4 /*yield*/, addItem($, cmd.text, cmd.ifOk)];
                case 1:
                    item_1 = _d.sent();
                    _a = queue_1.normalizeQueue;
                    return [4 /*yield*/, (0, claude_code_1.read)($, queue)];
                case 2:
                    q = _a.apply(void 0, [_d.sent()]);
                    at = q.items.findIndex(function (i) { return i.id === item_1.id; }) + 1;
                    return [2 /*return*/, { text: "Queued #".concat(at).concat(cmd.ifOk ? ' (if the turn before has no errors)' : '', ": ").concat((0, core_1.shorten)(cmd.text, 70)) }];
                case 3:
                    if (!(cmd.kind === 'list')) return [3 /*break*/, 6];
                    _b = queue_1.normalizeQueue;
                    return [4 /*yield*/, (0, claude_code_1.read)($, queue)];
                case 4:
                    q = _b.apply(void 0, [_d.sent()]);
                    return [4 /*yield*/, $.clock.now()];
                case 5:
                    now = _d.sent();
                    sent = (0, queue_1.keepToday)(q.sent, now);
                    lines = q.items.map(function (i, n) { return "".concat(n + 1, ". ").concat(i.ifOk ? '[if-ok] ' : '').concat(i.isBlocked ? '[held] ' : '').concat(i.text); });
                    return [2 /*return*/, {
                            text: __spreadArray(__spreadArray([
                                "Queue: ".concat(q.items.length, " waiting").concat(q.paused ? " \u00B7 paused (".concat((_c = q.pauseReason) !== null && _c !== void 0 ? _c : 'user', ")") : '')
                            ], lines, true), (sent.length ? __spreadArray(["Sent today: ".concat(sent.length)], sent.slice(-5).map(function (s) { return "  ".concat((0, core_1.fmtClock)(s.at), " ").concat((0, core_1.shorten)(s.text, 60)); }), true) : []), true).join('\n'),
                        }];
                case 6:
                    if (!(cmd.kind === 'clear')) return [3 /*break*/, 9];
                    return [4 /*yield*/, cancelCountdown($, 'turn')];
                case 7:
                    _d.sent();
                    return [4 /*yield*/, changeQueue($, function (q) { return (__assign(__assign({}, q), { items: [] })); })];
                case 8:
                    _d.sent();
                    return [2 /*return*/, { text: 'Queue cleared.' }];
                case 9:
                    if (!(cmd.kind === 'pause')) return [3 /*break*/, 11];
                    return [4 /*yield*/, pause($)];
                case 10:
                    _d.sent();
                    return [2 /*return*/, { text: 'Queue paused. /q resume to go on.' }];
                case 11: return [4 /*yield*/, resume($)];
                case 12:
                    _d.sent();
                    return [2 /*return*/, { text: 'Queue resumed.' }];
            }
        });
    }); });
    // ---------------------------------------------------------------- what the sender waits on
    on('turn.start', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!e.agentId) return [3 /*break*/, 2];
                    return [4 /*yield*/, quietly($, 'turn.start', function () { return __awaiter(void 0, void 0, void 0, function () {
                            var now, text;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, cancelCountdown($, 'turn')];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { isTurnRunning: true, turnErrors: 0 })); })];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, $.clock.now()];
                                    case 3:
                                        now = _a.sent();
                                        return [4 /*yield*/, setTurn($, function (t) { return (__assign(__assign({}, NO_TURN), { model: t.model, startedAt: now })); })];
                                    case 4:
                                        _a.sent();
                                        text = e.text ? (0, core_1.promptText)(e.text) : null;
                                        if (!text) return [3 /*break*/, 6];
                                        return [4 /*yield*/, say($, { who: 'you', label: 'you', text: text })];
                                    case 5:
                                        _a.sent();
                                        _a.label = 6;
                                    case 6: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/, next(e)];
            }
        });
    }); });
    // Each API response reports the 5h window: hold the queue past the limit, go on once it is under.
    on('session.measure', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!e.changed.includes('rateLimits')) return [3 /*break*/, 2];
                    return [4 /*yield*/, quietly($, 'usage measure', function () { return __awaiter(void 0, void 0, void 0, function () {
                            var fiveHour, now, was, _a, is;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        fiveHour = (0, queue_1.fiveHourOf)(e.rateLimits);
                                        return [4 /*yield*/, $.clock.now()];
                                    case 1:
                                        now = _b.sent();
                                        _a = [__assign({}, queue_1.IDLE)];
                                        return [4 /*yield*/, (0, claude_code_1.read)($, runtime)];
                                    case 2:
                                        was = __assign.apply(void 0, _a.concat([(_b.sent())]));
                                        return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { fiveHour: fiveHour })); })];
                                    case 3:
                                        _b.sent();
                                        is = __assign(__assign({}, was), { fiveHour: fiveHour });
                                        if (!((0, queue_1.isUsageBlocked)(is, now) && was.countdown)) return [3 /*break*/, 5];
                                        return [4 /*yield*/, cancelCountdown($, 'turn')];
                                    case 4:
                                        _b.sent();
                                        _b.label = 5;
                                    case 5:
                                        if (!((0, queue_1.isUsageBlocked)(was, now) && !(0, queue_1.isUsageBlocked)(is, now))) return [3 /*break*/, 7];
                                        return [4 /*yield*/, maybeStart($)];
                                    case 6:
                                        _b.sent();
                                        _b.label = 7;
                                    case 7: return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/, next(e)];
            }
        });
    }); });
    on('prompt.edit', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var rt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(e.origin.kind === 'composer')) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, claude_code_1.read)($, runtime)];
                case 1:
                    rt = _a.sent();
                    if (!(rt === null || rt === void 0 ? void 0 : rt.countdown)) return [3 /*break*/, 3];
                    return [4 /*yield*/, quietly($, 'cancel on typing', function () { return cancelCountdown($, 'typed'); })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, next(e)];
            }
        });
    }); });
    on('agent.spawn', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var started, agentId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, next(e)];
                case 1:
                    started = _a.sent();
                    if (started.deny !== undefined || !started.agentId)
                        return [2 /*return*/, started];
                    agentId = started.agentId;
                    return [4 /*yield*/, quietly($, 'agent.spawn card', function () { return __awaiter(void 0, void 0, void 0, function () {
                            var card, _a, _b;
                            var _c, _d;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        _c = {
                                            id: agentId,
                                            name: (0, core_1.shorten)(e.description || e.name || e.subagentType, 28),
                                            ctx: 0,
                                            out: 0
                                        };
                                        return [4 /*yield*/, $.clock.now()];
                                    case 1:
                                        card = (_c.spawnedAt = _e.sent(),
                                            _c.endedAt = null,
                                            _c.status = 'running',
                                            _c.tools = [],
                                            _c.answer = '',
                                            _c);
                                        return [4 /*yield*/, setAgents($, function (list) { return __spreadArray(__spreadArray([], list, true), [card], false).slice(-core_1.AGENTS_MAX); })];
                                    case 2:
                                        _e.sent();
                                        if (!!e.parentAgentId) return [3 /*break*/, 4];
                                        return [4 /*yield*/, setTurn($, function (t) { return (t.endedAt === null && t.startedAt !== null ? __assign(__assign({}, t), { agents: t.agents + 1 }) : t); })];
                                    case 3:
                                        _e.sent();
                                        _e.label = 4;
                                    case 4:
                                        if (!(e.background && !e.parentAgentId)) return [3 /*break*/, 6];
                                        return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { background: __spreadArray(__spreadArray([], r.background, true), [agentId], false) })); })];
                                    case 5:
                                        _e.sent();
                                        _e.label = 6;
                                    case 6:
                                        _a = say;
                                        _b = [$];
                                        _d = { who: 'agent' };
                                        return [4 /*yield*/, agentLabel($, card.id)];
                                    case 7: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_d.label = _e.sent(), _d.text = "b\u1EAFt \u0111\u1EA7u \u00B7 ".concat(card.name), _d)]))];
                                    case 8:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, started];
            }
        });
    }); });
    on('turn.step', function ($, e, next) {
        return __asyncGenerator(this, arguments, function () {
            var result, id, model_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [5 /*yield**/, __values(__asyncDelegator(__asyncValues(next(e))))];
                    case 1: return [4 /*yield*/, __await.apply(void 0, [_a.sent()])];
                    case 2:
                        result = _a.sent();
                        id = e.agentId;
                        if (!id) return [3 /*break*/, 4];
                        return [4 /*yield*/, __await(quietly($, 'turn.step usage', function () { return setAgents($, function (list) { return list.map(function (c) { return (c.id === id ? (0, core_1.applyStep)(c, result.usage) : c); }); }); }))];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        if (!e.model) return [3 /*break*/, 6];
                        model_1 = e.model;
                        return [4 /*yield*/, __await(quietly($, 'turn.step model', function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, (0, claude_code_1.read)($, turn)];
                                        case 1:
                                            if (!(((_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.model) !== model_1)) return [3 /*break*/, 3];
                                            return [4 /*yield*/, setTurn($, function (t) { return (__assign(__assign({}, t), { model: model_1 })); })];
                                        case 2:
                                            _b.sent();
                                            _b.label = 3;
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [4 /*yield*/, __await(result)];
                    case 7: return [2 /*return*/, _a.sent()];
                }
            });
        });
    });
    on('tool.call', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var isQuestion, question_1, ran;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isQuestion = e.tool === 'AskUserQuestion' && !e.agentId;
                    if (!isQuestion) return [3 /*break*/, 2];
                    question_1 = (0, sessions_1.questionOf)(e);
                    return [4 /*yield*/, quietly($, 'asking on', function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { isAsking: true, question: question_1 })); })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, say($, { who: 'main', label: 'main', text: "h\u1ECFi: ".concat(question_1), isQuestion: true })];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, tick($)];
                                    case 3:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [4 /*yield*/, next(e).finally(function () {
                        if (isQuestion)
                            void quietly($, 'asking off', function () { return setRuntime($, function (r) { return (__assign(__assign({}, r), { isAsking: false, question: null })); }); });
                    })];
                case 3:
                    ran = _a.sent();
                    if (ran.deny !== undefined)
                        return [2 /*return*/, ran];
                    return [4 /*yield*/, quietly($, 'tool.call log', function () { return __awaiter(void 0, void 0, void 0, function () {
                            var isError, id, text, path, _a, _b, _c;
                            var _d;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        isError = ran.isError === true;
                                        id = e.agentId;
                                        if (!(isError && !id)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { turnErrors: r.turnErrors + 1 })); })];
                                    case 1:
                                        _e.sent();
                                        _e.label = 2;
                                    case 2:
                                        if (!(isError && !id)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, setTurn($, function (t) { return (__assign(__assign({}, t), { errors: t.errors + 1 })); })];
                                    case 3:
                                        _e.sent();
                                        _e.label = 4;
                                    case 4:
                                        if (!(!isError && core_1.EDIT_TOOLS.has(e.tool))) return [3 /*break*/, 6];
                                        return [4 /*yield*/, setTurn($, function (t) { return (__assign(__assign({}, t), { edits: t.edits + 1 })); })];
                                    case 5:
                                        _e.sent();
                                        _e.label = 6;
                                    case 6:
                                        if (!(0, core_1.isLogged)(e.tool))
                                            return [2 /*return*/];
                                        text = (0, core_1.describeCall)(e.tool, e);
                                        if (!id) return [3 /*break*/, 8];
                                        return [4 /*yield*/, setAgents($, function (list) { return list.map(function (c) { return (c.id === id ? (0, core_1.noteTool)(c, text) : c); }); })];
                                    case 7:
                                        _e.sent();
                                        _e.label = 8;
                                    case 8:
                                        path = core_1.EDIT_TOOLS.has(e.tool) && !isError ? (0, core_1.pathOf)(e) : undefined;
                                        _a = say;
                                        _b = [$];
                                        _d = { who: id ? 'agent' : 'main' };
                                        if (!id) return [3 /*break*/, 10];
                                        return [4 /*yield*/, agentLabel($, id)];
                                    case 9:
                                        _c = _e.sent();
                                        return [3 /*break*/, 11];
                                    case 10:
                                        _c = 'main';
                                        _e.label = 11;
                                    case 11: return [4 /*yield*/, _a.apply(void 0, _b.concat([__assign.apply(void 0, [__assign.apply(void 0, [(_d.label = _c, _d.text = isError ? "".concat(text, "  \u2717") : text, _d), (path ? { path: path } : {})]), (isError ? { isError: isError } : {})])]))];
                                    case 12:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, ran];
            }
        });
    }); });
    on('turn.complete', function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var done, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, next(e)];
                case 1:
                    done = _a.sent();
                    id = e.agentId;
                    if (!!id) return [3 /*break*/, 3];
                    return [4 /*yield*/, quietly($, 'turn end', function () { return __awaiter(void 0, void 0, void 0, function () {
                            var now;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { isTurnRunning: false, lastTurnOk: r.turnErrors === 0 && e.reason === 'answer' })); })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, $.clock.now()];
                                    case 2:
                                        now = _a.sent();
                                        return [4 /*yield*/, setTurn($, function (t) { return (t.startedAt === null ? t : __assign(__assign({}, t), { endedAt: now, reason: e.reason })); })];
                                    case 3:
                                        _a.sent();
                                        return [4 /*yield*/, maybeStart($)];
                                    case 4:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, done];
                case 3: return [4 /*yield*/, quietly($, 'turn.complete card', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var list, now_1, status_1, answer_1, card, _a, _b;
                        var _c;
                        var _d, _e, _f;
                        return __generator(this, function (_g) {
                            switch (_g.label) {
                                case 0: return [4 /*yield*/, setRuntime($, function (r) { return (__assign(__assign({}, r), { background: r.background.filter(function (b) { return b !== id; }) })); })];
                                case 1:
                                    _g.sent();
                                    return [4 /*yield*/, (0, claude_code_1.read)($, agents)];
                                case 2:
                                    list = (_d = (_g.sent())) !== null && _d !== void 0 ? _d : [];
                                    if (!list.some(function (c) { return c.id === id; })) return [3 /*break*/, 7];
                                    return [4 /*yield*/, $.clock.now()];
                                case 3:
                                    now_1 = _g.sent();
                                    status_1 = e.reason === 'answer' ? 'done' : 'failed';
                                    answer_1 = (0, core_1.shorten)((_e = e.answer) !== null && _e !== void 0 ? _e : '', 200);
                                    return [4 /*yield*/, setAgents($, function (l) { return l.map(function (c) { return (c.id === id ? __assign(__assign({}, c), { status: status_1, endedAt: now_1, answer: answer_1 }) : c); }); })];
                                case 4:
                                    _g.sent();
                                    card = list.find(function (c) { return c.id === id; });
                                    _a = say;
                                    _b = [$];
                                    _c = { who: 'agent' };
                                    return [4 /*yield*/, agentLabel($, id)];
                                case 5: return [4 /*yield*/, _a.apply(void 0, _b.concat([__assign.apply(void 0, [(_c.label = _g.sent(), _c.text = status_1 === 'done' ? "xong \u00B7 ".concat((0, core_1.fmtElapsed)(now_1 - ((_f = card === null || card === void 0 ? void 0 : card.spawnedAt) !== null && _f !== void 0 ? _f : now_1))) : "d\u1EEBng (".concat(e.reason, ")"), _c), (status_1 === 'failed' ? { isError: true } : {})])]))];
                                case 6:
                                    _g.sent();
                                    _g.label = 7;
                                case 7: return [4 /*yield*/, maybeStart($)];
                                case 8:
                                    _g.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, done];
            }
        });
    }); });
    // Remember which block, and which queue item, holds the focus ring.
    on('ui.focus', { component: 'Pane', requestId: PANE }, function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var el, block, item_2;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    el = e.element;
                    block = el ? BLOCK_OF_KEY[(_a = el.split('-')[0]) !== null && _a !== void 0 ? _a : ''] : undefined;
                    if (!(el && block)) return [3 /*break*/, 2];
                    item_2 = (_c = (_b = /^q-item-(.+)$/.exec(el)) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : null;
                    return [4 /*yield*/, setView($, function (v) { return (__assign(__assign({}, v), { focusBlock: block, selected: item_2 !== null && item_2 !== void 0 ? item_2 : v.selected })); })];
                case 1:
                    _d.sent();
                    _d.label = 2;
                case 2: return [2 /*return*/, next(e)];
            }
        });
    }); });
    // ---------------------------------------------------------------- the band above the prompt: a send about to happen
    on('ui.render', { component: 'AbovePrompt' }, function ($, e, next) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, rt, q0, q, head, isCounting, isHeld, _b, Box, Text, Button;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (e.props.hasSurvey)
                        return [2 /*return*/, next(e)];
                    return [4 /*yield*/, Promise.all([(0, claude_code_1.read)($, runtime), (0, claude_code_1.read)($, queue)])];
                case 1:
                    _a = _c.sent(), rt = _a[0], q0 = _a[1];
                    q = (0, queue_1.normalizeQueue)(q0);
                    head = q.items[0];
                    isCounting = Boolean((rt === null || rt === void 0 ? void 0 : rt.countdown) && head && rt.countdown.id === head.id);
                    isHeld = Boolean(head === null || head === void 0 ? void 0 : head.isBlocked);
                    if (!head || (!isCounting && !isHeld))
                        return [2 /*return*/, next(e)];
                    _b = $.ui.resolve(e), Box = _b.Box, Text = _b.Text, Button = _b.Button;
                    return [2 /*return*/, (<Box>
        <Text color={isHeld ? C.alarm : C.queue} bold>
          {isHeld ? '✗ giữ lại ' : '⏳ sắp gửi '}
        </Text>
        <Text color={C.text} wrap="truncate">
          {(0, core_1.shorten)(head.text, Math.max(10, e.props.bodyColumns - 34))}
        </Text>
        <Text> </Text>
        <Button key="band-send" label={isHeld ? 'Vẫn gửi' : 'Gửi ngay'} hotkey="n" onPress={function () { return sendNow($); }}/>
        <Text> </Text>
        <Button key="band-cancel" label={isHeld ? 'Bỏ' : 'Huỷ'} hotkey="x" onPress={function () { return (isHeld ? changeQueue($, function (x) { return (__assign(__assign({}, x), { items: x.items.slice(1) })); }) : cancelCountdown($, 'cancel')); }}/>
      </Box>)];
            }
        });
    }); });
    // ---------------------------------------------------------------- the pane
    on('ui.render', { component: 'Pane', requestId: PANE }, function ($, e) { return __awaiter(void 0, void 0, void 0, function () {
        var els, Box, Text, Button, Input, hasClient, _a, v0, cards0, lines0, q0, rt0, beats0, selfBeat, turn0, selfId, cwd, now, beats, ownKey, v, cards, lines, q, rt, t, W, inner, isOpen, fold, row, headRow, frame, head, counting, selected, isQueueFocused, usageHold, autoText, autoColor, itemRight, editor, itemRow, sentToday, act, queueBlock, sessions, picking, targets, pickSession, messageTarget, waiting, MARK, sessionsBlock, peers, running, totalAgents, shown, offset, expanded, clock, agentsBlock, model, isTurnLive, isTurnOk, stats, turnBlock, LOG_MARK, logLines, logRow, tab, logBlock, chip;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    els = $.ui.resolve(e);
                    Box = els.Box, Text = els.Text, Button = els.Button;
                    Input = 'Input' in els ? els.Input : null;
                    hasClient = 'Client' in els;
                    return [4 /*yield*/, Promise.all([
                            (0, claude_code_1.read)($, view),
                            (0, claude_code_1.read)($, agents),
                            (0, claude_code_1.read)($, log),
                            (0, claude_code_1.read)($, queue),
                            (0, claude_code_1.read)($, runtime),
                            (0, claude_code_1.read)($, others),
                            (0, claude_code_1.read)($, self),
                            (0, claude_code_1.read)($, turn),
                            $.session.id().catch(function () { return ''; }),
                            $.session.cwd().catch(function () { return '?'; }),
                            $.clock.now(),
                        ])];
                case 1:
                    _a = _e.sent(), v0 = _a[0], cards0 = _a[1], lines0 = _a[2], q0 = _a[3], rt0 = _a[4], beats0 = _a[5], selfBeat = _a[6], turn0 = _a[7], selfId = _a[8], cwd = _a[9], now = _a[10];
                    beats = beats0 !== null && beats0 !== void 0 ? beats0 : [];
                    ownKey = (0, queue_1.projectKey)(cwd);
                    v = __assign(__assign({}, DEFAULT_VIEW), v0);
                    cards = cards0 !== null && cards0 !== void 0 ? cards0 : [];
                    lines = lines0 !== null && lines0 !== void 0 ? lines0 : [];
                    q = (0, queue_1.normalizeQueue)(q0);
                    rt = __assign(__assign({}, queue_1.IDLE), rt0);
                    t = __assign(__assign({}, NO_TURN), turn0);
                    W = Math.max(40, e.props.bodyColumns);
                    inner = W - 4;
                    isOpen = function (b) { return !v.collapsed.includes(b); };
                    fold = function (b) { return function () { return setView($, function (x) { return (__assign(__assign({}, x), { collapsed: toggle(x.collapsed, b) })); }); }; };
                    row = function (key, left, right, bg) { return (<Box key={key} width={inner} backgroundColor={bg}>
        <Box flexGrow={1} flexShrink={1}>
          {left}
        </Box>
        {right ? (<Box flexShrink={0} marginLeft={1}>
            {right}
          </Box>) : null}
      </Box>); };
                    headRow = function (block, title, color, summary, right) {
                        return row("".concat(block[0], "-head"), <Button key={"".concat(block[0], "-head")} plain onPress={fold(block)}>
          <Text color={color} bold>{"".concat(isOpen(block) ? '' : '▸ ').concat(title)}</Text>
          {summary}
        </Button>, right);
                    };
                    frame = function (key, color, isLive, children) { return (<Box key={key} flexDirection="column" borderStyle="round" borderColor={color} borderDimColor={!isLive} paddingX={1} width={W}>
        {children}
      </Box>); };
                    head = q.items[0];
                    counting = rt.countdown && head && rt.countdown.id === head.id ? rt.countdown : null;
                    selected = v.selected && q.items.some(function (i) { return i.id === v.selected; }) ? v.selected : ((_b = head === null || head === void 0 ? void 0 : head.id) !== null && _b !== void 0 ? _b : null);
                    isQueueFocused = e.props.isFocused && v.focusBlock === 'queue';
                    usageHold = (0, queue_1.isUsageBlocked)(rt, now) && rt.fiveHour ? rt.fiveHour : null;
                    autoText = !rt.isQueueOwner
                        ? 'phiên khác gửi'
                        : q.paused
                            ? q.pauseReason === 'if-ok'
                                ? 'dừng: lỗi'
                                : 'auto off'
                            : usageHold
                                ? "d\u1EEBng: 5h ".concat(Math.round(usageHold.percent), "%")
                                : 'auto on';
                    autoColor = q.paused ? (q.pauseReason === 'if-ok' ? C.alarm : C.dim) : usageHold ? C.sessions : C.jade;
                    itemRight = function (item, i) {
                        return item.isBlocked ? (<Text color={C.alarm}>✗ có lỗi</Text>) : i === 0 ? (q.paused ? (<Text color={C.dim}>⏸ dừng</Text>) : (<Text color={C.queue} bold>
            kế tiếp
          </Text>)) : item.ifOk ? (<Text color={C.sessions}>nếu 0 lỗi</Text>) : (<Text color={C.faint}>chờ</Text>);
                    };
                    editor = function (key, value, onSubmit) { return (<Box key={key} width={inner}>
        {Input ? (<Input key={key} label="" value={value} placeholder="việc cần Claude làm tiếp…" autoFocus onSubmit={function (text) {
                                void setView($, function (x) { return (__assign(__assign({}, x), { editing: null })); });
                                if (text.trim())
                                    void onSubmit(text.trim());
                            }}/>) : (<Text color={C.faint}>Dùng /q &lt;việc&gt; trên thiết bị này.</Text>)}
      </Box>); };
                    itemRow = function (item, i) {
                        if (v.editing === item.id) {
                            return editor("q-edit-".concat(item.id), item.text, function (text) {
                                return changeQueue($, function (x) { return (__assign(__assign({}, x), { items: x.items.map(function (it) { return (it.id === item.id ? __assign(__assign({}, it), { text: text, isBlocked: undefined }) : it); }) })); });
                            });
                        }
                        if (i === 0 && counting && hasClient) {
                            return (<Box key={"q-item-".concat(item.id)} width={inner}>
            <els.Client key={"q-ticket-".concat(item.id)} module="./ticket.tsx" props={{
                                    left: "\u25B8 ".concat(item.text),
                                    endsAt: counting.endsAt,
                                    now: now,
                                    total: COUNTDOWN_MS,
                                    width: inner,
                                    fg: C.text,
                                    lit: C.queueLit,
                                    dark: C.queueDeep,
                                }}/>
          </Box>);
                        }
                        var isHead = i === 0;
                        var mark = item.id === selected && e.props.isFocused ? '›' : isHead ? '▸' : String(i + 1);
                        return row("q-row-".concat(item.id), <Button key={"q-item-".concat(item.id)} plain onPress={function () { return setView($, function (x) { return (__assign(__assign({}, x), { selected: item.id })); }); }}>
          <Text color={isHead ? C.queue : C.faint} bold={isHead}>{"".concat(mark, " ")}</Text>
          <Text color={isHead ? C.text : C.dim} bold={isHead}>
            {counting && isHead ? "".concat(item.text, " \u00B7 sau ").concat(Math.max(0, Math.ceil((counting.endsAt - now) / 1000)), "s") : item.text}
          </Text>
        </Button>, itemRight(item, i), isHead ? C.queueDeep : undefined);
                    };
                    sentToday = (0, queue_1.keepToday)(q.sent, now).length;
                    act = function (key, hotkey, label, onPress) { return (<Button key={key} plain hotkey={hotkey} onPress={onPress}>
        {label}
      </Button>); };
                    queueBlock = frame('queue', C.queue, q.items.length > 0 && !q.paused && !usageHold, __spreadArray([
                        headRow('queue', 'QUEUE', C.queue, <Text color={C.dim}>
          {" \u00B7 ".concat(q.items.length, " ch\u1EDD \u00B7 ")}
          <Text color={autoColor}>{autoText}</Text>
        </Text>, (usageHold === null || usageHold === void 0 ? void 0 : usageHold.resetsAt) ? (<Text color={C.sessions}>{"\u21BB ch\u1EA1y l\u1EA1i sau ".concat((0, core_1.fmtUntil)(usageHold.resetsAt - now))}</Text>) : (<Text color={C.faint}>{"d\u1EEBng n\u1EBFu 5h>".concat(queue_1.USAGE_LIMIT, "%")}</Text>))
                    ], (isOpen('queue')
                        ? __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], q.items.map(itemRow), true), (v.editing === 'new' ? [editor('q-new', '', function (text) { return addItem($, text, false); })] : []), true), (q.items.length === 0 && v.editing !== 'new'
                            ? [row('q-empty', <Text color={C.faint}>/q &lt;việc&gt; hoặc q để thêm. Gửi khi Claude rảnh.</Text>, null)]
                            : []), true), (sentToday > 0 ? [row('q-sent', <Text color={C.faint}>{"\u2713 \u0111\u00E3 g\u1EEDi h\u00F4m nay: ".concat(sentToday)}</Text>, null)] : []), true), (isQueueFocused && q.items.length > 0
                            ? [
                                <Box key="q-keys" width={inner}>
                    {act('q-k-up', 'k', 'lên', function () { return selected && changeQueue($, function (x) { return (0, queue_1.move)(x, selected, -1); }); })}
                    <Text color={C.faint}> </Text>
                    {act('q-k-down', 'j', 'xuống', function () { return selected && changeQueue($, function (x) { return (0, queue_1.move)(x, selected, 1); }); })}
                    <Text color={C.faint}> </Text>
                    {act('q-k-edit', 'e', 'sửa', function () { return __awaiter(void 0, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if (!selected)
                                                        return [2 /*return*/];
                                                    return [4 /*yield*/, setView($, function (x) { return (__assign(__assign({}, x), { editing: selected })); })];
                                                case 1:
                                                    _a.sent();
                                                    return [4 /*yield*/, focusInput($, "q-edit-".concat(selected))];
                                                case 2:
                                                    _a.sent();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); })}
                    <Text color={C.faint}> </Text>
                    {act('q-k-del', 'd', 'xoá', function () { return selected && changeQueue($, function (x) { return (__assign(__assign({}, x), { items: x.items.filter(function (i) { return i.id !== selected; }) })); }); })}
                    <Text color={C.faint}> </Text>
                    {act('q-k-pause', 'p', q.paused ? 'chạy' : 'dừng', function () { return (q.paused ? resume($) : pause($)); })}
                    <Text color={C.faint}> </Text>
                    {act('q-k-now', 'n', 'gửi', function () { return sendNow($); })}
                    <Text color={C.faint}> </Text>
                    {act('q-k-move', 'm', 'sang phiên', function () { return selected && setView($, function (x) { return (__assign(__assign({}, x), { picking: { kind: 'move', itemId: selected } })); }); })}
                  </Box>,
                            ]
                            : []), true) : []), true));
                    sessions = (0, sessions_1.rowsOf)(beats, selfId, now);
                    picking = v.picking;
                    targets = sessions.filter(function (s) { return s.queueKey && s.queueKey !== ownKey; });
                    pickSession = function (s) { return __awaiter(void 0, void 0, void 0, function () {
                        var item_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!picking)
                                        return [2 /*return*/];
                                    if (!(picking.kind === 'move')) return [3 /*break*/, 6];
                                    item_3 = q.items.find(function (i) { return i.id === picking.itemId; });
                                    if (!item_3) return [3 /*break*/, 4];
                                    return [4 /*yield*/, queueInto($, s.queueKey, item_3.text, false)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, changeQueue($, function (x) { return (__assign(__assign({}, x), { items: x.items.filter(function (i) { return i.id !== item_3.id; }) })); })];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, say($, { who: 'queue', label: 'queue', text: "chuy\u1EC3n sang ".concat(s.project, ": ").concat((0, core_1.shorten)(item_3.text, 40)) })];
                                case 3:
                                    _a.sent();
                                    _a.label = 4;
                                case 4: return [4 /*yield*/, setView($, function (x) { return (__assign(__assign({}, x), { picking: null })); })];
                                case 5:
                                    _a.sent();
                                    return [3 /*break*/, 9];
                                case 6: return [4 /*yield*/, setView($, function (x) { return (__assign(__assign({}, x), { picking: null, messageTo: s.sessionId })); })];
                                case 7:
                                    _a.sent();
                                    return [4 /*yield*/, focusInput($, 's-msg-input')];
                                case 8:
                                    _a.sent();
                                    _a.label = 9;
                                case 9: return [2 /*return*/];
                            }
                        });
                    }); };
                    messageTarget = v.messageTo ? sessions.find(function (s) { return s.sessionId === v.messageTo; }) : undefined;
                    waiting = sessions.filter(function (s) { return s.status === 'waiting'; }).length;
                    MARK = {
                        waiting: { icon: '!', color: C.sessions },
                        working: { icon: '●', color: C.ember },
                        done: { icon: '✓', color: C.jade },
                    };
                    sessionsBlock = frame('sessions', C.sessions, waiting > 0, __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([
                        headRow('sessions', 'SESSIONS', C.sessions, <Text color={C.dim}>{sessions.length === 0 ? ' · không có phiên khác' : " \u00B7 ".concat(sessions.length, " kh\u00E1c")}</Text>, picking ? (<Button key="s-pick-cancel" plain onPress={function () { return setView($, function (x) { return (__assign(__assign({}, x), { picking: null })); }); }}>
            <Text color={C.sessions}>chọn phiên · huỷ</Text>
          </Button>) : waiting > 0 ? (<Text color={C.sessions} bold>{"".concat(waiting, " ch\u1EDD b\u1EA1n")}</Text>) : null)
                    ], (isOpen('sessions') && picking && targets.length === 0
                        ? [row('s-none', <Text color={C.faint}>Không có phiên nào ở repo khác để gửi sang.</Text>, null)]
                        : []), true), (isOpen('sessions') && picking
                        ? targets.map(function (s, i) {
                            return row("s-pick-".concat(i), <Button key={"s-pick-".concat(i)} plain hotkey={String(i + 1)} onPress={function () { return pickSession(s); }}>
                <Text color={C.sessions} bold>{"".concat(i + 1, " ")}</Text>
                <Text color={C.text}>{s.project}</Text>
                {s.account ? <Text color={C.rose}>{" @".concat(s.account)}</Text> : null}
              </Button>, <Text color={C.dim}>{s.status === 'done' ? 'rảnh' : 'xếp hàng'}</Text>);
                        })
                        : []), true), (isOpen('sessions') && messageTarget
                        ? [
                            <Box key="s-msg" width={inner}>
              <Text color={C.sessions}>{"\u2192 ".concat(messageTarget.project).concat(messageTarget.account ? " @".concat(messageTarget.account) : '', ": ")}</Text>
              {Input ? (<Input key="s-msg-input" label="" placeholder="nhắn như lời bạn, gửi khi phiên đó rảnh…" autoFocus onSubmit={function (text) {
                                        void setView($, function (x) { return (__assign(__assign({}, x), { messageTo: null })); });
                                        if (text.trim()) {
                                            void queueInto($, messageTarget.queueKey, text.trim(), true);
                                            void say($, { who: 'queue', label: 'queue', text: "nh\u1EAFn ".concat(messageTarget.project, ": ").concat((0, core_1.shorten)(text.trim(), 40)) });
                                        }
                                    }}/>) : (<Text color={C.faint}>không nhập được trên thiết bị này</Text>)}
            </Box>,
                        ]
                        : []), true), (isOpen('sessions') && !picking && selfBeat
                        ? [
                            (function (s) {
                                return row('s-self', <Text wrap="truncate" color={C.dim}>
                  {" ".concat(MARK[s.status].icon, "  ").concat(s.project)}
                  {s.account ? " @".concat(s.account) : ''}
                </Text>, <Text color={C.faint}>{s.elapsed ? "".concat(s.activity, " \u00B7 ").concat(s.elapsed) : s.activity}</Text>);
                            })((0, sessions_1.rowOf)(selfBeat, now)),
                        ]
                        : []), true), (isOpen('sessions') && !picking
                        ? sessions.map(function (s, i) {
                            return row("s-".concat(i), s.status === 'waiting' ? (<Text wrap="truncate">
                  <Text backgroundColor={C.sessions} color={C.ink} bold>{" ! ".concat(s.project, " ")}</Text>
                  {s.account ? <Text color={C.rose}>{" @".concat(s.account)}</Text> : null}
                </Text>) : (<Box>
                  {s.status === 'working' && hasClient ? (<Box flexShrink={0}>
                      <Text> </Text>
                      <els.Client key={"s-spin-".concat(i)} module="./spin.tsx" props={{ color: C.ember, now: now }}/>
                      <Text> </Text>
                    </Box>) : (<Text color={MARK[s.status].color}>{" ".concat(MARK[s.status].icon, " ")}</Text>)}
                  <Text wrap="truncate">
                    <Text color={C.text}>{" ".concat(s.project)}</Text>
                    {s.account ? <Text color={C.rose}>{" @".concat(s.account)}</Text> : null}
                  </Text>
                </Box>), <Text color={s.status === 'waiting' ? C.sessions : C.dim} bold={s.status === 'waiting'}>
                {s.elapsed ? "".concat(s.activity, " \u00B7 ").concat(s.elapsed) : s.activity}
              </Text>);
                        })
                        : []), true));
                    peers = (0, sessions_1.peerAgents)(beats, selfId, now);
                    running = cards.filter(function (c) { return c.status === 'running'; }).length + peers.filter(function (a) { return a.status === 'running'; }).length;
                    totalAgents = cards.length + peers.length;
                    shown = cards.slice(-9);
                    offset = cards.length - shown.length;
                    expanded = v.expandedAgent !== null ? cards[v.expandedAgent] : undefined;
                    clock = function (c) {
                        var _a;
                        return c.status !== 'running' ? (<Text color={c.status === 'done' ? C.jade : C.alarm}>{"".concat(c.status === 'done' ? '✓' : '✗', " ").concat((0, core_1.fmtElapsed)(((_a = c.endedAt) !== null && _a !== void 0 ? _a : now) - c.spawnedAt))}</Text>) : hasClient ? (<els.Client key={"a-clock-".concat(c.id)} module="./spin.tsx" props={{ since: c.spawnedAt, now: now, color: C.ember }}/>) : (<Text color={C.ember}>{"\u25CF ".concat((0, core_1.fmtElapsed)(now - c.spawnedAt))}</Text>);
                    };
                    agentsBlock = frame('agents', C.agents, running > 0, __spreadArray(__spreadArray([
                        headRow('agents', 'AGENTS', C.agents, <Text color={C.dim}>{totalAgents === 0 ? ' · chưa có' : " \u00B7 ".concat(running, " running \u00B7 ").concat(totalAgents, " total")}</Text>, shown.length > 0 ? <Text color={C.faint}>{shown.length === 1 ? 'phím 1: xem việc' : "ph\u00EDm 1-".concat(shown.length, ": xem vi\u1EC7c")}</Text> : null)
                    ], (isOpen('agents')
                        ? shown.flatMap(function (c, j) {
                            var i = offset + j;
                            return __spreadArray([
                                row("a-".concat(j), <Button key={"a-".concat(j)} plain hotkey={String(j + 1)} onPress={function () { return setView($, function (x) { return (__assign(__assign({}, x), { expandedAgent: x.expandedAgent === i ? null : i })); }); }}>
                  <Text color={c.status === 'running' ? C.text : C.dim} wrap="truncate">{c.name}</Text>
                </Button>, clock(c))
                            ], (v.expandedAgent === i && expanded
                                ? __spreadArray(__spreadArray(__spreadArray([
                                    row("a-".concat(j, "-tok"), <Text color={C.faint}>{"   ".concat((0, core_1.kTokens)(expanded.ctx), " context \u00B7 ").concat((0, core_1.kTokens)(expanded.out), " vi\u1EBFt ra")}</Text>, null)
                                ], (expanded.tools.length === 0
                                    ? [row("a-".concat(j, "-none"), <Text color={C.faint}>{'   chưa gọi tool nào'}</Text>, null)]
                                    : []), true), expanded.tools.map(function (t, k) { return row("a-".concat(j, "-t").concat(k), <Text color={C.dim} wrap="truncate">{"   \u00B7 ".concat(t)}</Text>, null); }), true), (expanded.answer
                                    ? [row("a-".concat(j, "-ans"), <Text color={C.dim} wrap="truncate">{"   \u00BB ".concat(expanded.answer)}</Text>, null)]
                                    : []), true) : []), true);
                        })
                        : []), true), (isOpen('agents')
                        ? peers.slice(0, 9).map(function (a, k) {
                            var _a;
                            return row("a-peer-".concat(k), <Text wrap="truncate">
                <Text color={C.agents}>◇ </Text>
                <Text color={a.status === 'running' ? C.text : C.dim}>{a.name}</Text>
                <Text color={C.faint}>{"  ".concat((0, core_1.kTokens)(a.ctx + a.out), " token \u00B7 ")}</Text>
                <Text color={C.dim}>{a.project}</Text>
                {a.account ? <Text color={C.rose}>{" @".concat(a.account)}</Text> : null}
              </Text>, a.status === 'running' ? (hasClient ? (<els.Client key={"a-peer-clock-".concat(k)} module="./spin.tsx" props={{ since: a.spawnedAt, now: now, color: C.ember }}/>) : (<Text color={C.ember}>{"\u25CF ".concat((0, core_1.fmtElapsed)(now - a.spawnedAt))}</Text>)) : (<Text color={a.status === 'done' ? C.jade : C.alarm}>
                  {"".concat(a.status === 'done' ? '✓' : '✗', " ").concat((0, core_1.fmtElapsed)(((_a = a.endedAt) !== null && _a !== void 0 ? _a : now) - a.spawnedAt))}
                </Text>));
                        })
                        : []), true));
                    model = (0, core_1.prettyModel)(t.model);
                    isTurnLive = t.startedAt !== null && t.endedAt === null;
                    isTurnOk = t.errors === 0 && (t.reason === null || t.reason === 'answer');
                    stats = (<Text color={C.dim}>
        <Text color={t.edits > 0 ? C.text : C.dim}>{"".concat(t.edits, " s\u1EEDa")}</Text>
        {' · '}
        <Text color={t.errors > 0 ? C.alarm : C.dim}>{"".concat(t.errors, " l\u1ED7i")}</Text>
        {' · '}
        <Text color={t.agents > 0 ? C.agents : C.dim}>{"".concat(t.agents, " agent")}</Text>
      </Text>);
                    turnBlock = frame('turn', C.ember, isTurnLive, [
                        row('t-head', <Text wrap="truncate">
          <Text color={C.ember} bold>
            TURN
          </Text>
          <Text color={C.dim}>{" \u00B7 ".concat(model)}</Text>
        </Text>, t.startedAt === null ? null : stats),
                        t.startedAt === null ? (row('t-none', <Text color={C.faint}>chưa có lượt nào</Text>, null)) : isTurnLive ? (row('t-now', <Text color={C.text}>đang làm</Text>, hasClient ? (<els.Client key="t-spin" module="./spin.tsx" props={{ color: C.ember, since: t.startedAt, now: now }}/>) : (<Text color={C.ember}>{"\u25CF ".concat((0, core_1.fmtElapsed)(now - t.startedAt))}</Text>))) : (row('t-last', <Text color={isTurnOk ? C.jade : C.alarm}>
            {"".concat(isTurnOk ? '✓' : '✗', " l\u01B0\u1EE3t tr\u01B0\u1EDBc \u00B7 ").concat((0, core_1.fmtElapsed)(((_c = t.endedAt) !== null && _c !== void 0 ? _c : now) - t.startedAt))}
            {t.reason && t.reason !== 'answer' ? " \u00B7 d\u1EEBng (".concat(t.reason, ")") : ''}
          </Text>, <Text color={C.faint}>{"xong ".concat((0, core_1.fmtClock)((_d = t.endedAt) !== null && _d !== void 0 ? _d : now))}</Text>)),
                    ]);
                    LOG_MARK = {
                        you: { icon: '▸', color: C.text },
                        main: { icon: '●', color: C.ember },
                        agent: { icon: '◇', color: C.agents },
                        peer: { icon: '!', color: C.rose },
                        queue: { icon: '»', color: C.queue },
                    };
                    logLines = (v.logTab === 'all' ? (0, sessions_1.mergeLogs)(lines, beats, selfId, now) : lines.filter(function (l) { return l.who !== 'peer'; })).slice(-12);
                    logRow = function (l, i) {
                        var mark = LOG_MARK[l.who];
                        var body = (<Text wrap="truncate">
          <Text color={C.faint}>{"".concat((0, core_1.fmtClock)(l.at), " ")}</Text>
          <Text color={mark.color}>{"".concat(mark.icon, " ")}</Text>
          <Text color={mark.color} bold={l.who === 'you'}>
            {l.label.padEnd(8)}
          </Text>
          <Text color={l.isError ? C.alarm : l.isQuestion ? C.sessions : l.who === 'you' ? C.text : C.dim}>{l.text}</Text>
        </Text>);
                        var path = l.path;
                        return row("l-".concat(i), path ? (<Button key={"l-".concat(i)} plain onPress={function () { return openFile($, path); }}>
            {body}
          </Button>) : (body), null);
                    };
                    tab = function (name) { return (<Button key={"l-tab-".concat(name)} plain onPress={function () { return setView($, function (x) { return (__assign(__assign({}, x), { logTab: name })); }); }}>
        <Text color={v.logTab === name ? C.text : C.faint} bold={v.logTab === name}>
          {v.logTab === name ? "[".concat(name, "]") : " ".concat(name, " ")}
        </Text>
      </Button>); };
                    logBlock = frame('log', C.log, false, __spreadArray([
                        row('l-head', <Button key="l-head" plain onPress={fold('log')}>
          <Text color={C.text} bold>{"".concat(isOpen('log') ? '' : '▸ ', "SESSION LOG")}</Text>
          {logLines.length === 0 ? <Text color={C.dim}> · chưa có</Text> : null}
        </Button>, <Box>
          {tab('this')}
          {tab('all')}
        </Box>)
                    ], (isOpen('log') ? logLines.map(logRow) : []), true));
                    chip = function (color, value, isLive) { return (<Text>
        <Text color={color}>{'  ● '}</Text>
        <Text color={isLive ? C.text : C.faint} bold={isLive}>{value}</Text>
      </Text>); };
                    return [2 /*return*/, (<Box flexDirection="column" width={W}>
        <Box width={W} marginBottom={1}>
          <Box flexGrow={1} flexShrink={1}>
            <Text wrap="truncate">
              <Text bold color={C.text}>
                GLANCEDECK
              </Text>
              <Text color={C.faint}>{' · '}</Text>
              <Text color={C.queue}>{(0, core_1.basename)(cwd)}</Text>
            </Text>
          </Box>
          <Box flexShrink={0}>
            {chip(C.sessions, "".concat(waiting, " ch\u1EDD b\u1EA1n"), waiting > 0)}
            {chip(C.queue, "".concat(q.items.length, " ch\u1EDD g\u1EEDi"), q.items.length > 0)}
            {chip(C.agents, "".concat(running, " agent"), running > 0)}
          </Box>
        </Box>
        {sessionsBlock}
        {queueBlock}
        {turnBlock}
        {agentsBlock}
        {logBlock}
        {e.props.isFocused ? null : (<Box width={W}>
            <Text color={C.faint} wrap="truncate">
              <Text color={C.dim} bold>ctrl+x</Text> rồi <Text color={C.dim} bold>tab</Text> để vào glancedeck, rồi{' '}
              <Text color={C.dim} bold>↑↓</Text> để di chuyển
            </Text>
          </Box>)}
        <Box width={W}>
          <Text color={C.faint}>↑↓ di chuyển · </Text>
          <Button key="f-queue" plain hotkey="q" onPress={function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, setView($, function (x) { return (__assign(__assign({}, x), { editing: 'new', focusBlock: 'queue' })); })];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, focusInput($, 'q-new')];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }}>
            thêm queue
          </Button>
          <Text color={C.faint}> · </Text>
          <Button key="f-send" plain hotkey="s" onPress={function () { return setView($, function (x) { return (__assign(__assign({}, x), { picking: { kind: 'message' }, focusBlock: 'sessions' })); }); }}>
            nhắn phiên
          </Button>
          <Text color={C.faint}> · </Text>
          <Button key="f-collapse" plain hotkey="c" onPress={function () { return setView($, function (x) { return (__assign(__assign({}, x), { collapsed: toggle(x.collapsed, x.focusBlock) })); }); }}>
            thu gọn
          </Button>
        </Box>
      </Box>)];
            }
        });
    }); });
};
exports.register = register;
