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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionOf = exports.peerAgents = exports.sharedAgents = exports.AGENT_LINGER_MS = exports.mergeLogs = exports.dueAlerts = exports.isQueueOwner = exports.rowOf = exports.rowsOf = exports.parseHeartbeat = exports.isLive = exports.accountOf = exports.ALERT_MS = exports.STALE_MS = void 0;
var core_1 = require("./core");
/** Older than this, a heartbeat's session is gone (closed, crashed, or its machine asleep). */
exports.STALE_MS = 30000;
/** A session waiting on you this long gets a toast and a sound, once per wait. */
exports.ALERT_MS = 3 * 60000;
/** `@acc2` for CLAUDE_CONFIG_DIR=~/.claude-acc2; no tag for the default ~/.claude. */
var accountOf = function (configDir) {
    var _a;
    if (!configDir)
        return null;
    var name = (_a = configDir
        .replace(/[\\/]+$/, '')
        .split(/[\\/]/)
        .pop()) !== null && _a !== void 0 ? _a : '';
    if (name === '.claude' || name === '')
        return null;
    return name.replace(/^\.claude-?/, '') || name;
};
exports.accountOf = accountOf;
var isLive = function (h, now) { return now - h.updatedAt < exports.STALE_MS; };
exports.isLive = isLive;
var parseHeartbeat = function (text) {
    try {
        var h = JSON.parse(text);
        if (typeof h.sessionId !== 'string' || typeof h.updatedAt !== 'number' || typeof h.project !== 'string')
            return null;
        return {
            sessionId: h.sessionId,
            project: h.project,
            cwd: typeof h.cwd === 'string' ? h.cwd : '',
            queueKey: typeof h.queueKey === 'string' ? h.queueKey : '',
            account: typeof h.account === 'string' ? h.account : null,
            status: h.status === 'waiting' || h.status === 'working' ? h.status : 'idle',
            activity: typeof h.activity === 'string' ? h.activity : '',
            since: typeof h.since === 'number' ? h.since : h.updatedAt,
            startedAt: typeof h.startedAt === 'number' ? h.startedAt : h.updatedAt,
            updatedAt: h.updatedAt,
            log: Array.isArray(h.log) ? h.log.filter(function (l) { return typeof l === 'object' && l !== null && typeof l.text === 'string'; }) : [],
            agents: Array.isArray(h.agents)
                ? h.agents.filter(function (a) { return typeof a === 'object' && a !== null && typeof a.name === 'string' && typeof a.spawnedAt === 'number'; })
                : [],
        };
    }
    catch (_a) {
        return null;
    }
};
exports.parseHeartbeat = parseHeartbeat;
/** The others, live, as rows: whoever waits on you first, then work, then the idle; newest first within each. */
var rowsOf = function (beats, selfId, now) {
    var rank = { waiting: 0, working: 1, idle: 2 };
    return beats
        .filter(function (h) { return h.sessionId !== selfId && (0, exports.isLive)(h, now); })
        .sort(function (a, b) { return rank[a.status] - rank[b.status] || b.since - a.since; })
        .map(function (h) { return (0, exports.rowOf)(h, now); });
};
exports.rowsOf = rowsOf;
/** One heartbeat as a SESSIONS row. */
var rowOf = function (h, now) { return ({
    sessionId: h.sessionId,
    queueKey: h.queueKey,
    status: h.status === 'idle' ? 'done' : h.status,
    project: h.project,
    account: h.account,
    activity: h.status === 'idle' ? 'rảnh' : (0, core_1.shorten)(h.activity || (h.status === 'waiting' ? 'chờ bạn' : 'đang làm'), 40),
    elapsed: (0, core_1.fmtUntil)(now - h.since),
}); };
exports.rowOf = rowOf;
/**
 * Which live session sends this project's queue: the one that started first. Two sessions on one
 * repo (two accounts, say) share the queue file; only one of them may count down and send.
 */
var isQueueOwner = function (beats, self, now) {
    return !beats.some(function (h) {
        return h.sessionId !== self.sessionId &&
            h.queueKey === self.queueKey &&
            (0, exports.isLive)(h, now) &&
            (h.startedAt < self.startedAt || (h.startedAt === self.startedAt && h.sessionId < self.sessionId));
    });
};
exports.isQueueOwner = isQueueOwner;
/** Sessions that have waited on you past ALERT_MS: the key of each wait, so it alerts once. */
var dueAlerts = function (beats, selfId, now) {
    return beats
        .filter(function (h) { return h.sessionId !== selfId && (0, exports.isLive)(h, now) && h.status === 'waiting' && now - h.since >= exports.ALERT_MS; })
        .map(function (h) { return ({ key: "".concat(h.sessionId, "-").concat(h.since), beat: h }); });
};
exports.dueAlerts = dueAlerts;
/** The other sessions' recent rows, tagged with who they are, merged with this session's by time. */
var mergeLogs = function (own, beats, selfId, now) {
    var others = beats
        .filter(function (h) { return h.sessionId !== selfId && (0, exports.isLive)(h, now); })
        .flatMap(function (h) {
        return h.log
            .filter(function (l) { return l.who === 'you' || l.isQuestion || l.isError || l.path !== undefined; })
            .map(function (l) { return (__assign(__assign({}, l), { who: 'peer', label: h.account ? "@".concat(h.account) : (0, core_1.shorten)(h.project, 8), text: l.isQuestion ? "".concat(h.project, " h\u1ECFi: ").concat(l.text) : "".concat(h.project, ": ").concat(l.text), path: undefined })); });
    });
    return __spreadArray(__spreadArray([], own, true), others, true).sort(function (a, b) { return a.at - b.at; });
};
exports.mergeLogs = mergeLogs;
/** How long a finished subagent stays in the others' AGENTS block. */
exports.AGENT_LINGER_MS = 10 * 60000;
/** This session's subagents worth showing the others: running, or finished a short while ago. */
var sharedAgents = function (cards, now) {
    return cards
        .filter(function (c) { return c.status === 'running' || (c.endedAt !== null && now - c.endedAt < exports.AGENT_LINGER_MS); })
        .slice(-9)
        .map(function (_a) {
        var name = _a.name, ctx = _a.ctx, out = _a.out, spawnedAt = _a.spawnedAt, endedAt = _a.endedAt, status = _a.status;
        return ({ name: name, ctx: ctx, out: out, spawnedAt: spawnedAt, endedAt: endedAt, status: status });
    });
};
exports.sharedAgents = sharedAgents;
/** The other live sessions' subagents, each tagged with where it runs; running ones first. */
var peerAgents = function (beats, selfId, now) {
    return beats
        .filter(function (h) { return h.sessionId !== selfId && (0, exports.isLive)(h, now); })
        .flatMap(function (h) { return h.agents.map(function (a) { return (__assign(__assign({}, a), { project: h.project, account: h.account })); }); })
        .sort(function (a, b) { return Number(b.status === 'running') - Number(a.status === 'running') || b.spawnedAt - a.spawnedAt; });
};
exports.peerAgents = peerAgents;
/** The question an AskUserQuestion call asks, for the heartbeat and the log. */
var questionOf = function (input) {
    var qs = typeof input === 'object' && input !== null ? input.questions : undefined;
    var first = Array.isArray(qs) ? qs[0] : undefined;
    var text = typeof first === 'object' && first !== null ? first.question : undefined;
    return typeof text === 'string' ? (0, core_1.shorten)(text, 60) : 'đang hỏi bạn';
};
exports.questionOf = questionOf;
