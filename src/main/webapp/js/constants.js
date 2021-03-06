var NCE_PREFIX = 'NCE_';
var SELECTED_APP = NCE_PREFIX + 'SELECTED_APP';
var SELECTED_VERSION = NCE_PREFIX + 'SELECTED_VERSION';
var SELECTED_STATUS = NCE_PREFIX + 'SELECTED_STATUS';
var SELECTED_CUBE = NCE_PREFIX + 'SELECTED_CUBE';
var SELECTED_BRANCH = NCE_PREFIX + 'SELECTED_BRANCH';
var SELECTED_CUBE_INFO = NCE_PREFIX + 'SELECTED_CUBE_INFO';
var ACTIVE_TAB_VIEW_TYPE = NCE_PREFIX + 'ACTIVE_TAB_VIEW_TYPE';
var OPEN_CUBES = NCE_PREFIX + 'OPEN_CUBES';
var HIDDEN_COLUMNS = NCE_PREFIX + 'HIDDEN_COLUMNS';
var AXIS_ORDER = NCE_PREFIX + 'AXIS_ORDER';
var COLUMN_WIDTHS = NCE_PREFIX + 'COLUMN_WIDTHS';
var ROW_HEIGHTS = NCE_PREFIX + 'ROW_HEIGHTS';
var TEST_RESULTS = NCE_PREFIX + 'TEST_RESULTS';
var FILTERS = NCE_PREFIX + 'FILTERS';
var SCOPE_MAP = NCE_PREFIX + 'SCOPE_MAP';
var VISITED_BRANCHES = NCE_PREFIX + 'VISITED_BRANCHES';

var PROGRESS_DELAY = 300;
var DIFF_SIDE_BY_SIDE = 0;
var DIFF_INLINE = 1;
var DIFF_DESCRIPTIVE = 2;
var DIFF_VISUAL = 3;
var CLIP_NCE = '~NCE~';
var CLIP_EXCEL = 'EXCEL';
var TAB_SEPARATOR = '~';

var MIN_COL_WIDTH = 50;
var MAX_COL_WIDTH = 600;
var FONT_HEIGHT = 22;
var MIN_ROW_HEIGHT = FONT_HEIGHT + 1;
var FONT_SIZE = '14px';
var FONT_CELL = FONT_SIZE + ' Helvetica Neue';
var FONT_CODE = FONT_SIZE + ' Lucida Console';
var CALC_WIDTH_AXIS_BUTTON_MOD = 50;
var CALC_WIDTH_REF_AX_BUTTON_MOD = 60;
var CALC_WIDTH_BASE_MOD = 30;
var CALC_WIDTH_TAB_OVERFLOW_MOD = 45;

var CONFIG_TITLE = '~Title';
var CONFIG_DEFAULT_TAB = '~DefaultTab';
var PAGE_ID = 'PageId';

var AXIS_DEFAULT = '002147483647';
var DEFAULT_TEXT = 'Default';

var BACKGROUND_CUBE_NAME = '#6495ED';
var BACKGROUND_AXIS_INFO = '#4D4D4D';
var COLOR_WHITE = '#FFFFFF';

var CLASS_HANDSON_TABLE_HEADER = ' handsonTableHeader';
var CLASS_HANDSON_CURRENT_ROW = 'handsonCurrentRow';

var CLASS_HANDSON_CELL_BASIC = ' cell';
var CLASS_HANDSON_CELL_CODE = ' code';
var CLASS_HANDSON_CELL_CUBE_NAME = ' cube-name';
var CLASS_HANDSON_CELL_DEFAULT = ' tableDefault';
var CLASS_HANDSON_CELL_ODD_ROW = ' oddRow';
var CLASS_HANDSON_CELL_URL = ' url';
var CLASS_HANDSON_SEARCH_RESULT = ' searchResult';

var CLASS_CONFLICT = 'conflict';
var CLASS_OUT_OF_SYNC = 'out-of-sync';
var CLASS_ACTIVE_VIEW = 'active-view';

var TAB_OVERFLOW_TEXT_PADDING = 70;
var TAB_WIDTH = 217;
var COORDINATE_BAR_SCROLL_AMOUNT = 40;
var NONE = 'none';
var NBSP = '&nbsp;';
var CUBE_INFO = {
    APP: 0,
    VERSION: 1,
    STATUS: 2,
    BRANCH: 3,
    NAME: 4,
    TAB_VIEW: 5
};

var MAX_VISIBLE_ROWS = 150000;
var MAX_TEMP = 10000000;
var REGEX_ANY_TAG = /(<([^>]+)>)/ig;
var REGEX_HR_TAG = /(<hr([^>]+)>)/ig;

var SAVED_INFO = {
    FILTER_OUT_BLANK_ROWS: 'filterOutBlankRows',
    INFO_DTO: 'infoDto',
    NUMBER_OF_FROZEN_COLUMNS: 'numFrozenCols',
    SEARCH_QUERY: 'searchQuery',
    VIEW_POSITION: 'position'
};

var STATUS = {
    RELEASE: 'RELEASE',
    SNAPSHOT: 'SNAPSHOT'
};

var VERSION = {
    MAJOR: 0,
    MINOR: 1,
    PATCH: 2
};

var AXIS_SUBTYPES = {
    EXPRESSION: 'EXPRESSION',
    STRING: 'STRING'
};
var AXIS_TYPE_LIST = {
    GENERAL_SUBTYPE: ['STRING', 'LONG', 'BIG_DECIMAL', 'DOUBLE', 'DATE', 'COMPARABLE'],
    RULE_SUBTYPE: ['EXPRESSION'],
    TYPE: ['DISCRETE', 'RANGE', 'SET', 'NEAREST', 'RULE']
};
var URL_ENABLED_LIST = ['string', 'binary', 'exp', 'method', 'template'];
var CACHE_ENABLED_LIST = ['string', 'binary', 'exp', 'method', 'template'];
var CODE_CELL_TYPE_LIST = ['exp', 'method'];
var FILTER_COMPARATOR_LIST = ['=','!=','>','<','contains','excludes'];
var METAPROPERTIES = {
    COLUMN_BLACKLIST: ['value','url','type','id','name'],
    OBJECT_TYPES: {
        CUBE: 'cube',
        AXIS: 'axis',
        COLUMN: 'column'
    }
};

var POPULATE_SELECT_FROM_CUBE = {
    AXIS: 'axis',
    METHOD: 'method'
};

var CONTROLLER = 'ncubeController.';
var CONTROLLER_METHOD = {
    ACCEPT_MINE: 'acceptMine',
    ACCEPT_THEIRS: 'acceptTheirs',
    ADD_AXIS: 'addAxis',
    BREAK_AXIS_REFERENCE: 'breakAxisReference',
    CHANGE_VERSION_VALUE: 'changeVersionValue',
    CHECK_PERMISSIONS: 'checkPermissions',
    COPY_BRANCH: 'copyBranch',
    COPY_CELLS: 'copyCells',
    DELETE_AXIS: 'deleteAxis',
    DELETE_BRANCH: 'deleteBranch',
    FETCH_HTML_BRANCH_DIFFS: 'fetchHtmlBranchDiffs',
    FETCH_HTML_REV_DIFFS: 'fetchHtmlRevDiffs',
    FETCH_JSON_BRANCH_DIFFS: 'fetchJsonBranchDiffs',
    FETCH_JSON_REV_DIFFS: 'fetchJsonRevDiffs',
    GET_APP_LOCKED_BY: 'getAppLockedBy',
    GET_APP_NAMES: 'getAppNames',
    GET_APP_VERSIONS: 'getAppVersions',
    GET_AXIS: 'getAxis',
    GET_AXIS_METAPROPERTIES: 'getAxisMetaProperties',
    GET_BRANCH_CHANGES: 'getBranchChanges',
    GET_BRANCH_CHANGES_FROM_BRANCH: 'getBranchChangesFromBranch',
    GET_BRANCHES: 'getBranches',
    GET_CUBE_METAPROPERTIES: 'getCubeMetaProperties',
    GET_COLUMN_METAPROPERTIES: 'getColumnMetaProperties',
    GET_JSON: 'getJson',
    GET_MENU: 'getMenu',
    GET_VERSIONS: 'getVersions',
    IS_APP_ADMIN: 'isAppAdmin',
    IS_APP_LOCKED: 'isAppLocked',
    LOCK_APP: 'lockApp',
    MOVE_BRANCH: 'moveBranch',
    PASTE_CELLS: 'pasteCells',
    RELEASE_VERSION: 'releaseVersion',
    RESOLVE_RELATIVE_URL: 'resolveRelativeUrl',
    SEARCH: 'search',
    UPDATE_AXIS: 'updateAxis',
    UPDATE_AXIS_COLUMNS: 'updateAxisColumns',
    UPDATE_AXIS_METAPROPERTIES: 'updateAxisMetaProperties',
    UPDATE_BRANCH: 'updateBranch',
    UPDATE_BRANCH_CUBE: 'updateBranchCube',
    UPDATE_BRANCH_CUBES: 'updateBranchCubes',
    UPDATE_CELL: 'updateCell',
    UPDATE_CUBE_METAPROPERTIES: 'updateCubeMetaProperties',
    UPDATE_COLUMN_METAPROPERTIES: 'updateColumnMetaProperties'
};

var DEFAULT_SCOPE = [
    {
        isApplied: 'true',
        key: 'context',
        value: 'Edit'
    },
    {
        isApplied: 'true',
        key: 'action',
        value: 'Edit'
    }
];

var PERMISSION_ACTION = {
    COMMIT: 'commit',
    READ: 'read',
    RELEASE: 'release',
    UPDATE: 'update'
};

var KEY_CODES = {
    MOUSE_LEFT: 1,
    MOUSE_RIGHT: 3,
    MOUSE_MIDDLE: 2,
    BACKSPACE: 8,
    COMMA: 188,
    INSERT: 45,
    DELETE: 46,
    END: 35,
    ENTER: 13,
    ESCAPE: 27,
    CONTROL_LEFT: 91,
    COMMAND_LEFT: 17,
    COMMAND_RIGHT: 93,
    ALT: 18,
    HOME: 36,
    PAGE_DOWN: 34,
    PAGE_UP: 33,
    PERIOD: 190,
    SPACE: 32,
    SHIFT: 16,
    CAPS_LOCK: 20,
    TAB: 9,
    ARROW_RIGHT: 39,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_DOWN: 40,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    A: 65,
    F: 70,
    X: 88,
    C: 67,
    K: 75,
    V: 86
};