import CuteFileBrowser from './assets/js/CuteFileBrowser.js';
import Dialog from './assets/js/Dialog.js'
import Config from './Config.js';

var config;
var serverUrl;
var cfb;
var dialog;
var hostNames = [];

init();

updateHostNames();


function init() {
    initConfig();
    initDialog();
    initCuteFileBrowser();
    initDateTimePicker();
    initListener();
    initTimeSlider();
}

function initConfig() {
    config = new Config().getConfig();
    serverUrl = config.url;
}

function initCuteFileBrowser() {
    cfb = new CuteFileBrowser(serverUrl, dialog);
}

function initDialog() {
    dialog = new Dialog();
}


function updateHostNames() {
    $.ajax({
        type: 'GET',
        url: serverUrl + ':8080/hostname',
        success: function(res){
            if(res && res.length > 0) {
                hostNames = res;
                setHostNames(res);
            }
            console.log('hostnames:' + res);
        },
        error: function(res) {
            dialog.showMessage('Error: no Hostname found!');
        }
    });
}

function setHostNames(hostNames) {
    var dropdown = $('.dropdown-menu');
    dropdown.empty();
    for(var i=0; i < hostNames.length; i++) {
        var item = $('<a class="dropdown-item" href="#"></a>');
        item.text(hostNames[i]);
        item.on('click', function(e) {
            $('#dropdownMenuButton').text($(e.target).text());
            dropdown.removeClass('unselected');
        });
        dropdown.append(item);
    }
}

function initDateTimePicker() {
    $('#datetimepickerStart').datetimepicker({
        format: 'MM/DD/YYYY HH:mm:ss'
    });
    $('#datetimepickerEnd').datetimepicker({
        useCurrent: false,
        format: 'MM/DD/YYYY HH:mm:ss'
    });
}

function initTimeSlider() {
    $('#slider-range').slider({
        disabled: true,
        range: true, 
        min: 0,
        max: 1,
        values: [0, 1]
    });
}

function initListener() {
    $("#datetimepickerStart").on("change.datetimepicker", function (e) {
        $('#datetimepickerEnd').datetimepicker('minDate', e.date);
    });
    $("#datetimepickerEnd").on("change.datetimepicker", function (e) {
        $('#datetimepickerStart').datetimepicker('maxDate', e.date);
    });

    $('#nav-item-list').on('click', function(e) {
        updateHostNames();
        $('.container').hide();
        $('.container-list').show();
        $('.filebrowser-actions').show();
    });

    $('#nav-item-restore').on('click', function(e) {
        updateRestoreList();
        $('.container').hide();
        $('.container-restore').show();
    });

    $('#nav-item-entropy').on('click', function(e) {
        updateEntropyList();
        $('.container').hide();
        $('.container-entropy').show();
    })

    $('#applyFilter').on('click', function(e) {

        if($('.dropdown-menu').hasClass('unselected')) {
            dialog.showMessage("Select a Hostname!");
        } else {
            var hostname = $('#dropdownMenuButton').text();
            var regex = $('#inputRegex').val();

            var startDate;
            var datePickerStart = $('#datetimepickerStart');
            if(datePickerStart.find('.datetimepicker-input').val() === "") {
                startDate = "";
            } else {
                startDate = getTimeOfTimePicker(datePickerStart);
            }

            var endDate;
            var datePickerEnd = $('#datetimepickerEnd');
            if(datePickerEnd.find('.datetimepicker-input').val() === "") {
                endDate = "";
            } else {
                endDate = getTimeOfTimePicker(datePickerEnd);
            }

            applyFilter(hostname, regex, startDate, endDate);
        }
    });
}

function updateEntropyList() {
    var entropyContainer = $('.container-entropy');
    var listContainer = entropyContainer.find('.list-group');
    listContainer.empty();
    getEntropyList();
}

function getEntropyList() {
    $.ajax({
        type: 'GET',
        url: serverUrl + ':8080/entropyList',
        success: function(res){
            if(res) {
                setEntropyList(res);
            }
        },
        error: function(res) {
            dialog.showMessage('Error: Could not get entropy list.');
        }
    });
}

function setEntropyList(list) {
    // sort the list
    list.sort(function(a, b) {
        return parseFloat(b.name) - parseFloat(a.name);
    });
    for(var i = 0; i < list.length; i++) {
        // list[i].name: unix.csv
        var name = list[i].name.split('.')[0];
        var date = moment.unix(name).format('MMMM Do YYYY, HH:mm:ss');

        var li = $('<li class="list-group-item" data-name="' +list[i].name + '">' +
            '<h5 class="card-title">' + date + '</h5>' +
            '<p class="card-text">FileSize: ' + cfb.bytesToSize(list[i].fsize) + '</p>' +
            '<span class="download-icon" title="Download entropy"><i class="fa fa-download"></i></span>' +
            '<span class="delete-icon" title="Delete entropy"><i class="fa fa-trash"></i></span></li>');

        li.on('click', function(e) {
            var $target = $(e.target);
            if(!$target.hasClass('list-group-item')) {
                $target = $target.parents('.list-group-item');
            }
            listContainer.find('.list-group-item.active').removeClass('active');
            $target.addClass('active');
        }.bind(this));

        li.find('.download-icon').on('click', function(e) {
            e.stopPropagation();
            var $target = $(e.target);
            var $parent = $target.parents('.list-group-item');
            var name = $parent.attr('data-name');
            cfb.downloadFile(serverUrl + ':8080/downloadEntropy/' + name);
        }.bind(this));

        li.find('.delete-icon').on('click', function(e) {
            e.stopPropagation();
            var $target = $(e.target);
            var $parent = $target.parents('.list-group-item');
            var name = $parent.attr('data-name');
            var func = function() {
                deleteEntropy(name, $parent);
            }
             var splittedName = name.split('.')[0];
             var date = moment.unix(splittedName).format('MMMM Do YYYY, HH:mm:ss');
            dialog.askDialog(func, "Do you really want to delete the entropy " + date +  "?");
        }.bind(this));

        var entropyContainer = $('.container-entropy');
        var listContainer = entropyContainer.find('.list-group');
        listContainer.append(li)
    }
}

function deleteEntropy(name, $li) {
    var title = $li.find('.card-title').text();

    $.ajax({
        type: 'DELETE',
        url: serverUrl + ':8080/entropy/' + name,
        success: function(res){
            if(res) {
                $li.remove();
                dialog.showMessage('Entropy ' + title + ' was deleted successfully.');
            }
            console.log('success:' + res);
        },
        error: function(res) {
            dialog.showMessage('Error: Entropy ' + title + ' could not be deleted.');
        }
    });
}

function updateRestoreList() {
    var restoreContainer = $('.container-restore');
    var listContainer = restoreContainer.find('.list-group');
    listContainer.empty();
    getRestoreList();
}

function getRestoreList() {
    $.ajax({
        type: 'GET',
        url: serverUrl + ':8080/folderList',
        success: function(res){
            if(res) {
                setRestoreList(res);
            }
        },
        error: function(res) {
            dialog.showMessage('Error: Could not get restore list.');
        }
    });
}

function setRestoreList(list) {
    // sort the list
    list.sort(function(a, b) {
        return parseFloat(b.name) - parseFloat(a.name);
    });
    for(var i = 0; i < list.length; i++) {
        var date = moment.unix(list[i].name).format('MMMM Do YYYY, HH:mm:ss');

        var li = $('<li class="list-group-item" data-name="' +list[i].name + '">' +
            '<h5 class="card-title">' + date + '</h5>' +
            '<p class="card-text">FileSize: ' + cfb.bytesToSize(list[i].fsize) + '</p>' +
            '<span class="download-icon" title="Download restored folder"><i class="fa fa-download"></i></span>' +
            '<span class="delete-icon" title="Delete restored folder"><i class="fa fa-trash"></i></span></li>');

        li.on('click', function(e) {
            var $target = $(e.target);
            if(!$target.hasClass('list-group-item')) {
                $target = $target.parents('.list-group-item');
            }
            listContainer.find('.list-group-item.active').removeClass('active');
            $target.addClass('active');
        }.bind(this));

        li.find('.download-icon').on('click', function(e) {
            e.stopPropagation();
            var $target = $(e.target);
            var $parent = $target.parents('.list-group-item');
            var name = $parent.attr('data-name');
            cfb.downloadFile(serverUrl + ':8080/downloadFolder/' + name);
        }.bind(this));

        li.find('.delete-icon').on('click', function(e) {
            e.stopPropagation();
            var $target = $(e.target);
            var $parent = $target.parents('.list-group-item');
            var name = $parent.attr('data-name');
            var func = function() {
                deleteRestoreFolder(name, $parent);
            }
            var date = moment.unix(name).format('MMMM Do YYYY, HH:mm:ss');
            dialog.askDialog(func, "Do you really want to delete the restored folder " + date +  "?");
        }.bind(this));

        var restoreContainer = $('.container-restore');
        var listContainer = restoreContainer.find('.list-group');
        listContainer.append(li);
    }
}

function deleteRestoreFolder(name, $li) {
    var title = $li.find('.card-title').text();

    $.ajax({
        type: 'DELETE',
        url: serverUrl + ':8080/restoredFolder/' + name,
        success: function(res){
            if(res) {
                $li.remove();
                dialog.showMessage('Folder ' + title + ' was deleted successfully.');
            }
            console.log('success:' + res);
        },
        error: function(res) {
            dialog.showMessage('Error: Folder ' + title + ' could not be deleted.');
        }
    });
}

function applyFilter(hostname, regex, startDate, endDate) {

    var parameter = {}
    parameter['regex'] = encodeURIComponent(regex);
    if(startDate !== "") {
        parameter['startDate'] = startDate;
    }
    if(endDate !== "") {
        parameter['endDate'] = endDate;
    }
    $.ajax({
        type: 'GET',
        url: serverUrl + ':8080/restoreList/' + hostname,
        data: parameter,
        success: function(res){
            if(res) {
                cfb.loadFiles(res, hostname, regex, startDate, endDate);
            }
        },
        error: function(res) {
            dialog.showMessage('Error: applying Filter failed. No Files loaded/updated.')
        }
    });
}

function getTimeOfTimePicker($timepicker) {
    var dateString = $timepicker.data('date');
    var date = moment(dateString);
    var time = date.unix();
    return time;
}