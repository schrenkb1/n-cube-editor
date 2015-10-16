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
    var _cubeList = {};
    var _apps = [];
    var _statuses = ['RELEASE', 'SNAPSHOT'];
    var _versions = [];
    var _selectedCubeName = localStorage[SELECTED_CUBE];
    var _selectedApp = localStorage[SELECTED_APP];
    var _selectedVersion = localStorage[SELECTED_VERSION];
    var _selectedBranch;
    if (localStorage.getItem(SELECTED_BRANCH) == null)
    {
        localStorage[SELECTED_BRANCH] = head;
        _selectedBranch = head;
    }
    else
    {
        _selectedBranch = localStorage[SELECTED_BRANCH];
    }
    var _selectedStatus = "SNAPSHOT";
    var _errorId = null;
    var _activeTab = 'n-cubeTab';
    var _searchNames = $('#cube-search');
    var _searchContent = $('#cube-search-content');
    var _cubeCount = $('#ncubeCount');
    var _listOfCubes= $('#ncube-list');
    var _mergeCubeName = null;
    var _mergeSha1 = null;
    var _mergeHeadSha1 = null;
    var _searchLastKeyTime = Date.now();
    var _searchKeyPressed = false;
    var _mainTabPanel = $('#ncubeTabContent');

    //  modal dialogs
    var _selectBranchModal = $('#selectBranchModal');
    var _commitModal = $('#commitRollbackModal');

    initialize();

    function initialize()
    {
        startWorker();
        showActiveBranch();
        loadAppNames();
        loadVersions();
        loadNCubes();
        loadAppListView();
        loadStatusListView();
        loadVersionListView();
        buildMenu();
        clearSearch();
        loop();

        // Set up back button support (base a page on a app, version, status, branch, and cube name)
        $(window).on("popstate", function(e)
        {
            if (e.originalEvent.state !== null)
            {
                var state = e.originalEvent.state;
                _selectedApp = state.app;
                _selectedVersion = state.version;
                _selectedStatus = state.status;
                _selectedCubeName = state.cube;
                _selectedBranch = state.branch;
                showActiveBranch();
                loadAppNames();
                loadVersions();
                loadNCubes();
                loadAppListView();
                loadStatusListView();
                loadVersionListView();
                selectCubeByName(_selectedCubeName);
            }
        });

        $.fn.selectRange = function (start, end)
        {
            if (!end)
            {
                end = start;
            }
            return this.each(function ()
            {
                if (this.setSelectionRange)
                {
                    this.focus();
                    this.setSelectionRange(start, end);
                }
                else if (this.createTextRange)
                {
                    var range = this.createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', end);
                    range.moveStart('character', start);
                    range.select();
                }
            });
        };
        var appListDiv = $('#app-list-div');
        var appListPanel = appListDiv.find('> .panel-body');
        appListPanel.height(60);

        var statListDiv = $('#status-list-div');
        var statListPanel = statListDiv.find('> .panel-body');
        statListPanel.height(36);

        var verListDiv = $('#version-list-div');
        var verListPanel = verListDiv.find('> .panel-body');
        verListPanel.height(60);

        addListeners();

        $('body').layout({
            name:   "BodyLayout"
            //	reference only - these options are NOT required because 'true' is the default
            ,   closable:					true	// pane can open & close
            ,	resizable:					true	// when open, pane can be resized
            ,	slidable:					true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
            ,	livePaneResizing:			true
            ,   togglerLength_open:         60
            ,   togglerLength_closed:       "100%"
            //	some pane animation settings
            ,	west__animatePaneSizing:	false
            ,   west__fxName_open:          "none"
            ,	west__fxName_close:			"none"	// NO animation when closing west-pane
            ,   spacing_open:         5
            ,   spacing_closed:       5
            ,   west__resizeable:           true
            ,   west__size:                 250
            ,   west__minSize:              140
            //	enable showOverflow on west-pane so CSS popups will overlap north pane
            ,	west__showOverflowOnHover:	true
            ,   center__triggerEventsOnLoad: true
            ,   center__maskContents:       true
            //	enable state management
            ,	stateManagement__enabled:	false // automatic cookie load & save enabled by default
            ,	showDebugMessages:			false // log and/or display messages from debugging & testing code
        });
    }

    /**
     * Background worker thread that will send search filter text asynchronously to server,
     * fetch the results, and ship to main thread (which will be updated to the filtered list).
     */
    function startWorker()
    {
        if (typeof(Worker) !== "undefined")
        {
            _searchThread = new Worker("js/loadCubeList.js");
            _searchThread.onmessage = function(event)
            {
                var list = event.data;
                loadFilteredNCubeListView(list);
            };
        }
        else
        {
            alert('Sorry! No Web Worker support. Try using the Chrome browser.');
        }
    }

    function buildMenu()
    {
        var result = call('ncubeController.getMenu',[getAppId()]);
        if (result.status !== true)
        {
            showNote('Unable to load menu.' + result.data);
            return;
        }
        var menu = result.data;
        $('#appTitle').html(menu['~Title']);
        var ul = $('#menuList');

        $.each(menu, function (key, value)
        {
            if (!key.startsWith('~') && !key.startsWith('@') && !key.startsWith('#'))
            {
                var menuId = key.replace(/\s/g,'_') + 'Tab';
                var pageId = key.replace(/\s/g,'_') + 'PageId';
                var li = $('<li/>');
                var a = $('<a/>').prop({'id': menuId, 'href': '#' + pageId});
                a.attr({'data-toggle':'tab', 'style':"border-radius:8px"});
                a.html(key);
                li.append(a);
                ul.append(li);

                var div = $('<div/>').prop({class:'tab-pane', id:pageId});
                div.attr({style:'overflow:hidden;height:100%'});
                _mainTabPanel.append(div);

                var iframeId = 'iframe_' + pageId;
                var iframe = $('<iframe id="' + iframeId + '"/>');
                div.append(iframe);

                var html = value['html'];
                if (!html.startsWith('http:') && !html.startsWith('https:'))
                {
                    html += '?appId=' + JSON.stringify(getAppId());
                }
                iframe.attr({style:'position:relative;height:100%;width:100%', src:html});

                $('#' + menuId).click(function ()
                {
                    clearError();
                    _activeTab = menuId;

                    try
                    {
                        document.getElementById(iframeId).contentWindow.tabActivated(buildAppState());
                    }
                    catch (e)
                    {
                        console.log(e);
                    }
                });
            }
        });
    }

    function getCubeMap()
    {
        return _cubeList;
    }

    function buildAppState()
    {
        return {
            call: call,
            clearError: clearError,
            doesCubeExist: doesCubeExist,
            ensureModifiable: ensureModifiable,
            exec: exec,
            getAppId: getAppId,
            getCubeMap: getCubeMap,
            getProperCubeName: getProperCubeName,
            getSelectedCubeName: getSelectedCubeName,
            getSelectedApp: getSelectedApp,
            getSelectedVersion: getSelectedVersion,
            getSelectedStatus: getSelectedStatus,
            isHeadSelected: isHeadSelected,
            loadCube: loadCube,
            reloadCube: reloadCube,
            selectBranch: selectBranch,
            selectCubeByName: selectCubeByName,
            showNote: showNote
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
        loadCube(); // load spreadsheet side
        _searchNames.val('');
        _searchContent.val('');
        _cubeCount.html(Object.keys(_cubeList).length);
    }

    function selectCubeByName(cubeName)
    {
        _selectedCubeName = getProperCubeName(cubeName);
        localStorage[SELECTED_CUBE] = cubeName;
        loadCube(); // load spreadsheet side
    }

    function runSearch()
    {
        if (!_searchContent.val() || _searchContent.val() == '')
        {   // Perform filter client-side only (no server call)
            var mainList = _cubeList;
            if (_searchNames.val() && _searchNames.val() != '')
            {   // If there is content to filter by, then use it.
                var nameFilter = _searchNames.val();
                var list = [];
                var pattern = wildcardToRegexString(nameFilter);
                var regex = new RegExp(pattern, "i");

                $.each(_cubeList, function (key, value)
                {
                    var array = regex.exec(key);
                    if (array)
                    {
                        var loKey = key.toLowerCase();
                        var info = _cubeList[loKey];
                        info.pos = array.index;
                        info.endPos = array.index + array[0].length;
                        list.push(info);
                    }
                });

                list.sort(function (a, b)
                {
                    if (a.pos < b.pos)
                        return -1;
                    if (a.pos > b.pos)
                        return 1;

                    var aLo = a.name.toLowerCase();
                    var bLo = b.name.toLowerCase();
                    if (aLo < bLo)
                        return -1;
                    else if (aLo > bLo)
                        return 1;

                    return 0;
                });

                mainList = {};
                for (var i = 0; i < list.length; i++)
                {
                    var info = list[i];
                    mainList[info.name.toLowerCase()] = info;
                }
                list = [];
            }
            loadFilteredNCubeListView(mainList);
        }
        else
        {   // Do server side search as content was specified
            _searchThread.postMessage(
                [
                    _searchNames.val(),
                    _searchContent.val(),
                    {
                        "app": _selectedApp,
                        "version": _selectedVersion,
                        "status": _selectedStatus,
                        "branch": _selectedBranch
                    }
                ]);
        }
    }

    function addListeners()
    {
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
            if (e.keyCode == 27)
            {   // ESCape key
                clearSearch();
            }
        });

        _searchContent.keyup(function (e)
        {
            if (e.keyCode == 27)
            {   // ESCape key
                clearSearch();
            }
        });

        $('#cube-search-reset').click(function()
        {
            clearSearch();
        });

        $('#newCubeMenu').click(function ()
        {
            newCube()
        });
        $('#newCubeSave').click(function ()
        {
            newCubeSave()
        });
        $('#renameCubeMenu').click(function ()
        {
            renameCube();
        });
        $('#renameCubeOk').click(function ()
        {
            renameCubeOk();
        });
        $('#dupeCubeMenu').click(function ()
        {
            dupeCube();
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
        $('#restoreSelectAll').click(function()
        {
            checkAll(true, 'input[type="checkbox"]');
        });
        $('#restoreSelectNone').click(function()
        {
            checkAll(false, 'input[type="checkbox"]');
        });
        $('#revisionHistoryMenu').click(function ()
        {
            revisionHistory();
        });
        $('#revisionHistoryOk').click(function ()
        {
            revisionHistoryOk();
        });
        $('#showRefsToMenu').click(function ()
        {
            showRefsToCube();
        });
        $('#showRefsToClose').click(function ()
        {
            showRefsToCubeClose()
        });
        $('#showRefsFromMenu').click(function ()
        {
            showRefsFromCube()
        });
        $('#showRefsFromClose').click(function ()
        {
            showRefsFromCubeClose()
        });
        $('#showReqScopeMenu').click(function ()
        {
            showReqScope()
        });
        $('#showReqScopeClose').click(function ()
        {
            showReqScopeClose()
        });
        $('#releaseCubesMenu').click(function ()
        {
            releaseCubes()
        });
        $('#releaseCubesOk').click(function ()
        {
            releaseCubesOk()
        });
        $('#changeVerMenu').click(function ()
        {
            changeVersion()
        });
        $('#changeVerOk').click(function ()
        {
            changeVersionOk()
        });
        $('#clearCache').click(function()
        {
            clearCache();
        });

        addBranchListeners();
    }

    function loadAppListView()
    {
        $('#appCount').html(_apps.length);
        var list = $('#app-list');
        list.empty();
        $.each(_apps, function (index, value)
        {
            var li = $("<li/>");
            var anchor = $('<a href="#"/>');
            anchor.click(function ()
            {
                var appName = anchor.text();
                setListSelectedStatus(appName, '#app-list');
                localStorage[SELECTED_APP] = appName;
                _selectedApp = appName;
                loadVersions();
                loadVersionListView();
                loadNCubes();
                loadNCubeListView();
                loadCube();
                runSearch();
            });
            anchor.html(value);
            li.append(anchor);
            list.append(li);
        });
        setListSelectedStatus(_selectedApp, '#app-list');
    }

    function saveState()
    {
        var title = (_selectedCubeName ? _selectedCubeName : '') + ':' + (_selectedApp ? _selectedApp : '') + '/' + (_selectedVersion ? _selectedVersion : '') + '/' + (_selectedStatus ? _selectedStatus : '') + '/' + (_selectedBranch ? _selectedBranch : '');
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

    function loadStatusListView()
    {
        var list = $('#status-list');
        list.empty();
        $.each(_statuses, function (index, value)
        {
            var li = $("<li/>");
            var anchor = $('<a href="#"/>');
            anchor.click(function ()
            {
                var status = anchor.text();
                setListSelectedStatus(status, '#status-list');
                _selectedStatus = status;
                loadVersions();
                loadVersionListView();
                loadNCubes();
                loadNCubeListView();
                loadCube();
                runSearch();
            });
            anchor.html(value);
            li.append(anchor);
            list.append(li);
        });
        setListSelectedStatus(_selectedStatus, '#status-list');
    }

    function loadVersionListView()
    {
        $('#verCount').html(_versions.length);
        var list = $('#version-list');
        list.empty();
        $.each(_versions, function (index, value)
        {
            var li = $("<li/>");
            var anchor = $('<a href="#"/>');
            anchor.click(function ()
            {
                var version = anchor.text();
                setListSelectedStatus(version, '#version-list');
                localStorage[SELECTED_VERSION] = version;
                _selectedVersion = version;
                loadNCubes();
                loadNCubeListView();
                loadCube();
                runSearch();
            });
            anchor.html(value);
            li.append(anchor);
            list.append(li);
        });
        setListSelectedStatus(_selectedVersion, '#version-list');
    }

    function getActiveTab()
    {
        return _mainTabPanel.find('div.active iframe');
    }

    function loadNCubeListView()
    {
        loadFilteredNCubeListView(_cubeList);
    }

    function loadFilteredNCubeListView(cubes)
    {
        var filter = _searchNames.val();
        _listOfCubes.empty();
        var count = 0;

        $.each(cubes, function buildCubeList(loName, infoDto)
        {
            count++;
            var cubeName = infoDto.name;
            var li = $('<li/>');
            var a = $('<a href="#"/>');
            a.click(function()
            {
                selectCubeByName(loName);
            });

            if (_selectedCubeName == cubeName)
            {
                a.addClass('ncube-selected').removeClass('ncube-notselected');
            }
            else
            {
                a.addClass('ncube-notselected').removeClass('ncube-selected');
            }

            a.attr('itemName', loName);
            li.append(a);
            _listOfCubes.append(li);

            if (filter && infoDto.pos != null)
            {
                var nameHtml = cubeName.substring(0, infoDto.pos);
                nameHtml += '<span class="search-hilite">';
                nameHtml += cubeName.substring(infoDto.pos, infoDto.endPos);
                nameHtml += '</span>';
                nameHtml += cubeName.substring(infoDto.endPos);
                a.html(nameHtml);
            }
            else
            {
                a.html(cubeName);
            }

            if (!isHeadSelected())
            {
                if (!infoDto.headSha1)
                {
                    if (infoDto.sha1)
                    {
                        a.addClass('cube-added');
                    }
                    else if (infoDto.changeType == 'R')
                    {
                        a.addClass('cube-restored');
                    }
                }
                else
                {
                    if (infoDto.headSha1 != infoDto.sha1)
                    {
                        a.addClass('cube-modified');
                    }
                    else if (infoDto.changeType == 'R')
                    {
                        a.addClass('cube-restored');
                    }
                }
            }
        });

        _cubeCount.html(count);
    }

    function getProperCubeName(cubeName)
    {
        var nameToChk = (cubeName + '').toLowerCase();
        var info = _cubeList[nameToChk];
        return info ? info.name : null;
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

        setListSelectedStatus(_selectedCubeName, '#ncube-list');
    }

    /**
     * Tweak the class name of the selected / non-selected items
     * to match what was selected.
     */
    function setListSelectedStatus(itemName, listId)
    {
        var items = $(listId).find('li a');
        var saveSelected = null;
        var loItemName = itemName.toLowerCase();

        $.each(items, function (index, value)
        {
            var anchor = $(value);
            var text = anchor.html();
            var elemName = anchor.attr('itemName');
            if (loItemName == elemName || itemName == text)
            {
                saveSelected = anchor;
                anchor.removeClass('ncube-notselected').addClass('ncube-selected');
            }
            else
            {
                anchor.removeClass('ncube-selected').addClass('ncube-notselected');
            }
        });

        if (saveSelected)
        {
            saveSelected.scrollintoview();
        }
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

        // If there is no _selectedCubeName, establish one if possible (choose 1st cube in list)
        if (!_selectedCubeName || !doesCubeExist())
        {
            if (first)
            {
                _selectedCubeName = (_cubeList && first) ? _cubeList[first.toLowerCase()].name : null;
            }
            else
            {
                _selectedCubeName = null;
            }
        }
    }

    function doesCubeExist()
    {
        var nameToChk = (_selectedCubeName + '').toLowerCase();
        return nameToChk in _cubeList;
    }

    function loadVersions()
    {
        _versions = [];
        clearError();
        if (!_selectedApp)
        {
            showNote('Unable to load versions, no n-cube App selected.');
            return;
        }
        if (!_selectedStatus)
        {
            showNote('Unable to load versions, no n-cube Status selected.');
            return;
        }
        if (!_selectedBranch)
        {
            showNote('Unable to load versions, no branch selected.');
            return;
        }

        var result = call("ncubeController.getAppVersions", [_selectedApp, _selectedStatus, _selectedBranch]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                _versions[index] = value;
            });
        }
        else
        {
            showNote('Unable to load versions:<hr class="hr-small"/>' + result.data);
        }
        if (!_selectedVersion || !doesVersionExist(_selectedVersion))
        {
            _selectedVersion = (_versions && _versions.length > 0) ? _versions[_versions.length - 1] : null;
        }
    }

    function doesVersionExist(selVer)
    {
        for (var i=0; i < _versions.length; i++)
        {
            if (_versions[i] == selVer)
            {
                return true;
            }
        }
        return false;
    }

    function loadAppNames()
    {
        _apps = [];
        clearError();
        var result = call("ncubeController.getAppNames", [_selectedStatus, _selectedBranch]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                _apps[index] = value;
            });
        }
        else
        {
            showNote('Unable to load n-cube Apps:<hr class="hr-small"/>' + result.data);
        }
        if (!_selectedApp && _apps)
        {
            _selectedApp = _apps[0];
            localStorage[SELECTED_APP] = _selectedApp;
        }
        if (!_apps)
        {
            _selectedApp = localStorage[SELECTED_APP] = null;
        }
        else if (!doesItemExist(_selectedApp, _apps) && _apps.length > 0)
        {
            _selectedApp = _apps[0];
        }
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
        buildDropDown('#newCubeAppList', '#newCubeAppName', _apps, function (app)
        {
            var result = call("ncubeController.getAppVersions", [getAppId()]);
            if (result.status === true)
            {
                buildDropDown('#existVersionList', '#newCubeVersion', result.data, function ()
                {
                });
            }
            else
            {
                showNote('Failed to load App versions:<hr class="hr-small"/>' + result.data);
            }
        });
        buildDropDown('#existVersionList', '#newCubeVersion', _versions, function ()
        {
        });
        $('#newCubeModal').modal();
    }

    function newCubeSave()
    {
        $('#newCubeModal').modal('hide');
        var appName = $('#newCubeAppName').val();
        var cubeName = $('#newCubeName').val();
        var version = $('#newCubeVersion').val();
        if (!version)
        {
            showNote("Note", "Version must be x.y.z")
            return;
        }
        var appId = getAppId();
        appId.version = version;
        appId.app = appName;
        var result = call("ncubeController.createCube", [appId, cubeName]);
        if (result.status === true)
        {
            _selectedApp = appName;
            _selectedVersion = appId.version;
            loadAppNames();
            loadNCubes();
            loadVersions();
            loadAppListView();
            loadStatusListView();
            loadVersionListView();
            loadNCubeListView();
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
        if (!ensureModifiable('Cannot delete n-cube.'))
        {
            return;
        }

        $('#deleteCubeLabel').html("Delete '" + _selectedCubeName + "' ?");
        $('#deleteCubeModal').modal();
    }

    function deleteCubeOk()
    {
        $('#deleteCubeModal').modal('hide');
        var result = call("ncubeController.deleteCube", [getAppId(), _selectedCubeName]);
        if (result.status === true)
        {
            loadNCubes();
            runSearch();
        }
        else
        {
            showNote("Unable to delete n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
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
        $('#restoreCubeLabel').html('Restore Cubes in ' + _selectedVersion + ', ' + _selectedStatus);
        var result = call("ncubeController.search", [getAppId(), "*", null, false]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var li = $('<li/>').prop({class: 'list-group-item skinny-lr'});
                var div = $('<div/>').prop({class:'container-fluid'});
                var checkbox = $('<input>').prop({class:'restoreCheck', type:'checkbox'});
                var label = $('<label/>').prop({class: 'checkbox no-margins'}).text(value.name);
                checkbox.prependTo(label); // <=== create input without the closing tag
                div.append(label);
                li.append(div);
                ul.append(li);
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
                cubesToRestore.push($(this).parent().text());
            }
        });

        var result = call("ncubeController.restoreCube", [getAppId(), cubesToRestore]);
        if (result.status === true)
        {
            loadNCubes();
            loadNCubeListView();
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
            showNote("Unable to restore n-cube '" + _selectedCubeName + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function revisionHistory()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            showNote('No n-cube selected. No revision history to show.');
            return;
        }
        var ul = $('#revisionHistoryList');
        ul.empty();
        $('#revisionHistoryLabel').html('Revision History for ' + _selectedCubeName);
        $('#revisionHistoryModal').modal();
        var result = call("ncubeController.getRevisionHistory", [getAppId(), _selectedCubeName]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var li = $("<li/>").attr({'class': 'list-group-item skinny-lr'});
                var anchorHtml = $('<a href="#"/>');
                var anchorJson = $('<a href="#"/>');
                var anchorDiff = $('<a href="#"/>');

                var kbd1 = $('<kbd/>');
                kbd1.html('HTML');
                anchorHtml.append(kbd1);

                var kbd2 = $('<kbd/>');
                kbd2.html('JSON');
                anchorJson.append(kbd2);

                var kbd3 = $('<kbd/>');
                kbd3.html('Compare');
                anchorDiff.append(kbd3);

                var date = '';
                if (value.createDate != undefined)
                {
                    date = new Date(value.createDate).format('yyyy-mm-dd HH:MM:ss');
                }
                li.append(anchorHtml);
                li.append('&nbsp;&nbsp;&nbsp;');
                li.append(anchorJson);
                li.append('&nbsp;&nbsp;&nbsp;');
                li.append(anchorDiff);
                li.append('&nbsp;&nbsp;&nbsp;');
                li.append('rev: ' + value.revision + '&nbsp;&nbsp;&nbsp;' + date + '&nbsp;&nbsp;&nbsp;' + value.createHid);
                anchorHtml.click(function ()
                {
                    var title = value.name + '.rev.' + value.revision;
                    var oldHtml = window.open('', title + '.html');
                    var htmlReq = call("ncubeController.getCubeRevisionAs", [getAppId(), _selectedCubeName, value.revision, "html"]);
                    if (htmlReq.status === true)
                    {
                        oldHtml.document.removeChild(oldHtml.document.documentElement);
                        oldHtml.document.write(htmlReq.data);
                        oldHtml.document.title = title + '.html';
                    }
                });
                anchorJson.click(function ()
                {
                    var title = value.name + '.rev.' + value.revision;
                    var oldJson = window.open('', title + '.json');
                    var prettyJsonReq = call("ncubeController.getCubeRevisionAs", [getAppId(), _selectedCubeName, value.revision, "json-pretty"]);
                    if (prettyJsonReq.status === true)
                    {
                        oldJson.document.removeChild(oldJson.document.documentElement);
                        oldJson.document.write('<html><pre>');
                        oldJson.document.write(prettyJsonReq.data);
                        oldJson.document.write('</pre></html>');
                        oldJson.document.title = title + '.json';
                    }
                });
                anchorDiff.click(function ()
                {
                    var title = value.name + '.rev.' + value.revision;
                    window.open('http://www.prettydiff.com/', title);
                });
                ul.append(li);
            });
        }
        else
        {
            showNote('Error fetching revision history (' + _selectedVersion + ', ' + _selectedStatus + '):<hr class="hr-small"/>' + result.data);
        }
    }

    function revisionHistoryOk()
    {
        $('#revisionHistoryModal').modal('hide');
    }

    function renameCube()
    {
        if (!ensureModifiable('Unable to rename cube.'))
        {
            return;
        }

        $('#renameCubeAppName').val(_selectedApp);
        $('#renameCubeVersion').val(_selectedVersion);
        $('#renameCubeName').val(_selectedCubeName);
        $('#renameNewCubeName').val('');
        $('#renameCubeLabel').html('Rename');
        $('#renameCubeModal').modal();
    }

    function renameCubeOk()
    {
        $('#renameCubeModal').modal('hide');
        var oldName = $('#renameCubeName').val();
        var newName = $('#renameNewCubeName').val();
        var result = call("ncubeController.renameCube", [getAppId(), oldName, newName]);
        if (result.status === true)
        {
            loadNCubes();
            _selectedCubeName = newName;
            loadNCubeListView();
            loadCube();
            runSearch();
        }
        else
        {
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
        if (isHeadSelected())
        {
            selectBranch();
            return false;
        }

        $('#dupeCubeAppName').val(_selectedApp);
        $('#dupeCubeVersion').val(_selectedVersion);
        $('#dupeCubeName').val(_selectedCubeName);
        $('#dupeCubeLabel').html('Duplicate: ' + _selectedCubeName + ' ?');
        buildDropDown('#dupeCubeAppList', '#dupeCubeAppName', _apps, function (app)
        {
            var appId = {
                'app':app,
                'status':'SNAPSHOT',
                'branch':_selectedBranch
            };
            var result = call("ncubeController.getAppVersions", [appId]);
            if (result.status === true)
            {
                buildDropDown('#dupeCubeVersionList', '#dupeCubeVersion', result.data, function ()
                {
                });
            }
            else
            {
                showNote('Unable to load App versions:<hr class="hr-small"/>' + result.data);
            }
        });
        buildDropDown('#dupeCubeVersionList', '#dupeCubeVersion', _versions, function ()
        {
        });
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
            'status':'SNAPSHOT',
            'branch':_selectedBranch
        };
        var result = call("ncubeController.duplicateCube", [getAppId(), destAppId, _selectedCubeName, newName]);
        if (result.status === true)
        {
            loadAppNames();
            _selectedApp = newApp;
            loadAppListView();
            _selectedStatus = 'SNAPSHOT';
            setListSelectedStatus('SNAPSHOT', '#status-list');
            loadVersions();
            _selectedVersion = newVersion;
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

    function showRefsToCube()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            showNote('No n-cube selected. No (inbound) references to show.');
            return;
        }
        $('#showRefsToLabel').html('Inbound refs to: ' + _selectedCubeName);
        var ul = $('#refsToCubeList');
        ul.empty();
        $('#showRefsToCubeModal').modal();
        var result = call("ncubeController.getReferencesTo", [getAppId(), _selectedCubeName]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var li = $("<li/>").attr({'class': 'list-group-item skinny-lr'});
                var anchor = $('<a href="#"/>');
                anchor.html(value);
                anchor.click(function ()
                {
                    showRefsToCubeClose();
                    _selectedCubeName = getProperCubeName(value);
                    loadCube();
                });
                li.append(anchor);
                ul.append(li);
            });
        }
        else
        {
            showNote('Error fetching inbound references to ' + _selectedCubeName + ' (' + _selectedVersion + ', ' + _selectedStatus + '):<hr class="hr-small"/>' + result.data);
        }
    }

    function showRefsToCubeClose()
    {
        $('#showRefsToCubeModal').modal('hide');
    }

    function showRefsFromCube()
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            showNote('No n-cube selected. No (outbound) references to show.');
            return;
        }
        $('#showRefsFromLabel').html('Outbound refs of: ' + _selectedCubeName);
        var ul = $('#refsFromCubeList');
        ul.empty();
        $('#showRefsFromCubeModal').modal();
        var result = call("ncubeController.getReferencesFrom", [getAppId(), _selectedCubeName]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var li = $("<li/>").attr({'class': 'list-group-item skinny-lr'});
                var anchor = $('<a href="#"/>');
                anchor.html(value);
                anchor.click(function ()
                {
                    showRefsFromCubeClose();
                    _selectedCubeName = getProperCubeName(value);
                    loadCube();
                });
                li.append(anchor);
                ul.append(li);
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
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            showNote('No n-cube selected. No required scope to show.');
            return;
        }
        $('#showReqScopeLabel').html("Scope for '" + _selectedCubeName + "'");
        var ul = $('#reqScopeList');
        ul.empty();
        $('#showReqScopeModal').modal();
        var result = call("ncubeController.getRequiredScope", [getAppId(), _selectedCubeName]);
        if (result.status === true)
        {
            $.each(result.data, function (index, value)
            {
                var li = $("<li/>").attr({'class': 'list-group-item skinny-lr'});
                li.html(value);
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

    function releaseCubes()
    {
        if (!isHeadSelected())
        {
            showNote('HEAD branch must be selected to release a version.');
            return;
        }

        $('#releaseCubesLabel').html('Release ' + _selectedApp + ' ' + _selectedVersion + ' SNAPSHOT ?');
        $('#releaseCubesAppName').val(_selectedApp);
        $('#releaseCubesModal').modal();
    }

    function releaseCubesOk()
    {
        $('#releaseCubesModal').modal('hide');
        var newSnapVer = $('#releaseCubesVersion').val();
        var result = call("ncubeController.releaseCubes", [getAppId(), newSnapVer]);
        if (result.status === true)
        {
            var saveSelectedVersion = _selectedVersion;
            loadVersions();
            _selectedVersion = doesItemExist(saveSelectedVersion, _versions) ? saveSelectedVersion : _selectedVersion;
            loadVersionListView();
            loadNCubes();
            loadNCubeListView();
            loadCube();
            runSearch();

        }
        else
        {
            showNote("Unable to release version '" + _selectedVersion + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function changeVersion()
    {
        if (!ensureModifiable('Version cannot be changed.'))
        {
            return;
        }

        $('#changeVerLabel').html('Change ' + _selectedApp + ' ' + _selectedVersion + ' ?');
        $('#changeVerModal').modal();
    }

    function changeVersionOk()
    {
        $('#changeVerModal').modal('hide');
        var newSnapVer = $('#changeVerValue').val();
        var result = call("ncubeController.changeVersionValue", [getAppId(), newSnapVer]);
        if (result.status === true)
        {
            loadVersions();
            _selectedVersion = doesItemExist(newSnapVer, _versions) ? newSnapVer : _selectedVersion;
            loadVersionListView();
            loadNCubes();
            loadNCubeListView();
            loadCube();
            runSearch();
        }
        else
        {
            showNote("Unable to change SNAPSHOT version to value '" + newSnapVer + "':<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function ensureModifiable(operation)
    {
        clearError();
        if (!_selectedApp || !_selectedVersion || !_selectedCubeName || !_selectedStatus)
        {
            showNote(operation + ' No n-cube selected.');
            return false;
        }
        if (_selectedStatus == "RELEASE")
        {
            showNote(operation + ' Only a SNAPSHOT version can be modified.');
            return false;
        }
        if (isHeadSelected())
        {
            selectBranch();
            return false;
        }

        return true;
    }

    function clearCache()
    {
        var result = call("ncubeController.clearCache", [getAppId()]);

        if (result.status === false)
        {
            showNote('Unable to fetch the cell contents: ' + result.data);
        }
    }

    // ======================================== Everything to do with Branching ========================================

    function addBranchListeners()
    {
        // Main menu options
        $('#branchSelect').click(function()
        {
            selectBranch();
        });
        $('#branchCommit').click(function()
        {
            commitBranch(true);
        });
        $('#commitRollbackSelectAll').click(function()
        {
            checkAll(true, 'input[type="checkbox"]')
        });
        $('#commitRollbackSelectNone').click(function()
        {
            checkAll(false, 'input[type="checkbox"]')
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
            commitBranch(false);
        });
        $('#branchUpdate').click(function()
        {
            updateBranch();
        });
        $('#branchDelete').click(function()
        {
            deleteBranch();
        });
        $('#deleteBranchOk').click(function()
        {
            deleteBranchOk();
        });
        // From 'Select / Create Branch' Modal
        $('#createBranch').click(function()
        {
            createBranch();
        });
        $('#branchNameWarning').find('button').click(function()
        {
            $('#branchNameWarning').hide();
        });
        $('#acceptTheirs').click(function()
        {
            acceptTheirs();
        });
        $('#acceptMine').click(function()
        {
            acceptMine();
        });
    }

    function showActiveBranch()
    {
        $('#BranchMenu').html('Branch:&nbsp;<button class="btn-sm btn-primary">&nbsp;' + (_selectedBranch || head) + '&nbsp;<b class="caret"></b></button>');
    }

    function selectBranch()
    {
        clearError();
        $('#newBranchName').val("");
        $('#branchNameWarning').hide();

        var result = call("ncubeController.getBranches", []);

        if (!result.status)
        {
            showNote('Unable to get branches:<hr class="hr-small"/>' + result.data);
            return;
        }

        var branchNames = result.data;
        var ul = $('#branchList');
        ul.empty();

        $.each(branchNames, function (index, name)
        {
            if (!name)
            {
                name = head;
            }
            var li = $('<li/>').attr({'class': 'list-group-item skinny-lr'});
            var anchor = $('<a href="#"/>');
            anchor.html('<kbd> ' + name + ' </kbd>');
            anchor.click(function ()
            {
                changeBranch(name);
            });
            li.append(anchor);
            ul.append(li);
        });

        _selectBranchModal.modal('show');
    }

    function createBranch()
    {
        clearError();

        var branchName = $('#newBranchName').val();
        var validName = /^[a-zA-Z_][0-9a-zA-Z_.-]*$/i;

        if (!branchName || !validName.test(branchName) || head.toLowerCase() == branchName.toLowerCase())
        {
            $('#branchNameWarning').show();
            return;
        }

        var appId = getAppId();
        appId.branch = branchName;
        if (!_selectedApp || !_selectedVersion || !_selectedStatus)
        {
            changeBranch(branchName);
            return;
        }

        var result = call("ncubeController.createBranch", [appId]);
        if (!result.status)
        {
            showNote('Unable to create branch:<hr class="hr-small"/>' + result.data);
            return;
        }

        changeBranch(branchName);
    }

    function changeBranch(branchName)
    {
         if (head.toLowerCase() == branchName.toLowerCase())
         {
             branchName = head;
         }
        _selectedBranch = branchName;
        localStorage[SELECTED_BRANCH] = branchName;
        _selectBranchModal.modal('hide');

        showActiveBranch();
        loadAppNames();
        loadVersions();
        loadNCubes();
        loadAppListView();
        loadStatusListView();
        loadVersionListView();
        loadNCubeListView();
        loadCube();
        runSearch();
        showNote('<kbd>' + (branchName || head) + '</kbd>', 'Active Branch', 2000);
    }

    function commitBranch(state)
    {
        clearError();

        var errMsg;
        var title;
        var btnLabel;
        if (state)
        {
            errMsg = 'commit to';
            title = 'Commit changes';
            btnLabel = 'Commit';
            $('#commitOk').show();
            $('#rollbackOk').hide();
        }
        else
        {
            errMsg = 'rollback in';
            title = 'Rollback changes';
            btnLabel = 'Rollback';
            $('#commitOk').hide();
            $('#rollbackOk').show();
        }

        if (isHeadSelected())
        {
            showNote('You cannot ' + errMsg + ' HEAD.');
            return;
        }

        var result = call("ncubeController.getBranchChanges", [getAppId()]);

        if (!result.status || !result.data)
        {
            showNote('Unable to get branch changes:<hr class="hr-small"/>' + result.data);
            return;
        }

        $('#commitRollbackLabel').html(title);
        $('#commitRollbackOk').text(btnLabel);

        var branchChanges = result.data;

        _commitModal.prop('changes', branchChanges);
        var ul = $('#commitRollbackList');
        ul.empty();

        $.each(branchChanges, function (index, infoDto)
        {
            var li = $('<li/>').prop({class: 'list-group-item skinny-lr'});
            var div = $('<div/>').prop({class:'container-fluid'});
            var checkbox = $('<input>').prop({class:'commitCheck', type:'checkbox'});
            var label = $('<label/>').prop({class: 'checkbox no-margins'}).text(infoDto.name);

            if (!infoDto.headSha1)
            {
                if (infoDto.sha1)
                {
                    label.addClass('cube-added');
                }
                else
                {
                    if (infoDto.changeType == 'D')
                    {
                        label.addClass('cube-deleted');
                    }
                    else if (infoDto.changeType == 'R')
                    {
                        label.addClass('cube-restored');
                    }
                }
            }
            else
            {
                if (infoDto.headSha1 != infoDto.sha1)
                {
                    label.addClass('cube-modified');
                }
                else if (infoDto.changeType == 'D')
                {
                    label.addClass('cube-deleted');
                }
                else if (infoDto.changeType == 'R')
                {
                    label.addClass('cube-restored');
                }
            }
            checkbox.prependTo(label); // <=== create input without the closing tag
            div.append(label);
            li.append(div);
            ul.append(li);
        });

        checkAll(true, 'input[type="checkbox"]');

        //TODO: After Axis, column, or cell modifications, mark _selectedCubeName as modified (blue)
        //TODO: Eliminate scan through cubes 2nd time to set selected / not-selected (remember selected?)
        _commitModal.modal('show');
    }

    function commitOk()
    {
        var branchChanges = _commitModal.prop('changes');
        var input = $('.commitCheck');
        var changes = [];
        $.each(input, function (index, label)
        {
            if ($(this).is(':checked'))
            {
                changes.push(branchChanges[index]);
            }
        });

        _commitModal.modal('hide');
        var result = call("ncubeController.commitBranch", [getAppId(), changes]);

        if (result.status === false)
        {
            mergeBranch(result.data);
            return;
        }

        showNote('Successfully committed ' + changes.length + ' cube(s).', 'Note', 5000);

        loadNCubes();
        loadNCubeListView();
        reloadCube();
        runSearch();
    }

    function rollbackOk()
    {
        var branchChanges = _commitModal.prop('changes');
        var input = $('.commitCheck');
        var changes = [];
        $.each(input, function (index, label)
        {
            if ($(this).is(':checked'))
            {
                changes.push(branchChanges[index]);
            }
        });

        _commitModal.modal('hide');
        var result = call("ncubeController.rollbackBranch", [getAppId(), changes]);

        if (result.status === false)
        {
            showNote('Unable to rollback cubes:<hr class="hr-small"/>' + result.data);
            return;
        }

        showNote('Successfully rolled back ' + changes.length + ' cube(s).', 'Note', 5000);
        loadNCubes();
        loadNCubeListView();
        reloadCube();
        runSearch();
    }

    function updateBranch()
    {
        clearError();

        var result = call('ncubeController.updateBranch', [getAppId()]);
        if (!result.status)
        {
            mergeBranch(result.data);
            return;
        }

        showNote('Branch Updated');
        loadNCubes();
        loadNCubeListView();
        reloadCube();
        runSearch();
    }

    function deleteBranch()
    {
        if (isHeadSelected())
        {
            showNote('HEAD branch cannot be deleted.');
            return;
        }

        $('#deleteBranchLabel').html("Delete '" + _selectedBranch + "' ?");
        $('#deleteBranchModal').modal();
    }

    function deleteBranchOk()
    {
        $('#deleteBranchModal').modal('hide');
        clearError();

        var result = call('ncubeController.deleteBranch', [getAppId()]);
        changeBranch(head);
        if (!result.status)
        {
            showNote('Unable to delete branch:<hr class="hr-small"/>' + result.data);
        }
    }

    function mergeBranch(data)
    {
        var ul = $('#mergeList');
        ul.empty();
        $('#deltaDesc').val('');
        $.each(data, function(key, value)
        {
            if ('@type' != key)
            {
                var li = $('<li/>').prop({class: 'list-group-item skinny-lr'});
                var div = $('<div/>').prop({class:'container-fluid'});
                var checkbox = $('<input>').prop({type:'radio'});
                checkbox.click(function ()
                {
                    markMutuallyExclusive(checkbox);
                    var msg = data[key].message;
                    var diff = data[key].diff;
                    _mergeCubeName = key;
                    _mergeSha1 = data[key].sha1;
                    _mergeHeadSha1 = data[key].headSha1;

                    if (diff && diff['@items'] && diff['@items'].length > 0)
                    {
                        msg += '\n';
                        var len = diff['@items'].length;

                        for (var i=0; i < len; i++)
                        {
                            var delta = diff['@items'][i];
                            msg += (i + 1) + ': ' + delta.loc.name + ' ' + delta.type.name + ': ' + delta.desc + '\n';
                        }
                    }
                    $('#deltaDesc').val(msg);
                });
                var label = $('<label/>').prop({class: 'radio no-margins'}).text(key);
                checkbox.prependTo(label); // <=== create input without the closing tag
                div.append(label);
                li.append(div);
                ul.append(li);

            }
        });
        $('#mergeBranchModal').modal('show');
    }

    function markMutuallyExclusive(checkbox)
    {
        var inputs = $('#mergeList').find('input');
        $.each(inputs, function (key, value)
        {
            $(value).prop('checked', false);
        });
        checkbox.prop('checked', true );
    }

    function acceptTheirs()
    {
        $('#mergeBranchModal').modal('hide');

        if (_mergeCubeName == null)
        {
            showNote('No cube selected, nothing to merge.');
            return;
        }
        var result = call('ncubeController.acceptTheirs', [getAppId(), _mergeCubeName, _mergeSha1]);
        if (result.status === true)
        {
            showNote('Cube: ' + _mergeCubeName + ' updated in your branch with cube from HEAD');
        }
        else
        {
            showNote('Unable to update your branch cube: ' + _mergeCubeName + ' with cube from HEAD:<hr class="hr-small"/>' + result.data);
        }
        _mergeCubeName = null;
        _mergeSha1 = null;
        _mergeHeadSha1 = null;
        loadNCubes();
        loadNCubeListView();
        reloadCube();
        runSearch();
    }

    function acceptMine()
    {
        $('#mergeBranchModal').modal('hide');

        if (_mergeCubeName == null)
        {
            showNote('No cube selected, nothing to merge.');
            return;
        }
        var result = call('ncubeController.acceptMine', [getAppId(), _mergeCubeName, _mergeHeadSha1]);
        if (result.status === true)
        {
            showNote('Cube: ' + _mergeCubeName + ' updated in HEAD with cube from your branch');
        }
        else
        {
            showNote('Unable to update HEAD cube: ' + _mergeCubeName + ' with cube from your branch:<hr class="hr-small"/>' + result.data);
        }
        _mergeCubeName = null;
        _mergeSha1 = null;
        _mergeHeadSha1 = null;
        loadNCubes();
        loadNCubeListView();
        reloadCube();
        runSearch();
    }

    // =============================================== End Branching ===================================================

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

    function checkAll(state, queryStr)
    {
        var input = $(queryStr);
        $.each(input, function (index, btn)
        {
            $(this).prop('checked', state);
        });
    }

    function doesItemExist(item, list)
    {
        if (!item)
        {
            return false;
        }
        var found = false;
        $.each(list, function (index, value)
        {
            if (item.toLowerCase() === value.toLowerCase())
            {
                found = true;
                return;
            }
        });
        return found;
    }

    function showNote(msg, title, millis)
    {
        _errorId = $.gritter.add({
            title: (title || 'Note'),
            text: msg,
            image: './img/cube-logo.png',
            sticky: !millis,
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

    function isHeadSelected()
    {
        return head == _selectedBranch;
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
        }
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

    // API
    return {
        getSelectedStatus: getSelectedStatus
    }

})(jQuery);

function frameLoaded()
{
    $('#menuList').find(':first-child').find('a').click();
}