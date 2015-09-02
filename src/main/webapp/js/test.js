/**
 * Test Panel for N-Cube Editor
 *
 * @author Ken Partlow (kpartlow@gmail.com)
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

$(function ()
{
    $.info = {};
    var _testData = null;
    var _testSelectionAnchor = -1;
    var _duplicateTestModal = $('#duplicateTestModal');
    var _deleteTestModal = $('#deleteTestmodal');
    var _addParameterModal = $('#addParameterModal');
    var _deleteParameterModal = $('#deleteParameterModal');
    var _createNewTestModal = $('#createNewTestModal');
    var _renameTestModal = $('#renameTestModal');
    var _testResultsDiv = $('#testResultsDiv');
    var _testList = $('#testList');
    var _testListWarning = $('#testListWarning');
    var _testListItems = $('#testListItems');

    var _padding = ["", "0", "00", "000", "0000", "00000", "000000", "0000000", "00000000", "000000000", "0000000000" ];

    $('#renameTestOk').click(function ()
    {
        renameTestOk();
    });
    $('#deleteParameterOk').click(function ()
    {
        deleteParameterOk();
    });
    $('#addParameterMenu').click(function ()
    {
        addParameterMenu();
    });
    $('#addAssertionMenu').click(function ()
    {
        addNewAssertion();
    });
    $('#addParameterOk').click(function ()
    {
        addParameterOk();
    });
    $('#createTestsLink').click(function (e)
    {
        e.preventDefault();
        createNewTestMenu();
    });
    $('#generateTestsLink').click(function (e)
    {
        e.preventDefault();
        if (nce().ensureModifiable("Unable to generate tests."))
        {
            loadTestListView("ncubeController.generateTests");
        }
    });
    //  Set focused field when dialog appears so user can just start typing.
    _addParameterModal.on('shown.bs.modal', function () {
        $('#addParameterField').focus();
    });

    _createNewTestModal.on('shown.bs.modal', function () {
        $('#createNewTestField').focus();
    });

    _renameTestModal.on('shown.bs.modal', function () {
        $('#renameTestNewName').focus();
    });

    _duplicateTestModal.on('shown.bs.modal', function () {
        $('#duplicateTestNameField').focus();
    });

    //  Set default button clicked when <enter> is hit.
    _addParameterModal.on( 'keypress', function( e ) {
        if( e.keyCode === 13 ) {
            e.preventDefault();
            $('#addParameterOk').click();
        }
    });

    _renameTestModal.on( 'keypress', function( e ) {
        if( e.keyCode === 13 ) {
            e.preventDefault();
            $('#renameTestOk').click();
        }
    });

    _deleteParameterModal.on( 'keypress', function( e ) {
        if( e.keyCode === 13 ) {
            e.preventDefault();
            $('#deleteParameterOk').click();
        }
    });

    _duplicateTestModal.on( 'keypress', function( e ) {
        if( e.keyCode === 13 ) {
            e.preventDefault();
            $('#duplicateCurrentTestOk').click();
        }
    });

    _deleteTestModal.on( 'keypress', function( e ) {
        if( e.keyCode === 13 ) {
            e.preventDefault();
            $('#deleteTestOk').click();
        }
    });

    _createNewTestModal.on( 'keypress', function( e ) {
        if( e.keyCode === 13 ) {
            e.preventDefault();
            $('#addParameterOk').click();
        }
    });

    $('#runAllTestsMenu').click(function ()
    {
        $(this).css({'cursor':'wait'});
        runAllTests();
        $(this).css({'cursor':'default'})
    });

    $('#runAllTestsButton').click(function ()
    {
        $(this).css({'cursor':'wait'});
        runAllTests();
        $(this).css({'cursor':'default'})
    });

    $('#runCurrentTestMenu').click(function ()
    {
        $(this).css({'cursor':'wait'});
        runCurrentTest();
        $(this).css({'cursor':'default'})
    });

    $('#runTestButton').click(function ()
    {
        $(this).css({'cursor':'wait'});
        runCurrentTest();
        $(this).css({'cursor':'default'})
    });

    $('#runTestMenu').click(function ()
    {
        $(this).css({'cursor':'wait'});
        runCurrentTest();
        $(this).css({'cursor':'default'})
    });

    $('#renameCurrentTestMenu').click(function ()
    {
        renameCurrentTestMenu();
    });

    $('#renameTestMenu').click(function ()
    {
        renameCurrentTestMenu();
    });

    $('#deleteCurrentTestMenu').click(function ()
    {
        deleteCurrentTestMenu();
    });

    $('#deleteTestMenu').click(function ()
    {
        deleteCurrentTestMenu();
    });

    $('#deleteTestOk').click(function ()
    {
        deleteTestOk();
    });

    $('#createNewTestMenu').click(function ()
    {
        createNewTestMenu();
    });

    $('#createNewTestOk').click(function ()
    {
        createNewTestOk();
    });

    $('#duplicateCurrentTestMenu').click(function ()
    {
        duplicateCurrentTestMenu();
    });

    $('#duplicateTestMenu').click(function ()
    {
        duplicateCurrentTestMenu();
    });

    $("#duplicateCurrentTestOk").click(function ()
    {
        duplicateCurrentTestOk();
    });

    $('#deleteAllTestsMenu').click(function ()
    {
        deleteAllTestsMenu();
    });

    $('#deleteAllTestsOk').click(function ()
    {
        deleteAllTestsOk();
    });

    function loadTestListView(funcName)
    {
        if (!nce().getSelectedCubeName())
        {
            $('#selectedTestName').html('No n-cube selected.');
            return false;
        }

        _testData = null;
        _testSelectionAnchor = -1;

        enableTestItems();

        var testListResult = nce().call(funcName, [nce().getAppId(), nce().getSelectedCubeName()]);

        if (testListResult.status === true)
        {
            _testData = testListResult.data;
            _testSelectionAnchor = 0;
            refreshTestList();
        }
        else
        {
            var msg = 'Error fetching test data for: ' + nce().getSelectedCubeName();
            if (testListResult.data != null)
            {
                msg += (':<hr class="hr-small"/>' + testListResult.data);
            }
            nce().showNote(msg);
        }
    }

    function refreshTestList()
    {
        _testListItems.empty();

        var hasTests = _testData != null && _testData.length > 0;
        if (hasTests)
        {
            $("#testCount").html(_testData.length);
            $.each(_testData, function (index, value)
            {
                var anchor = $("<a/>").attr({'class': 'list-group-item'});
                anchor.html('<span class="glyphicon" style="vertical-align: -1px;"></span>&nbsp;&nbsp;' + value['name']);

                if (index == _testSelectionAnchor)
                {
                    anchor.toggleClass("selected");
                }

                anchor.click(function (e)
                {
                    var link = $(e.currentTarget);
                    _testSelectionAnchor = index;
                    clearTestSelection();
                    link.addClass("selected");
                    enableTestItems();
                    loadTestView();
                });
                _testListItems.append(anchor);
            });
        }
        loadTestView();
        enableTestItems();
        if (hasTests)
        {
            _testListWarning.addClass('hide');
            _testList.removeClass('hide');
        }
        else
        {
            _testListWarning.removeClass('hide');
            _testList.addClass('hide');
        }
    }

    function clearTestView()
    {
        $('#testParametersDiv').hide();
        $('#testAssertionsDiv').hide();
        $('#testNameDiv').hide();
        $('#testButtonGroupDiv').hide();
        _testResultsDiv.hide();

        $('#testParameters').empty();
        $('#testAssertions').empty();
        $('#testResults').empty();
    }

    function loadTestView()
    {
        clearTestView();

        if (!_testData || _testData.length == 0 || _testSelectionAnchor >= _testData.length || _testSelectionAnchor < 0)
        {
            _testSelectionAnchor = -1;
            return;
        }

        var testData = _testData[_testSelectionAnchor];
        var testParameters = $('#testParameters');
        var testAssertions = $('#testAssertions');

        try
        {
            $('#selectedTestName').html(testData['name']);
            var coordinate = testData['coord'];

            if (coordinate != null  && coordinate)
            {
                $.each(coordinate, function (index, item)
                {
                    var key = item['key'];
                    if (key.substring(0, 1) != "@")
                    {
                        var value = item['value'];
                        var isUrl = (value == null || value.isUrl == null) ? false : value.isUrl;
                        var v = (value == null || value.value == null) ? null : value.value;
                        var dataType = (value == null || value.dataType == null) ? null : value.dataType;
                        testParameters.append(buildParameter(key, dataType, isUrl, v, true, false, deleteParameter));
                    }
                });
            }

            var assertions = testData['expected'];
            if (assertions != null  && assertions)
            {
                $.each(assertions, function (index, value)
                {
                    var isUrl = value['isUrl'] == null ? null : value['isUrl'];
                    var v = value.value == null ? null : value.value;
                    var dataType = value.dataType == null ? null : value.dataType;
                    testAssertions.append(buildParameter(index + 1, "exp", isUrl, v, false, true, deleteAssertion));
                });
            }
        }
        catch (e)
        {
            console.log(e);
            nce().showNote('Unable to load test view:<hr class="hr-small"/>' + e.message);
        }

        $('#testParametersDiv').fadeIn('fast');
        $('#testAssertionsDiv').fadeIn('fast');
        $('#testNameDiv').fadeIn('fast');
        $('#testButtonGroupDiv').fadeIn('fast');
    }

    function buildParameter(labelText, type, isUrl, value, hasSelector, isRenumberable, deleteFunc)
    {
        var ident = generateRandomId();
        var labelGroup = $("<div/>").attr({'class': 'form-group', 'parameter-id':labelText, 'id':ident});
        var cat = ident + "-value";
        var label = $("<label/>").attr({'for': cat, 'class': 'control-label'}).html(labelText);
        var deleteParamButton = $("<a/>").attr({'class':'red-item pull-right', 'font-size':'9px', 'style':'padding: 1px 3px; font-size: 12px; line-height: 1.5; border-radius: 3px;'});
        var glyph = $("<span/>").attr({'class':'glyphicon glyphicon-remove', 'style':'vertical-align: -1px;' });

        deleteParamButton.append(glyph);
        deleteParamButton.click(deleteFunc);

        labelGroup.append(label);
        labelGroup.append(deleteParamButton);

        var inputGroupAddon = $("<span/>").attr({'class':'input-group-btn'});
        var controls = $("<div/>").attr({'class': 'controls'});
        var inputGroup = $("<div/>").attr({'class':'input-group input-group-sm'});
        var urlButton = $("<button/>").attr({'type':'button', 'class':'btn btn-default', 'value':'url'});

        if (isUrl)
        {
            urlButton.html("&nbsp;URL&nbsp;");
        }
        else
        {
            urlButton.html("Value");
        }

        urlButton.click(function ()
        {
            var txt = urlButton.text();
            if (txt == "Value")
            {
                urlButton.html("&nbsp;URL&nbsp;");
            }
            else
            {
                urlButton.html("Value");
            }
        });

        inputGroupAddon.append(urlButton);
        inputGroup.append(inputGroupAddon);
        inputGroup.append($("<input/>").attr({'class': 'form-control', 'type': 'text', 'id': cat}).val(value));

        if (hasSelector)
        {
            var selector = createTypeSelector(type, isUrl);
            inputGroup.append(selector);
            selector.selectpicker();
        }

        controls.append(inputGroup);
        labelGroup.append(controls);

        return labelGroup;
    }

    function renameAssertions()
    {
        $("#testAssertions .form-group").each(function (index, value)
        {
            var v = $(value);
            var count = index + 1;
            v.attr('parameter-id', count);
            v.find('label.control-label').html("" + count + ".");
            v.find('a[parameter-id]').attr('parameter-id', count);
        });
    }

    function deleteParameter(e)
    {
        var parent = $(e.currentTarget).parent("div.form-group");
        var param = parent.attr('parameter-id');
        var test = $('#selectedTestName').html();

        var title = "Delete Parameter?";
        var label = "Delete parameter '" + param + "' from '" + test + "'?";

        deleteTestItem(title, label, false, parent.attr('id'));
    }

    function deleteAssertion(e)
    {
        var parent = $(e.currentTarget).parent("div.form-group");
        var param = parent.attr('parameter-id');
        var test = $('#selectedTestName').html();
        var title = "Delete Assertion?";
        var label = "Delete assertion '" + param + "' from '" + test + "'?";

        deleteTestItem(title, label, true, parent.attr('id'));
    }

    function deleteTestItem(title, label, isRenumberable, paramId)
    {
        nce().clearError();
        if (!nce().getSelectedCubeName())
        {
            nce().showNote('No n-cube selected. Nothing to delete.');
            return;
        }

        $('#deleteParameterTitle').html(title);
        $('#deleteParameterLabel').html(label);
        $('#deleteParameterHiddenId').val(paramId);
        $('#deleteParameterOk').attr({'isRenumberable': isRenumberable});
        _deleteParameterModal.modal({
            keyboard: true
        });
    }

    function deleteParameterOk()
    {
        _deleteParameterModal.modal('hide');

        var id = $('#deleteParameterHiddenId').val();
        var isRenumberable = $('#deleteParameterOk').attr('isRenumberable')

        $('#' + id).remove();

        if (isRenumberable == "true") {
            renameAssertions();
        }

        saveAllTests(false);
    }

    function enableTestItems()
    {
        var count = _testListItems.find("a.selected").length;

        $("#renameCurrentTestMenu").parent().toggleClass('disabled', count != 1);
        $("#runCurrentTestMenu").parent().toggleClass('disabled', count != 1);
        $("#duplicateCurrentTestMenu").parent().toggleClass('disabled', count != 1);
        $("#deleteCurrentTestMenu").parent().toggleClass('disabled', count != 1);

        $("#renameTestMenu").parent().toggleClass('disabled', count != 1);
        $("#duplicateTestMenu").parent().toggleClass('disabled', count != 1);
        $("#runTestMenu").parent().toggleClass('disabled', count != 1);
        $("#deleteTestMenu").parent().toggleClass('disabled', count != 1);

        if (count != 1)
        {
            clearTestView();
        }
    }

    function deleteCurrentTestMenu()
    {
        nce().clearError();
        if (!nce().getSelectedCubeName())
        {
            nce().showNote('No n-cube is currently selected. There are not tests to delete.');
            return;
        }

        var list = $("#testListItems a.selected");

        if (list.length != 1)
        {
            if (list.length == 0)
            {
                nce().showNote('No test is currently selected. Select a test to delete.');
            }
            else
            {
                nce().showNote('More than one test is selected. There can only be one test selected to delete.');
            }
            return;
        }

        var test = _testData[_testSelectionAnchor]["name"];

        $('#deleteTestTitle').html("Delete Test");
        $('#deleteTestLabel').html("Are you sure you want to delete the test '" + test + "'?");
        $('#deleteTestModal').modal({
            keyboard: true
        });

    }

    function deleteTestOk()
    {
        nce().clearError();

        $('#deleteTestModal').modal('hide');

        _testData.splice(_testSelectionAnchor, 1);
        _testSelectionAnchor = -1;

        refreshTestList();
        saveAllTests(true);
    }

    function renameCurrentTestMenu()
    {
        nce().clearError();
        if (!nce().getSelectedCubeName())
        {
            nce().showNote('No n-cube is currently selected. Cannot rename test.');
            return;
        }

        var list = $("#testListItems a.selected");

        if (list.length != 1)
        {
            if (list.length == 0)
            {
                nce().showNote('No test is currently selected. Select a test to duplicate.');
            }
            else
            {
                nce().showNote('More than one test is selected. There can only be one test selected to duplicate.');
            }
            return;
        }

        var test = _testData[_testSelectionAnchor]["name"];

        $('#renameTestOldName').val(test);
        $('#renameTestNewName').val('');
        $('#renameTestLabel').html('Rename \'' + test + '\'?');

        _renameTestModal.modal({
            keyboard: true
        });
    }

    function testNameAlreadyExists(name)
    {
        if (_testData == null)
        {
            return false;
        }

        var found = false;
        $.each(_testData, function (index, value)
        {
            if (value['name'] == name)
            {
                found = true;
            }
        });

        return found;
    }

    function validateTestName(name)
    {
        var nameRegex = /^([A-Za-z0-9-.]{3,64})$/g;

        if (!nameRegex.test(name))
        {
            nce().showNote("Test name is invalid. Test names can only contain letters, numbers, and, ., and -");
            return false;
        }

        if (testNameAlreadyExists(name))
        {
            nce().showNote("There is already a test with that name.  Please rename and try again.");
            return false;
        }

        return true;
    }

    function renameTestOk()
    {
        nce().clearError();
        //var oldName = $('#renameTestOldName').val();
        var newName = $('#renameTestNewName').val();

        if (!validateTestName(newName))
        {
            return;
        }

        _renameTestModal.modal('hide');

        // change name of selected test
        $('#selectedTestName').html(newName);

        // change currently selected model item
        var test = _testData[_testSelectionAnchor];
        test["name"] = newName;

        saveAllTests(false);
    }

    function addParameterMenu()
    {
        nce().clearError();
        if (!nce().getSelectedCubeName())
        {
            nce().showNote('No n-cube selected. Cannot add test parameter.');
            return;
        }

        $('#addParameterField').val('');

        _addParameterModal.modal({
            keyboard: true
        });
    }

    function addParameterOk()
    {
        _addParameterModal.modal('hide');
        var id = $('#addParameterField').val();

        // check to see if parameter already exists in parameter-key of #testAssertions .form-group
        var param = buildParameter(id, "string", false, '', true, false, deleteParameter);

        if ($('#testParameters .form-group').length > 0)
        {
            param.insertAfter('#testParameters .form-group:last');
        }
        else
        {
            $('#testParameters').append(param);
        }

        saveAllTests(false);
    }

    function addNewAssertion()
    {
        var count = $('#testAssertions .form-group').length;
        var param = buildParameter(count+1, "exp", false, 'output.return', false, true, deleteAssertion);

        if (count > 0)
        {
            param.insertAfter('#testAssertions .form-group:last');
        }
        else
        {
            $('#testAssertions').append(param);
        }

        saveAllTests(false);
    }

    function runCurrentTest()
    {
        nce().clearError();
        if (!nce().getSelectedCubeName())
        {
            nce().showNote('No n-cube selected. Test cannot be run.');
            return;
        }

        if (_testData == null || _testSelectionAnchor == -1)
        {
            nce().showNote('No test selected.  Test cannot be run.');
            return;
        }

        try
        {
            var test = getActiveTest();
            _testData[_testSelectionAnchor] = test;

            var result = nce().call("ncubeController.runTest", [nce().getAppId(), nce().getSelectedCubeName(), test]);
            saveAllTests(true);

            if (result.status != true)
            {
                showTestResult(false, "Could not run test:  " + result.data);

                $('#testLayoutCenter > .well').animate({
                    scrollTop: _testResultsDiv.offset().top
                }, 200);

                return;
            }

            showTestResult(result.data["_result"], result.data["_message"]);


            $('#testLayoutCenter > .well').animate({
                scrollTop: _testResultsDiv.offset().top
            }, 200);

        }
        catch (e)
        {
            nce().showNote("Could not run cube test:<hr class=\"hr-small\"/>" + e.message);
        }
    }

    function runAllTests()
    {
        nce().showNote('Functionality not implemented yet.');
    }

    function saveAllTests(modelIsUpToDate)
    {
        if (!nce().ensureModifiable("Unable to save all tests."))
        {
            return;
        }

        if (_testData == null)
        {
            nce().showNote('No test selected.  There are no tests to save.');
            return;
        }

        if (!modelIsUpToDate)
        {
            var test = getActiveTest();

            //  If a test is currently selected
            if (test != null) {
                //  locate test in list to add it in...and add it before saving.
                _testData[_testSelectionAnchor] = test;
            }
        }

        var result = nce().call("ncubeController.saveTests", [nce().getAppId(), nce().getSelectedCubeName(), _testData]);

        if (!result.status)
        {
            nce().showNote("Unable to save TestData:<hr class=\"hr-small\"/>" + result.data);
        }
    }

    function getActiveTest()
    {
        var test = {};
        var name = $("#selectedTestName").html();

        if (name == null)
        {
            return null;
        }

        test["name"] = name;
        test["@type"] = "com.cedarsoftware.ncube.NCubeTest";
        test["coord"] = retrieveParameters();
        test["expected"] = retrieveAssertions();
        return test;
    }

    function retrieveParameters()
    {
        var parameters = $("#testParameters > div[parameter-id]");
        var coord = new Array(parameters.length);

        $.each(parameters, function (index, value)
        {
            var pair = {};
            var v = $(value);
            pair['key'] = v.attr("parameter-id");
            pair['value'] = retrieveCellInfo(v, true);
            coord[index] = pair;
        });

        return coord;
    }

    function retrieveAssertions()
    {
        var assertions = $('#testAssertions > div[parameter-id]');
        var array = new Array(assertions.length);

        $.each(assertions, function(index, value) {
            array[index] = retrieveCellInfo($(value), false);
        });

        return array;
    }

    function retrieveCellInfo(group, hasSelector)
    {
        var cell = {"@type":"com.cedarsoftware.ncube.CellInfo"};

        cell["value"] = group.find('input').val();
        cell["isUrl"] = group.find('button[value]').text() != "Value";

        if (hasSelector)
        {
            cell["dataType"] = group.find('select').val();
        }
        else
        {
            cell["dataType"] = "exp";
        }

        return cell;
    }

    function showTestResult(success, message)
    {
        _testResultsDiv.hide();
        var testResults = $('#testResults');
        testResults.empty();

        if (success)
        {
            _testResultsDiv.addClass("panel-success");
            _testResultsDiv.removeClass("panel-danger");
        }
        else
        {
            _testResultsDiv.addClass("panel-danger");
            _testResultsDiv.removeClass("panel-success");
        }

        testResults.html(message);
        _testResultsDiv.fadeIn("fast");
    }

    function clearTestSelection()
    {
        $("#testListItems").find("a.selected").each(function (index, elem)
        {
            $(elem).removeClass("selected");
        });
        enableTestItems();
    }

    function selectAllTests()
    {
        $("#testListItems").find("a").each(function (index, elem)
        {
            var a = $(elem);
            var span = a.find("span");
            a.addClass("selected");
        });
        enableTestItems();
    }

    function findTestByName(name)
    {
        if (_testData == null)
        {
            return null;
        }

        for (var i=0; i<_testData.length; i++)
        {
            if (name == _testData[i]["name"])
            {
                return _testData[i];
            }
        }
        return null;
    }

    function createNewTestMenu()
    {
        if (!nce().ensureModifiable("Unable to create a test."))
        {
            return;
        }

        if ($('#createNewTestMenu').parent().hasClass('disabled'))
        {
            return;
        }

        $('#createNewTestField').val('');
        _createNewTestModal.modal({
            keyboard: true
        });
    }

    function deleteAllTestsMenu()
    {
        nce().clearError();

        if ($('#deleteAllTestsMenu').parent().hasClass('disabled'))
        {
            return;
        }

        if (!nce().getSelectedCubeName())
        {
            nce().showNote('No n-cube is currently selected. You cannot delete all tests.');
            return;
        }

        $('#deleteAllTestsModal').modal({
            keyboard: true
        });
    }

    function deleteAllTestsOk()
    {
        $('#deleteAllTestsModal').modal('hide');

        _testData = [];
        _testSelectionAnchor = -1;

        saveAllTests(true);
        refreshTestList();
    }

    function createNewTestOk()
    {
        var newName = $('#createNewTestField').val().trim();

        if (findTestByName(newName) != null)
        {
            nce().showNote('There is already a test named \'' + newName + '\'.  Please choose a new name.');
            return;
        }

        var result = nce().call("ncubeController.createNewTest", [nce().getAppId(), nce().getSelectedCubeName(), newName]);

        if (result.status === true)
        {
            if (_testData == null)
            {
                _testData = [];
            }
            _testData.push(result.data);
            _testSelectionAnchor = _testData.length-1;

            refreshTestList();
            saveAllTests(true);

            _createNewTestModal.modal('hide');

            _testList.find('div.panel-body').animate({
                scrollTop: _testListItems.find('a.selected').offset().top
            }, 200);
        }
        else
        {
            var msg = 'Error creating new test for ' + nce().getSelectedCubeName();
            if (result.data != null)
            {
                msg += (':<hr class="hr-small"/>' + result.data);
            }
            nce().showNote(msg);
        }
    }

    function duplicateCurrentTestMenu()
    {
        nce().clearError();

        if ($('#duplicateCurrentTestMenu').parent().hasClass('disabled'))
        {
            return;
        }

        if (!nce().getSelectedCubeName())
        {
            nce().showNote('No n-cube is currently selected. Cannot duplicate a test.');
            return;
        }

        var list = getSelectedTestList();

        if (list.length != 1)
        {
            if (list.length == 0)
            {
                nce().showNote('No test is currently selected. Select a test to duplicate.');
            }
            else
            {
                nce().showNote('More than one test is selected. There can only be one test selected to duplicate.');
            }
            return;
        }

        $('#duplicateTestTitle').html('Duplicate \'' + $(list[0]).text().trim() + '\' ?');
        $('#duplicateTestNameField').val('');
        $('#duplicateTestModal').modal();
    }

    function getSelectedTestList()
    {
        return _testListItems.find('a.selected');
    }

    function getSelectedTestCount()
    {
        return getSelectedTestList().length;
    }

    function getSelectedTestFromModel()
    {
        var list = getSelectedTestList();
        return findTestByName($(list[0]).text().trim());
    }

    function duplicateCurrentTestOk()
    {
        // see if name already exists in tests?
        var newName = $('#duplicateTestNameField').val().trim();

        if (findTestByName(newName) != null)
        {
            nce().showNote('There is already a test named \'' + newName + '\'.  Please choose a new name.');
            return;
        }

        $('#duplicateTestModal').modal('hide');

        var newTest = duplicateTest(getSelectedTestFromModel(), newName);

        // scroll to item we just added.
        _testData.push(newTest);
        _testSelectionAnchor = _testData.length-1;
        refreshTestList();
        saveAllTests(true);

        _testList.find('div.panel-body').animate({
            scrollTop: _testListItems.find('a.selected').offset().top
        }, 200);
    }

    function duplicateTest(test, newTestName)
    {
        var newTest = {};
        newTest["@type"] = "com.cedarsoftware.ncube.NCubeTest";
        newTest["name"] = newTestName;

        var parameters = [];

        $.each(test["coord"], function(index, item) {
            var pair = {};
            pair["key"] = item["key"];
            var cell = item["value"];
            var newCell = {};

            if (!cell)
            {
                pair["value"] = null;
            }
            else
            {
                $.each(cell, function(key, value) {
                    newCell[key] = value;
                });
                pair["value"] = newCell;
            }

            parameters.push(pair);
        });

        newTest["coord"] = parameters;
        var result = [];

        $.each(test["expected"], function(index, item) {
            var newCell = {};

            if (!item)
            {
                newCell = null;
            }
            else
            {
                $.each(item, function (key, value) {
                    newCell[key] = value;
                });
            }

            result.push(newCell);
        });

        newTest["expected"] = result;
        return newTest;
    }

    function createTypeSelector(typeStr, url)
    {
        if (typeStr == null)
        {
            typeStr = 'string';
        }
        var selector = $("<select/>").attr({'class': 'selectpicker show-tick show-menu-arrow', 'data-width':'auto', 'data-style': 'btn-default'});
        return fillTypeSelector(selector, typeStr, url);
    }

    function fillTypeSelector(selector, typeStr, url)
    {
        if (selector == null)
        {
            return;
        }
        selector.empty();

        var options = null;

        if (url)
        {
            options = $('#datatypes-url').find('option');
        }
        else
        {
            options = $('#datatypes-value').find('option');
        }

        $.each(options, function (i, value)
        {
            var item = $(value);
            var opt = $("<option/>").attr({'value': item.val()});
            opt.text(item.text());

            if (typeStr != null && typeStr == item.val())
            {
                opt.prop({'selected' : true});
            }
            selector.append(opt);
        });

        return selector;
    }

    function leftPad (str, length)
    {
        var pad = length - str.length;

        if (pad < 1 || pad > 11) {
            return str;
        }

        return _padding[pad] + str;
    }

    // these are just temporary to use as an id
    function generateRandomId()
    {
        return leftPad(Math.random().toString(36).substring(7), 11);
    }

    $.loadData = function()
    {
        if (!nce().getCubeMap() || !nce().doesCubeExist())
        {
            return;
        }

        var info = nce().getCubeMap()[(nce().getSelectedCubeName() + '').toLowerCase()];
        if (!info)
        {
            return;
        }

        var secondaryLayout = $('#testBody').layout({
            name: "secondaryLayout"
            ,   closable:					true	// pane can open & close
            ,	resizable:					true	// when open, pane can be resized
            ,	slidable:					true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
            ,	livePaneResizing:			true
            ,	east__minSize:				170
            ,   togglerLength_open:         60
            ,   togglerLength_closed:       "100%"
            ,	spacing_open:			5  // ALL panes
            ,	spacing_closed:			5 // ALL panes
            //            ,	south__spacing_open:			5  // ALL panes
            //,	south__spacing_closed:			5 // ALL panes
            ,  east__onresize: function()
            {
                calculateTestPanelSize();
            }
        });

        loadTestListView("ncubeController.getTests");
        calculateTestPanelSize();
        secondaryLayout.resizeAll();
    };

    function calculateTestPanelSize()
    {
        var east = $('#testLayoutEast');
        var testList = _testList.find('> .panel-body');
        testList.height(east.height() - 47);
    }
});

function nce()
{
    return $.info.fn;
}

function tabActivated(info)
{
    try
    {
        $.info = info;
        $.loadData();
    }
    catch (e)
    {
        console.log(e);
    }
}