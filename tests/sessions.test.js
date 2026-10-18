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
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("claude-code/testing");
var sessions_1 = require("../hooks/sessions");
var NOW = 1000000000;
var beat = function (sessionId, extra) {
    if (extra === void 0) { extra = {}; }
    return (__assign({ sessionId: sessionId, project: "p-".concat(sessionId), cwd: "D:/p-".concat(sessionId), queueKey: "p-".concat(sessionId, "-x"), account: null, status: 'idle', activity: '', since: NOW - 60000, startedAt: NOW - 600000, updatedAt: NOW - 1000, log: [], agents: [] }, extra));
};
(0, testing_1.test)('the account tag comes from CLAUDE_CONFIG_DIR', function () {
    (0, testing_1.expect)((0, sessions_1.accountOf)(undefined)).toBeNull();
    (0, testing_1.expect)((0, sessions_1.accountOf)('C:\\Users\\me\\.claude')).toBeNull();
    (0, testing_1.expect)((0, sessions_1.accountOf)('C:\\Users\\me\\.claude-acc2')).toBe('acc2');
    (0, testing_1.expect)((0, sessions_1.accountOf)('/home/me/.claude-work/')).toBe('work');
});
(0, testing_1.test)('rows: others only, live only, whoever waits on you first', function () {
    var _a;
    var beats = [
        beat('self'),
        beat('idle'),
        beat('busy', { status: 'working', activity: 'Bash → npm run build' }),
        beat('ask', { status: 'waiting', activity: 'xoá migration cũ?', account: 'acc2' }),
        beat('gone', { updatedAt: NOW - sessions_1.STALE_MS - 1 }),
    ];
    var rows = (0, sessions_1.rowsOf)(beats, 'self', NOW);
    (0, testing_1.expect)(rows.map(function (r) { return r.sessionId; })).toEqual(['ask', 'busy', 'idle']);
    (0, testing_1.expect)(rows[0]).toMatchObject({ status: 'waiting', account: 'acc2', activity: 'xoá migration cũ?' });
    (0, testing_1.expect)((_a = rows[2]) === null || _a === void 0 ? void 0 : _a.activity).toBe('rảnh');
});
(0, testing_1.test)('two live sessions on one repo: the one that started first sends the queue', function () {
    var first = beat('a', { queueKey: 'repo-1', startedAt: NOW - 900000 });
    var second = beat('b', { queueKey: 'repo-1', startedAt: NOW - 100000 });
    (0, testing_1.expect)((0, sessions_1.isQueueOwner)([first, second], first, NOW)).toBe(true);
    (0, testing_1.expect)((0, sessions_1.isQueueOwner)([first, second], second, NOW)).toBe(false);
    // Once the first is gone, the second takes over.
    (0, testing_1.expect)((0, sessions_1.isQueueOwner)([__assign(__assign({}, first), { updatedAt: NOW - sessions_1.STALE_MS - 1 }), second], second, NOW)).toBe(true);
});
(0, testing_1.test)('an alert is due once a session has waited on you for 3 minutes', function () {
    var fresh = beat('w1', { status: 'waiting', since: NOW - sessions_1.ALERT_MS + 1000 });
    var long = beat('w2', { status: 'waiting', since: NOW - sessions_1.ALERT_MS });
    (0, testing_1.expect)((0, sessions_1.dueAlerts)([fresh, long], 'self', NOW).map(function (d) { return d.key; })).toEqual(["w2-".concat(NOW - sessions_1.ALERT_MS)]);
});
(0, testing_1.test)('the all tab merges the other sessions’ prompts, questions, errors and edits, tagged', function () {
    var other = beat('o', {
        account: 'acc2',
        project: 'acme-api',
        log: [
            { at: NOW - 5000, who: 'main', label: 'main', text: 'Read → a.ts' },
            { at: NOW - 3000, who: 'main', label: 'main', text: 'hỏi: xoá migration cũ?', isQuestion: true },
        ],
    });
    var merged = (0, sessions_1.mergeLogs)([{ at: NOW - 4000, who: 'you', label: 'you', text: 'hi' }], [other], 'self', NOW);
    (0, testing_1.expect)(merged.map(function (l) { return l.text; })).toEqual(['hi', 'acme-api hỏi: hỏi: xoá migration cũ?']);
    (0, testing_1.expect)(merged[1]).toMatchObject({ who: 'peer', label: '@acc2' });
});
(0, testing_1.test)('other sessions’ subagents are shared: running ones, and finished ones for 10 minutes', function () {
    var card = function (name, status, endedAt) { return ({
        id: name,
        name: name,
        ctx: 1000,
        out: 10,
        spawnedAt: NOW - 120000,
        endedAt: endedAt,
        status: status,
        tools: [],
        answer: '',
    }); };
    var shared = (0, sessions_1.sharedAgents)([card('Build core', 'running', null), card('Old', 'done', NOW - 11 * 60000), card('Review', 'done', NOW - 60000)], NOW);
    (0, testing_1.expect)(shared.map(function (a) { return a.name; })).toEqual(['Build core', 'Review']);
    var peers = (0, sessions_1.peerAgents)([
        beat('self', { agents: shared }),
        beat('o', { project: 'acme-api', account: 'acc2', agents: shared }),
        beat('gone', { updatedAt: 0, agents: shared }),
    ], 'self', NOW);
    (0, testing_1.expect)(peers.map(function (a) { return "".concat(a.name, "@").concat(a.project, "/").concat(a.account); })).toEqual(['Build core@acme-api/acc2', 'Review@acme-api/acc2']);
});
(0, testing_1.test)('heartbeats and questions are read leniently', function () {
    var _a;
    (0, testing_1.expect)((0, sessions_1.parseHeartbeat)('not json')).toBeNull();
    (0, testing_1.expect)((0, sessions_1.parseHeartbeat)(JSON.stringify({ sessionId: 'x' }))).toBeNull();
    (0, testing_1.expect)((_a = (0, sessions_1.parseHeartbeat)(JSON.stringify({ sessionId: 'x', project: 'p', updatedAt: 5, status: 'weird' }))) === null || _a === void 0 ? void 0 : _a.status).toBe('idle');
    (0, testing_1.expect)((0, sessions_1.questionOf)({ questions: [{ question: 'Public or private?' }] })).toBe('Public or private?');
    (0, testing_1.expect)((0, sessions_1.questionOf)({})).toBe('đang hỏi bạn');
});
