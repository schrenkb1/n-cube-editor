/**
 * NCube Editor
 *     IDE for building and editing NCubes
 *
 * @author John DeRegnaucourt (jdereg@gmail.com)
 *         <br>
 *         Copyright (c) Cedar Software LLC
 *         <br><br>
 *         Licensed under the Apache License, Version 2.0 (the "License");
 *         you may not use this file except in compliance with the License.
 *         You may obtain a copy of the License at
 *         <br><br>
 *         http://www.apache.org/licenses/LICENSE-2.0
 *         <br><br>
 *         Unless required by applicable law or agreed to in writing, software
 *         distributed under the License is distributed on an "AS IS" BASIS,
 *         WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *         See the License for the specific language governing permissions and
 *         limitations under the License.
 */

var NCE = (function ($)
{
    var head = 'HEAD';
    var _searchThread;
    var _heartBeatThread;
    var _cubeList = {};
    var _openCubes = localStorage[OPEN_CUBES];
    try
    {
        _openCubes = JSON.parse(_openCubes);

        if (Object.prototype.toString.call(_openCubes) !== '[object Array]'
            || (_openCubes.length > 0 && typeof _openCubes[0] !== 'object')) {
            _openCubes = [];
        }
        else if (!_openCubes[0].hasOwnProperty('cubeKey'))
        {
            _openCubes = [];
        }
    }
    catch (e)
    {
        _openCubes = []
    }
    var _visitedBranches = localStorage[VISITED_BRANCHES];
    if (_visitedBranches === undefined) {
        _visitedBranches = {};
    } else {
        _visitedBranches = JSON.parse(_visitedBranches);
    }
    var _selectedCubeName = localStorage[SELECTED_CUBE];
    var _selectedApp = localStorage[SELECTED_APP];
    var _selectedVersion = localStorage[SELECTED_VERSION];
    var _selectedBranch;
    if (localStorage.getItem(SELECTED_BRANCH) == null)
    {
        saveSelectedBranch(head);
    }
    else
    {
        _selectedBranch = localStorage[SELECTED_BRANCH];
    }
    var _selectedStatus = localStorage[SELECTED_STATUS] || STATUS.SNAPSHOT;
    var _errorId = null;
    var _activeTabViewType = localStorage[ACTIVE_TAB_VIEW_TYPE];
    if (!_activeTabViewType)
    {
        _activeTabViewType = 'n-cube' + PAGE_ID;
    }
    var _selectedCubeInfo = localStorage[SELECTED_CUBE_INFO];
    _selectedCubeInfo = _selectedCubeInfo ? JSON.parse(_selectedCubeInfo) : [];
    var _defaultTab = null;
    var _appTitle = $('#appTitle');
    var _searchNames = $('#cube-search');
    var _searchContent = $('#cube-search-content');
    var _cubeCount = $('#ncubeCount');
    var _listOfCubes= $('#ncube-list');
    var _mainTabPanel = $('#ncubeTabContent');
    var _openTabsPanel = $('#ncube-tabs');
    var _openTabList = _openTabsPanel.find('ul');
    var _diffOutput = $('#diffOutput');
    var _searchLastKeyTime = Date.now();
    var _searchKeyPressed = false;
    var _diffLastResult = null;
    var _diffHtmlResult = null;
    var _diffLeftName = '';
    var _diffRightName = '';
    var _menuOptions = [];
    var _tabOverflow = $('#tab-overflow');
    var _branchNames = [];
    var _conflictMap = [];
    var _draggingTabCubeInfo = null;
    var _tabDragIndicator = $('#tab-drag-indicator');
    var _appMenu = $('#AppMenu');
    var _versionMenu = $('#VersionMenu');
    var _batchUpdateAxisReferencesTable = $('#batchUpdateAxisReferencesTable');
    var _batchUpdateAxisReferencesToggle = $('#batchUpdateAxisReferencesToggle');
    var _batchUpdateAxisReferencesData = [];
    var _batchUpdateAxisReferencesApp = $('#batchUpdateAxisReferencesApp');
    var _batchUpdateAxisReferencesVersion = $('#batchUpdateAxisReferencesVersion');
    var _batchUpdateAxisReferencesCubeName = $('#batchUpdateAxisReferencesCubeName');
    var _batchUpdateAxisReferencesAxisName = $('#batchUpdateAxisReferencesAxisName');
    var _changeVersionMenu = $('#changeVerMenu');
    var _releaseCubesMenu = $('#releaseCubesMenu');
    var _createSnapshotMenu = $('#createSnapshotMenu');
    var _lockUnlockAppMenu = $('#lockUnlockAppMenu');
    var _getAppLockedByMenu = $('#getAppLockedByMenu');
    var _releaseCubesVersion = $('#releaseCubesVersion');
    var _branchMenu = $('#BranchMenu');
    var _releaseMenu = $('#ReleaseMenu');
    var _branchCommit = $('#branchCommit');
    var _commitRollbackList = $('#commitRollbackList');
    var _branchQuickSelectHeader = $('#branchQuickSelectHeader');
    var _clearCache = $('#clearCache');
    var _releaseCubesProgressDiv = $('#releaseCubesProgressDiv');
    var _releaseCubesProgressBar = $('#releaseCubesProgressBar');
    var _releaseCubesProgressInfo = $('#releaseCubesProgressInfo');
    var _releaseCubesOk = $('#releaseCubesOk');
    var _releaseCubesProgressPct = null;
    var _releaseCubesProgressText = null;
    var isReleasePending = false;
    var _branchCompareUpdateMenu = $('#branchCompareUpdate');
    var _branchCompareUpdateList = $('#branchCompareUpdateList');
    var _branchList = $('#branchList');
    var _newBranchName = $('#newBranchName');
    var _branchNameWarning = $('#branchNameWarning');
    var _createSnapshotLabel = $('#createSnapshotLabel');
    var _createSnapshotVersion = $('#createSnapshotVersion');
    var _copyBranchLabel = $('#copyBranchLabel');

    //  modal dialogs
    var _selectBranchModal = $('#selectBranchModal');
    var _commitModal = $('#commitRollbackModal');
    var _diffModal = $('#diffOutputModal');
    var _releaseCubesModal = $('#releaseCubesModal');
    var _branchCompareUpdateModal = $('#branchCompareUpdateModal');
    var _createSnapshotModal = $('#createSnapshotModal');
    var _copyBranchModal = $('#copyBranchModal');

    initialize();

    function initialize()
    {
        try
        {
            setupMainSplitter();
            startWorkers();
            loadAppListView();
            loadVersionListView();
            showActiveBranch();
            loadNCubes();
            buildMenu();
            clearSearch();
            loop();
            heartBeat();
            addListeners();
            addModalFilters();
            modalsDraggable(true);
        }
        catch (e)
        {
            console.log(e);
        }
    }

    function setupMainSplitter() {
        $('body').layout({
            name: "BodyLayout"
            //	reference only - these options are NOT required because 'true' is the default
            , closable: true	// pane can open & close
            , resizable: true	// when open, pane can be resized
            , slidable: true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
            , livePaneResizing: true
            , togglerLength_open: 60
            , togglerLength_closed: "100%"
            //	some pane animation settings
            , west__animatePaneSizing: false
            , west__fxName_open: "none"
            , west__fxName_close: "none"	// NO animation when closing west-pane
            , spacing_open: 5
            , spacing_closed: 5
            , west__resizeable: true
            , west__size: 250
            , west__minSize: 140
            //	enable showOverflow on west-pane so CSS popups will overlap north pane
            , west__showOverflowOnHover: true
            , center__triggerEventsOnLoad: true
            , center__maskContents: true
            //	enable state management
            , stateManagement__enabled: false // automatic cookie load & save enabled by default
            , showDebugMessages: false // log and/or display messages from debugging & testing code
            , onresize_end: function() {
                delay(function() {
                    buildTabs();
                },PROGRESS_DELAY);
            }
        });
    }
    
    function saveOpenCubeList() {
        localStorage[OPEN_CUBES] = JSON.stringify(_openCubes);
    }

    function addCurrentCubeTab(insertIdx, cubeInfo, dto) {
        var cubeInfo = cubeInfo || [_selectedApp, _selectedVersion, _selectedStatus, _selectedBranch, _selectedCubeName, getActiveTabViewType()];
        var newOpenCube = {
            cubeKey: getCubeInfoKey(cubeInfo),
            status: null,
            position: {},
            numFrozenCols: null,
            searchQuery: null,
            infoDto: dto||_cubeList[cubeInfo[CUBE_INFO.NAME].toLowerCase()],
            filterOutBlankRows: false
        };
        if (insertIdx > -1) {
            _openCubes.splice(insertIdx, 0, newOpenCube);
        } else {
            _openCubes.unshift(newOpenCube);
        }
        saveOpenCubeList();
        buildTabs(cubeInfo);
    }

    function getOpenCubeIndex(cubeInfo) {
        var cubeInfoKey = getCubeInfoKey(cubeInfo);
        for (var i = 0, len = _openCubes.length; i < len; i++) {
            if (cubeInfoKey === _openCubes[i].cubeKey) {
                return i;
            }
        }
    }

    function saveSelectedApp(app) {
        if (app !== undefined) {
            _selectedApp = app;
        }
        localStorage[SELECTED_APP] = _selectedApp;
    }
    
    function saveSelectedVersion(version) {
        if (version !== undefined) {
            _selectedVersion = version;
        }
        localStorage[SELECTED_VERSION] = _selectedVersion;
    }

    function saveSelectedStatus(status) {
        if (status !== undefined) {
            _selectedStatus = status;
        }
        localStorage[SELECTED_STATUS] = _selectedStatus;
    }
    
    function saveSelectedBranch(branch) {
        if (branch !== undefined) {
            _selectedBranch = branch;
        }
        localStorage[SELECTED_BRANCH] = _selectedBranch;
    }

    function saveOpenCubeInfoValue(property, value) {
        _openCubes[getOpenCubeIndex(_selectedCubeInfo)][property] = value;
        saveOpenCubeList();
    }

    function getOpenCubeInfoValue(property) {
        return _openCubes[getOpenCubeIndex(_selectedCubeInfo)][property];
    }

    function getInfoDto() {
        return getOpenCubeInfoValue(SAVED_INFO.INFO_DTO);
    }

    function saveInfoDto(dto) {
        saveOpenCubeInfoValue(SAVED_INFO.INFO_DTO, dto);
    }

    function saveViewPosition(position) {
        var savedPos = getOpenCubeInfoValue(SAVED_INFO.VIEW_POSITION);
        savedPos[getActiveTabViewType()] = position;
        saveOpenCubeInfoValue(SAVED_INFO.VIEW_POSITION, savedPos);
    }

    function getViewPosition() {
        return getOpenCubeInfoValue(SAVED_INFO.VIEW_POSITION)[getActiveTabViewType()];
    }

    function saveFilterOutBlankRows(shouldFilterOutBlankRows) {
        saveOpenCubeInfoValue(SAVED_INFO.FILTER_OUT_BLANK_ROWS, shouldFilterOutBlankRows);
    }

    function getFilterOutBlankRows() {
        return getOpenCubeInfoValue(SAVED_INFO.FILTER_OUT_BLANK_ROWS);
    }

    function saveNumFrozenCols(num) {
        saveOpenCubeInfoValue(SAVED_INFO.NUMBER_OF_FROZEN_COLUMNS, num);
    }

    function getNumFrozenCols() {
        return getOpenCubeInfoValue(SAVED_INFO.NUMBER_OF_FROZEN_COLUMNS);
    }

    function getSearchQuery() {
        return getOpenCubeInfoValue(SAVED_INFO.SEARCH_QUERY);
    }

    function saveSearchQuery(query) {
        saveOpenCubeInfoValue(SAVED_INFO.SEARCH_QUERY, query);
    }

    function getCubeInfoKey(cubeInfo)
    {
        return cubeInfo.join(TAB_SEPARATOR);
    }

    function getCubeInfo(cubeKey)
    {
        return cubeKey.split(TAB_SEPARATOR);
    }

    function getSelectedCubeInfoKey()
    {
        return getCubeInfoKey(_selectedCubeInfo);
    }

    function removeTab(cubeInfo) {
        _openCubes.splice(getOpenCubeIndex(cubeInfo), 1);
        saveOpenCubeList();

        if (_openCubes.length > 0) {
            var newCubeInfo = getCubeInfo(_openCubes[0].cubeKey);
            makeCubeInfoActive(newCubeInfo);
        } else {
            switchTabPane(null);
        }

        buildTabs();
    }

    function removeAllTabs() {
        _openCubes = [];
        delete localStorage[OPEN_CUBES];
        buildTabs();
    }

    function startWorkers()
    {
        if (typeof(Worker) !== 'undefined')
        {
            /**
             * Background worker thread that will send search filter text asynchronously to server,
             * fetch the results, and ship to main thread (which will be updated to the filtered list).
             */
            _searchThread = new Worker('js/loadCubeList.js');
            _searchThread.onmessage = function(event)
            {
                var list = event.data;
                loadFilteredNCubeListView(list);
            };

            // background thread for heartbeat
            _heartBeatThread = new Worker('js/heartBeat.js');
            _heartBeatThread.onmessage = function(event) {
                var result = event.data.obj;
                for (var i = 0, len = result.length; i < len; i++) {
                    for (var x = 0, xLen = _openCubes.length; x < xLen; x++) {
                        var curCube = _openCubes[x];
                        var curRes = result[i];
                        if (curCube.cubeKey.indexOf(curRes.key) > -1) {
                            curCube.status = curRes.status;
                        }
                    }
                }
                saveOpenCubeList();
                updateTabStatus();
            };
        }
        else
        {
            alert('Sorry! No Web Worker support. Try using the Chrome browser.');
        }
    }

    function makeCubeInfoActive(cubeInfo) {
        _selectedCubeInfo = cubeInfo;
        _selectedCubeName = cubeInfo[CUBE_INFO.NAME];
        setActiveTabViewType(cubeInfo[CUBE_INFO.TAB_VIEW]);
    }

    function selectTab(cubeInfo) {
        deselectTab();
        var tab = $('#' + getCubeInfoKey(cubeInfo).replace(/\./g,'_').replace(/~/g,'\\~'));
        if (tab.length < 1) {
            var idx = getOpenCubeIndex(cubeInfo);
            if (idx > -1) {
                _openCubes.unshift(_openCubes.splice(idx, 1)[0]);
                saveOpenCubeList();
                buildTabs();
                return;
            }
            tab = _openTabList.children().first();
            var id = tab.prop('id');
            cubeInfo[CUBE_INFO.TAB_VIEW] = id.substring(id.lastIndexOf('~') + 1);
            id = id.substring(0, id.lastIndexOf('~'));
            cubeInfo[CUBE_INFO.NAME] = id.substring(id.lastIndexOf('~') + 1);
        }
        tab.addClass('active');

        makeCubeInfoActive(cubeInfo);
        localStorage[SELECTED_CUBE_INFO] = JSON.stringify(cubeInfo);
        localStorage[SELECTED_CUBE] = _selectedCubeName;
        localStorage[ACTIVE_TAB_VIEW_TYPE] = getActiveTabViewType();
        tab.find('a.' + CLASS_ACTIVE_VIEW).removeClass(CLASS_ACTIVE_VIEW);
        tab.find('a').filter(function()
        {
            return $(this)[0].textContent.trim() === getActiveTabViewType().replace(PAGE_ID,'');
        }).addClass(CLASS_ACTIVE_VIEW);

        var listCubeName = null;
        if (cubeInfo[CUBE_INFO.APP] === _selectedApp
            && cubeInfo[CUBE_INFO.VERSION] === _selectedVersion
            && cubeInfo[CUBE_INFO.STATUS] === _selectedStatus
            && cubeInfo[CUBE_INFO.BRANCH] === _selectedBranch) {
            listCubeName = _selectedCubeName;
        }
        setListSelectedStatus(listCubeName, '#ncube-list');

        switchTabPane(getActiveTabViewType());
    }

    function deselectTab() {
        _openTabList.find('li.dropdown.active').removeClass('active');
    }

    function getTabImage(imgSrc) {
        return imgSrc ? '<img src="' + imgSrc + '" height="16px" width="16px" draggable="false"/>' : '';
    }

    function addTab(cubeInfo, status) {
        deselectTab();
        var imgSrc;
        for (var x = 0, xLen = _menuOptions.length; x < xLen; x++) {
            var opt = _menuOptions[x];
            if (opt.pageId === cubeInfo[CUBE_INFO.TAB_VIEW]) {
                imgSrc = opt.imgSrc;
                break;
            }
        }
        var link = $('<a/>')
            .attr('href','#')
            .attr('draggable', false)
            .addClass('dropdown-toggle ncube-tab-top-level')
            .addClass(status)
            .html(getTabImage(imgSrc)
                + '<span class="tab-text">' + cubeInfo[CUBE_INFO.NAME] + '</span>'
                + '<span class="click-space"><span class="big-caret"></span></span>'
                + '<span class="glyphicon glyphicon-remove tab-close-icon" aria-hidden="true"></span>'
            );
        link.attr('data-toggle', 'dropdown');
        var li = $('<li/>');
        function closeTab() {
            li.removeClass('open');
            li.tooltip('hide');
            li.find('button').remove();
            li.find('input').remove();
            $('div.dropdown-backdrop').hide();
        }

        li.addClass('active');
        li.addClass('dropdown');
        li.attr('id', getCubeInfoKey(cubeInfo).replace(/\./g,'_'));
        li.attr('draggable', true);
        li.on("dragstart", function(e) {
            _draggingTabCubeInfo = cubeInfo;
        });
        li.tooltip({
            trigger: 'hover',
            placement: 'auto top',
            animate: true,
            delay: 250,
            container: 'body',
            title: cubeInfo.slice(0, CUBE_INFO.TAB_VIEW).join(' - '),
            template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner tab-tooltip"></div></div>'
        });
        li.click(function(e) {
            // only show dropdown when clicking the caret, not just the tab
            var target = $(e.target);
            var isClose = target.hasClass('glyphicon-remove');
            var isDroptdown = target.hasClass('click-space') || target.hasClass('big-caret');

            if (isClose) {
                li.tooltip('destroy');
                removeTab(cubeInfo);
            } else {
               if (isDroptdown) { // clicking caret for dropdown
                    $(this).find('.ncube-tab-top-level')
                        .addClass('dropdown-toggle')
                        .attr('data-toggle', 'dropdown');
                    $(document).one('click', function() { // prevent tooltip and dropdown from remaining on screen
                        closeTab();
                    });
                } else { // when clicking tab show tab, not dropdown
                   $(this).find('.ncube-tab-top-level')
                        .removeClass('dropdown-toggle')
                        .attr('data-toggle', '')
                        .tab('show');
                }

                if (cubeInfo !== _selectedCubeInfo) {
                    makeCubeInfoActive(cubeInfo);
                    selectTab(cubeInfo);
                    saveState();
                }
            }
        });

        var dd = $('<ul/>');
        dd.addClass('dropdown-menu tab-menu');

        for (var menuIdx = 0, menuLen = _menuOptions.length; menuIdx < menuLen; menuIdx++) {
            (function() {
                var menuOption = _menuOptions[menuIdx];
                var pageId = menuOption.pageId;
                var imgHtml = getTabImage(menuOption.imgSrc);

                var anc = $('<a/>')
                    .attr('href', '#')
                    .html(imgHtml + NBSP + menuOption.key)
                    .click(function (e) {
                        clearError();
                        setActiveTabViewType(pageId);
                        var ci2 = [cubeInfo[CUBE_INFO.APP], cubeInfo[CUBE_INFO.VERSION], cubeInfo[CUBE_INFO.STATUS], cubeInfo[CUBE_INFO.BRANCH], cubeInfo[CUBE_INFO.NAME], getActiveTabViewType()];
                        var cia2 = getCubeInfoKey(ci2);
                        var tabIdx = getOpenCubeIndex(ci2);
                        var isCtrlKey = e.metaKey || e.ctrlKey;
                        if (isCtrlKey) {
                            e.stopImmediatePropagation();
                            e.preventDefault();
                        }

                        if (tabIdx > -1) { // already open
                            e.preventDefault();
                            e.stopPropagation();
                            closeTab();
                            selectTab(ci2);
                        } else {
                            tabIdx = getOpenCubeIndex(cubeInfo);
                            if (isCtrlKey) { // open new tab
                                li.removeClass('open');
                                li.tooltip('hide');
                                addCurrentCubeTab(tabIdx, ci2, getInfoDto());
                            } else { // use current tab
                                cubeInfo[CUBE_INFO.TAB_VIEW] = getActiveTabViewType();
                                _openCubes[tabIdx].cubeKey = cia2;
                                saveOpenCubeList();
                                li.attr('id', cia2.replace(/\./g,'_'));
                                var img = link.find('img');
                                if (img.length > 0) {
                                    img.attr('src', menuOption.imgSrc);
                                }
                                li.find('a').removeClass(CLASS_ACTIVE_VIEW);
                                $(this).addClass(CLASS_ACTIVE_VIEW);
                            }
                            switchTabPane(getActiveTabViewType());
                        }
                    });

                dd.append($('<li/>').append(anc));
            })();
        }

        dd.append(
            $('<div/>').addClass('divider')
        ).append(
            $('<li/>')
                .addClass('dropdown-submenu')
                .append(
                $('<a/>')
                    .prop({href:'#', tabindex:'-1'})
                    .html('Compare')
            ).append(
                createBranchesUl(function(branchName) {
                    var infoDto = getInfoDto();
                    var leftInfoDto = $.extend(true, {}, infoDto);
                    leftInfoDto.branch = branchName;
                    diffCubes(leftInfoDto, infoDto, infoDto.name);
                })
            )
        ).append(
            $('<li/>')
                .append(
                $('<a/>')
                    .attr('href','#')
                    .html('Revision History...')
                    .click(function(e) {
                        revisionHistory();
                    }))
        ).append(
            $('<li/>')
                .append(
                $('<a/>')
                    .attr('href','#')
                    .html('Show Outbound References')
                    .click(function(e) {
                        showRefsFromCube();
                    }))
        ).append(
            $('<li/>')
                .append(
                $('<a/>')
                    .attr('href','#')
                    .html('Show Required Scope')
                    .click(function(e) {
                        showReqScope();
                    }))
        );

        if (cubeInfo[CUBE_INFO.BRANCH] !== head) {
            dd.append(
                $('<div/>').addClass('divider')
            ).append(
                $('<li/>')
                    .append(
                    $('<a/>')
                        .attr('href', '#')
                        .html('Commit...')
                        .click(function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            li.find('li').not($(this).parent()).find('button').remove();
                            var buttons = $(this).find('button');
                            if (buttons.length === 0) {
                                $(this).append(
                                    $('<button/>')
                                        .addClass('btn btn-danger btn-xs pull-right')
                                        .html('Cancel')
                                ).append(
                                    $('<button/>')
                                        .addClass('btn btn-primary btn-xs pull-right')
                                        .html('Confirm')
                                        .click(function (e) {
                                            closeTab();
                                            callCommit(getInfoDto(), getSelectedTabAppId());
                                        })
                                );
                            } else {
                                buttons.remove();
                            }
                        }))
            ).append(
                $('<li/>')
                    .append(
                    $('<a/>')
                        .attr('href', '#')
                        .html('Rollback...')
                        .click(function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            li.find('li').not($(this).parent()).find('button').remove();
                            var buttons = $(this).find('button');
                            if (buttons.length === 0) {
                                $(this).append(
                                    $('<button/>')
                                        .addClass('btn btn-danger btn-xs pull-right')
                                        .html('Cancel')
                                ).append(
                                    $('<button/>')
                                        .addClass('btn btn-primary btn-xs pull-right')
                                        .html('Confirm')
                                        .click(function (e) {
                                            closeTab();
                                            callRollbackFromTab(getInfoDto());
                                        })
                                );
                            } else {
                                buttons.remove();
                            }
                        }))
            ).append(
                $('<li/>')
                    .addClass('dropdown-submenu')
                    .append(
                    $('<a/>')
                        .prop({href: '#', tabindex: '-1'})
                        .html('Update')
                ).append(
                    createBranchesUl(function (branchName) {
                        callUpdate(branchName);
                    })
                )
            ).append(
                $('<div/>')
                    .addClass('divider')
            ).append(
                $('<li/>')
                    .append(
                    $('<a/>')
                        .attr('href', '#')
                        .html('Delete...')
                        .click(function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            li.find('li').not($(this).parent()).find('button').remove();
                            var buttons = $(this).find('button');
                            if (buttons.length === 0) {
                                $(this).append(
                                    $('<button/>')
                                        .addClass('btn btn-danger btn-xs pull-right')
                                        .html('Cancel')
                                ).append(
                                    $('<button/>')
                                        .addClass('btn btn-primary btn-xs pull-right')
                                        .html('Confirm')
                                        .click(function (e) {
                                            closeTab();
                                            callDeleteFromTab(getInfoDto().name);
                                        })
                                );
                            } else {
                                buttons.remove();
                            }
                        }))
            ).append(
                $('<li/>')
                    .append(
                    $('<a/>')
                        .attr('href', '#')
                        .html('Duplicate...')
                        .click(function (e) {
                            dupeCube();
                        }))
            ).append(
                $('<li/>')
                    .append(
                    $('<a/>')
                        .attr('href', '#')
                        .html('Rename')
                        .click(function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            var parent = $(this).parent();
                            var inputs = parent.find('input');
                            if (inputs.length === 0) {
                                var newNameInput = $('<input/>')
                                    .prop('type', 'text')
                                    .val(cubeInfo[CUBE_INFO.NAME])
                                    .addClass('form-control')
                                    .click(function (ie) {
                                        ie.preventDefault();
                                        ie.stopPropagation();
                                    })
                                    .keyup(function (ie) {
                                        if (ie.keyCode === KEY_CODES.ENTER) {
                                            closeTab();
                                            renameCube(newNameInput.val());
                                        }
                                    });
                                parent.append(newNameInput);
                                $(this).append(
                                    $('<button/>')
                                        .addClass('btn btn-danger btn-xs pull-right')
                                        .html('Cancel')
                                ).append(
                                    $('<button/>')
                                        .addClass('btn btn-primary btn-xs pull-right')
                                        .html('Confirm')
                                        .click(function (e) {
                                            closeTab();
                                            renameCube(newNameInput.val());
                                        })
                                );
                                newNameInput[0].focus();
                            } else {
                                inputs.remove();
                                parent.find('button').remove();
                            }
                        }))
            );
        }

        dd.append(
            $('<div/>')
                .prop({'class': 'divider'})
        ).append(
            $('<li/>').append(
                $('<a/>')
                    .attr('href','#')
                    .html('Close')
                    .click(function() {
                        li.tooltip('destroy');
                        removeTab(cubeInfo);
                    }))
        ).append(
            $('<li/>').append(
                $('<a/>')
                    .attr('href','#')
                    .html('Close All')
                    .click(function() {
                        li.tooltip('destroy');
                        removeAllTabs();
                        switchTabPane(null);
                    }))
        ).append(
            $('<li/>').append(
                $('<a/>')
                    .attr('href','#')
                    .html('Close Others')
                    .click(function() {
                        li.tooltip('destroy');
                        removeAllTabs();
                        addCurrentCubeTab();
                    }))
        );

        li.append(link);
        li.append(dd);
        _openTabList.first().append(li);

        trimText(li.find('.tab-text')[0]);
    }

    function trimText(el){
        var value, len;
        if (el.scrollWidth > el.offsetWidth) {
            value = el.innerHTML;
            len = value.length;
            if (len > 30) {
                value = value.substr(len - 30);
            }
            do {
                value = '...' + value.substr(4);
                el.innerHTML = value;
            }
            while (el.scrollWidth > el.offsetWidth);
        }
    }

    function createBranchesUl(func) {
        var html, bnIdx, bnLen, branchesUl;

        html = '<ul class="dropdown-menu">';
        for (bnIdx = 0, bnLen = _branchNames.length; bnIdx < bnLen; bnIdx++) {
            html += '<li><a href="#">';
            html += _branchNames[bnIdx];
            html += '</a></li>';
        }
        
        branchesUl = $(html);
        branchesUl.find('a').on('click', function() {
            return func(this.innerHTML);
        });
        return branchesUl;
    }

    function switchTabPane(pageId)
    {
        $('.tab-pane').removeClass('active');
        if (pageId) {
            $('#' + pageId).addClass('active');
            var iframeId = 'iframe_' + pageId;
            try {
                var frame = document.getElementById(iframeId);
                if (frame) {
                    var cw = frame.contentWindow;
                    if (cw.tabActivated !== undefined) {
                        cw.tabActivated(buildAppState());
                        localStorage[ACTIVE_TAB_VIEW_TYPE] = pageId;
                        cw.focus();
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }
    }

    function updateTabStatus() {
        var allStatusClasses = [CLASS_OUT_OF_SYNC, CLASS_CONFLICT];
        function updateElementStatus(el, status) {
            el = $(el);
            el.removeClass(allStatusClasses);
            if (status !== undefined && status !== null) {
                el.addClass(status);
            }
        }

        // top tabs
        var tabs = _openTabList.find('li').find('a.ncube-tab-top-level');
        for (var tabNum = 0, tabLen = tabs.length; tabNum < tabLen; tabNum++) {
            updateElementStatus(tabs[tabNum], _openCubes[tabNum].status);
        }

        // overflow
        var overflow = _tabOverflow.find('li').find('a');
        for (var oNum = 0, oLen = overflow.length; oNum < oLen; oNum++) {
            updateElementStatus(overflow[oNum], _openCubes[tabNum + oNum]);
        }
    }

    function calcMaxTabs() {
        var windowWidth = _openTabsPanel.width();
        var availableWidth = windowWidth - _tabOverflow.outerWidth();
        return Math.floor(availableWidth / TAB_WIDTH);
    }

    function buildTabs(curCubeInfo) {
        _openTabList.children().remove();
        _tabOverflow.hide();
        var len = _openCubes.length;
        if (len > 0) {
            var maxTabs = calcMaxTabs();

            var cubeInfo = curCubeInfo || _selectedCubeInfo;
            var idx = getOpenCubeIndex(cubeInfo);
            if (idx >= maxTabs) { // if selected tab is now in overflow, bring to front
                var temp = _openCubes.splice(idx, 1);
                _openCubes.unshift(temp[0]);
                saveOpenCubeList();
            }

            for (var i = 0; i < len && i < maxTabs; i++) {
                var openCube = _openCubes[i];
                addTab(getCubeInfo(openCube.cubeKey), openCube.status);
            }
            if (len > maxTabs) {
                _tabOverflow.show();
                buildTabOverflow(maxTabs, len);
            }
            selectTab(cubeInfo);
        } else {
            switchTabPane(null);
        }
    }

    function buildTabOverflow(maxTabs, len) {
        $('#tab-overflow-text')[0].innerHTML = len - maxTabs;
        var dd = _tabOverflow.find('ul');
        var largestText = TAB_WIDTH;

        for (var i = maxTabs; i < len; i++) {
            (function() {
                var openCube = _openCubes[i];
                var cubeInfo = getCubeInfo(openCube.cubeKey);
                var imgSrc;
                for (var x = 0, xLen = _menuOptions.length; x < xLen; x++) {
                    var opt = _menuOptions[x];
                    if (opt.pageId === cubeInfo[CUBE_INFO.TAB_VIEW]) {
                        imgSrc = opt.imgSrc;
                        break;
                    }
                }

                var tabText = cubeInfo.slice(0, CUBE_INFO.TAB_VIEW).join(' - ');
                var textWidth = $('<p>' + tabText + '</p>').canvasMeasureWidth(FONT_CELL) + CALC_WIDTH_TAB_OVERFLOW_MOD;
                if (textWidth > largestText) {
                    largestText = textWidth;
                }

                dd.append(
                    $('<li/>').append(
                        $('<a/>')
                            .attr('href', '#')
                            .addClass(openCube.status)
                            .html(getTabImage(imgSrc)
                                + '<span class="dropdown-tab-text">' + tabText + '</span>'
                                + '<span class="glyphicon glyphicon-remove tab-close-icon" aria-hidden="true"></span>'
                            )
                            .click(function(e) {
                                if ($(e.target).hasClass('glyphicon-remove')) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeTab(cubeInfo);
                                } else {
                                    makeCubeInfoActive(cubeInfo);
                                    buildTabs();
                                }
                            })
                    )
                );
            })();
        }

        largestText += TAB_OVERFLOW_TEXT_PADDING;
        var button = _tabOverflow.find('button');
        var offset = button.offset();
        var maxWidth = offset.left + button.outerWidth();
        var dropdownWidth = largestText < maxWidth ? largestText : maxWidth;
        var dropDownTop = offset.top + button.outerHeight() + parseInt(button.css('marginTop').replace('px',''));
        var dropDownLeft = maxWidth - dropdownWidth;
        dd.css({top: dropDownTop + 'px', left: dropDownLeft + 'px', width: dropdownWidth + 'px'});
    }

    function buildMenu() {
        var menu, pageId, tabHeight, iframeHtml, menuKeys, key, value, i, len;
        var html = '';
        var appId = getAppId();
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_MENU,[appId]);
        if (!result.status) {
            showNote('Unable to load menu.' + result.data);
            return;
        }
        menu = result.data;
        _appTitle[0].innerHTML = menu[CONFIG_TITLE];
        _defaultTab = menu[CONFIG_DEFAULT_TAB];
        if (_defaultTab) {
            _defaultTab = _defaultTab.replace(/\s/g,'_') + PAGE_ID;
            if (!_activeTabViewType) {
                setActiveTabViewType(_defaultTab);
            }
        }
        _menuOptions = null;
        _menuOptions = [];

        menuKeys = Object.keys(menu);
        for (i = 0, len = menuKeys.length; i < len; i++) {
            key = menuKeys[i];
            value = null;
            value = menu[key];
            if (['~','@','#'].indexOf(key[0]) < 0) {
                pageId = key.replace(/\s/g,'_') + PAGE_ID;
                _menuOptions.push({key:key, pageId:pageId, imgSrc:value['img']});
                if (!_activeTabViewType) {
                    setActiveTabViewType(pageId);
                    _defaultTab = pageId;
                }

                if (_mainTabPanel.find('div#' + pageId).length === 0) {
                    if (tabHeight === undefined) {
                        tabHeight = _openTabsPanel.outerHeight();
                    }
                    iframeHtml = value['html'];
                    if (!iframeHtml.startsWith('http:') && !iframeHtml.startsWith('https:')) {
                        iframeHtml += '?appId=' + JSON.stringify(appId).replace(/\"/g, '&quot;');
                    }

                    html += '<div class="tab-pane" id="' + pageId + '" '
                        + 'style="overflow:hidden;height:calc(100% - ' + tabHeight + 'px);">';
                    html += '<iframe id="iframe_' + pageId + '" class="panel-frame" src="' + iframeHtml + '">';
                    html += '</iframe></div>';
                }
            }
        }

        if (html.length > 0) {
            _mainTabPanel.append(html);
        }
    }

    function getCubeMap() {
        return _cubeList;
    }

    function buildAppState() {
        return {
            call: call,
            clearError: clearError,
            displayMap: displayMap,
            doesCubeExist: doesCubeExist,
            ensureModifiable: ensureModifiable,
            exec: exec,
            getAppId: getAppId,
            getSelectedTabAppId: getSelectedTabAppId,
            getInfoDto: getInfoDto,
            getCubeMap: getCubeMap,
            getProperCubeName: getProperCubeName,
            getSelectedCubeName: getSelectedCubeName,
            getSelectedApp: getSelectedApp,
            getSelectedVersion: getSelectedVersion,
            getSelectedStatus: getSelectedStatus,
            getSelectedBranch: getSelectedBranch,
            getSelectedCubeInfoKey: getSelectedCubeInfoKey,
            isHeadSelected: isHeadSelected,
            loadCube: loadCube,
            reloadCube: reloadCube,
            selectBranch: selectBranch,
            selectCubeByName: selectCubeByName,
            showNote: showNote,
            loadNCubes: loadNCubes,
            loadNCubeListView: loadNCubeListView,
            saveViewPosition: saveViewPosition,
            getViewPosition: getViewPosition,
            getNumFrozenCols: getNumFrozenCols,
            saveNumFrozenCols: saveNumFrozenCols,
            getSearchQuery: getSearchQuery,
            saveSearchQuery: saveSearchQuery,
            getFilterOutBlankRows: getFilterOutBlankRows,
            saveFilterOutBlankRows: saveFilterOutBlankRows,
            checkPermissions: checkPermissions
        };
    }

    function reloadCube()
    {
        var doc = document.documentElement;
        var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
        var top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
        loadCube();
        window.scrollTo(left, top);
    }

    function clearSearch()
    {
        _searchNames.val('');
        _searchContent.val('');
        loadNCubeListView();
        setListSelectedStatus(_selectedCubeName, '#ncube-list');
        _searchNames.val('');
        _searchContent.val('');
        _cubeCount[0].textContent = Object.keys(_cubeList).length;
    }

    function selectCubeByName(cubeName, differentAppId)
    {
        if (!cubeName) {
            return;
        }
        var cubeInfo;
        if (differentAppId) {
            _selectedCubeName = cubeName;
            cubeInfo = [differentAppId.app, differentAppId.version, differentAppId.status, differentAppId.branch, cubeName];
        } else {
            _selectedCubeName = getProperCubeName(cubeName);
            cubeInfo = [_selectedApp, _selectedVersion, _selectedStatus, _selectedBranch, _selectedCubeName];
        }

        localStorage[SELECTED_CUBE] = cubeName;
        var cis = getCubeInfoKey(cubeInfo);
        var found = false;
        for (var i = 0, len = _openCubes.length; i < len; i++) {
            var oci = _openCubes[i].cubeKey;
            var idx = oci.lastIndexOf(TAB_SEPARATOR);
            var tab = oci.substring(idx + TAB_SEPARATOR.length);
            oci = oci.substring(0, idx);

            if (oci === cis) {
                cubeInfo.push(tab);

                if (i < calcMaxTabs()) {
                    selectTab(cubeInfo);
                } else {
                    makeCubeInfoActive(cubeInfo);
                    buildTabs();
                    return;
                }
                found = true;
                break;
            }
        }
        if (!found) {
            setActiveTabViewType(_defaultTab);
            cubeInfo.push(getActiveTabViewType());
            addCurrentCubeTab(null, cubeInfo);
        }
        saveState();
    }

    function runSearch()
    {
        var nameFilter, list, pattern, regex;
        if (!_searchContent.val() || _searchContent.val() === '')
        {   // Perform filter client-side only (no server call)
            var mainList = _cubeList;
            if (_searchNames.val() && _searchNames.val() !== '')
            {   // If there is content to filter by, then use it.
                nameFilter = _searchNames.val();
                list = [];
                pattern = wildcardToRegexString(nameFilter);
                regex = new RegExp(pattern, "i");

                $.each(_cubeList, function (key, info)
                {
                    var array = regex.exec(key);
                    if (array)
                    {
                        info.pos = array.index;
                        info.endPos = array.index + array[0].length;
                        list.push(info);
                    }
                });

                list.sort(function (a, b) {
                    if (a.pos < b.pos) {
                        return -1;
                    }
                    if (a.pos > b.pos) {
                        return 1;
                    }
                    return a.name.localeCompare(b.name);
                });

                mainList = null;
                mainList = {};
                for (var i = 0; i < list.length; i++)
                {
                    var info = list[i];
                    mainList[info.name.toLowerCase()] = info;
                }
            }
            loadFilteredNCubeListView(mainList);
        }
        else
        {   // Do server side search as content was specified
            if (_searchNames.val() && _searchNames.val() !== '') {
                nameFilter = _searchNames.val();
                pattern = wildcardToRegexString(nameFilter);
                regex = new RegExp(pattern, 'i');
            }
            _searchThread.postMessage(
                [
                    _searchNames.val(),
                    _searchContent.val(),
                    {
                        "app": _selectedApp,
                        "version": _selectedVersion,
                        "status": _selectedStatus,
                        "branch": _selectedBranch
                    },
                    regex
                ]);
        }
    }

    function setCubeListLoading()
    {
        _listOfCubes.empty();
        var anchor = $('<a/>');
        anchor[0].textContent = 'Loading n-cubes...';
        _listOfCubes.append(anchor);
    }

    // Clear versions (add single 'Loading versions...' entry)
    function setVersionListLoading()
    {
        _versionMenu.parent().find('.dropdown-menu').empty();
        _versionMenu[0].innerHTML = 'Version: Loading...';
    }

    function addListeners()
    {
        _openTabsPanel.on('drop dragdrop', function(e) {
            $('.tooltip').hide();
            _tabDragIndicator.hide();
            var posX = e.originalEvent.x - $('#center').offset().left;
            var oldTabIdx = getOpenCubeIndex(_draggingTabCubeInfo);
            var newTabIdx = Math.floor(posX / TAB_WIDTH);
            if (newTabIdx !== oldTabIdx) {
                _openCubes.splice(newTabIdx, 0, _openCubes.splice(oldTabIdx, 1)[0]);
                saveOpenCubeList();
                buildTabs();
            }
        });
        _openTabsPanel.on('dragenter dragover', function(e) {
            e.preventDefault();
            var offsetLeft = $('#center').offset().left;
            var posX = e.originalEvent.x - offsetLeft;
            var left = Math.floor(posX / TAB_WIDTH) * TAB_WIDTH + offsetLeft;
            var top = _openTabsPanel.outerHeight() - _tabDragIndicator.height() + _openTabsPanel.offset().top;
            _tabDragIndicator.css({left:left, top:top});
            _tabDragIndicator.show()
        });

        // 'Close' for the Diff Modal
        $('#diffModalClose').on('click', function() {
            diffShow(false);
        });

        $('#diffDesc').click(function() {
            diffLoad(DIFF_DESCRIPTIVE)
        });
        $('#diffVisual').click(function() {
            diffLoad(DIFF_VISUAL)
        });
        $('#diffSide').click(function() {
            diffLoad(DIFF_SIDE_BY_SIDE)
        });
        $('#diffInline').click(function() {
            diffLoad(DIFF_INLINE)
        });

        // Send to background Web Worker thread
        _searchNames.on('input', function (event)
        {
            _searchKeyPressed = true;
            _searchLastKeyTime = Date.now();
        });
        _searchContent.on('input', function (event)
        {
            _searchKeyPressed = true;
            _searchLastKeyTime = Date.now();
        });

        _searchNames.keyup(function (e)
        {
            if (e.keyCode === KEY_CODES.ESCAPE)
            {   // ESCape key
                clearSearch();
            }
        });

        _searchContent.keyup(function (e)
        {
            if (e.keyCode === KEY_CODES.ESCAPE)
            {   // ESCape key
                clearSearch();
            }
        });

        // Set up back button support (base a page on a app, version, status, branch, and cube name)
        $(window).on("popstate", function(e)
        {
            var state = e.originalEvent.state;

            if (state)
            {
                _selectedCubeName = state.cube;
                if (_selectedApp === state.app &&
                    _selectedVersion === state.version &&
                    _selectedStatus === state.status &&
                    _selectedBranch === state.branch)
                {   // Make Back button WAY faster when only cube name changes - no need to reload other lists.
                    selectCubeByName(_selectedCubeName);
                }
                else
                {
                    saveSelectedApp(state.app);
                    saveSelectedVersion(state.version);
                    saveSelectedStatus(state.status);
                    saveSelectedBranch(state.branch);
                    _selectedCubeName = state.cube;
                    loadAppListView();
                    loadVersionListView();
                    showActiveBranch();
                    loadNCubes();
                    selectCubeByName(_selectedCubeName);
                    buildMenu();
                }
            }
        });

        $('#cube-search-reset').click(function()
        {
            clearSearch();
        });
        $('#newCubeMenu').click(function ()
        {
            newCube();
        });
        $('#newCubeSave').click(function ()
        {
            newCubeSave();
        });
        $('#dupeCubeCopy').click(function ()
        {
            dupeCubeCopy();
        });
        $('#deleteCubeMenu').click(function ()
        {
            deleteCube();
        });
        $('#deleteCubeOk').click(function ()
        {
            deleteCubeOk();
        });
        $('#restoreCubeMenu').click(function ()
        {
            restoreCube();
        });
        $('#restoreCubeOk').click(function ()
        {
            restoreCubeOk();
        });
        $('#revisionHistoryOk').click(function ()
        {
            revisionHistoryOk();
        });
        $('#showRefsFromClose').click(function ()
        {
            showRefsFromCubeClose();
        });
        $('#showReqScopeClose').click(function ()
        {
            showReqScopeClose();
        });
        _releaseCubesOk.click(function () {
            releaseCubesOk();
        });
        $('#changeVerOk').on('click', function () {
            setTimeout(changeVersionOk, PROGRESS_DELAY);
        });
        $('#createSnapshotOk').on('click', function() {
            createSnapshotFromReleaseOk();
        });
        $('#clearStorage').click(function()
        {
            clearStorage();
        });
        _clearCache.click(function()
        {
            clearCache();
        });
        $('#serverStats').click(function()
        {
            serverStats();
        });
        $('#httpHeaders').click(function()
        {
            httpHeaders();
        });
        $('#compareRevs').click(function()
        {
            compareRevisions();
        });
        $('#promoteRev').click(function() {
            promoteRevision();
        });
        $('#clearRevSelection').click(function()
        {
            clearRevSelection();
        });
        $('#batchUpdateAxisReferencesMenu').click(function() {
            batchUpdateAxisReferencesOpen();
        });
        $('#batchUpdateAxisReferencesUpdate').click(function() {
            batchUpdateAxisReferencesUpdate();
        });
        _batchUpdateAxisReferencesToggle.change(function() {
            buildBatchUpdateAxisReferencesTable();
        });
        _batchUpdateAxisReferencesApp.change(function() {
            batchUpdateAxisReferencesAppChanged();
        });
        _batchUpdateAxisReferencesVersion.change(function() {
            batchUpdateAxisReferencesVersionChanged();
        });
        _batchUpdateAxisReferencesCubeName.change(function() {
            batchUpdateAxisReferencesCubeNameChanged();
        });

        $('#releaseCubesVersionMajor').click(function(e) {
            e.preventDefault();
            _releaseCubesVersion.val(getNextVersion(VERSION.MAJOR));
        });
        $('#releaseCubesVersionMinor').click(function(e) {
            e.preventDefault();
            _releaseCubesVersion.val(getNextVersion(VERSION.MINOR));
        });
        $('#releaseCubesVersionPatch').click(function(e) {
            e.preventDefault();
            _releaseCubesVersion.val(getNextVersion(VERSION.PATCH));
        });
        $('#createSnapshotVersionMajor').click(function(e) {
            e.preventDefault();
            _createSnapshotVersion.val(getNextVersion(VERSION.MAJOR));
        });
        $('#createSnapshotVersionMinor').click(function(e) {
            e.preventDefault();
            _createSnapshotVersion.val(getNextVersion(VERSION.MINOR));
        });
        $('#createSnapshotVersionPatch').click(function(e) {
            e.preventDefault();
            _createSnapshotVersion.val(getNextVersion(VERSION.PATCH));
        });
        $('#btnClearBranchQuickSelect').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            clearVisitedBranchesList(_selectedApp);
            buildBranchQuickSelectMenu(_selectedApp);
        });

        addBranchListeners();
        addSelectAllNoneListeners();
    }

    function getNextVersion(partChanged) {
        var version = _selectedVersion.split('.');
        version[partChanged] = parseInt(version[partChanged]) + 1;
        for (var i = partChanged + 1, len = version.length; i < len; i++) {
            version[i] = 0;
        }
        return version.join('.')
    }

    function batchUpdateAxisReferencesAppChanged() {
        _batchUpdateAxisReferencesCubeName.empty();
        _batchUpdateAxisReferencesAxisName.empty();
        var params = [_batchUpdateAxisReferencesApp.val(), STATUS.RELEASE];
        populateSelect(buildAppState(), _batchUpdateAxisReferencesVersion, CONTROLLER_METHOD.GET_APP_VERSIONS, params, null, true);
    }

    function batchUpdateAxisReferencesVersionChanged() {
        _batchUpdateAxisReferencesAxisName.empty();
        var params = [appIdFrom(_batchUpdateAxisReferencesApp.val(), _batchUpdateAxisReferencesVersion.val(), STATUS.RELEASE, head), '*', null, true];
        populateSelect(buildAppState(), _batchUpdateAxisReferencesCubeName, CONTROLLER_METHOD.SEARCH, params, null, true);
    }

    function batchUpdateAxisReferencesCubeNameChanged() {
        var params = [appIdFrom(_batchUpdateAxisReferencesApp.val(), _batchUpdateAxisReferencesVersion.val(), STATUS.RELEASE, head), _batchUpdateAxisReferencesCubeName.val(), {mode:'json'}];
        populateSelectFromCube(buildAppState(), _batchUpdateAxisReferencesAxisName, params, POPULATE_SELECT_FROM_CUBE.AXIS);
    }

    function batchUpdateAxisReferencesOpen() {
        _batchUpdateAxisReferencesData = [];
        $('#batchUpdateAxisReferencesInstTitle')[0].innerHTML = 'Instructions - Batch Update Axis References';
        $('#batchUpdateAxisReferencesInstructions')[0].innerHTML = 'Update the reference axis properties of the checked axes. Updating will only update the rows you have selected. You can toggle between destination and transformation properties';

        populateSelect(buildAppState(), _batchUpdateAxisReferencesApp, CONTROLLER_METHOD.GET_APP_NAMES, [], null, true);

        showNote('Finding all reference axes, please wait...');
        setTimeout(function() {
            var result = call('ncubeController.getReferenceAxes', [getAppId()]);
            clearError();
            if (!result.status) {
                showNote('Unable to load reference axes:<hr class="hr-small"/>' + result.data);
                return;
            }

            _batchUpdateAxisReferencesData = result.data;
            buildBatchUpdateAxisReferencesTable();
            $('#batchUpdateAxisReferencesModal').modal();
        },1);
    }

    function findBatchUpdateAxisReferencesRows() {
        return _batchUpdateAxisReferencesTable.find('.batch-update-axis-references-entry');
    }

    function isBatchUpdateAxisReferencesDestinationToggled() {
        return _batchUpdateAxisReferencesToggle.prop('checked');
    }

    function buildBatchUpdateAxisReferencesTable() {
        findBatchUpdateAxisReferencesRows().remove();
        var isDest = isBatchUpdateAxisReferencesDestinationToggled();
        $('#batchUpdateAxisReferencesSectionHeader')[0].innerHTML = isDest ? 'Destination Axis' : 'Transform Axis';

        for (var i = 0, len = _batchUpdateAxisReferencesData.length; i < len; i++) {
            var refAxData = _batchUpdateAxisReferencesData[i];
            var tr = $('<tr/>').prop('class','batch-update-axis-references-entry');
            var selectCheckbox = $('<input/>').prop({type:'checkbox', class:'isSelected'});
            var app, version, cube, axis;
            if (isDest) {
                app = refAxData.destApp;
                version = refAxData.destVersion;
                cube = refAxData.destCubeName;
                axis = refAxData.destAxisName;
            } else {
                app = refAxData.transformApp;
                version = refAxData.transformVersion;
                cube = refAxData.transformCubeName;
                axis = refAxData.transformAxisName;
            }

            _batchUpdateAxisReferencesTable.append(tr);
            tr.append($('<td/>').append(selectCheckbox));
            tr.append($('<td/>').html(refAxData.srcCubeName));
            tr.append($('<td/>').html(refAxData.srcAxisName));
            tr.append($('<td/>').html(app).prop('class','app'));
            tr.append($('<td/>').html(version).prop('class','version'));
            tr.append($('<td/>').html(cube).prop('class','cubeName'));
            tr.append($('<td/>').html(axis).prop('class','axisName'));
        }
    }

    function batchUpdateAxisReferencesUpdate() {
        var refAxes = [];
        var allRows = findBatchUpdateAxisReferencesRows();
        var checked = allRows.has('input:checked');
        var newAppVal = _batchUpdateAxisReferencesApp.val();
        var newVersionVal = _batchUpdateAxisReferencesVersion.val();
        var newCubeNameVal = _batchUpdateAxisReferencesCubeName.val();
        var newAxisNameVal = _batchUpdateAxisReferencesAxisName.val();
        var propPrefix = isBatchUpdateAxisReferencesDestinationToggled() ? 'dest' : 'transform';
        var appProp = propPrefix + 'App';
        var versionProp = propPrefix + 'Version';
        var cubeNameProp = propPrefix + 'CubeName';
        var axisNameProp = propPrefix + 'AxisName';

        for (var checkedIdx = 0, checkedLen = checked.length; checkedIdx < checkedLen; checkedIdx++) {
            var refAxIdx = allRows.index(checked[checkedIdx]);
            var refAx = _batchUpdateAxisReferencesData[refAxIdx];
            if (newAppVal !== '') {
                refAx[appProp] = newAppVal;
                if (newVersionVal !== '') {
                    refAx[versionProp] = newVersionVal;
                    if (newCubeNameVal !== '') {
                        refAx[cubeNameProp] = newCubeNameVal;
                        if (newAxisNameVal !== '') {
                            refAx[axisNameProp] = newAxisNameVal;
                        }
                    }
                }
            }
            refAxes.push(refAx);
        }
        var result = call('ncubeController.updateReferenceAxes', [refAxes]);
        if (!result.status) {
            showNote('Unable to update reference axes:<hr class="hr-small"/>' + result.data);
            return;
        }
        var axisGrammar = checkedLen === 1 ? 'axis' : 'axes';
        showNote(checkedLen + ' ' + axisGrammar + ' updated', '', 3000);
        for (checkedIdx = 0; checkedIdx < checkedLen; checkedIdx++) {
            var row = $(checked[checkedIdx]);
            if (newAppVal !== '') {
                row.find('td.app')[0].innerHTML = newAppVal;
                if (newVersionVal !== '') {
                    row.find('td.version')[0].innerHTML = newVersionVal;
                    if (newCubeNameVal !== '') {
                        row.find('td.cubeName')[0].innerHTML = newCubeNameVal;
                        if (newAxisNameVal !== '') {
                            row.find('td.axisName')[0].innerHTML = newAxisNameVal;
                        }
                    }
                }
            }
        }
        selectNone();
    }

    function checkPermissions(appId, resource, action) {
        var result = call(CONTROLLER + CONTROLLER_METHOD.CHECK_PERMISSIONS, [appId, resource, action]);
        if (result.status) {
            return ensureModifiable() && result.data;
        }
        showNote('Unable to check permissions:<hr class="hr-small"/>' + result.data);
        return false;
    }

    function checkAppPermission(action) {
        var result = call(CONTROLLER + CONTROLLER_METHOD.CHECK_PERMISSIONS, [getAppId(), null, action]);
        if (result.status) {
            return result.data;
        }
        showNote('Unable to check app permissions:<hr class="hr-small"/>' + result.data);
    }

    function checkIsAppAdmin() {
        var result = call(CONTROLLER + CONTROLLER_METHOD.IS_APP_ADMIN, [getAppId()]);
        if (result.status) {
            return result.data;
        }
        showNote('Unable to check for admin permissions:<hr class="hr-small"/>' + result.data);
    }

    function enableDisableReleaseMenu(canReleaseApp) {
        _releaseCubesMenu.off('click');
        _changeVersionMenu.off('click');
        _createSnapshotMenu.off('click');

        if (canReleaseApp) {
            _releaseCubesMenu.on('click', releaseCubes);
            _changeVersionMenu.on('click', changeVersion);
            _createSnapshotMenu.on('click', createSnapshotFromRelease);
            _releaseCubesMenu.parent().removeClass('disabled');
            _changeVersionMenu.parent().removeClass('disabled');
            _createSnapshotMenu.parent().removeClass('disabled');
        } else {
            _releaseCubesMenu.parent().addClass('disabled');
            _changeVersionMenu.parent().addClass('disabled');
            _createSnapshotMenu.parent().addClass('disabled');
        }
    }

    function enableDisableCommitBranch(canCommitOnApp) {
        if (canCommitOnApp) {
            _branchCommit.show();
        } else {
            _branchCommit.hide();
        }
    }
    
    function enableDisableClearCache(isAppAdmin) {
        if (isAppAdmin) {
            _clearCache.parent().removeClass('disabled');
        } else {
            _clearCache.parent().addClass('disabled');
        }
    }

    function enableDisableLockMenu(isAppAdmin) {
        var result = call(CONTROLLER + CONTROLLER_METHOD.IS_APP_LOCKED, [getAppId()]);
        var isLocked;
        if (result.status) {
            isLocked = result.data;
            setLockUnlockMenuText(isLocked);
            setGetAppLockedByMenuText(isLocked);
        } else {
            showNote('Unable to check lock for app \'' + _selectedApp + '\':<hr class="hr-small"/>' + result.data);
        }

        _lockUnlockAppMenu.off('click');
        if (isAppAdmin) {
            _lockUnlockAppMenu.on('click', lockUnlockApp);
            _lockUnlockAppMenu.parent().removeClass('disabled');
        } else {
            _lockUnlockAppMenu.parent().addClass('disabled');
        }
    }

    function handleAppPermissions() {
        var isAppAdmin = checkIsAppAdmin();
        var canReleaseApp = checkAppPermission(PERMISSION_ACTION.RELEASE);
        var canCommitOnApp = checkAppPermission(PERMISSION_ACTION.COMMIT);

        enableDisableReleaseMenu(canReleaseApp);
        enableDisableCommitBranch(canCommitOnApp);
        enableDisableClearCache(isAppAdmin);
        enableDisableLockMenu(isAppAdmin);
    }
    
    function buildBranchUpdateMenu() {
        var li = _branchCompareUpdateMenu.parent();
        getBranchNames();
        li.find('ul').remove();
        li.append(createBranchesUl(compareUpdateBranch));
    }

    function loadAppListView()
    {
        var ul = _appMenu.parent().find('.dropdown-menu');
        ul.empty();
        handleAppPermissions();
        buildBranchUpdateMenu();
        buildBranchQuickSelectMenu(_selectedApp);

        $.each(loadAppNames(), function (index, value)
        {            var li = $('<li/>');
            var an = $('<a/>');
            an.attr('href','#');
            an[0].innerHTML = value;
            an.click(function() {
                saveSelectedApp(value);
                _appMenu.find('button')[0].innerHTML = value + '&nbsp;<b class="caret"></b>';

                handleAppPermissions();

                setVersionListLoading();
                setCubeListLoading();

                setTimeout(function()
                {   // Allow selection widget to update before loading content
                    loadAppListView();
                    loadVersionListView();
                    showActiveBranch();
                    loadNCubes();
                    runSearch();
                    buildMenu();
                    buildBranchUpdateMenu();
                    buildBranchQuickSelectMenu(value);
                }, PROGRESS_DELAY);
            });

            ul.append(li);
            li.append(an);
        });

        if (_selectedApp)
        {
            _appMenu[0].innerHTML = '<button class="btn-sm btn-primary">' + _selectedApp + '&nbsp;<b class="caret"></b></button>';
        }
    }

    function buildBranchQuickSelectMenu(app) {
        var ul = _branchQuickSelectHeader.parent();
        var idx = ul.find('li').index(_branchQuickSelectHeader);
        ul.find('li:gt(' + idx + ')').remove();

        var list = getVisitedBranchesList(app);
        for (var i = 0, len = list.length; i < len; i++) {
            (function() {
                var branchName = list[i];
                var li = $('<li/>');
                var an = $('<a/>');
                an.attr('href', '#');
                an[0].innerHTML = branchName;
                an.click(function () {
                    changeBranch(branchName);
                });
                ul.append(li);
                li.append(an);
            })();
        }
    }

    function addToVisitedBranchesList(app, branch) {
        if (branch === head) {
            return;
        }
        var list = getVisitedBranchesList(app);
        var oldIdx = list.indexOf(branch);
        if (oldIdx > -1) {
            list.splice(oldIdx, 1);
        }
        list.splice(1, 0, branch);
        _visitedBranches[app] = list.join(TAB_SEPARATOR);
        saveVisitedBranchesList();
    }

    function removeFromVisitedBranchesList(app, branch) {
        var list = getVisitedBranchesList(app);
        var oldIdx = list.indexOf(branch);
        if (oldIdx > -1) {
            list.splice(oldIdx, 1);
        }
        _visitedBranches[app] = list.join(TAB_SEPARATOR);
        saveVisitedBranchesList();
    }

    function clearVisitedBranchesList(app) {
        delete _visitedBranches[app];
        saveVisitedBranchesList();
    }

    function saveVisitedBranchesList() {
        localStorage[VISITED_BRANCHES] = JSON.stringify(_visitedBranches);
    }

    function getVisitedBranchesList(app) {
        if (_visitedBranches.hasOwnProperty(app)) {
            return _visitedBranches[app].split(TAB_SEPARATOR);
        }
        return [head];
    }

    function saveState()
    {
        var title = (_selectedApp ? _selectedApp : '') + ' - ' + (_selectedVersion ? _selectedVersion : '') + ' - ' + (_selectedStatus ? _selectedStatus : '') + ' - ' + (_selectedBranch ? _selectedBranch : '') + ' - ' + (_selectedCubeName ? _selectedCubeName : '');
        document.title = title;
        var state = history.state;
        if (state && state.app == _selectedApp &&
            state.version == _selectedVersion &&
            state.status == _selectedStatus &&
            state.branch == _selectedBranch &&
            state.cube == _selectedCubeName)
        {   // Don't save redundant selection
            return;
        }
        history.pushState({app: _selectedApp,
            version: _selectedVersion,
            status: _selectedStatus,
            branch: _selectedBranch,
            cube: _selectedCubeName}, title);
    }

    function loadVersionListView() {
        var versions, i, len, ul, html;
        html = '';
        versions = loadVersions();
        for (i = 0, len = versions.length; i < len; i++) {
            html += '<li><a href="#">' + versions[i] + '</a></li>';
        }

        ul = _versionMenu.parent().find('.dropdown-menu');
        ul.empty();
        ul.append(html);
        ul.find('a').on('click', onVersionClick);

        if (_selectedVersion) {
            _versionMenu[0].innerHTML = '<button class="btn-sm btn-primary">' + _selectedVersion + '-' + _selectedStatus + '&nbsp;<b class="caret"></b></button>';
        }
    }
    
    function onVersionClick(e) {
        var arr, version, status, value;
        value = e.target.textContent;
        arr = value.split('-');
        version = arr[0];
        status = arr[1];
        saveSelectedVersion(version);
        saveSelectedStatus(status);
        _versionMenu.find('button')[0].innerHTML = value + '&nbsp;<b class="caret"></b>';

        setCubeListLoading();

        setTimeout(function() {
            // Allow bootstrap-selection widget to update before loading content
            showActiveBranch();
            loadNCubes();
            runSearch();
            buildMenu();
        }, PROGRESS_DELAY);
    }

    function getActiveTab()
    {
        return _mainTabPanel.find('div.active iframe');
    }

    function loadNCubeListView() {
        loadFilteredNCubeListView(_cubeList);
    }

    function loadFilteredNCubeListView(cubes) {
        var cubeIdx, cubeLen, cubeKeys, loName;
        var filter = _searchNames.val();
        var isNotHead = !isHeadSelected();
        var listItemHtml = '';
        _listOfCubes.empty();

        cubeKeys = Object.keys(cubes);
        for (cubeIdx = 0, cubeLen = cubeKeys.length; cubeIdx < cubeLen; cubeIdx++) {
            loName = cubeKeys[cubeIdx];
            listItemHtml += buildCubeListItem(loName, cubes[loName], filter, isNotHead);
        }

        _listOfCubes.append(listItemHtml);
        _listOfCubes.find('a').on('click', function() {
            selectCubeByName(this.getAttribute('itemName'));
        });

        if (keyCount(cubes) < 1)
        {   // Special case: 0 cubes
            var activeTab = getActiveTab();
            if (activeTab && activeTab[0])
            {   // Indicate to the active iFrame that a cube selection event has occurred.
                activeTab[0].contentWindow.cubeSelected();
            }
        }
        _cubeCount[0].textContent = cubeIdx;
    }

    function buildCubeListItem(loName, infoDto, filter, isNotHead) {
        var cubeName = infoDto.name;
        var classes = [];
        var innerHtml;

        if (filter && infoDto.pos !== null && infoDto.pos !== undefined && infoDto.endPos !== null && infoDto.endPos !== undefined) {
            innerHtml = cubeName.substring(0, infoDto.pos);
            innerHtml += '<span class="search-hilite">';
            innerHtml += cubeName.substring(infoDto.pos, infoDto.endPos);
            innerHtml += '</span>';
            innerHtml += cubeName.substring(infoDto.endPos);
        } else {
            innerHtml = cubeName;
        }

        if (_selectedCubeName === cubeName) {
            classes.push('ncube-selected');
        } else {
            classes.push('ncube-notselected');
        }

        if (isNotHead) {
            if (!infoDto.headSha1) {
                classes.push('cube-added');
            } else if (infoDto.headSha1 !== infoDto.sha1) {
                classes.push('cube-modified');
            }
        }

        return '<li><a href="#" itemName="' + loName + '" class="' + classes.join(' ') + '">' + innerHtml + '</a></li>';
    }

    function getProperCubeName(cubeName)
    {
        var nameToChk = (cubeName + '').toLowerCase();
        var info = _cubeList[nameToChk];
        return info ? info.name : getInfoDto() ? getInfoDto().name : null;
    }

    function loadCube()
    {
        saveState();
        try
        {
            var activeTab = getActiveTab();
            if (activeTab && activeTab[0])
            {   // Indicate to the active iFrame that a cube selection event has occurred.
                activeTab[0].contentWindow.cubeSelected();
            }
        }
        catch (e)
        {
            console.log(e);
        }
    }

    /**
     * Tweak the class name of the selected / non-selected items
     * to match what was selected.
     */
    function setListSelectedStatus(itemName, listId)
    {
        var items = $(listId).find('li a');
        items.filter('.ncube-selected').removeClass('ncube-selected').addClass('ncube-notselected');
        if (itemName === null || itemName === undefined) {
            return;
        }

        var saveSelected = null;
        var loItemName = itemName.toLowerCase();

        items.filter(function() {
            var anchor = $(this);
            var text = anchor[0].textContent;
            var elemName = anchor.attr('itemName');
            if (loItemName === elemName || itemName === text) {
                anchor.scrollintoview();
                return true;
            }
            return false;
        }).removeClass('ncube-notselected').addClass('ncube-selected');
    }

    /**
     * Load NCube List from Database
     */
    function loadNCubes()
    {
        _cubeList = {};
        if (!_selectedApp)
        {
            return;
        }
        if (!_selectedVersion)
        {
            return;
        }
        if (!_selectedStatus)
        {
            return;
        }
        var result = call("ncubeController.search", [getAppId(), '*', null, true]);
        var first = null;
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var name = value.name;
                _cubeList[name.toLowerCase()] = value;
                if (!first)
                {
                    first = name;
                }
            });
        }
        else
        {
            showNote('Unable to load n-cubes:<hr class="hr-small"/>' + result.data);
        }
    }

    function doesCubeExist()
    {
        var nameToChk = (_selectedCubeName + '').toLowerCase();
        return nameToChk in _cubeList;
    }

    function loadVersions() {
        var result, arr, versions;
        clearError();
        if (!_selectedApp) {
            showNote('Unable to load versions, no n-cube App selected.');
            return;
        }
        result = call(CONTROLLER + CONTROLLER_METHOD.GET_VERSIONS, [_selectedApp]);
        if (result.status) {
            versions = result.data;
        } else {
            showNote('Unable to load versions:<hr class="hr-small"/>' + result.data);
            return;
        }
        
        if (!_selectedVersion || !doesVersionExist(versions, _selectedVersion, _selectedStatus)) {
            if (versions.length > 0) {
                arr = versions[0].split('-');
            }
            saveSelectedVersion(arr ? arr[0] : null);
            saveSelectedStatus(arr ? arr[1] : null);
        }
        
        return versions;
    }

    function doesVersionExist(versions, selVer, selStatus) {
        var i, len;
        var chkVer = selVer + '-' + selStatus;
        for (i = 0, len = versions.length; i < len; i++) {
            if (versions[i] === chkVer) {
                return true;
            }
        }
        return false;
    }

    function loadAppNames() {
        var result;
        var apps = [];
        clearError();
        result = call(CONTROLLER + CONTROLLER_METHOD.GET_APP_NAMES, [_selectedStatus, _selectedBranch]);
        if (result.status) {
            apps = result.data;
        } else {
            showNote('Unable to load n-cube Apps:<hr class="hr-small"/>' + result.data);
        }
        
        if (apps.length > 0 && (!_selectedApp || apps.indexOf(_selectedApp) === -1)) {
            saveSelectedApp(apps[0]);
        }
        return apps;
    }

    function newCube()
    {
        if (isHeadSelected())
        {
            selectBranch();
            return false;
        }

        clearError();
        $('#newCubeAppName').val(_selectedApp);
        $('#newCubeStatus').val('SNAPSHOT');
        $('#newCubeVersion').val(_selectedVersion);
        $('#newCubeName').val('');
        buildDropDown('#newCubeAppList', '#newCubeAppName', loadAppNames(), function (app)
        {
            buildVersionsDropdown('#existVersionList', '#newCubeVersion');
        });
        buildVersionsDropdown('#existVersionList', '#newCubeVersion');
        $('#newCubeModal').modal();
    }

    function buildVersionsDropdown(listId, inputId) {
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_APP_VERSIONS, [_selectedApp]);
        if (result.status) {
            buildDropDown(listId, inputId, result.data, function(){});
        } else {
            showNote('Failed to load App versions:<hr class="hr-small"/>' + result.data);
        }
    }

    function newCubeSave()
    {
        $('#newCubeModal').modal('hide');
        var appName = $('#newCubeAppName').val();
        var cubeName = $('#newCubeName').val();
        var version = $('#newCubeVersion').val();
        if (!version)
        {
            showNote("Note", "Version must be x.y.z");
            return;
        }
        var appId = getAppId();
        appId.version = version;
        appId.app = appName;
        var result = call("ncubeController.createCube", [appId, cubeName]);
        if (result.status)
        {
            saveSelectedApp(appName);
            saveSelectedVersion(appId.version);
            loadAppListView();
            loadVersionListView();
            loadNCubes();
            clearSearch();
            selectCubeByName(cubeName);
        }
        else
        {
            showNote("Unable to create n-cube '" + cubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function deleteCube()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedStatus) {
            showNote('Need to have an application, version, and status selected first.');
            return;
        }
        if (isHeadSelected()) {
            selectBranch();
            return;
        }

        var ul = $('#deleteCubeList');
        ul.empty();
        $('#deleteCubeLabel')[0].textContent = 'Delete Cubes in ' + _selectedVersion + ', ' + _selectedStatus;
        var cubeLinks = _listOfCubes.find('a');
        for (var i = 0, len = cubeLinks.length; i < len; i++) {
            var cubeName = cubeLinks[i].textContent;
            var li = $('<li/>').prop({class: 'list-group-item skinny-lr'});
            var div = $('<div/>').prop({class: 'container-fluid'});
            var checkbox = $('<input>').prop({
                class: 'deleteCheck',
                type: 'checkbox'
            });
            var label = $('<label/>').prop({class: 'checkbox no-margins'});
            label[0].textContent = cubeName;
            ul.append(li);
            li.append(div);
            div.append(label);
            checkbox.prependTo(label); // <=== create input without the closing tag
        }
        $('#deleteCubeModal').modal();
    }

    function deleteCubeOk() {
        $('#deleteCubeModal').modal('hide');

        var input = $('.deleteCheck');
        var cubesToDelete = [];
        $.each(input, function (index, label) {
            if ($(this).is(':checked')) {
                cubesToDelete.push($(this).parent()[0].textContent);
            }
        });

        callDelete(cubesToDelete);
    }

    function callDelete(cubesToDelete) {
        var result = call("ncubeController.deleteCubes", [getAppId(), cubesToDelete]);
        if (result.status === true) {
            var cubeInfo = [];
            cubeInfo[CUBE_INFO.APP] = _selectedApp;
            cubeInfo[CUBE_INFO.VERSION] = _selectedVersion;
            cubeInfo[CUBE_INFO.STATUS] = _selectedStatus;
            cubeInfo[CUBE_INFO.BRANCH] = _selectedBranch;
            for (var i = 0, len = cubesToDelete.length; i < len; i++) {
                var cubeName = cubesToDelete[i];
                delete _cubeList[cubeName.toLowerCase()];
                if (_selectedCubeName === cubeName) {
                    _selectedCubeName = null;
                    _activeTabViewType = null;
                    delete localStorage[SELECTED_CUBE];
                    delete localStorage[ACTIVE_TAB_VIEW_TYPE];
                }

                cubeInfo[CUBE_INFO.NAME] = cubeName;

                var cis = getCubeInfoKey(cubeInfo);
                for (var x = _openCubes.length - 1; x >= 0; x--) {
                    if (_openCubes[x].cubeKey.indexOf(cis) > -1) {
                        _openCubes.splice(x, 1);
                    }
                }
            }
            saveOpenCubeList();
            buildTabs();
            runSearch();
        } else {
            showNote("Unable to delete cubes: " + '<hr class="hr-small"/>' + result.data);
        }
    }

    function callDeleteFromTab(cubeToDelete) {
        var appId = getSelectedTabAppId();
        var result = call("ncubeController.deleteCubes", [appId, [cubeToDelete]]);
        if (result.status === true) {
            var cubeInfo = [];
            cubeInfo[CUBE_INFO.APP] = appId.app;
            cubeInfo[CUBE_INFO.VERSION] = appId.version;
            cubeInfo[CUBE_INFO.STATUS] = appId.status;
            cubeInfo[CUBE_INFO.BRANCH] = appId.branch;
            var cubeName = cubeToDelete;
            if (_selectedCubeName === cubeName) {
                _selectedCubeName = null;
                _activeTabViewType = null;
                delete localStorage[SELECTED_CUBE];
                delete localStorage[ACTIVE_TAB_VIEW_TYPE];
            }
            cubeInfo[CUBE_INFO.NAME] = cubeName;

            var cis = getCubeInfoKey(cubeInfo);
            for (var x = _openCubes.length - 1; x >= 0; x--) {
                if (_openCubes[x].cubeKey.indexOf(cis) > -1) {
                    _openCubes.splice(x, 1);
                }
            }

            if (appIdsEqual(appId, getAppId())) {
                delete _cubeList[cubeName.toLowerCase()];
                runSearch();
            }

            saveOpenCubeList();
            buildTabs();
        } else {
            showNote("Unable to delete cubes: " + '<hr class="hr-small"/>' + result.data);
        }
    }

    function appIdsEqual(id1, id2) {
        return id1.app     === id2.app
            && id1.version === id2.version
            && id1.status  === id2.status
            && id1.branch  === id2.branch;
    }

    function restoreCube()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedStatus)
        {
            showNote('Need to have an application, version, and status selected first.');
            return;
        }
        if (isHeadSelected())
        {
            selectBranch();
            return;
        }

        var ul = $('#deletedCubeList');
        ul.empty();
        $('#restoreCubeLabel')[0].textContent = 'Restore Cubes in ' + _selectedVersion + ', ' + _selectedStatus;
        var result = call("ncubeController.search", [getAppId(), "*", null, false]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var li = $('<li/>').prop({class: 'list-group-item skinny-lr'});
                var div = $('<div/>').prop({class:'container-fluid'});
                var checkbox = $('<input>').prop({class:'restoreCheck', type:'checkbox'});
                var label = $('<label/>').prop({class: 'checkbox no-margins'});
                label[0].textContent = value.name;
                ul.append(li);
                li.append(div);
                div.append(label);
                checkbox.prependTo(label); // <=== create input without the closing tag
            });
            $('#restoreCubeModal').modal();
        }
        else
        {
            showNote('Error fetching deleted cubes (' + _selectedVersion + ', ' + _selectedStatus + '):<hr class="hr-small"/>' + result.data);
        }
    }

    function restoreCubeOk()
    {
        $('#restoreCubeModal').modal('hide');

        var input = $('.restoreCheck');
        var cubesToRestore = [];
        $.each(input, function (index, label)
        {
            if ($(this).is(':checked'))
            {
                cubesToRestore.push($(this).parent()[0].textContent);
            }
        });

        var result = call("ncubeController.restoreCubes", [getAppId(), cubesToRestore]);
        if (result.status === true)
        {
            loadNCubes();
            var cubeName = _selectedCubeName;
            if (cubesToRestore.length == 1)
            {
                cubeName = cubesToRestore[0];
                selectCubeByName(cubeName);
            }
            clearSearch();
        }
        else
        {
            showNote("Unable to restore cubes':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function revisionHistory()
    {
        clearError();
        var appId = getSelectedTabAppId();
        var ul = $('#revisionHistoryList');
        ul.empty();
        $('#revisionHistoryLabel')[0].textContent = 'Revision History for ' + _selectedCubeName;
        $('#revisionHistoryModal').modal();

        var result = call("ncubeController.getRevisionHistory", [appId, _selectedCubeName]);

        if (result.status === true)
        {
            $.each(result.data, function (index, infoDto)
            {
                var li = $("<li/>").attr({'class': 'list-group-item skinny-lr'});
                var div = $('<div/>').prop({class: 'container-fluid'});
                var anchorHtml = $('<a href="#" style="margin:0 10px 0 0"/>');
                var anchorJson = $('<a href="#" style="margin:0 10px 0 0"/>');

                ul.append(li);
                li.append(anchorHtml);
                li.append(anchorJson);
                li.append(div);

                var labelB = $('<label/>').prop({class: 'col-xs-1'});
                div.append(labelB);
                labelB.css('padding', 0);
                labelB.css('margin', 0);
                labelB.css('margin-right', '10px');
                labelB.css('width', '12%');
                labelB.append(anchorHtml);
                labelB.append(anchorJson);

                var kbd1 = $('<kbd/>');
                kbd1[0].textContent = 'HTML';
                anchorHtml.append(kbd1);

                var kbd2 = $('<kbd/>');
                kbd2[0].textContent = 'JSON';
                anchorJson.append(kbd2);
                
                var checkbox = $('<input>').prop({class:'commitCheck', type:'checkbox'});
                checkbox.attr('data-cube-id', infoDto.id);
                checkbox.attr('data-rev-id', infoDto.revision);
                var label = $('<label/>').prop({class: 'checkbox no-margins col-xs-10'});
                div.append(label);
                var text = 'rev: ' + infoDto.revision + '&nbsp;&nbsp;&nbsp;';
                if (infoDto.notes && infoDto.notes != "")
                {
                    text += infoDto.notes;
                }
                else
                {
                    var date = '';
                    if (infoDto.createDate != undefined)
                    {
                        date = new Date(infoDto.createDate).format('yyyy-mm-dd HH:MM:ss');
                    }
                    text += date + '&nbsp;&nbsp;&nbsp;' + infoDto.createHid;
                }
                label[0].innerHTML = text;
                checkbox.prependTo(label);

                anchorHtml.click(function ()
                {
                    var title = infoDto.name + '.rev.' + infoDto.revision;
                    var oldHtml = window.open('', title + '.html');
                    var htmlReq = call("ncubeController.loadCubeById", [appId, infoDto.id, "html"], {noResolveRefs:true});
                    if (htmlReq.status === true)
                    {
                        oldHtml.document.removeChild(oldHtml.document.documentElement);
                        oldHtml.document.write(htmlReq.data);
                        oldHtml.document.title = title + '.html';
                    }
                });
                anchorJson.click(function ()
                {
                    var title = infoDto.name + '.rev.' + infoDto.revision;
                    var oldJson = window.open('', title + '.json');
                    var prettyJsonReq = call("ncubeController.loadCubeById", [appId, infoDto.id, "json-pretty"], {noResolveRefs:true});
                    if (prettyJsonReq.status === true)
                    {
                        oldJson.document.removeChild(oldJson.document.documentElement);
                        oldJson.document.write('<html><pre>');
                        oldJson.document.write(prettyJsonReq.data);
                        oldJson.document.write('</pre></html>');
                        oldJson.document.title = title + '.json';
                    }
                });
            });
        }
        else
        {
            showNote('Error fetching revision history (' + appId.version + ', ' + appId.status + '):<hr class="hr-small"/>' + result.data);
        }
    }

    function getSelectedRevisions() {
        var cubeIds = [];
        var revIds = [];
        $.each($('#revisionHistoryList').find('.commitCheck:checked'), function()
        {
            cubeIds.push($(this).attr('data-cube-id'));
            revIds.push($(this).attr('data-rev-id'))
        });

        return {cubeIds:cubeIds, revIds:revIds};
    }

    function compareRevisions()
    {
        var revs = getSelectedRevisions();
        var revIds = revs.revIds;
        var cubeIds = revs.cubeIds;

        if (revIds.length != 2)
        {
            showNote('Must select exactly 2 for comparison', 'Note', 2500);
            return;
        }

        if (revIds[0] < revIds[1])
        {
            var loIdx = 0;
            var hiIdx = 1;
        }
        else
        {
            var loIdx = 1;
            var hiIdx = 0;
        }
        diffCubeRevs(cubeIds[loIdx], cubeIds[hiIdx], revIds[loIdx], revIds[hiIdx], revIds[loIdx] + ' vs. ' + revIds[hiIdx]);
    }

    function promoteRevision() {
        var revs = getSelectedRevisions();
        var revIds = revs.revIds;

        var note;
        if (revIds.length == 0) {
            note = 'Must select a revision to promote.';
        } else if (revIds.length > 1) {
            note = 'Must select only 1 revision to promote.';
        }
        if (note) {
            showNote(note, 'Note', 2500);
            return;
        }

        var result = call("ncubeController.promoteRevision", [getSelectedTabAppId(), revs.cubeIds[0]]);

        if (result.status === true) {
            loadCube();
            revisionHistoryOk();
        } else {
            showNote("Unable to promote n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function clearRevSelection()
    {
       $.each($('#revisionHistoryList').find('.commitCheck:checked'), function()
        {
            $(this).removeAttr("checked");
        });
    }

    function revisionHistoryOk()
    {
        $('#revisionHistoryModal').modal('hide');
    }

    function renameCube(newName) {
        var result = call("ncubeController.renameCube", [getSelectedTabAppId(), _selectedCubeName, newName]);
        if (result.status === true) {
            var oldCubeInfo = [];
            oldCubeInfo[CUBE_INFO.APP] = _selectedApp;
            oldCubeInfo[CUBE_INFO.VERSION] = _selectedVersion;
            oldCubeInfo[CUBE_INFO.STATUS] = _selectedStatus;
            oldCubeInfo[CUBE_INFO.BRANCH] = _selectedBranch;
            oldCubeInfo[CUBE_INFO.NAME] = _selectedCubeName;
            var oldCis = getCubeInfoKey(oldCubeInfo);

            var newCubeInfo = [];
            newCubeInfo[CUBE_INFO.APP] = _selectedApp;
            newCubeInfo[CUBE_INFO.VERSION] = _selectedVersion;
            newCubeInfo[CUBE_INFO.STATUS] = _selectedStatus;
            newCubeInfo[CUBE_INFO.BRANCH] = _selectedBranch;
            newCubeInfo[CUBE_INFO.NAME] = newName;
            newCubeInfo[CUBE_INFO.TAB_VIEW] = getActiveTabViewType();
            var newCis = getCubeInfoKey(newCubeInfo);

            for (var i = 0, len = _openCubes.length; i < len; i++) {
                var openCube = _openCubes[i];
                if (openCube.cubeKey.indexOf(oldCis) > -1) {
                    openCube.cubeKey = newCis;
                }
            }
            saveOpenCubeList();
            _selectedCubeName = newName;
            localStorage[SELECTED_CUBE] = _selectedCubeName;
            buildTabs(newCubeInfo);
            loadCube();
            if (appIdsEqual(getSelectedTabAppId(), getAppId())) {
                loadNCubes();
                runSearch();
            }
        } else {
            showNote("Unable to rename n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function dupeCube()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            showNote('No n-cube selected. Nothing to duplicate.');
            return;
        }
        if (isSelectedCubeInHead())
        {
            selectBranch();
            return false;
        }

        $('#dupeCubeAppName').val(_selectedApp);
        $('#dupeCubeVersion').val(_selectedVersion);
        $('#dupeCubeName').val(_selectedCubeName);
        $('#dupeCubeLabel')[0].textContent = 'Duplicate: ' + _selectedCubeName + ' ?';
        buildDropDown('#dupeCubeAppList', '#dupeCubeAppName', loadAppNames(), function (app)
        {
            buildVersionsDropdown('#dupeCubeVersionList', '#dupeCubeVersion');
        });
        buildVersionsDropdown('#dupeCubeVersionList', '#dupeCubeVersion');
        $('#dupeCubeModal').modal();
    }

    function dupeCubeCopy()
    {
        $('#dupeCubeModal').modal('hide');
        var newName = $('#dupeCubeName').val();
        var newApp = $('#dupeCubeAppName').val();
        var newVersion = $('#dupeCubeVersion').val();
        var destAppId = {
            'app':newApp,
            'version':newVersion,
            'status':STATUS.SNAPSHOT,
            'branch':_selectedBranch
        };
        var result = call("ncubeController.duplicateCube", [getAppId(), destAppId, _selectedCubeName, newName]);
        if (result.status)
        {
            saveSelectedApp(newApp);
            loadAppListView();
            saveSelectedStatus(STATUS.SNAPSHOT);
            saveSelectedVersion(newVersion);
            loadVersionListView();
            loadNCubes();
            clearSearch();
            selectCubeByName(newName);
        }
        else
        {
            showNote("Unable to duplicate n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function showRefsFromCube()
    {
        clearError();
        $('#showRefsFromLabel')[0].textContent = 'Outbound refs of: ' + _selectedCubeName;
        var ul = $('#refsFromCubeList');
        ul.empty();
        $('#showRefsFromCubeModal').modal();
        var result = call("ncubeController.getReferencesFrom", [getSelectedTabAppId(), _selectedCubeName]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var li = $("<li/>").attr({'class': 'list-group-item skinny-lr'});
                var anchor = $('<a href="#"/>');
                anchor[0].innerHTML = value;
                anchor.click(function ()
                {
                    showRefsFromCubeClose();
                    selectCubeByName(value);
                });
                ul.append(li);
                li.append(anchor);
            });
        }
        else
        {
            showNote('Error fetching outbound references for ' + _selectedCubeName + '):<hr class="hr-small"/>' + result.data);
        }
    }

    function showRefsFromCubeClose()
    {
        $('#showRefsFromCubeModal').modal('hide');
    }

    function showReqScope()
    {
        clearError();
        $('#showReqScopeLabel')[0].textContent = "Scope for '" + _selectedCubeName + "'";
        var ul = $('#reqScopeList');
        ul.empty();
        $('#showReqScopeModal').modal();
        var result = call("ncubeController.getRequiredScope", [getSelectedTabAppId(), _selectedCubeName]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var li = $("<li/>").attr({'class': 'list-group-item skinny-lr'});
                li[0].innerHTML = value;
                ul.append(li);
            });
        }
        else
        {
            showNote('Error fetching required scope for: ' + _selectedCubeName + '):<hr class="hr-small"/>' + result.data);
        }
    }

    function showReqScopeClose()
    {
        $('#showReqScopeModal').modal('hide');
    }

    function setLockUnlockMenuText(isLocked) {
        var lockUnlockMenuText = isLocked ? 'Unlock ' : 'Lock ';
        lockUnlockMenuText += _selectedApp;
        _lockUnlockAppMenu[0].innerHTML = lockUnlockMenuText;
    }

    function lockUnlockApp() {
        var appId = getAppId();
        var result = call(CONTROLLER + CONTROLLER_METHOD.IS_APP_LOCKED, [appId]);
        var isLocked;
        if (result.status) {
            isLocked = result.data;
        } else {
            showNote("Unable to check lock for app '" + _selectedApp + "':<hr class=\"hr-small\"/>" + result.data);
            return;
        }
        result = null;
        result = call(CONTROLLER + CONTROLLER_METHOD.LOCK_APP, [appId, !isLocked]);
        if (result.status) {
            setLockUnlockMenuText(!isLocked);
            setGetAppLockedByMenuText(!isLocked);
        } else {
            showNote("Unable to change lock for app '" + _selectedApp + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function getAppLockedBy() {
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_APP_LOCKED_BY, [getAppId()]);
        if (result.status) {
            return result.data;
        } else {
            showNote("Unable to change lock for app '" + _selectedApp + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function setGetAppLockedByMenuText(isLocked) {
        _getAppLockedByMenu[0].innerHTML = isLocked ? 'Locked by ' + getAppLockedBy() : '';
    }

    //////////////////////////////////////////   BEGIN RELEASE PROCESS   ///////////////////////////////////////////////

    function releaseCubes() {
        if (!isReleasePending) {
            clearError();
            if (_selectedBranch !== head) {
                showNote('HEAD branch must be selected to release a version.');
                return;
            }

            $('#releaseCubesLabel')[0].textContent = 'Release ' + _selectedApp + ' ' + _selectedVersion + ' SNAPSHOT ?';
            $('#releaseCubesAppName').val(_selectedApp);
            _releaseCubesVersion.val('');
            setReleaseCubesProgress(0, 'Ready to release');
            updateProgressUi();
        }
        _releaseCubesModal.modal();
    }

    function setReleaseCubesProgress(progress, msg, shouldStopUpdateProgressUi) {
        _releaseCubesProgressPct = progress;
        _releaseCubesProgressText = msg;
        if (shouldStopUpdateProgressUi) {
            stopUpdateProgressUi();
        }
    }

    function updateProgressUi() {
        var progPct = _releaseCubesProgressPct + '%';
        _releaseCubesProgressInfo.html(_releaseCubesProgressText);
        _releaseCubesProgressBar.css('width', progPct).attr('aria-valuenow', _releaseCubesProgressPct).text(progPct);
    }

    function stopUpdateProgressUi() {
        clearInterval(updateProgressUi);
        setTimeout(updateProgressUi, 0);
        isReleasePending = false;
        _releaseCubesOk.show();
    }

    function releaseCubesOk() {
        var newSnapVer = _releaseCubesVersion.val();

        setInterval(updateProgressUi, 1000);
        if (!newSnapVer) {
            setReleaseCubesProgress(0, 'No version set.', true);
            return;
        }

        isReleasePending = true;
        _releaseCubesOk.hide();
        setReleaseCubesProgress(0, 'Locking app...');
        lockAppForRelease(getAppId(), newSnapVer);
    }

    function lockAppForRelease(appId, newSnapVer) {
        var result = call(CONTROLLER + CONTROLLER_METHOD.IS_APP_LOCKED, [appId]);
        if (result.status) {
            if (result.data) {
                lockAppForReleaseCallback(appId, newSnapVer);
                return;
            }
        } else {
            setReleaseCubesProgress(0, 'Error checking lock: ' + result.data, true);
            return;
        }
        
        call(CONTROLLER + CONTROLLER_METHOD.LOCK_APP, [appId, true], {callback: function(result) {
            if (result.status) {
                setTimeout(function() {
                        lockAppForReleaseCallback(appId, newSnapVer);
                }, 10000);
            } else {
                setReleaseCubesProgress(0, 'Unable to lock app: ' + result.data, true);
            }
        }});
    }

    function lockAppForReleaseCallback(appId, newSnapVer) {
        var branchName, i, len;
        var branchNamesWithoutHead = [];
        setReleaseCubesProgress(0, 'Updating branch names...');
        getBranchNames();
        
        for (i = 0, len = _branchNames.length; i < len; i++) {
            branchName = _branchNames[i];
            if (branchName !== head) {
                branchNamesWithoutHead.push(branchName);
            }
        }
        if (branchNamesWithoutHead.length > 0) {
            moveBranch(appId, newSnapVer, branchNamesWithoutHead, 0);
        } else {
            releaseVersion(appId, newSnapVer);
        }
    }

    function moveBranch(appId, newSnapVer, branchNames, branchIdx) {
        var len = branchNames.length;
        var progress = Math.round(branchIdx / (len + 1) * 100);

        appId.branch = branchNames[branchIdx];
        setReleaseCubesProgress(progress, 'Processing branch ' + (branchIdx + 1) + ' of ' + len + ': ' + appId.branch);
        call(CONTROLLER + CONTROLLER_METHOD.MOVE_BRANCH, [appId, newSnapVer], {callback: function(result) {
            if (result.status) {
                if (branchIdx < len - 1) {
                    moveBranch(appId, newSnapVer, branchNames, branchIdx + 1);
                } else {
                    releaseVersion(appId, newSnapVer);
                }
            } else {
                setReleaseCubesProgress(progress, 'Error: ' + result.data, true);
            }
        }});
    }

    function releaseVersion(appId, newSnapVer) {
        var len = _branchNames.length;
        var progress = Math.round((len - 1) / len * 100);

        setReleaseCubesProgress(progress, 'Processing release of HEAD...');
        call(CONTROLLER + CONTROLLER_METHOD.RELEASE_VERSION, [appId, newSnapVer], {callback: function(result) {
            if (result.status) {
                finalizeRelease(appId, newSnapVer);
            } else {
                setReleaseCubesProgress(progress, 'Error: ' + result.data, true);
            }
        }});
    }

    function finalizeRelease(appId, newSnapVer) {
        setReleaseCubesProgress(100, 'Unlocking app... ');
        appId.branch = head;
        call(CONTROLLER + CONTROLLER_METHOD.LOCK_APP, [appId, false], {callback: function(result) {
            if (result.status) {
                setReleaseCubesProgress(100, 'Success!', true);
                updateCubeInfoInOpenCubeList(CUBE_INFO.VERSION, newSnapVer);
                saveSelectedVersion(newSnapVer);
                loadVersionListView();
                loadNCubes();
                loadCube();
                runSearch();
            } else {
                setReleaseCubesProgress(0, 'Unable to unlock app: ' + result.data, true);
            }
        }});
    }

    ///////////////////////////////////////////   END RELEASE PROCESS   ////////////////////////////////////////////////

    function changeVersion()
    {
        clearError();
        if (!ensureModifiable('Version cannot be changed.'))
        {
            return;
        }

        $('#changeVerLabel')[0].textContent = 'Change ' + _selectedApp + ' ' + _selectedVersion + ' ?';
        $('#changeVerModal').modal();
    }

    function changeVersionOk() {
        var newSnapVer, result;
        $('#changeVerModal').modal('hide');
        newSnapVer = $('#changeVerValue').val();
        result = call(CONTROLLER + CONTROLLER_METHOD.CHANGE_VERSION_VALUE, [getAppId(), newSnapVer]);
        if (result.status) {
            updateCubeInfoInOpenCubeList(CUBE_INFO.VERSION, newSnapVer);
            saveSelectedVersion(newSnapVer);
            loadVersionListView();
            loadNCubes();
            loadCube();
            runSearch();
        } else {
            showNote("Unable to change SNAPSHOT version to value '" + newSnapVer + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function createSnapshotFromRelease() {
        clearError();
        if (_selectedStatus !== STATUS.RELEASE) {
            showNote('Must select a released version to copy.');
            return;
        }
        _createSnapshotLabel[0].textContent = 'Copy ' + _selectedApp + ' ' + _selectedVersion + '-RELEASE';
        _createSnapshotModal.modal();
    }

    function createSnapshotFromReleaseOk() {
        var result;
        var origAppId = getAppId();
        var copyAppId = getAppId();
        var newSnapVer = _createSnapshotVersion.val();
        copyAppId.version = newSnapVer;
        copyAppId.status = STATUS.SNAPSHOT;
        
        result = call(CONTROLLER + CONTROLLER_METHOD.COPY_BRANCH, [origAppId, copyAppId]);
        if (!result.status) {
            showNote('Error creating new SNAPSHOT:<hr class="hr-small"/>' + result.data);
            return;
        }

        _createSnapshotModal.modal('hide');
        saveSelectedVersion(newSnapVer);
        saveSelectedStatus(STATUS.SNAPSHOT);
        loadVersionListView();
        loadNCubes();
        runSearch();
    }

    function doesCubeInfoMatchOldAppId(cubeInfoPart, cubeInfo) {
        var appId = getAppId();
        var doesAppMatch = cubeInfo[CUBE_INFO.APP] === appId.app;
        var doesVersionMatch = cubeInfo[CUBE_INFO.VERSION] === appId.version;
        var doesStatusMatch = cubeInfo[CUBE_INFO.STATUS] === appId.status;
        var doesBranchMatch = cubeInfo[CUBE_INFO.BRANCH] === appId.branch;

        switch (cubeInfoPart) {
            case CUBE_INFO.APP:
                return doesAppMatch;
            case CUBE_INFO.VERSION:
                return doesAppMatch && doesVersionMatch;
            case CUBE_INFO.STATUS:
                return doesAppMatch && doesVersionMatch && doesStatusMatch;
            case CUBE_INFO.BRANCH:
                return doesAppMatch && doesVersionMatch && doesStatusMatch && doesBranchMatch;
        }
    }

    function updateCubeInfoInOpenCubeList(cubeInfoPart, newValue) {
        var i, len, cubeInfo;
        for (i = 0, len = _openCubes.length; i < len; i++) {
            cubeInfo = getCubeInfo(_openCubes[i].cubeKey);
            if (doesCubeInfoMatchOldAppId(cubeInfoPart, cubeInfo)) {
                cubeInfo[cubeInfoPart] = newValue;
                _openCubes[i].cubeKey = getCubeInfoKey(cubeInfo);
            }
        }
        saveOpenCubeList();

        if (doesCubeInfoMatchOldAppId(cubeInfoPart, _selectedCubeInfo)) {
            _selectedCubeInfo[cubeInfoPart] = newValue;
        }
        buildTabs();
    }

    function removeCubeInfoInOpenCubeList(cubeInfoPart) {
        var i, cubeInfo;
        for (i = _openCubes.length; i--;) {
            cubeInfo = getCubeInfo(_openCubes[i].cubeKey);
            if (doesCubeInfoMatchOldAppId(cubeInfoPart, cubeInfo)) {
                _openCubes.splice(i, 1);
            }
        }
        saveOpenCubeList();

        if (doesCubeInfoMatchOldAppId(cubeInfoPart, _selectedCubeInfo)) {
            _selectedCubeInfo = _openCubes.length ? getCubeInfo(_openCubes[0].cubeKey) : [];
        }
        buildTabs();
    }

    function ensureModifiable(operation)
    {
        if (!operation) {
            operation = '';
        }
        clearError();
        var appId = getSelectedTabAppId() || getAppId();
        if (!appId.app || !appId.version || !_selectedCubeName || !appId.status || !appId.branch)
        {
            showNote(operation + ' No n-cube selected.');
            return false;
        }
        if (appId.status === "RELEASE")
        {
            showNote(operation + ' Only a SNAPSHOT version can be modified.');
            return false;
        }
        if (appId.branch === head)
        {
            showNote(operation + ' HEAD branch cannot be modified.');
            return false;
        }

        return true;
    }

    function clearStorage() {
        var keys = Object.keys(localStorage);
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            if (key.startsWith(NCE_PREFIX)) {
                delete localStorage[key];
            }
        }
    }

    function clearCache()
    {
        var result = call("ncubeController.clearCache", [getAppId()]);

        if (result.status === false)
        {
            showNote('Unable to clear cache:<hr class="hr-small"/>' + result.data);
        }
    }

    function serverStats()
    {
        var result = call("ncubeController.heartBeat", [{}]);

        if (result.status === false)
        {
            showNote('Unable to fetch server statistics:<hr class="hr-small"/>' + result.data);
            return;
        }
        clearError();
        displayMap(result.data.serverStats, 'Server Statistics');
    }

    function httpHeaders()
    {
        var result = call("ncubeController.getHeaders", []);

        if (result.status === false)
        {
            showNote('Unable to fetch HTTP headers:<hr class="hr-small"/>' + result.data);
            return;
        }
        clearError();
        displayMap(result.data, 'HTTP Headers');
    }

    function displayMap(map, title)
    {
        delete map['@type'];
        var msg = '';
        var maxValLen = 0;
        var rows = 0;

        for (var key in map)
        {
            if (map.hasOwnProperty(key))
            {
                rows++;
                var val = '' + map[key];
                if (val.length > 50)
                {   // Hard-coded to size of current (330px) gritter text area (reduced by gritter-image size)
                    val = val.substring(0, 5) + '...' + val.substr(-54);
                }
                msg += '<dt>' + key + '</dt>';
                msg += '<dd>' + val + '</dd>';

                if (val.length > maxValLen)
                {
                    maxValLen = val.length;
                }
            }
        }

        if (maxValLen > 32 || rows == 1)
        {
            msg = '<dl>' + msg;
        }
        else
        {
            msg = '<dl class="dl-horizontal">' + msg;
        }
        msg += '</dl>';

        showNote(msg, title);
    }

    // ======================================== Everything to do with Branching ========================================

    function addBranchListeners()
    {
        // Main menu options
        $('#branchSelect').click(function()
        {
            selectBranch();
        });
        $('#branchCompareUpdateOk').on('click', function() {
            branchCompareUpdateOk();
        });
        $('#branchCommit').click(function()
        {
            setTimeout(function() { commitBranch(true); }, PROGRESS_DELAY);
            showNote('Processing commit request...');
        });
        $('#commitOk').click(function()
        {
            commitOk();
        });
        $('#rollbackOk').click(function()
        {
            rollbackOk();
        });
        $('#branchRollback').click(function()
        {
            setTimeout(function() { commitBranch(false); }, PROGRESS_DELAY);
            showNote('Processing rollback request...');
        });
        $('#branchUpdate').click(function()
        {
            setTimeout(function() { callUpdate(); }, PROGRESS_DELAY);
            showNote('Updating branch...');
        });
        $('#branchDelete').click(function()
        {
            deleteBranch();
        });
        $('#deleteBranchOk').click(function()
        {
            deleteBranchOk();
        });
        $('#branchCopy').on('click', function() {
            copyBranch();
        });
        $('#copyBranchOk').on('click', function() {
            copyBranchOk();
        });
        // From 'Select / Create Branch' Modal
        $('#createBranch').click(function()
        {
            createBranch();
        });
        _branchNameWarning.find('button').on('click', function() {
            _branchNameWarning.hide();
        });
        $('#compareCubes').click(function(e)
        {
            diffConflicts();
        });
        $('#acceptTheirs').click(function(e)
        {
            acceptTheirs();
        });
        $('#acceptMine').click(function(e)
        {
            acceptMine();
        });
        $('#mergeClose').click(function(e)
        {
            setTimeout(function() {
                loadNCubes();
                reloadCube();
                runSearch();
            }, PROGRESS_DELAY);
            showNote('Closing merge window, reloading cubes...', 'Note', 1000);
        });
    }

    function showActiveBranch() {
        var branchNames = getBranchNames();
        if (branchNames.indexOf(_selectedBranch) === -1) {
            saveSelectedBranch(head);
        }
        _branchMenu[0].innerHTML = '<button class="btn-sm btn-primary">&nbsp;' + _selectedBranch + '&nbsp;<b class="caret"></b></button>';
    }

    function getBranchNames() {
        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_BRANCHES, [getAppId()]);
        if (!result.status) {
            showNote('Unable to get branches:<hr class="hr-small"/>' + result.data);
            return [];
        }
        _branchNames = null;
        _branchNames = result.data;
        return _branchNames;
    }

    function selectBranch() {
        var branchNames, ul, listHtml, i, len, name;
        clearError();
        _newBranchName.val('');
        _branchNameWarning.hide();

        branchNames = getBranchNames();
        listHtml = '';

        for (i = 0, len = branchNames.length; i < len; i++) {
            name = branchNames[i] || head;
            listHtml += '<li class="list-group-item skinny-lr"><a href="#"><kbd>' + name + '</kbd></a></li>';
        }

        ul = _branchList;
        ul.empty();
        ul.append(listHtml);
        ul.find('li').find('a').on('click', function() {
            var branchName = $(this).find('kbd')[0].textContent;
            changeBranch(branchName);
        });

        _selectBranchModal.modal('show');
    }

    function createBranch()
    {
        clearError();

        var branchName = _newBranchName.val();
        var validName = /^[a-zA-Z_][0-9a-zA-Z_.-]*$/i;

        if (!branchName || !validName.test(branchName) || head.toLowerCase() == branchName.toLowerCase())
        {
            _branchNameWarning.show();
            return;
        }

        var appId = getAppId();
        appId.branch = branchName;
        if (!_selectedApp || !_selectedVersion || !_selectedStatus)
        {
            changeBranch(branchName);
            return;
        }

        setTimeout(function() {
            var result = call("ncubeController.createBranch", [appId]);
            if (!result.status)
            {
                clearError();
                showNote('Unable to create branch:<hr class="hr-small"/>' + result.data);
                return;
            }
            changeBranch(branchName);
        }, PROGRESS_DELAY);
        _selectBranchModal.modal('hide');
        showNote('Creating branch: ' + branchName, 'Creating...');
    }

    function changeBranch(branchName)
    {
         if (head.toLowerCase() == branchName.toLowerCase())
         {
             branchName = head;
         }
        saveSelectedBranch(branchName);
        addToVisitedBranchesList(_selectedApp, branchName);
        _selectBranchModal.modal('hide');

        setTimeout(function() {
            loadAppListView();
            loadVersionListView();
            showActiveBranch();
            loadNCubes();
            runSearch();
            buildMenu();
            clearError();
            buildBranchQuickSelectMenu(_selectedApp);
        }, PROGRESS_DELAY);
        clearError();
        showNote('Changing branch to: ' + branchName, 'Please wait...');
    }

    function compareUpdateBranch(branchName) {
        var result, branchChanges;
        clearError();

        if (isHeadSelected())
        {
            showNote('You cannot update HEAD.');
            return;
        }

        result = call(CONTROLLER + CONTROLLER_METHOD.GET_BRANCH_CHANGES_FROM_BRANCH, [getAppId(), branchName]);
        if (!result.status) {
            showNote('Unable to get branch changes:<hr class="hr-small"/>' + result.data);
            return;
        }

        $('#branchCompareUpdateLabel')[0].innerHTML = 'Update ' + _selectedBranch + ' from ' + branchName;
        branchChanges = result.data;
        branchChanges.sort(function compare(a,b) {
            return a.name.localeCompare(b.name);
        });

        _branchCompareUpdateModal.prop({changes: branchChanges, branchName: branchName});
        buildUlForCompare(_branchCompareUpdateList, branchName, branchChanges, 'updateCheck');

        selectAll();
        _branchCompareUpdateModal.modal();
    }

    function buildUlForCompare(ul, updateFromBranchName, branchChanges, inputClass) {
        ul.empty();
        ul.append(buildHtmlListForCompare(branchChanges, inputClass));
        ul.find('a.compare').on('click', function() {
            var li = $(this).parent().parent().parent();
            var ul = li.parent();
            var idx = ul.children().index(li);
            var infoDto = branchChanges[idx];
            var leftInfoDto = $.extend(true, {}, infoDto);
            leftInfoDto.branch = updateFromBranchName;
            diffCubes(leftInfoDto, infoDto, infoDto.name);
        });
    }

    function branchCompareUpdateOk() {
        var branchChanges = _branchCompareUpdateModal.prop('changes');
        var branchName = _branchCompareUpdateModal.prop('branchName');
        var input = _branchCompareUpdateList.find('.updateCheck');
        var changes = [];

        $.each(input, function (index, label) {
            if ($(this).is(':checked')) {
                changes.push(branchChanges[index].name);
            }
        });

        _commitModal.modal('hide');
        callUpdateBranchCubes(changes, branchName);
    }

    function callUpdateBranchCubes(cubeNames, branchName) {
        showNote('Updating selected cubes...', 'Please wait...');
        setTimeout(function() {
            var result = call(CONTROLLER + CONTROLLER_METHOD.UPDATE_BRANCH_CUBES, [getAppId(), cubeNames, branchName]);
            var note;

            clearError();
            if (!result.status) {
                showNote(result.data);
                return;
            }

            loadNCubes();
            runSearch();
            reloadCube();

            note = 'Successfully updated ' + result.data.length + ' cube(s).<hr class="hr-small"/>';
            note += '<b style="color:cornflowerblue">Updated cubes:</b><br>';
            $.each(result.data, function(idx, infoDto) {
                note += infoDto.name + '<br>';
            });
            showNote(note);
        }, PROGRESS_DELAY);
    }

    function buildHtmlListForCompare(branchChanges, inputClass) {
        var i, len, infoDto;
        var html = '';
        for (i = 0, len = branchChanges.length; i < len; i++) {
            infoDto = branchChanges[i];

            html += '<li class="list-group-item skinny-lr no-margins" style="padding-left:0;">';
            html += '<div class="container-fluid">';

            html += '<label class="col-xs-1" style="padding:0;margin:0 10px 0 0;">';
            html += '<a href="#" class="compare"><kbd>Compare</kbd></a>';
            html += '</label>';

            html += '<label class="checkbox no-margins col-xs-10 ' + getLabelDisplayClassForInfoDto(infoDto) + '">';
            html += '<input class="' + inputClass + '" type="checkbox">';
            html += infoDto.name;
            html += '</label>';

            html += '</div></li>';
        }
        return html;
    }
    
    function getLabelDisplayClassForInfoDto(infoDto) {
        if (infoDto.revision < 0) {
            return 'cube-deleted';
        }
        
        if (!infoDto.headSha1) {
            if (infoDto.sha1) {
                return 'cube-added';
            }
            if (infoDto.changeType === 'D') {
                    return 'cube-deleted';
            }
            if (infoDto.changeType === 'R') {
                return 'cube-restored';
            }
        }
        
        if (infoDto.headSha1 != infoDto.sha1) {
            return 'cube-modified';
        }
        if (infoDto.changeType === 'D') {
            return 'cube-deleted';
        }
        if (infoDto.changeType == 'R') {
            return 'cube-restored';
        }
        
        return '';
    }

    function commitBranch(state)
    {
        clearError();

        var errMsg;
        var title;
        if (state)
        {
            errMsg = 'commit to';
            title = 'Commit changes';
            $('#commitOk').show();
            $('#rollbackOk').hide();
        }
        else
        {
            errMsg = 'rollback in';
            title = 'Rollback changes';
            $('#commitOk').hide();
            $('#rollbackOk').show();
        }

        if (isHeadSelected())
        {
            showNote('You cannot ' + errMsg + ' HEAD.');
            return;
        }

        var result = call(CONTROLLER + CONTROLLER_METHOD.GET_BRANCH_CHANGES, [getAppId()]);

        if (!result.status || !result.data)
        {
            showNote('Unable to get branch changes:<hr class="hr-small"/>' + result.data);
            return;
        }

        $('#commitRollbackLabel')[0].textContent = title;

        var branchChanges = result.data;
        branchChanges.sort(
            function compare(a,b)
            {
                return a.name.localeCompare(b.name);
            });

        _commitModal.prop('changes', branchChanges);
        buildUlForCompare(_commitRollbackList, head, branchChanges, 'commitCheck');

        selectAll();
        _commitModal.modal('show');
    }

    function commitOk()
    {
        var branchChanges = _commitModal.prop('changes');
        var input = _commitRollbackList.find('.commitCheck');
        var changes = [];

        $.each(input, function (index, label)
        {
            if ($(this).is(':checked'))
            {
                changes.push(branchChanges[index]);
            }
        });

        _commitModal.modal('hide');

        callCommit(changes);
    }

    function callCommit(changedDtos, appId) {
        showNote('Committing changes on selected cubes...', 'Please wait...');
        setTimeout(function() {
            var result;
            if (appId) {
                result = call("ncubeController.commitCube", [appId, changedDtos.name]);
            } else {
                result = call("ncubeController.commitBranch", [getAppId(), changedDtos]);
            }

            clearError();
            if (result.status === false)
            {
                showNote('You have conflicts with the HEAD branch.  Update Branch first, then re-attempt branch commit.');
                return;
            }

            if (!appId || appIdsEqual(appId, getAppId())) {
                loadNCubes();
                runSearch();
            }
            reloadCube();

            var note = 'Successfully committed ' + result.data.length + ' cube(s).<hr class="hr-small"/>';
            note += '<b style="color:cornflowerblue">Committed cubes:</b><br>';
            $.each(result.data, function(idx, infoDto)
            {
                note += infoDto.name + '<br>';
            });
            showNote(note);
        }, PROGRESS_DELAY);
    }

    function rollbackOk()
    {
        var branchChanges = _commitModal.prop('changes');
        var input = _commitRollbackList.find('.commitCheck');
        var changes = [];
        $.each(input, function (index, label)
        {
            if ($(this).is(':checked'))
            {
                changes.push(branchChanges[index]);
            }
        });

        _commitModal.modal('hide');
        callRollback(changes);
    }

    function callRollback(changes) {
        showNote('Rolling back changes on selected cubes...', 'Please wait...');
        setTimeout(function(){
            var names = [];
            for (var i=0; i < changes.length; i++)
            {
                names.push(changes[i].name)
            }
            var result = call("ncubeController.rollbackBranch", [getAppId(), names]);
            clearError();

            if (result.status === false)
            {
                showNote('Unable to rollback cubes:<hr class="hr-small"/>' + result.data);
                return;
            }

            loadNCubes();
            reloadCube();
            runSearch();

            var note = 'Successfully rolled back ' + changes.length + ' cube(s).<hr class="hr-small"/>';
            note += '<b style="color:cornflowerblue">Rolled back cubes:</b><br>';
            $.each(changes, function(idx, infoDto)
            {
                note += infoDto.name + '<br>';
            });
            showNote(note);
        }, PROGRESS_DELAY);
    }

    function callRollbackFromTab(changedCube) {
        showNote('Rolling back changes on selected cubes...', 'Please wait...');
        setTimeout(function(){
            var appId = getSelectedTabAppId();
            var name = changedCube.name;
            var result = call("ncubeController.rollbackBranch", [appId, [name]]);
            clearError();

            if (result.status === false)
            {
                showNote('Unable to rollback cubes:<hr class="hr-small"/>' + result.data);
                return;
            }

            if (appIdsEqual(appId, getAppId())) {
                loadNCubes();
                runSearch();
            }
            reloadCube();
            showNote('Successfully rolled back ' + name + '.');
        }, PROGRESS_DELAY);
    }

    function callUpdate(sourceBranch) {
        var appId, result, map, updateMap, mergeMap, updates, upMap, merges, mMap, conflicts, names, note, i;
        clearError();
        
        if (sourceBranch !== undefined) {
            appId = getSelectedTabAppId();
            result = call(CONTROLLER + CONTROLLER_METHOD.UPDATE_BRANCH_CUBE, [appId, _selectedCubeName, sourceBranch]);
        } else  {
            appId = getAppId();
            result = call(CONTROLLER + CONTROLLER_METHOD.UPDATE_BRANCH, [appId]);
        }
        if (!result.status)
        {
            showNote('Unable to update branch:<hr class="hr-small"/>' + result.data);
            return;
        }

        map = result.data;
        updateMap = map['updates'];
        mergeMap = map['merges'];
        _conflictMap = map['conflicts'];
        updates = 0;
        merges = 0;
        conflicts = 0;

        if (updateMap && updateMap['@items'])
        {
            updates = updateMap['@items'].length;
        }
        if (mergeMap && mergeMap['@items'])
        {
            merges = mergeMap['@items'].length;
        }
        if (_conflictMap)
        {
            delete _conflictMap['@type'];
            conflicts = countKeys(_conflictMap);
        }

        note = '<b>Branch Updated:</b><hr class="hr-small"/>' + updates + ' cubes <b>updated</b><br>' + merges + ' cubes <b>merged</b><br>' + conflicts + ' cubes in <b>conflict</b>';
        if (updates > 0)
        {
            upMap = updateMap['@items'];
            note += '<hr class="hr-small"/><b style="color:cornflowerblue">Updated cube names:</b><br>';
            upMap.sort(function(a, b)
            {   // sort case-insensitively, use client-side CPU
                var lowA = a.name.toLowerCase();
                var lowB = b.name.toLowerCase();
                return lowA.localeCompare(lowB);
            });
            for (i = 0; i < updates; i++)
            {
                note += upMap[i].name + '<br>';
            }
        }
        if (merges > 0)
        {
            mMap = mergeMap['@items'];
            note += '<hr class="hr-small"/><b style="color:#D4AF37">Merged cube names:</b><br>';
            mMap.sort(function(a, b)
            {   // sort case-insensitively, use client-side CPU
                var lowA = a.name.toLowerCase();
                var lowB = b.name.toLowerCase();
                return lowA.localeCompare(lowB);
            });
            for (i=0; i < merges; i++)
            {
                note += mMap[i].name + '<br>';
            }
        }
        if (conflicts > 0)
        {
            note += '<hr class="hr-small"/><b style="color:#F08080">Cubes in conflict:</b><br>';
            names = Object.keys(_conflictMap);
            names.sort(function(a, b)
            {   // sort case-insensitively, use client-side CPU
                var lowA = a.toLowerCase();
                var lowB = b.toLowerCase();
                return lowA.localeCompare(lowB);
            });
            $.each(names, function(index, value)
            {
                note += value + '<br>';
            });
        }
        showNote(note);

        if (conflicts > 0)
        {
            mergeBranch(_conflictMap);
            return;
        }

        if (appIdsEqual(appId, getAppId())) {
            loadNCubes();
            runSearch();
        }

        reloadCube();
    }

    function copyBranch() {
        clearError();
        $('#copyBranchAppName').val(_selectedApp);
        $('#copyBranchStatus').val(STATUS.SNAPSHOT);
        $('#copyBranchVersion').val(_selectedVersion);
        $('#copyBranchName').val('');
        buildDropDown('#copyBranchAppList', '#copyBranchAppName', loadAppNames(), function (app) {
            buildVersionsDropdown('#copyBranchVersionList', '#copyBranchVersion');
        });
        buildVersionsDropdown('#copyBranchVersionList', '#copyBranchVersion');

        _copyBranchLabel[0].textContent = 'Copy ' + _selectedApp + ' ' + _selectedVersion + '-' + _selectedStatus + ' ' + _selectedBranch;
        _copyBranchModal.modal();
    }

    function copyBranchOk() {
        var result;
        var origAppId = getAppId();
        var copyAppId = {
            app: $('#copyBranchAppName').val(),
            version: $('#copyBranchVersion').val(),
            status: STATUS.SNAPSHOT,
            branch: $('#copyBranchName').val()
        };
        
        result = call(CONTROLLER + CONTROLLER_METHOD.COPY_BRANCH, [origAppId, copyAppId]);
        if (!result.status) {
            showNote('Unable to copy branch:<hr class="hr-small"/>' + result.data);
            return;
        }
        
        _copyBranchModal.modal('hide');
        saveSelectedApp(copyAppId.app);
        saveSelectedVersion(copyAppId.version);
        saveSelectedStatus(copyAppId.status);
        saveSelectedBranch(copyAppId.branch);
        loadAppListView();
        loadVersionListView();
        showActiveBranch();
        loadNCubes();
        runSearch();
    }

    function deleteBranch()
    {
        if (isHeadSelected())
        {
            showNote('HEAD branch cannot be deleted.');
            return;
        }

        $('#deleteBranchLabel')[0].textContent = "Delete '" + _selectedBranch + "' ?";
        $('#deleteBranchModal').modal();
    }

    function deleteBranchOk() {
        var result;
        var appId = getAppId();
        $('#deleteBranchModal').modal('hide');
        clearError();

        result = call(CONTROLLER + CONTROLLER_METHOD.DELETE_BRANCH, [appId]);
        if (result.status) {
            removeFromVisitedBranchesList(_selectedApp, appId.branch);
            removeCubeInfoInOpenCubeList(CUBE_INFO.BRANCH);
            changeBranch(head);
        } else {
            showNote('Unable to delete branch:<hr class="hr-small"/>' + result.data);
        }
    }

    function mergeBranch(conflictMap)
    {
        delete conflictMap['@type'];
        var ul = $('#mergeList');
        ul.empty();

        // Sort keys of Map
        var keys = Object.keys(conflictMap);
        keys.sort(function(a, b)
        {
            var lowA = a.toLowerCase();
            var lowB = b.toLowerCase();
            return lowA.localeCompare(lowB);
        });

        // Walk sorted keys, indexing into Map
        $.each(keys, function(index, cubeName)
        {
            var li = $('<li style="border:none"/>').prop({class: 'list-group-item skinny-lr'});
            var div = $('<div/>').prop({class:'container-fluid'});
            var checkbox = $('<input>').prop({type:'checkbox'});
            var label = $('<label/>').prop({class: 'radio no-margins'});
            label[0].textContent = cubeName;
            ul.append(li);
            li.append(div);
            div.append(label);
            checkbox.prependTo(label); // <=== create input without the closing tag
        });
        $('#mergeBranchModal').modal('show');
    }

    function getSingleSelectedConflict() {
        var checkedInput = $('#mergeList').find('input:checked');
        if (checkedInput.length === 0) {
            showNote('Select a cube', 'Note', 3000);
            return null;
        }
        if (checkedInput.length > 1) {
            showNote('Select only one cube', 'Note', 3000);
            return null;
        }
        return checkedInput.parent()[0].textContent;
    }

    function getAllSelectedConflicts() {
        var checkedInput = $('#mergeList').find('input:checked');
        if (checkedInput.length === 0) {
            showNote('Select a cube', 'Note', 3000);
            return null;
        }

        var results = {
            cubeNames: [],
            branchSha1: [],
            headSha1: []
        };
        for (var i = 0, len = checkedInput.length; i < len; i++) {
            var cubeName = $(checkedInput[i]).parent()[0].textContent;
            results.cubeNames.push(cubeName);
            results.branchSha1.push(_conflictMap[cubeName].sha1);
            results.headSha1.push(_conflictMap[cubeName].headSha1);
        }
        return results;
    }

    function diffConflicts()
    {
        var conflictedCube = getSingleSelectedConflict();
        if (!conflictedCube)
        {
            return;
        }
        var appId = getAppId();
        var infoDto = {
            name: conflictedCube,
            app: appId.app,
            version: appId.version,
            status: appId.status,
            branch: appId.branch
        };
        var leftInfoDto = $.extend(true, {}, infoDto);
        leftInfoDto.branch = 'HEAD';
        diffCubes(leftInfoDto, infoDto, conflictedCube);
    }

    function acceptTheirs() {
        var result;
        var conflictedCubes = getAllSelectedConflicts();
        if (!conflictedCubes) {
            return;
        }

        result = call(CONTROLLER + CONTROLLER_METHOD.ACCEPT_THEIRS, [getAppId(), conflictedCubes.cubeNames, conflictedCubes.branchSha1]);
        if (result.status) {
            showNote(result.data.value + ' cubes updated in your branch with cube from HEAD', 'Note', 5000);
            $('#mergeList').find('input:checked').parent().parent().parent().remove();
        } else {
            showNote('Unable to update your branch cubes from HEAD:<hr class="hr-small"/>');
        }
    }

    function acceptMine() {
        var result;
        var conflictedCubes = getAllSelectedConflicts();
        if (!conflictedCubes) {
            return;
        }

        result = call(CONTROLLER + CONTROLLER_METHOD.ACCEPT_MINE, [getAppId(), conflictedCubes.cubeNames, conflictedCubes.headSha1]);
        if (result.status) {
            showNote(result.data.value + ' cubes updated to overwrite-on-commit.', 'Note', 5000);
            $('#mergeList').find('input:checked').parent().parent().parent().remove();
        } else {
            showNote('Unable to update your branch cubes to overwrite-on-commit:<hr class="hr-small"/>');
        }
    }

    // =============================================== End Branching ===================================================

    // ============================================== Cube Comparison ==================================================
    
    function diffCubes(leftInfo, rightInfo, title) {
        clearError();
        call(CONTROLLER + CONTROLLER_METHOD.FETCH_JSON_BRANCH_DIFFS, [leftInfo, rightInfo], {noResolveRefs:true, callback:descriptiveDiffCallback});
        call(CONTROLLER + CONTROLLER_METHOD.FETCH_HTML_BRANCH_DIFFS, [leftInfo, rightInfo], {noResolveRefs:true, callback:htmlDiffCallback});
        setupDiff(leftInfo.branch, rightInfo.branch, title);
    }

    function diffCubeRevs(id1, id2, leftName, rightName, title) {
        clearError();
        call(CONTROLLER + CONTROLLER_METHOD.FETCH_JSON_REV_DIFFS, [id1, id2], {noResolveRefs:true, callback:descriptiveDiffCallback});
        call(CONTROLLER + CONTROLLER_METHOD.FETCH_HTML_REV_DIFFS, [id1, id2], {noResolveRefs:true, callback:htmlDiffCallback});
        setupDiff(leftName, rightName, title);
    }

    function setupDiff(leftName, rightName, title) {
        _diffOutput.empty();
        $('#diffTitle')[0].innerHTML = title;
        _diffLastResult = 'Loading...';
        _diffHtmlResult = 'Loading...';
        _diffLeftName = leftName;
        _diffRightName = rightName;
        diffLoad(DIFF_DESCRIPTIVE);
        diffShow(true);
    }
    
    function diffShow(shouldShow) {
        if (shouldShow) {
            _diffModal.show();
        } else {
            _diffModal.hide();
        }
    }

    function diffLoad(viewType) {
        _diffOutput.empty();
        switch(viewType) {
            case DIFF_INLINE:
            case DIFF_SIDE_BY_SIDE:
                diffInlineOrSideBySide(viewType);
                break;
            case DIFF_DESCRIPTIVE:
                diffDescriptive();
                break;
            case DIFF_VISUAL:
                diffVisual();
                break;
            default:
                console.log('Error -> Unknown DIFF type');
                break;
        }
    }
    
    function diffDescriptive() {
        var str;
        var stillLoading = typeof _diffLastResult !== 'object';

        if (stillLoading) {
            str = _diffLastResult;
        } else {
            str = _diffLastResult.delta;
            if (!str || str == '') {
                str = 'No difference';
            }
        }
        _diffOutput[0].innerHTML = str;

        if (stillLoading) {
            setTimeout(function () {
                emptyDiffOutput();
                diffDescriptive();
            }, PROGRESS_DELAY);
        }
    }
    
    function diffInlineOrSideBySide(viewType) {
        var leftJson, rightJson, sm, opcodes;
        var stillLoading = typeof _diffLastResult !== 'object';

        if (stillLoading) {
        _diffOutput[0].innerHtml = _diffLastResult;
            setTimeout(function () {
                emptyDiffOutput();
                diffInlineOrSideBySide(viewType);
            }, PROGRESS_DELAY);
            return;
        }

        leftJson = _diffLastResult.left['@items'];
        rightJson = _diffLastResult.right['@items'];
        
        // create a SequenceMatcher instance that diffs the two sets of lines
        sm = new difflib.SequenceMatcher(leftJson, rightJson);

        // get the opcodes from the SequenceMatcher instance
        // opcodes is a list of 3-tuples describing what changes should be made to the base text
        // in order to yield the new text
        opcodes = sm.get_opcodes();

        // build the diff view and add it to the current DOM
        _diffOutput[0].appendChild(diffview.buildView({
            baseTextLines: leftJson,
            newTextLines: rightJson,
            opcodes: opcodes,
            // set the display titles for each resource
            baseTextName: _diffLeftName,
            newTextName: _diffRightName,
            contextSize: 3,
            viewType: viewType
        }));
        _diffOutput.find('.author').remove();
    }
    
    function diffVisual() {
        var html = '';
        var stillLoading = typeof _diffHtmlResult !== 'object';

        if (stillLoading) {
            html += _diffHtmlResult;
        } else {
            html += '<div class="innerL">' + _diffHtmlResult.leftHtml + '</div>';
            html += '<div class="innerR">' + _diffHtmlResult.rightHtml + '</div>';
        }
        _diffOutput[0].innerHTML = html;
        
        if (stillLoading) {
            setTimeout(function () {
                emptyDiffOutput();
                diffVisual();
            }, PROGRESS_DELAY);
        }
    }

    function emptyDiffOutput() {
        _diffOutput.empty();
    }

    function descriptiveDiffCallback(result) {
        if (!result.status) {
            showNote('Unable to fetch comparison of cube:<hr class="hr-small"/>' + result.data);
            return;
        }
        _diffLastResult = result.data;
    }

    function htmlDiffCallback(result) {
        if (!result.status) {
            showNote('Unable to fetch visual comparison of cube:<hr class="hr-small"/>' + result.data);
            return;
        }
        _diffHtmlResult = result.data;
    }

    // ============================================ End Cube Comparison ================================================

    // ============================================= General Utilities =================================================
    function loop()
    {
        setInterval(function()
        {
            var now = Date.now();
            if (now - _searchLastKeyTime > 150 && _searchKeyPressed)
            {
                _searchKeyPressed = false;
                runSearch();
            }
        }, 500);
    }

    function createHeartBeatTransferObj() {
        var obj = {};
        for (var i = 0, len = _openCubes.length; i < len; i++) {
            var cubeInfo = getCubeInfo(_openCubes[i].cubeKey);
            var key = cubeInfo.slice(0, CUBE_INFO.TAB_VIEW).join(TAB_SEPARATOR);
            obj[key] = '';
        }

        return {obj:obj, aBuffer: new ArrayBuffer(1024 * 1024)};
    }

    function heartBeat() {
        var transferObj = createHeartBeatTransferObj();
        _heartBeatThread.postMessage(transferObj, [transferObj.aBuffer]);
        setInterval(function() {
            transferObj = createHeartBeatTransferObj();
            _heartBeatThread.postMessage(transferObj, [transferObj.aBuffer]);
        }, 60000);
    }

    function showNote(msg, title, millis)
    {
        _errorId = $.gritter.add({
            title: (title || 'Note'),
            text: msg,
            image: './img/cube-logo.png',
            sticky: !millis,
            append: false,
            time: (millis || 0)
        });
    }

    function clearError()
    {
        if (_errorId)
        {
            $.gritter.remove(_errorId);
            _errorId = null;
        }
    }

    function isHeadSelected() {
        return head === _selectedBranch;
    }

    function isSelectedCubeInHead() {
        var appId = getSelectedTabAppId();
        return appId ? appId.branch === head : true;
    }

    /**
     * Get the ApplicationID based on the user's selections.  Tenant is sent not sent (server will fill
     * that in based on authentication.
     * @returns {app: *, version: *, status: string, branch: *}
     */
    function getAppId()
    {
        return {
            'app':_selectedApp,
            'version':_selectedVersion,
            'status':_selectedStatus,
            'branch':_selectedBranch
        };
    }

    function getSelectedTabAppId() {
        return {
            'app': _selectedCubeInfo[CUBE_INFO.APP],
            'version': _selectedCubeInfo[CUBE_INFO.VERSION],
            'status': _selectedCubeInfo[CUBE_INFO.STATUS],
            'branch': _selectedCubeInfo[CUBE_INFO.BRANCH]
        };
    }

    function getSelectedCubeName()
    {
        return _selectedCubeName;
    }

    function getSelectedApp()
    {
        return _selectedApp;
    }

    function getSelectedVersion()
    {
        return _selectedVersion;
    }

    var getSelectedStatus = function()
    {
        return _selectedStatus;
    };

    var getSelectedBranch = function() {
        return _selectedBranch;
    };

    var setActiveTabViewType = function(viewType)
    {
        _activeTabViewType = viewType;
        return getActiveTabViewType();
    };

    var getActiveTabViewType = function()
    {
        if (!_activeTabViewType)
        {
            _activeTabViewType = 'n-cube' + PAGE_ID;
        }
        return _activeTabViewType;
    };

    // API
    return {
        getSelectedStatus: getSelectedStatus,
        buildTabs: buildTabs
    }

})(jQuery);

function frameLoaded()
{
    NCE.buildTabs();
    $('.fadeMe2').fadeOut(800, function()
    {
        $('.fadeMe2').remove();
    });
    $('#fadeMe1').fadeOut(500, function()
    {
        $('#fadeMe1').remove();
    });
}