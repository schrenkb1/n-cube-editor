/**
 * RPM Editor
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

var RpmEditor = (function($)
{
    var hot = null;
    var nce = null;

    $(window).resize(function ()
    {
        RpmEditor.render();
    });

    var showRpmError = function(msg)
    {
        $('#rpmErrorPanel').removeAttr('hidden');
        $('#viewRpmInfo').attr('hidden', true);
        $('#rpmErrorMsg').html(msg);
    };

    var clearRpmError = function()
    {
        $('#rpmErrorPanel').attr('hidden', true);
        $('#viewRpmInfo').removeAttr('hidden');
    };

    var init = function()
    {
        nce = $.info.fn;
        if (!nce.getCubeMap() || !nce.doesCubeExist())
        {
            showRpmError('No cubes available.');
            return;
        }

        var info = nce.getCubeMap()[(nce.getSelectedCubeName() + '').toLowerCase()];
        if (!info)
        {
            showRpmError('No cube selected.');
            return;
        }

        var loName = nce.getSelectedCubeName().toLowerCase();

        if (loName.indexOf('rpm.class') != 0 && loName.indexOf('rpm.enum') != 0)
        {
            showRpmError(nce.getSelectedCubeName() + ' is not an RPM Class.');
            return;
        }

        clearRpmError();

        // 1. Call server to fetch Rpm Class data in JSON format.
        // 2. Build out table
        // 3. Plop in links
        var fieldNames = [];
        for (var i=0; i < 50; i++)
        {
            fieldNames.push('field' + (i + 1));
        }
        var data1 = [
                ['', 'Kia', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford','Kia', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford','Kia', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford','Kia', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
                ['2012', 10, 11, 12, 13, 15, 16],
                ['2013', 10, 11, 12, 13, 15, 16],
                ['2014', 10, 11, 12, 13, 15, 16],
                ['2015', 10, 11, 12, 13, 15, 16],
                ['2016', 10, 11, 12, 13, 15, 16],
                ['2017', 10, 11, 12, 13, 15, 16],
                ['2018', 10, 11, 12, 13, 15, 16],
                ['2019', 10, 11, 12, 13, 15, 16],
                ['2020', 10, 11, 12, 13, 15, 16],
                ['2021', 10, 11, 12, 13, 15, 16],
                ['2022', 10, 11, 12, 13, 15, 16],
                ['2023', 10, 11, 12, 13, 15, 16],
                ['2024', 10, 11, 12, 13, 15, 16],
                ['2025', 10, 11, 12, 13, 15, 16],
                ['2026', 10, 11, 12, 13, 15, 16],
                ['2027', 10, 11, 12, 13, 15, 16],
                ['2028', 10, 11, 12, 13, 15, 16],
                ['2029', 10, 11, 12, 13, 15, 16],
                ['2030', 10, 11, 12, 13, 15, 16],
                ['2031', 10, 11, 12, 13, 15, 16],
                ['2032', 10, 11, 12, 13, 15, 16],
                ['2033', 10, 11, 12, 13, 15, 16],
                ['2034', 10, 11, 12, 13, 15, 16],
                ['2035', 10, 11, 12, 13, 15, 16],
                ['2036', 10, 11, 12, 13, 15, 16],
                ['2037', 10, 11, 12, 13, 15, 16],
                ['2038', 10, 11, 12, 13, 15, 16],
                ['2039', 10, 11, 12, 13, 15, 16],
                ['2040', 10, 11, 12, 13, 15, 16],
                ['2041', 10, 11, 12, 13, 15, 16],
                ['2042', 10, 11, 12, 13, 15, 16],
                ['2043', 10, 11, 12, 13, 15, 16],
                ['2044', 10, 11, 12, 13, 15, 16],
                ['2045', 10, 11, 12, 13, 15, 16],
                ['2046', 10, 11, 12, 13, 15, 16],
                ['2047', 10, 11, 12, 13, 15, 16],
                ['2048', 10, 11, 12, 13, 15, 16],
                ['2049', 10, 11, 12, 13, 15, 16],
                ['2050', 10, 11, 12, 13, 15, 16],
                ['2051', 10, 11, 12, 13, 15, 16],
                ['2052', 10, 11, 12, 13, 15, 16],
                ['2053', 10, 11, 12, 13, 15, 16],
                ['2054', 10, 11, 12, 13, 15, 16],
                ['2055', 10, 11, 12, 13, 15, 16],
                ['2056', 10, 11, 12, 13, 15, 16],
                ['2057', 10, 11, 12, 13, 15, 16],
                ['2058', 10, 11, 12, 13, 15, 16],
                ['2059', 10, 11, 12, 13, 15, 16]
            ],
            container = document.getElementById('rpmTable'),
            settings = {
                data: data1,
                colHeaders: true,
                rowHeaders: fieldNames,
                //contextMenu: true,
                manualColumnResize: true,
                height:500
            };

        hot = new Handsontable(container, settings);
        hot.render();
    };

    var render = function()
    {
        if (!hot)
        {
            return;
        }
        hot.render();
    };

    var handleCubeSelected = function()
    {
        init();
    };

    return {
        init: init,
        render: render,
        handleCubeSelected: handleCubeSelected
    };

})(jQuery);


// Event handlers for events from NCE Frame
var tabActivated = function tabActivated(info)
{
    $.info = info;
    RpmEditor.init();
};

var cubeSelected = function cubeSelected()
{
    RpmEditor.handleCubeSelected();
};