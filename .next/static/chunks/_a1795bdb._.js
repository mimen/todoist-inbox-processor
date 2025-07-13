(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/lib/mock-data.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "generateMockSuggestions": (()=>generateMockSuggestions),
    "mockInboxTasks": (()=>mockInboxTasks),
    "mockLabels": (()=>mockLabels),
    "mockProjects": (()=>mockProjects)
});
const mockProjects = [
    {
        id: '1',
        name: 'Work',
        color: 'blue',
        order: 1,
        commentCount: 0,
        isShared: false,
        isFavorite: true,
        isInboxProject: false,
        isTeamInbox: false,
        viewStyle: 'list',
        url: ''
    },
    {
        id: '2',
        name: 'Personal',
        color: 'green',
        order: 2,
        commentCount: 0,
        isShared: false,
        isFavorite: false,
        isInboxProject: false,
        isTeamInbox: false,
        viewStyle: 'list',
        url: ''
    },
    {
        id: '3',
        name: 'Shopping',
        color: 'orange',
        order: 3,
        commentCount: 0,
        isShared: false,
        isFavorite: false,
        isInboxProject: false,
        isTeamInbox: false,
        viewStyle: 'list',
        url: ''
    },
    {
        id: 'inbox',
        name: 'Inbox',
        color: 'grey',
        order: 0,
        commentCount: 0,
        isShared: false,
        isFavorite: false,
        isInboxProject: true,
        isTeamInbox: false,
        viewStyle: 'list',
        url: ''
    }
];
const mockLabels = [
    {
        id: '1',
        name: 'urgent',
        color: 'red',
        order: 1,
        isFavorite: true
    },
    {
        id: '2',
        name: 'waiting',
        color: 'yellow',
        order: 2,
        isFavorite: false
    },
    {
        id: '3',
        name: 'someday',
        color: 'grey',
        order: 3,
        isFavorite: false
    },
    {
        id: '4',
        name: 'email',
        color: 'blue',
        order: 4,
        isFavorite: false
    },
    {
        id: '5',
        name: 'phone',
        color: 'green',
        order: 5,
        isFavorite: false
    }
];
const mockInboxTasks = [
    {
        id: '1',
        content: 'call mom about weekend plans',
        projectId: 'inbox',
        order: 1,
        priority: 1,
        labels: [],
        url: '',
        commentCount: 0,
        createdAt: '2024-01-15T10:00:00Z',
        isCompleted: false
    },
    {
        id: '2',
        content: 'review quarterly budget report',
        description: 'Need to check the Q4 numbers and prepare for the board meeting',
        projectId: 'inbox',
        order: 2,
        priority: 1,
        labels: [],
        url: '',
        commentCount: 0,
        createdAt: '2024-01-15T10:30:00Z',
        isCompleted: false
    },
    {
        id: '3',
        content: 'buy groceries',
        projectId: 'inbox',
        order: 3,
        priority: 1,
        labels: [],
        url: '',
        commentCount: 0,
        createdAt: '2024-01-15T11:00:00Z',
        isCompleted: false
    },
    {
        id: '4',
        content: 'fix the broken link on website',
        description: 'Users are reporting 404 error on the contact page',
        projectId: 'inbox',
        order: 4,
        priority: 1,
        labels: [],
        url: '',
        commentCount: 0,
        createdAt: '2024-01-15T11:30:00Z',
        isCompleted: false
    },
    {
        id: '5',
        content: 'schedule dentist appointment',
        projectId: 'inbox',
        order: 5,
        priority: 1,
        labels: [],
        url: '',
        commentCount: 0,
        createdAt: '2024-01-15T12:00:00Z',
        isCompleted: false
    }
];
function generateMockSuggestions(taskContent) {
    const suggestions = [];
    const content = taskContent.toLowerCase();
    // Project suggestions
    if (content.includes('call') || content.includes('phone') || content.includes('mom') || content.includes('family')) {
        suggestions.push({
            type: 'project',
            suggestion: 'Personal',
            confidence: 0.85,
            reasoning: 'Personal communication task'
        });
    } else if (content.includes('work') || content.includes('meeting') || content.includes('report') || content.includes('budget')) {
        suggestions.push({
            type: 'project',
            suggestion: 'Work',
            confidence: 0.9,
            reasoning: 'Work-related task'
        });
    } else if (content.includes('buy') || content.includes('shop') || content.includes('groceries')) {
        suggestions.push({
            type: 'project',
            suggestion: 'Shopping',
            confidence: 0.95,
            reasoning: 'Shopping or purchasing task'
        });
    }
    // Label suggestions
    if (content.includes('call') || content.includes('phone')) {
        suggestions.push({
            type: 'label',
            suggestion: 'phone',
            confidence: 0.9,
            reasoning: 'Phone communication required'
        });
    }
    if (content.includes('urgent') || content.includes('asap') || content.includes('important')) {
        suggestions.push({
            type: 'label',
            suggestion: 'urgent',
            confidence: 0.8,
            reasoning: 'Task indicates urgency'
        });
    }
    // Priority suggestions
    if (content.includes('urgent') || content.includes('asap') || content.includes('critical')) {
        suggestions.push({
            type: 'priority',
            suggestion: '4',
            confidence: 0.85,
            reasoning: 'High priority language detected'
        });
    } else if (content.includes('important') || content.includes('deadline')) {
        suggestions.push({
            type: 'priority',
            suggestion: '3',
            confidence: 0.75,
            reasoning: 'Medium-high priority indicated'
        });
    }
    // Task rewrite suggestions
    if (content.length < 30 || !content.includes(' ')) {
        suggestions.push({
            type: 'rewrite',
            suggestion: makeTaskMoreActionable(taskContent),
            confidence: 0.7,
            reasoning: 'Make task more specific and actionable'
        });
    }
    return suggestions;
}
function makeTaskMoreActionable(content) {
    const lower = content.toLowerCase();
    if (lower.includes('call mom')) {
        return 'Call mom to discuss weekend plans and confirm dinner time';
    } else if (lower.includes('buy groceries')) {
        return 'Go to grocery store and buy milk, bread, eggs, and vegetables for the week';
    } else if (lower.includes('fix') && lower.includes('website')) {
        return 'Investigate and fix the 404 error on website contact page';
    } else if (lower.includes('dentist')) {
        return 'Call dentist office to schedule routine cleaning appointment';
    } else if (lower.includes('review') && lower.includes('budget')) {
        return 'Review Q4 budget report and prepare summary for board meeting';
    }
    return `Complete task: ${content} - add specific details and next actions`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/TaskCard.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>TaskCard)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function TaskCard({ task, projects, labels, onContentChange }) {
    _s();
    const [isEditing, setIsEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [editContent, setEditContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(task.content);
    const [saveTimeout, setSaveTimeout] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const textareaRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Reset edit content when task changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TaskCard.useEffect": ()=>{
            setEditContent(task.content);
            setIsEditing(false);
        }
    }["TaskCard.useEffect"], [
        task.id,
        task.content
    ]);
    // Auto-save with debounce
    const debouncedSave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TaskCard.useCallback[debouncedSave]": (content)=>{
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }
            const timeout = setTimeout({
                "TaskCard.useCallback[debouncedSave].timeout": ()=>{
                    if (content !== task.content && onContentChange) {
                        onContentChange(content);
                    }
                }
            }["TaskCard.useCallback[debouncedSave].timeout"], 2000);
            setSaveTimeout(timeout);
        }
    }["TaskCard.useCallback[debouncedSave]"], [
        saveTimeout,
        task.content,
        onContentChange
    ]);
    const handleEditClick = ()=>{
        setIsEditing(true);
        setTimeout(()=>{
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.select();
            }
        }, 0);
    };
    const handleContentChange = (e)=>{
        const newContent = e.target.value;
        setEditContent(newContent);
        debouncedSave(newContent);
    };
    const handleKeyDown = (e)=>{
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            setIsEditing(false);
        }
        if (e.key === 'Escape') {
            setEditContent(task.content);
            setIsEditing(false);
        }
    };
    const handleBlur = ()=>{
        setIsEditing(false);
    };
    const formatDate = (dateString)=>{
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };
    const getTodoistColor = (colorName)=>{
        const colorMap = {
            'berry_red': '#b8256f',
            'red': '#db4035',
            'orange': '#ff9933',
            'yellow': '#fad000',
            'olive_green': '#afb83b',
            'lime_green': '#7ecc49',
            'green': '#299438',
            'mint_green': '#6accbc',
            'teal': '#158fad',
            'sky_blue': '#14aaf5',
            'light_blue': '#96c3eb',
            'blue': '#4073ff',
            'grape': '#884dff',
            'violet': '#af38eb',
            'lavender': '#eb96eb',
            'magenta': '#e05194',
            'salmon': '#ff8d85',
            'charcoal': '#808080',
            'grey': '#b8b8b8',
            'taupe': '#ccac93'
        };
        return colorMap[colorName] || '#299fe6';
    };
    // Convert API priority (1-4) to UI priority (P4-P1)
    const getUIPriority = (apiPriority)=>{
        return 5 - apiPriority // 4→P1, 3→P2, 2→P3, 1→P4
        ;
    };
    const getPriorityColor = (apiPriority)=>{
        const uiPriority = getUIPriority(apiPriority);
        switch(uiPriority){
            case 1:
                return 'text-red-600 bg-red-50 border-red-200' // P1 = Urgent
                ;
            case 2:
                return 'text-orange-600 bg-orange-50 border-orange-200' // P2 = High
                ;
            case 3:
                return 'text-blue-600 bg-blue-50 border-blue-200' // P3 = Medium
                ;
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200' // P4 = Normal
                ;
        }
    };
    const getPriorityLabel = (apiPriority)=>{
        const uiPriority = getUIPriority(apiPriority);
        switch(uiPriority){
            case 1:
                return 'Urgent' // P1
                ;
            case 2:
                return 'High' // P2
                ;
            case 3:
                return 'Medium' // P3
                ;
            default:
                return 'Normal' // P4
                ;
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-white rounded-lg shadow-sm p-6 task-card-enter",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start justify-between mb-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 mb-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `px-2 py-1 text-xs font-medium rounded-md border ${getPriorityColor(task.priority)}`,
                                children: [
                                    "P",
                                    getUIPriority(task.priority),
                                    " • ",
                                    getPriorityLabel(task.priority)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 135,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/TaskCard.tsx",
                            lineNumber: 134,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "group relative",
                            children: isEditing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                ref: textareaRef,
                                value: editContent,
                                onChange: handleContentChange,
                                onKeyDown: handleKeyDown,
                                onBlur: handleBlur,
                                className: "w-full text-xl font-semibold text-gray-900 leading-tight bg-transparent border border-todoist-blue rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-todoist-blue resize-none",
                                style: {
                                    minHeight: '2.5rem'
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 143,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-xl font-semibold text-gray-900 leading-tight cursor-pointer hover:bg-gray-50 rounded-md px-2 py-1 group-hover:bg-gray-50 transition-colors",
                                onClick: handleEditClick,
                                title: "Click to edit task content",
                                children: [
                                    task.content,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "ml-2 opacity-0 group-hover:opacity-50 text-sm text-gray-400",
                                        children: "✏️"
                                    }, void 0, false, {
                                        fileName: "[project]/components/TaskCard.tsx",
                                        lineNumber: 159,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 153,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/TaskCard.tsx",
                            lineNumber: 141,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/TaskCard.tsx",
                    lineNumber: 133,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/TaskCard.tsx",
                lineNumber: 132,
                columnNumber: 7
            }, this),
            task.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-sm font-medium text-gray-700 mb-2",
                        children: "Description"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 169,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600 bg-gray-50 rounded-md p-3 text-sm leading-relaxed",
                        children: task.description
                    }, void 0, false, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 170,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TaskCard.tsx",
                lineNumber: 168,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3 mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm font-medium text-gray-700",
                                children: "Project:"
                            }, void 0, false, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "ml-2 inline-flex items-center space-x-2 bg-gray-100 px-2 py-1 rounded",
                                children: (()=>{
                                    const project = projects.find((p)=>p.id === task.projectId);
                                    const projectColor = project ? getTodoistColor(project.color) : '#299fe6';
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-3 h-3 rounded-full flex-shrink-0",
                                                style: {
                                                    backgroundColor: projectColor
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/components/TaskCard.tsx",
                                                lineNumber: 186,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-gray-600",
                                                children: project?.name || 'Unknown Project'
                                            }, void 0, false, {
                                                fileName: "[project]/components/TaskCard.tsx",
                                                lineNumber: 190,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true);
                                })()
                            }, void 0, false, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 180,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this),
                    task.labels.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm font-medium text-gray-700",
                                children: "Labels:"
                            }, void 0, false, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 201,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-1 mt-1",
                                children: task.labels.map((labelName)=>{
                                    const label = labels.find((l)=>l.name === labelName);
                                    const labelColor = label ? getTodoistColor(label.color) : '#299fe6';
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs px-2 py-1 rounded flex items-center space-x-1",
                                        style: {
                                            backgroundColor: `${labelColor}20`,
                                            color: labelColor
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-2 h-2 rounded-full flex-shrink-0",
                                                style: {
                                                    backgroundColor: labelColor
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/components/TaskCard.tsx",
                                                lineNumber: 212,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: labelName
                                            }, void 0, false, {
                                                fileName: "[project]/components/TaskCard.tsx",
                                                lineNumber: 216,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, labelName, true, {
                                        fileName: "[project]/components/TaskCard.tsx",
                                        lineNumber: 207,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 202,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 200,
                        columnNumber: 11
                    }, this),
                    task.due && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm font-medium text-gray-700",
                                children: "Due:"
                            }, void 0, false, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 226,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-2 text-sm text-gray-600",
                                children: formatDate(task.due.date)
                            }, void 0, false, {
                                fileName: "[project]/components/TaskCard.tsx",
                                lineNumber: 227,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskCard.tsx",
                        lineNumber: 225,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TaskCard.tsx",
                lineNumber: 177,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pt-4 border-t border-gray-100",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between text-xs text-gray-500",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "Created: ",
                                formatDate(task.createdAt)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/TaskCard.tsx",
                            lineNumber: 237,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "ID: ",
                                task.id
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/TaskCard.tsx",
                            lineNumber: 238,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/TaskCard.tsx",
                    lineNumber: 236,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/TaskCard.tsx",
                lineNumber: 235,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/TaskCard.tsx",
        lineNumber: 130,
        columnNumber: 5
    }, this);
}
_s(TaskCard, "JsBrtn/S9iFDnQmez1pQvCZiEaQ=");
_c = TaskCard;
var _c;
__turbopack_context__.k.register(_c, "TaskCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ProjectDropdown.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>ProjectDropdown)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function ProjectDropdown({ projects, selectedProjectId, onProjectChange, placeholder = "Select project...", includeInbox = true, className = "" }) {
    _s();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const searchInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Close dropdown when clicking outside
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProjectDropdown.useEffect": ()=>{
            const handleClickOutside = {
                "ProjectDropdown.useEffect.handleClickOutside": (event)=>{
                    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                        setIsOpen(false);
                        setSearchTerm('');
                    }
                }
            }["ProjectDropdown.useEffect.handleClickOutside"];
            document.addEventListener('mousedown', handleClickOutside);
            return ({
                "ProjectDropdown.useEffect": ()=>document.removeEventListener('mousedown', handleClickOutside)
            })["ProjectDropdown.useEffect"];
        }
    }["ProjectDropdown.useEffect"], []);
    // Focus search input when dropdown opens
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProjectDropdown.useEffect": ()=>{
            if (isOpen && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }
    }["ProjectDropdown.useEffect"], [
        isOpen
    ]);
    const getTodoistColor = (colorName)=>{
        const colorMap = {
            'berry_red': '#b8256f',
            'red': '#db4035',
            'orange': '#ff9933',
            'yellow': '#fad000',
            'olive_green': '#afb83b',
            'lime_green': '#7ecc49',
            'green': '#299438',
            'mint_green': '#6accbc',
            'teal': '#158fad',
            'sky_blue': '#14aaf5',
            'light_blue': '#96c3eb',
            'blue': '#4073ff',
            'grape': '#884dff',
            'violet': '#af38eb',
            'lavender': '#eb96eb',
            'magenta': '#e05194',
            'salmon': '#ff8d85',
            'charcoal': '#808080',
            'grey': '#b8b8b8',
            'taupe': '#ccac93'
        };
        return colorMap[colorName] || '#299fe6';
    };
    // Create project hierarchy
    const createProjectHierarchy = ()=>{
        const rootProjects = projects.filter((p)=>!p.parentId && !p.isInboxProject);
        const childProjects = projects.filter((p)=>p.parentId && !p.isInboxProject);
        const hierarchy = [];
        // Add inbox if requested
        if (includeInbox) {
            const inboxProject = projects.find((p)=>p.isInboxProject);
            hierarchy.push({
                id: inboxProject?.id || 'inbox',
                name: 'Inbox',
                color: inboxProject ? getTodoistColor(inboxProject.color) : '#299fe6',
                indent: 0
            });
        }
        // Add root projects and their children
        const addProjectWithChildren = (project, indent = 0)=>{
            hierarchy.push({
                id: project.id,
                name: project.name,
                color: getTodoistColor(project.color),
                indent
            });
            // Add children
            const children = childProjects.filter((p)=>p.parentId === project.id);
            children.forEach((child)=>addProjectWithChildren(child, indent + 1));
        };
        rootProjects.forEach((project)=>addProjectWithChildren(project));
        return hierarchy;
    };
    const projectHierarchy = createProjectHierarchy();
    // Filter projects based on search term
    const filteredProjects = projectHierarchy.filter((project)=>project.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const selectedProject = projectHierarchy.find((p)=>p.id === selectedProjectId);
    const handleProjectSelect = (projectId, event)=>{
        event.preventDefault();
        event.stopPropagation();
        onProjectChange(projectId);
        setIsOpen(false);
        setSearchTerm('');
    };
    const handleDropdownClick = (event)=>{
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(!isOpen);
    };
    const handleSearchChange = (event)=>{
        event.preventDefault();
        event.stopPropagation();
        setSearchTerm(event.target.value);
    };
    const handleDropdownContainerClick = (event)=>{
        // Prevent any event bubbling from the dropdown container
        event.preventDefault();
        event.stopPropagation();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `relative ${className}`,
        ref: dropdownRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: handleDropdownClick,
                className: "w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center space-x-3",
                        children: selectedProject ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-4 h-4 rounded-full flex-shrink-0",
                                    style: {
                                        backgroundColor: selectedProject.color
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectDropdown.tsx",
                                    lineNumber: 156,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-medium text-gray-900",
                                    children: selectedProject.name
                                }, void 0, false, {
                                    fileName: "[project]/components/ProjectDropdown.tsx",
                                    lineNumber: 160,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-gray-500",
                            children: placeholder
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectDropdown.tsx",
                            lineNumber: 163,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectDropdown.tsx",
                        lineNumber: 153,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: `w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`,
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: "2",
                            d: "M19 9l-7 7-7-7"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectDropdown.tsx",
                            lineNumber: 172,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectDropdown.tsx",
                        lineNumber: 166,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectDropdown.tsx",
                lineNumber: 148,
                columnNumber: 7
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 dropdown-open",
                onClick: handleDropdownContainerClick,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-3 border-b border-gray-200",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            ref: searchInputRef,
                            type: "text",
                            placeholder: "Search projects...",
                            value: searchTerm,
                            onChange: handleSearchChange,
                            className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-todoist-blue focus:border-transparent text-sm"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectDropdown.tsx",
                            lineNumber: 183,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectDropdown.tsx",
                        lineNumber: 182,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-h-64 overflow-y-auto",
                        children: filteredProjects.length > 0 ? filteredProjects.map((project)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: (e)=>handleProjectSelect(project.id, e),
                                className: `w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 transition-colors ${selectedProjectId === project.id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`,
                                style: {
                                    paddingLeft: `${12 + project.indent * 20}px`
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-4 h-4 rounded-full flex-shrink-0",
                                        style: {
                                            backgroundColor: project.color
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectDropdown.tsx",
                                        lineNumber: 206,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-medium flex-1",
                                        children: project.name
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectDropdown.tsx",
                                        lineNumber: 210,
                                        columnNumber: 19
                                    }, this),
                                    selectedProjectId === project.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-4 h-4 text-blue-600",
                                        fill: "currentColor",
                                        viewBox: "0 0 20 20",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            fillRule: "evenodd",
                                            d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                                            clipRule: "evenodd"
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProjectDropdown.tsx",
                                            lineNumber: 213,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProjectDropdown.tsx",
                                        lineNumber: 212,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, project.id, true, {
                                fileName: "[project]/components/ProjectDropdown.tsx",
                                lineNumber: 197,
                                columnNumber: 17
                            }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-3 text-center text-gray-500 text-sm",
                            children: "No projects found"
                        }, void 0, false, {
                            fileName: "[project]/components/ProjectDropdown.tsx",
                            lineNumber: 219,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectDropdown.tsx",
                        lineNumber: 194,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectDropdown.tsx",
                lineNumber: 177,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProjectDropdown.tsx",
        lineNumber: 147,
        columnNumber: 5
    }, this);
}
_s(ProjectDropdown, "fVq9UFyIOMwEH0lCR81+fE+EN0s=");
_c = ProjectDropdown;
var _c;
__turbopack_context__.k.register(_c, "ProjectDropdown");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/TaskForm.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>TaskForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProjectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ProjectDropdown.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function TaskForm({ task, projects, labels, suggestions, onAutoSave, onNext }) {
    _s();
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        content: task.content,
        description: task.description || '',
        projectId: task.projectId,
        priority: task.priority,
        labels: [
            ...task.labels
        ],
        dueString: ''
    });
    const [selectedLabels, setSelectedLabels] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set(task.labels));
    const saveTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastSavedDataRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Auto-save with debounce
    const debouncedSave = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TaskForm.useCallback[debouncedSave]": (updates)=>{
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout({
                "TaskForm.useCallback[debouncedSave]": ()=>{
                    // Only save if data has actually changed
                    const dataToSave = {
                        ...updates,
                        labels: Array.from(selectedLabels)
                    };
                    const currentDataString = JSON.stringify(dataToSave);
                    const lastSavedString = JSON.stringify(lastSavedDataRef.current);
                    if (currentDataString !== lastSavedString) {
                        console.log('Auto-saving changes:', dataToSave);
                        onAutoSave(dataToSave);
                        lastSavedDataRef.current = dataToSave;
                    }
                }
            }["TaskForm.useCallback[debouncedSave]"], 2000);
        }
    }["TaskForm.useCallback[debouncedSave]"], [
        onAutoSave,
        selectedLabels
    ]);
    // Reset form data when task changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TaskForm.useEffect": ()=>{
            const newFormData = {
                content: task.content,
                description: task.description || '',
                projectId: task.projectId,
                priority: task.priority,
                labels: [
                    ...task.labels
                ],
                dueString: ''
            };
            setFormData(newFormData);
            setSelectedLabels(new Set(task.labels));
            lastSavedDataRef.current = {
                ...newFormData,
                labels: task.labels
            };
            // Clear any pending saves when task changes
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        }
    }["TaskForm.useEffect"], [
        task.id,
        task.content,
        task.description,
        task.projectId,
        task.priority,
        task.labels
    ]);
    // Trigger auto-save when form data changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TaskForm.useEffect": ()=>{
            debouncedSave(formData);
        }
    }["TaskForm.useEffect"], [
        formData,
        debouncedSave
    ]);
    // Cleanup timeout on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TaskForm.useEffect": ()=>{
            return ({
                "TaskForm.useEffect": ()=>{
                    if (saveTimeoutRef.current) {
                        clearTimeout(saveTimeoutRef.current);
                    }
                }
            })["TaskForm.useEffect"];
        }
    }["TaskForm.useEffect"], []);
    // No longer need handleSubmit since we auto-save
    const handleProjectChange = (projectId)=>{
        setFormData((prev)=>({
                ...prev,
                projectId
            }));
    };
    const handlePriorityChange = (priority)=>{
        setFormData((prev)=>({
                ...prev,
                priority: priority
            }));
    };
    const toggleLabel = (labelName)=>{
        const newLabels = new Set(selectedLabels);
        if (newLabels.has(labelName)) {
            newLabels.delete(labelName);
        } else {
            newLabels.add(labelName);
        }
        setSelectedLabels(newLabels);
        // Trigger auto-save for label changes
        debouncedSave({
            ...formData,
            labels: Array.from(newLabels)
        });
    };
    const applySuggestion = (suggestion)=>{
        switch(suggestion.type){
            case 'project':
                const project = projects.find((p)=>p.name === suggestion.suggestion);
                if (project) {
                    handleProjectChange(project.id);
                }
                break;
            case 'label':
                toggleLabel(suggestion.suggestion);
                break;
            case 'rewrite':
                setFormData((prev)=>({
                        ...prev,
                        content: suggestion.suggestion
                    }));
                break;
            case 'priority':
                handlePriorityChange(parseInt(suggestion.suggestion));
                break;
        }
    };
    const getTodoistColor = (colorName)=>{
        const colorMap = {
            'berry_red': '#b8256f',
            'red': '#db4035',
            'orange': '#ff9933',
            'yellow': '#fad000',
            'olive_green': '#afb83b',
            'lime_green': '#7ecc49',
            'green': '#299438',
            'mint_green': '#6accbc',
            'teal': '#158fad',
            'sky_blue': '#14aaf5',
            'light_blue': '#96c3eb',
            'blue': '#4073ff',
            'grape': '#884dff',
            'violet': '#af38eb',
            'lavender': '#eb96eb',
            'magenta': '#e05194',
            'salmon': '#ff8d85',
            'charcoal': '#808080',
            'grey': '#b8b8b8',
            'taupe': '#ccac93'
        };
        return colorMap[colorName] || '#299fe6';
    };
    const projectSuggestions = suggestions.filter((s)=>s.type === 'project');
    const labelSuggestions = suggestions.filter((s)=>s.type === 'label');
    const rewriteSuggestions = suggestions.filter((s)=>s.type === 'rewrite');
    const prioritySuggestions = suggestions.filter((s)=>s.type === 'priority');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Description"
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 163,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                value: formData.description,
                                onChange: (e)=>setFormData((prev)=>({
                                            ...prev,
                                            description: e.target.value
                                        })),
                                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-todoist-blue focus:border-transparent resize-none",
                                rows: 2,
                                placeholder: "Add additional details..."
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 166,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskForm.tsx",
                        lineNumber: 162,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Project"
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 177,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProjectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                projects: projects,
                                selectedProjectId: formData.projectId || '',
                                onProjectChange: handleProjectChange,
                                placeholder: "Select project...",
                                includeInbox: false,
                                className: "mb-2"
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 180,
                                columnNumber: 11
                            }, this),
                            projectSuggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-1",
                                children: projectSuggestions.map((suggestion, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>applySuggestion(suggestion),
                                        className: "text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 hover:bg-green-100 transition-colors",
                                        children: [
                                            "🤖 Suggest: ",
                                            suggestion.suggestion,
                                            " (",
                                            Math.round(suggestion.confidence * 100),
                                            "%)"
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/components/TaskForm.tsx",
                                        lineNumber: 191,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 189,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskForm.tsx",
                        lineNumber: 176,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Priority"
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 206,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2 mb-2",
                                children: [
                                    4,
                                    3,
                                    2,
                                    1
                                ].map((apiPriority)=>{
                                    const uiPriority = 5 - apiPriority // Convert API priority to UI priority (P1-P4)
                                    ;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>handlePriorityChange(apiPriority),
                                        className: `px-3 py-2 rounded-md border font-medium transition-colors ${formData.priority === apiPriority ? uiPriority === 1 ? 'bg-red-500 text-white border-red-500' // P1 = Urgent = Red
                                         : uiPriority === 2 ? 'bg-orange-500 text-white border-orange-500' // P2 = High = Orange
                                         : uiPriority === 3 ? 'bg-blue-500 text-white border-blue-500' // P3 = Medium = Blue
                                         : 'bg-gray-500 text-white border-gray-500' // P4 = Normal = Gray
                                         : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`,
                                        children: [
                                            "P",
                                            uiPriority
                                        ]
                                    }, apiPriority, true, {
                                        fileName: "[project]/components/TaskForm.tsx",
                                        lineNumber: 213,
                                        columnNumber: 17
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 209,
                                columnNumber: 11
                            }, this),
                            prioritySuggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-1",
                                children: prioritySuggestions.map((suggestion, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>applySuggestion(suggestion),
                                        className: "text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-200 hover:bg-yellow-100 transition-colors",
                                        children: [
                                            "⚡ Suggest: P",
                                            suggestion.suggestion,
                                            " (",
                                            Math.round(suggestion.confidence * 100),
                                            "%)"
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/components/TaskForm.tsx",
                                        lineNumber: 234,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 232,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskForm.tsx",
                        lineNumber: 205,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Labels"
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 249,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-2 mb-2",
                                children: labels.map((label)=>{
                                    const labelColor = getTodoistColor(label.color);
                                    const isSelected = selectedLabels.has(label.name);
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>toggleLabel(label.name),
                                        className: `px-3 py-1 rounded-full text-sm border transition-colors flex items-center space-x-2 ${isSelected ? 'text-white border-transparent' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'}`,
                                        style: isSelected ? {
                                            backgroundColor: labelColor
                                        } : {},
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-3 h-3 rounded-full flex-shrink-0",
                                                style: {
                                                    backgroundColor: labelColor
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/components/TaskForm.tsx",
                                                lineNumber: 268,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: label.name
                                            }, void 0, false, {
                                                fileName: "[project]/components/TaskForm.tsx",
                                                lineNumber: 272,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, label.id, true, {
                                        fileName: "[project]/components/TaskForm.tsx",
                                        lineNumber: 257,
                                        columnNumber: 17
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 252,
                                columnNumber: 11
                            }, this),
                            labelSuggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-1",
                                children: labelSuggestions.map((suggestion, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>applySuggestion(suggestion),
                                        className: "text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors",
                                        children: [
                                            "🏷️ Suggest: ",
                                            suggestion.suggestion,
                                            " (",
                                            Math.round(suggestion.confidence * 100),
                                            "%)"
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/components/TaskForm.tsx",
                                        lineNumber: 280,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 278,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskForm.tsx",
                        lineNumber: 248,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Due Date"
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 295,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: formData.dueString,
                                onChange: (e)=>setFormData((prev)=>({
                                            ...prev,
                                            dueString: e.target.value
                                        })),
                                className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-todoist-blue focus:border-transparent",
                                placeholder: "e.g., tomorrow, next friday, in 2 weeks..."
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 298,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-xs text-gray-500",
                                children: 'Use natural language like "tomorrow", "next Friday", "in 2 weeks"'
                            }, void 0, false, {
                                fileName: "[project]/components/TaskForm.tsx",
                                lineNumber: 305,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskForm.tsx",
                        lineNumber: 294,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TaskForm.tsx",
                lineNumber: 160,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pt-4 border-t border-gray-200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: onNext,
                    className: "w-full bg-todoist-blue text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors font-medium focus:ring-2 focus:ring-todoist-blue focus:ring-offset-2",
                    children: [
                        "Next Task ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "kbd ml-2",
                            children: "Enter"
                        }, void 0, false, {
                            fileName: "[project]/components/TaskForm.tsx",
                            lineNumber: 318,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/TaskForm.tsx",
                    lineNumber: 313,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/TaskForm.tsx",
                lineNumber: 312,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/TaskForm.tsx",
        lineNumber: 158,
        columnNumber: 5
    }, this);
}
_s(TaskForm, "/LIJ0XXhvWFqQtEwnNqHrDuCnik=");
_c = TaskForm;
var _c;
__turbopack_context__.k.register(_c, "TaskForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/KeyboardShortcuts.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>KeyboardShortcuts)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
function KeyboardShortcuts({ onClose }) {
    const shortcuts = [
        {
            key: 'Enter',
            description: 'Process current task'
        },
        {
            key: 'S',
            description: 'Skip current task'
        },
        {
            key: '?',
            description: 'Toggle this help'
        },
        {
            key: 'Esc',
            description: 'Close this help'
        },
        {
            key: 'Tab',
            description: 'Navigate between form fields'
        },
        {
            key: '1-4',
            description: 'Set priority (P1-P4)'
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white rounded-lg shadow-xl max-w-md w-full p-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-lg font-semibold text-gray-900",
                            children: "Keyboard Shortcuts"
                        }, void 0, false, {
                            fileName: "[project]/components/KeyboardShortcuts.tsx",
                            lineNumber: 21,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: "2",
                                    d: "M6 18L18 6M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "[project]/components/KeyboardShortcuts.tsx",
                                    lineNumber: 27,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/KeyboardShortcuts.tsx",
                                lineNumber: 26,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/KeyboardShortcuts.tsx",
                            lineNumber: 22,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/KeyboardShortcuts.tsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-3",
                    children: shortcuts.map((shortcut, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-sm text-gray-600",
                                    children: shortcut.description
                                }, void 0, false, {
                                    fileName: "[project]/components/KeyboardShortcuts.tsx",
                                    lineNumber: 35,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "kbd",
                                    children: shortcut.key
                                }, void 0, false, {
                                    fileName: "[project]/components/KeyboardShortcuts.tsx",
                                    lineNumber: 36,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, index, true, {
                            fileName: "[project]/components/KeyboardShortcuts.tsx",
                            lineNumber: 34,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/components/KeyboardShortcuts.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-6 pt-4 border-t border-gray-200",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-500",
                        children: [
                            "Press ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "kbd",
                                children: "?"
                            }, void 0, false, {
                                fileName: "[project]/components/KeyboardShortcuts.tsx",
                                lineNumber: 43,
                                columnNumber: 19
                            }, this),
                            " anytime to toggle this help"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/KeyboardShortcuts.tsx",
                        lineNumber: 42,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/KeyboardShortcuts.tsx",
                    lineNumber: 41,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/KeyboardShortcuts.tsx",
            lineNumber: 19,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/KeyboardShortcuts.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
_c = KeyboardShortcuts;
var _c;
__turbopack_context__.k.register(_c, "KeyboardShortcuts");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ProgressIndicator.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>ProgressIndicator)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
function ProgressIndicator({ current, total, progress }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "py-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm font-medium text-gray-700",
                        children: [
                            "Progress: ",
                            current,
                            " of ",
                            total
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProgressIndicator.tsx",
                        lineNumber: 13,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm text-gray-600",
                        children: [
                            Math.round(progress),
                            "%"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProgressIndicator.tsx",
                        lineNumber: 16,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProgressIndicator.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full bg-gray-200 rounded-full h-2",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-todoist-blue h-2 rounded-full transition-all duration-300 ease-out",
                    style: {
                        width: `${progress}%`
                    }
                }, void 0, false, {
                    fileName: "[project]/components/ProgressIndicator.tsx",
                    lineNumber: 22,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/ProgressIndicator.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProgressIndicator.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
_c = ProgressIndicator;
var _c;
__turbopack_context__.k.register(_c, "ProgressIndicator");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/ProjectSwitcher.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>ProjectSwitcher)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProjectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ProjectDropdown.tsx [app-client] (ecmascript)");
'use client';
;
;
function ProjectSwitcher({ projects, selectedProjectId, onProjectChange, taskCount = 0 }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-white rounded-lg shadow-sm border p-4 mb-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-sm font-medium text-gray-700",
                        children: "Processing Project"
                    }, void 0, false, {
                        fileName: "[project]/components/ProjectSwitcher.tsx",
                        lineNumber: 22,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-500",
                        children: [
                            taskCount,
                            " tasks"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProjectSwitcher.tsx",
                        lineNumber: 23,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProjectSwitcher.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProjectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                projects: projects,
                selectedProjectId: selectedProjectId,
                onProjectChange: onProjectChange,
                placeholder: "Select project to process...",
                includeInbox: true
            }, void 0, false, {
                fileName: "[project]/components/ProjectSwitcher.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 text-xs text-gray-500",
                children: "💡 Select a project to process its tasks. Use keyboard shortcuts: S to skip, Enter to process."
            }, void 0, false, {
                fileName: "[project]/components/ProjectSwitcher.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProjectSwitcher.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
_c = ProjectSwitcher;
var _c;
__turbopack_context__.k.register(_c, "ProjectSwitcher");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/components/TaskProcessor.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>TaskProcessor)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/mock-data.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$TaskCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/TaskCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$TaskForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/TaskForm.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$KeyboardShortcuts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/KeyboardShortcuts.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProgressIndicator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ProgressIndicator.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProjectSwitcher$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ProjectSwitcher.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
function TaskProcessor() {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        currentTask: null,
        queuedTasks: [],
        processedTasks: [],
        skippedTasks: []
    });
    const [projects, setProjects] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [labels, setLabels] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [showShortcuts, setShowShortcuts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [loadingTasks, setLoadingTasks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedProjectId, setSelectedProjectId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [allTasks, setAllTasks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [taskKey, setTaskKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0) // Force re-render of TaskForm
    ;
    const [showPriorityOverlay, setShowPriorityOverlay] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Load initial data (projects and labels)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TaskProcessor.useEffect": ()=>{
            async function loadInitialData() {
                try {
                    setLoading(true);
                    setError(null);
                    // Fetch projects and labels
                    const [projectsRes, labelsRes] = await Promise.all([
                        fetch('/api/todoist/projects'),
                        fetch('/api/todoist/labels')
                    ]);
                    if (!projectsRes.ok || !labelsRes.ok) {
                        throw new Error('Failed to fetch data from Todoist API');
                    }
                    const [projectsData, labelsData] = await Promise.all([
                        projectsRes.json(),
                        labelsRes.json()
                    ]);
                    setProjects(projectsData);
                    setLabels(labelsData);
                    // Set default to actual inbox project if it exists
                    const inboxProject = projectsData.find({
                        "TaskProcessor.useEffect.loadInitialData.inboxProject": (p)=>p.isInboxProject
                    }["TaskProcessor.useEffect.loadInitialData.inboxProject"]);
                    setSelectedProjectId(inboxProject?.id || 'inbox');
                } catch (err) {
                    console.error('Error loading initial data:', err);
                    setError(err instanceof Error ? err.message : 'Failed to load data');
                } finally{
                    setLoading(false);
                }
            }
            loadInitialData();
        }
    }["TaskProcessor.useEffect"], []);
    // Load tasks for selected project
    const loadProjectTasks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TaskProcessor.useCallback[loadProjectTasks]": async (projectId)=>{
            if (!projectId) return;
            try {
                setLoadingTasks(true);
                setError(null);
                console.log('Loading tasks for project:', projectId);
                const tasksRes = await fetch(`/api/todoist/tasks?projectId=${projectId}`);
                if (!tasksRes.ok) {
                    throw new Error('Failed to fetch tasks');
                }
                const tasksData = await tasksRes.json();
                console.log('Loaded tasks:', tasksData);
                setAllTasks(tasksData);
                // Set up task processing queue and force form re-render
                if (tasksData.length > 0) {
                    setState({
                        currentTask: tasksData[0],
                        queuedTasks: tasksData.slice(1),
                        processedTasks: [],
                        skippedTasks: []
                    });
                    setTaskKey({
                        "TaskProcessor.useCallback[loadProjectTasks]": (prev)=>prev + 1
                    }["TaskProcessor.useCallback[loadProjectTasks]"]) // Force TaskForm to re-render with new task
                    ;
                } else {
                    setState({
                        currentTask: null,
                        queuedTasks: [],
                        processedTasks: [],
                        skippedTasks: []
                    });
                }
            } catch (err) {
                console.error('Error loading project tasks:', err);
                setError(err instanceof Error ? err.message : 'Failed to load tasks');
            } finally{
                setLoadingTasks(false);
            }
        }
    }["TaskProcessor.useCallback[loadProjectTasks]"], []);
    // Load tasks when project changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TaskProcessor.useEffect": ()=>{
            if (projects.length > 0 && selectedProjectId) {
                loadProjectTasks(selectedProjectId);
            }
        }
    }["TaskProcessor.useEffect"], [
        selectedProjectId,
        projects.length,
        loadProjectTasks
    ]);
    // Update task key when current task changes to force form re-render
    const moveToNext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TaskProcessor.useCallback[moveToNext]": ()=>{
            setState({
                "TaskProcessor.useCallback[moveToNext]": (prev)=>{
                    const nextTask = prev.queuedTasks[0] || null;
                    const remainingQueue = prev.queuedTasks.slice(1);
                    // Force form re-render when task changes
                    if (nextTask) {
                        setTaskKey({
                            "TaskProcessor.useCallback[moveToNext]": (prevKey)=>prevKey + 1
                        }["TaskProcessor.useCallback[moveToNext]"]);
                    }
                    return {
                        ...prev,
                        currentTask: nextTask,
                        queuedTasks: remainingQueue
                    };
                }
            }["TaskProcessor.useCallback[moveToNext]"]);
        }
    }["TaskProcessor.useCallback[moveToNext]"], []);
    const autoSaveTask = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TaskProcessor.useCallback[autoSaveTask]": async (taskId, updates)=>{
            try {
                console.log('TaskProcessor.autoSaveTask called with:', {
                    taskId,
                    updates
                });
                // Update the task via API
                const response = await fetch(`/api/todoist/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updates)
                });
                console.log('API Response status:', response.status);
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('API Response error:', errorData);
                    throw new Error(`Failed to update task: ${errorData.error || response.statusText}`);
                }
                const responseData = await response.json();
                console.log('API Response data:', responseData);
            } catch (err) {
                console.error('Error auto-saving task:', err);
                setError(err instanceof Error ? err.message : 'Failed to auto-save task');
            }
        }
    }["TaskProcessor.useCallback[autoSaveTask]"], []);
    const handleContentChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TaskProcessor.useCallback[handleContentChange]": async (newContent)=>{
            if (state.currentTask) {
                await autoSaveTask(state.currentTask.id, {
                    content: newContent
                });
            }
        }
    }["TaskProcessor.useCallback[handleContentChange]"], [
        state.currentTask,
        autoSaveTask
    ]);
    const handleNext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TaskProcessor.useCallback[handleNext]": ()=>{
            if (!state.currentTask) return;
            setState({
                "TaskProcessor.useCallback[handleNext]": (prev)=>({
                        ...prev,
                        processedTasks: [
                            ...prev.processedTasks,
                            prev.currentTask.id
                        ]
                    })
            }["TaskProcessor.useCallback[handleNext]"]);
            moveToNext();
        }
    }["TaskProcessor.useCallback[handleNext]"], [
        state.currentTask,
        moveToNext
    ]);
    const handlePrioritySelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TaskProcessor.useCallback[handlePrioritySelect]": (priority)=>{
            if (state.currentTask) {
                // Update the task immediately in the UI
                setState({
                    "TaskProcessor.useCallback[handlePrioritySelect]": (prev)=>({
                            ...prev,
                            currentTask: prev.currentTask ? {
                                ...prev.currentTask,
                                priority
                            } : null
                        })
                }["TaskProcessor.useCallback[handlePrioritySelect]"]);
                // Queue the auto-save
                autoSaveTask(state.currentTask.id, {
                    priority
                });
            }
            setShowPriorityOverlay(false);
        }
    }["TaskProcessor.useCallback[handlePrioritySelect]"], [
        state.currentTask,
        autoSaveTask
    ]);
    const skipTask = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TaskProcessor.useCallback[skipTask]": ()=>{
            if (!state.currentTask) return;
            setState({
                "TaskProcessor.useCallback[skipTask]": (prev)=>({
                        ...prev,
                        skippedTasks: [
                            ...prev.skippedTasks,
                            prev.currentTask.id
                        ]
                    })
            }["TaskProcessor.useCallback[skipTask]"]);
            moveToNext();
        }
    }["TaskProcessor.useCallback[skipTask]"], [
        state.currentTask,
        moveToNext
    ]);
    // Keyboard shortcuts
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TaskProcessor.useEffect": ()=>{
            const handleKeyDown = {
                "TaskProcessor.useEffect.handleKeyDown": (e)=>{
                    // Don't handle shortcuts when priority overlay is open - it handles its own keys
                    if (showPriorityOverlay) {
                        return;
                    }
                    // Only handle shortcuts when not typing in an input or when dropdowns are open
                    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || document.querySelector('[role="listbox"]') || document.querySelector('.dropdown-open')) {
                        return;
                    }
                    switch(e.key){
                        case 'p':
                        case 'P':
                            e.preventDefault();
                            setShowPriorityOverlay(true);
                            break;
                        case 'Enter':
                            e.preventDefault();
                            handleNext();
                            break;
                        case '?':
                            e.preventDefault();
                            setShowShortcuts(!showShortcuts);
                            break;
                        case 'Escape':
                            setShowShortcuts(false);
                            setShowPriorityOverlay(false);
                            break;
                    }
                }
            }["TaskProcessor.useEffect.handleKeyDown"];
            window.addEventListener('keydown', handleKeyDown);
            return ({
                "TaskProcessor.useEffect": ()=>window.removeEventListener('keydown', handleKeyDown)
            })["TaskProcessor.useEffect"];
        }
    }["TaskProcessor.useEffect"], [
        handleNext,
        showShortcuts,
        showPriorityOverlay
    ]);
    const totalTasks = allTasks.length;
    const completedTasks = state.processedTasks.length + state.skippedTasks.length;
    const progress = totalTasks > 0 ? completedTasks / totalTasks * 100 : 0;
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "animate-spin rounded-full h-32 w-32 border-b-2 border-todoist-blue mx-auto"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskProcessor.tsx",
                        lineNumber: 261,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-2xl font-bold text-gray-900 mt-4",
                        children: "Loading Todoist Data..."
                    }, void 0, false, {
                        fileName: "[project]/components/TaskProcessor.tsx",
                        lineNumber: 262,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600",
                        children: "Fetching your inbox tasks, projects, and labels"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskProcessor.tsx",
                        lineNumber: 263,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TaskProcessor.tsx",
                lineNumber: 260,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/TaskProcessor.tsx",
            lineNumber: 259,
            columnNumber: 7
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-6xl mb-4",
                        children: "❌"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskProcessor.tsx",
                        lineNumber: 273,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold text-red-600 mb-2",
                        children: "Error Loading Data"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskProcessor.tsx",
                        lineNumber: 274,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600 mb-4",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/components/TaskProcessor.tsx",
                        lineNumber: 275,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>window.location.reload(),
                        className: "px-4 py-2 bg-todoist-blue text-white rounded-md hover:bg-blue-600 transition-colors",
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/components/TaskProcessor.tsx",
                        lineNumber: 276,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TaskProcessor.tsx",
                lineNumber: 272,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/TaskProcessor.tsx",
            lineNumber: 271,
            columnNumber: 7
        }, this);
    }
    if (!state.currentTask && state.queuedTasks.length === 0 && !loading) {
        const projectName = selectedProjectId === 'inbox' ? 'Inbox' : projects.find((p)=>p.id === selectedProjectId)?.name || 'Project';
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen p-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-4xl mx-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                            className: "text-3xl font-bold text-gray-900",
                                            children: "Task Processor"
                                        }, void 0, false, {
                                            fileName: "[project]/components/TaskProcessor.tsx",
                                            lineNumber: 297,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setShowShortcuts(!showShortcuts),
                                            className: "px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors",
                                            children: [
                                                "Shortcuts ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "kbd",
                                                    children: "?"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/TaskProcessor.tsx",
                                                    lineNumber: 302,
                                                    columnNumber: 27
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/TaskProcessor.tsx",
                                            lineNumber: 298,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/TaskProcessor.tsx",
                                    lineNumber: 296,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProjectSwitcher$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    projects: projects,
                                    selectedProjectId: selectedProjectId,
                                    onProjectChange: setSelectedProjectId,
                                    taskCount: totalTasks
                                }, void 0, false, {
                                    fileName: "[project]/components/TaskProcessor.tsx",
                                    lineNumber: 307,
                                    columnNumber: 13
                                }, this),
                                loadingTasks && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-white rounded-lg shadow-sm border p-4 mb-6",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-center space-x-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "animate-spin rounded-full h-5 w-5 border-b-2 border-todoist-blue"
                                            }, void 0, false, {
                                                fileName: "[project]/components/TaskProcessor.tsx",
                                                lineNumber: 318,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-600",
                                                children: "Loading tasks..."
                                            }, void 0, false, {
                                                fileName: "[project]/components/TaskProcessor.tsx",
                                                lineNumber: 319,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/TaskProcessor.tsx",
                                        lineNumber: 317,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/TaskProcessor.tsx",
                                    lineNumber: 316,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/TaskProcessor.tsx",
                            lineNumber: 295,
                            columnNumber: 11
                        }, this),
                        !loadingTasks && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-center",
                            style: {
                                minHeight: '50vh'
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-6xl mb-4",
                                        children: totalTasks === 0 ? '📭' : '🎉'
                                    }, void 0, false, {
                                        fileName: "[project]/components/TaskProcessor.tsx",
                                        lineNumber: 329,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-3xl font-bold text-gray-900 mb-2",
                                        children: totalTasks === 0 ? `${projectName} is Empty` : `${projectName} Complete!`
                                    }, void 0, false, {
                                        fileName: "[project]/components/TaskProcessor.tsx",
                                        lineNumber: 332,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-600 mb-4",
                                        children: totalTasks === 0 ? `No tasks found in ${projectName}. Try selecting a different project.` : 'All tasks have been processed.'
                                    }, void 0, false, {
                                        fileName: "[project]/components/TaskProcessor.tsx",
                                        lineNumber: 335,
                                        columnNumber: 17
                                    }, this),
                                    totalTasks > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm text-gray-500",
                                        children: [
                                            "Processed: ",
                                            state.processedTasks.length,
                                            " • Skipped: ",
                                            state.skippedTasks.length
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/TaskProcessor.tsx",
                                        lineNumber: 342,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>loadProjectTasks(selectedProjectId),
                                        className: "mt-4 px-4 py-2 bg-todoist-blue text-white rounded-md hover:bg-blue-600 transition-colors",
                                        children: "Refresh Tasks"
                                    }, void 0, false, {
                                        fileName: "[project]/components/TaskProcessor.tsx",
                                        lineNumber: 346,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/TaskProcessor.tsx",
                                lineNumber: 328,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/TaskProcessor.tsx",
                            lineNumber: 327,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/TaskProcessor.tsx",
                    lineNumber: 293,
                    columnNumber: 9
                }, this),
                showShortcuts && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$KeyboardShortcuts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    onClose: ()=>setShowShortcuts(false)
                }, void 0, false, {
                    fileName: "[project]/components/TaskProcessor.tsx",
                    lineNumber: 359,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/TaskProcessor.tsx",
            lineNumber: 292,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-4xl mx-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between mb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-3xl font-bold text-gray-900",
                                        children: "Task Processor"
                                    }, void 0, false, {
                                        fileName: "[project]/components/TaskProcessor.tsx",
                                        lineNumber: 371,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setShowShortcuts(!showShortcuts),
                                        className: "px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors",
                                        children: [
                                            "Shortcuts ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "kbd",
                                                children: "?"
                                            }, void 0, false, {
                                                fileName: "[project]/components/TaskProcessor.tsx",
                                                lineNumber: 376,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/TaskProcessor.tsx",
                                        lineNumber: 372,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/TaskProcessor.tsx",
                                lineNumber: 370,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProjectSwitcher$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                projects: projects,
                                selectedProjectId: selectedProjectId,
                                onProjectChange: setSelectedProjectId,
                                taskCount: totalTasks
                            }, void 0, false, {
                                fileName: "[project]/components/TaskProcessor.tsx",
                                lineNumber: 381,
                                columnNumber: 11
                            }, this),
                            loadingTasks && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white rounded-lg shadow-sm border p-4 mb-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-center space-x-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "animate-spin rounded-full h-5 w-5 border-b-2 border-todoist-blue"
                                        }, void 0, false, {
                                            fileName: "[project]/components/TaskProcessor.tsx",
                                            lineNumber: 392,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-gray-600",
                                            children: "Loading tasks..."
                                        }, void 0, false, {
                                            fileName: "[project]/components/TaskProcessor.tsx",
                                            lineNumber: 393,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/TaskProcessor.tsx",
                                    lineNumber: 391,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/TaskProcessor.tsx",
                                lineNumber: 390,
                                columnNumber: 13
                            }, this),
                            totalTasks > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProgressIndicator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                current: completedTasks + 1,
                                total: totalTasks,
                                progress: progress
                            }, void 0, false, {
                                fileName: "[project]/components/TaskProcessor.tsx",
                                lineNumber: 399,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskProcessor.tsx",
                        lineNumber: 369,
                        columnNumber: 9
                    }, this),
                    state.currentTask && !loadingTasks && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$TaskCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                task: state.currentTask,
                                projects: projects,
                                labels: labels,
                                onContentChange: handleContentChange
                            }, void 0, false, {
                                fileName: "[project]/components/TaskProcessor.tsx",
                                lineNumber: 411,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$TaskForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                task: state.currentTask,
                                projects: projects,
                                labels: labels,
                                suggestions: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["generateMockSuggestions"])(state.currentTask.content),
                                onAutoSave: (updates)=>autoSaveTask(state.currentTask.id, updates),
                                onNext: handleNext
                            }, taskKey, false, {
                                fileName: "[project]/components/TaskProcessor.tsx",
                                lineNumber: 419,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskProcessor.tsx",
                        lineNumber: 409,
                        columnNumber: 11
                    }, this),
                    state.queuedTasks.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-8 p-4 bg-gray-50 rounded-lg",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-medium text-gray-700 mb-3",
                                children: [
                                    "Next in queue (",
                                    state.queuedTasks.length,
                                    " remaining)"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/TaskProcessor.tsx",
                                lineNumber: 434,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: [
                                    state.queuedTasks.slice(0, 3).map((task, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm text-gray-600 truncate",
                                            children: [
                                                index + 1,
                                                ". ",
                                                task.content
                                            ]
                                        }, task.id, true, {
                                            fileName: "[project]/components/TaskProcessor.tsx",
                                            lineNumber: 439,
                                            columnNumber: 17
                                        }, this)),
                                    state.queuedTasks.length > 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm text-gray-400",
                                        children: [
                                            "+ ",
                                            state.queuedTasks.length - 3,
                                            " more..."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/TaskProcessor.tsx",
                                        lineNumber: 444,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/TaskProcessor.tsx",
                                lineNumber: 437,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/TaskProcessor.tsx",
                        lineNumber: 433,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TaskProcessor.tsx",
                lineNumber: 367,
                columnNumber: 7
            }, this),
            showShortcuts && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$KeyboardShortcuts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                onClose: ()=>setShowShortcuts(false)
            }, void 0, false, {
                fileName: "[project]/components/TaskProcessor.tsx",
                lineNumber: 455,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/TaskProcessor.tsx",
        lineNumber: 366,
        columnNumber: 5
    }, this);
}
_s(TaskProcessor, "9bePh+ikAVvmkNhCdOMdbmriC0Y=");
_c = TaskProcessor;
var _c;
__turbopack_context__.k.register(_c, "TaskProcessor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=_a1795bdb._.js.map