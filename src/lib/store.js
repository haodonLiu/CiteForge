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
import { create } from 'zustand';
import { setTheme as applyTheme, getStoredTheme } from './theme';
var storedTheme = getStoredTheme();
export var useAppStore = create(function (set) { return ({
    theme: storedTheme || 'ivory_press',
    setTheme: function (theme) {
        applyTheme(theme);
        set({ theme: theme });
    },
    initializeTheme: function () {
        var stored = getStoredTheme();
        if (stored) {
            applyTheme(stored);
            set({ theme: stored });
        }
    },
    tasks: {},
    currentTaskId: null,
    addTask: function (task) {
        return set(function (state) {
            var _a;
            return ({
                tasks: __assign(__assign({}, state.tasks), (_a = {}, _a[task.id] = task, _a)),
            });
        });
    },
    updateTask: function (id, updates) {
        return set(function (state) {
            var _a;
            if (!state.tasks[id])
                return state;
            return {
                tasks: __assign(__assign({}, state.tasks), (_a = {}, _a[id] = __assign(__assign({}, state.tasks[id]), updates), _a)),
            };
        });
    },
    updateTaskFromEvent: function (event) {
        var taskId = event.payload.task_id;
        set(function (state) {
            var _a, _b, _c, _d;
            var task = state.tasks[taskId];
            // If task doesn't exist and this is TaskStarted, create it
            if (!task && event.type === 'TaskStarted') {
                task = {
                    id: taskId,
                    topic: '',
                    status: 'Pending',
                    progress: 0,
                };
            }
            if (!task)
                return state;
            var updates = {};
            switch (event.type) {
                case 'TaskStarted':
                    // TaskActor already emitted with topic if we want to use it
                    // For now, use a placeholder or expect event payload to include topic
                    updates.status = 'Researching';
                    updates.progress = 0.25;
                    return {
                        tasks: __assign(__assign({}, state.tasks), (_a = {}, _a[taskId] = __assign(__assign({}, task), updates), _a)),
                        currentTaskId: state.currentTaskId || taskId, // Set if not already set
                    };
                case 'AgentCompleted':
                    updates.status = event.payload.agent === 'Researcher' ? 'Analyzing'
                        : event.payload.agent === 'Analyst' ? 'Writing'
                            : 'Writing';
                    updates.progress = event.payload.agent === 'Researcher' ? 0.5
                        : event.payload.agent === 'Analyst' ? 0.75
                            : 1.0;
                    break;
                case 'TaskCompleted':
                    updates.status = 'Completed';
                    updates.progress = 1.0;
                    return {
                        tasks: __assign(__assign({}, state.tasks), (_b = {}, _b[taskId] = __assign(__assign({}, task), updates), _b)),
                        currentTaskId: null, // Clear current task on completion
                    };
                case 'TaskFailed':
                    updates.status = 'Failed';
                    updates.error = event.payload.error;
                    return {
                        tasks: __assign(__assign({}, state.tasks), (_c = {}, _c[taskId] = __assign(__assign({}, task), updates), _c)),
                        currentTaskId: null,
                    };
                case 'LiteraturePoolUpdated':
                    updates.lastAction = "\u6587\u732E\u5E93\u66F4\u65B0: ".concat(event.payload.count, " \u7BC7");
                    break;
                case 'DraftGenerated':
                    updates.lastAction = '草稿已生成';
                    break;
            }
            return {
                tasks: __assign(__assign({}, state.tasks), (_d = {}, _d[taskId] = __assign(__assign({}, task), updates), _d)),
            };
        });
    },
    setCurrentTask: function (id) {
        return set({ currentTaskId: id });
    },
    clearTask: function (id) {
        return set(function (state) {
            var _a = state.tasks, _b = id, _ = _a[_b], rest = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
            return { tasks: rest };
        });
    },
    getCurrentTask: function () {
        // This needs to be a selector-style access, so we return a getter
        return null; // Placeholder - actual usage via selector
    },
}); });
