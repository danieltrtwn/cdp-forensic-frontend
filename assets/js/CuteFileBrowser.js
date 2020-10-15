export default class CuteFileBrowser {

	serverUrl;

	// describes the current path in the filebrower
	currentPath = '';

	// jQuery Object
	filemanager;

	// jQuery Object
	breadcrumbs;

    // jQuery Object
	fileList;

	// Array of all folders
	folders = [];

	// Array of all files
	files = [];

    // Array of all timestamps
	allTimestamps = [];

	// Array of sorted unique timestamps
	sortedUniqueTimestamps = [];

	// selected hostname for the filebrowser
	hostname = "";

	// selected filter/regex for the filebrowser
	regex = "";

	// selected startDate for the filebrowser
	startDate;

	// selected endDate for the filebrowser
	endDate;

    // the rootPath is neccessary in order to generate the tree structure in originalData and filteredData
	rootPath = "/pseudoRoot";

	// variable that decides if originalData or filteredData will be used
	useOriginalData = true;

	// original data object that contains all files and objects
	originalData;

	// filtered data object that contains filtered files and objects
	filteredData;

    // instance of Dialog.js
	dialog;

	constructor(url, dialog) {
		this.serverUrl = url;
		this.dialog = dialog;
		this.init();
	}

	getData() {
		if(this.useOriginalData) {
			return this.originalData;
		} else {
			return this.filteredData;
		}
	}

	init() {
	    this.filemanager = $('.filemanager');
        this.breadcrumbs = $('.breadcrumb');
        this.fileList = this.filemanager.find('.data');

        // Hiding and showing the search box
        this.filemanager.find('.search-icon').click(function(e){
            var $target = $(e.target);
            var search = $(e.target).parents('.search');
            search.find('input[type=search]').focus();
        }.bind(this));

        // Listening for keyboard input on the search field.
        this.filemanager.find('input').on('input', function(e){
            this.folders = [];
            this.files = [];
            var value = e.target.value.trim();
            if(value.length) {
                this.filemanager.addClass('searching');
                // Update the hash on every key stroke
                this.gotoPath('/search=' + value.trim(), this.getData());
            } else {
                this.filemanager.removeClass('searching');
                if(this.currentPath == this.rootPath) {
                    this.gotoPath("/", this.getData());
                } else {
                    this.gotoPath(this.currentPath, this.getData());
                }
            }
        }.bind(this)).on('keyup', function(e){
            // Clicking 'ESC' button triggers focusout and cancels the search
            var search = $(e.target);
            if(e.keyCode == 27) {
                search.trigger('focusout');
            }
        }.bind(this)).focusout(function(e){
            // Cancel the search
            var search = $(e.target);
            if(!search.val().trim().length) {
                if(this.currentPath == this.rootPath) {
                    this.gotoPath("/", this.getData());
                } else {
                    this.gotoPath(this.currentPath, this.getData());
                }
            }
        }.bind(this));

        // Clicking on folders
        this.fileList.on('click', 'li.folders', function(e){
            e.preventDefault();
            var $target = $(e.target);
            if(!$target.hasClass('folders')) {
                $target = $target.parents('a.folders');
            }
            var nextDir = $target.attr('data-nextDir');
            if(this.filemanager.hasClass('searching')) {
                this.filemanager.removeClass('searching');
                this.filemanager.find('input[type=search]').val('');
                this.filemanager.find('span');
            }
            this.gotoPath(nextDir, this.getData());
            this.currentPath = nextDir;
        }.bind(this));

        $('#backButton').on('click', function(e) {
            var previousDir = "";
            if(this.currentPath == this.rootPath) {
                previousDir = "/";
            } else {
                previousDir = this.currentPath.substring(0, this.currentPath.lastIndexOf("/"));
            }
            if(previousDir.charAt(0) != "/") {
                previousDir = "/" + previousDir;
            }
            this.gotoPath(previousDir, this.getData());
        }.bind(this));

        $('#homeButton').on('click', function(e) {
            this.gotoPath('/', this.getData());
        }.bind(this));
	}

    loadFiles (data, hostname, regex, startDate, endDate) {
		this.hostname = hostname;
		this.regex = regex;
		this.startDate = startDate;
		this.endDate = endDate;

        this.originalData = {
            type: "folder",
            path: this.rootPath,
            items: data,
            name: ""
        };

		this.showFilemanager();

        this.gotoPath("/", this.getData());

		this.initSlider(this.getData());
	};

	showFilemanager() {
		if(this.filemanager.hasClass('hidden')) {
			this.filemanager.removeClass('hidden');
		}
	}

	initSlider() {
		var timestamps = this.getAllTimestamps([this.originalData]);
		this.sortedUniqueTimestamps = this.sortDistinctArray(timestamps);

		// context is needed in the anonymous function
		var ref = this;

		$("#slider-range").slider({
			disabled: false,
			range: true,
			min: 0,
			max: ref.sortedUniqueTimestamps.length-1,
			values: [0, ref.sortedUniqueTimestamps.length-1],
			slide: function( event, ui ) {
				var startTime = moment.unix(ref.sortedUniqueTimestamps[ui.values[0]]).format('MMMM Do YYYY, HH:mm:ss');
				var endTime = moment.unix(ref.sortedUniqueTimestamps[ui.values[1]]).format('MMMM Do YYYY, HH:mm:ss');
				$('.startTime').text(startTime);
				$('.endTime').text(endTime);

				ref.useOriginalData = false;
				var startTime = ref.sortedUniqueTimestamps[ui.values[0]];
				var endTime = ref.sortedUniqueTimestamps[ui.values[1]];

				// filter
				ref.filteredData = ref.filterTimeData([ref.originalData], [ref.filteredData], startTime, endTime)[0];
				ref.removeFilesWithNoVersions([ref.filteredData]);

				if(ref.currentPath == ref.rootPath) {
					ref.gotoPath("/", ref.getData());
				} else {
					// You need to fix the path because if you use the currentPath for the method gotoPath, you have to add the "/"
					ref.gotoPath(ref.fixPath(ref.currentPath), ref.getData());
				}
			}
		});
		var sV1 = $('#slider-range').slider('values', 0);
		var sV2 = $('#slider-range').slider('values', 1);
		var t1 = moment.unix(this.sortedUniqueTimestamps[sV1]).format('MMMM Do YYYY, HH:mm:ss');
		var t2 = moment.unix(this.sortedUniqueTimestamps[sV2]).format('MMMM Do YYYY, HH:mm:ss');
		$('.startTime').text(t1);
		$('.endTime').text(t2);
	}

	fixPath(path) {
		if(!path.startsWith("/")) {
			path = "/" + path;
		}
		return path;
	}
	
	sortDistinctArray(array) {
		// Remove duplicates
		var uniqueArray = Array.from(new Set(array));
		// Sort array
		var sortedUniqueArray = uniqueArray.sort((a, b) => a - b);
		console.log(sortedUniqueArray);
		return sortedUniqueArray;
	}

	// Navigates to the given path
	gotoPath(path, data) {
		path = path.slice(1).split('=');
		if (path.length) {
			var rendered = '';

			// if hash has search in it
			if (path[0] === 'search') {
				this.filemanager.addClass('searching');
				rendered = this.searchData([data], path[1].toLowerCase());
				if (rendered.length) {
					this.currentPath = path[0];
					this.render(rendered);
				}
				else {
					this.render(rendered);
				}
			}
			// if path available
			else if (path[0].trim().length) {
				rendered = this.searchByPath(path[0], data);
				// Fix path -> add "/"
				this.currentPath = this.fixPath(path[0]);
                		this.render(rendered);
			}

			// pseudoroot path
			else {
				this.currentPath = this.rootPath;
				this.render(this.searchByPath(data.path, data));
			}
		}
	}

	// Splits a file path and turns it into clickable breadcrumbs
	generateBreadcrumbs(nextDir){
		var path = nextDir.split('/').slice(0);
		for(var i=1;i<path.length;i++){
			path[i] = path[i-1]+ '/' +path[i];
		}
		return path;
	}

	// Locates a file by path
	searchByPath(dir, data) {
		if(dir == this.rootPath) {
			return data.items;
		}
		var path = dir.split('/'),
			demo = data.items,
			flag = 0;
		for(var i=0;i<path.length;i++){
			for(var j=0;j<demo.length;j++){
				if(demo[j].name === path[i]){
					flag = 1;
					demo = demo[j].items;
					break;
				}
			}
		}
		demo = flag ? demo : [];
		return demo;
	}

	// Recursively search through the file tree
	searchData(data, searchTerms) {
		data.forEach(function(d){
			if(d.type === 'folder') {
				this.searchData(d.items,searchTerms);
				if(d.name.toLowerCase().match(searchTerms)) {
					this.folders.push(d);
				}
			}
			else if(d.type === 'file') {
				if(d.name.toLowerCase().match(searchTerms)) {
					this.files.push(d);
				}
			}
		}.bind(this));
		return {folders: this.folders, files: this.files};
	}

	filterTimeData(originalData, filteredData, startTime, endTime) {
		// iterate Array
		for (var i = 0; i < originalData.length; i++) {

			// if folder
			if(originalData[i].type === "folder") {
				// add object to filteredData[i]
				filteredData[i] = this.cloneObject(originalData[i])
				this.filterTimeData(originalData[i].items, filteredData[i].items, startTime, endTime)

			// if file
			} else if(originalData[i].type === "file") {

				var fileObject = this.cloneObject(originalData[i]);
				var filteredFileVersions = [];
				for (var j = 0; j < fileObject.versions.length; j++) {
					if(fileObject.versions[j].mtime >= startTime && fileObject.versions[j].mtime <= endTime) {
						filteredFileVersions.push(fileObject.versions[j]);
					}
				}
				if(filteredFileVersions.length > 0) {
					fileObject.versions = filteredFileVersions;
					filteredData[i] = fileObject;
				} else {
					// if no file matches, set file to null
					filteredData[i] = null;
				}
			}
		}
		return filteredData;
	}

	removeFilesWithNoVersions(array) {
		var filtered = array.filter(function(value, index, arr) {
			return value !== null;
		})
		if(filtered) {
			array = filtered;
			for (var i = 0; i < array.length; i++) {
				if(array[i].type === "folder") {
					array[i].items = this.removeFilesWithNoVersions(array[i].items);
				}
			}
		}
		return array;
	}

	cloneObject(o) {
		return JSON.parse(JSON.stringify(o));
	}

	// Recursively add all timestamps of files into array
	getAllTimestamps(data) {
		data.forEach(function(d){
			if(d.type === 'folder') {
				this.getAllTimestamps(d.items);
			}
			else if(d.type === 'file') {
				for (var i = 0; i < d.versions.length; i++) {
					var file = d.versions[i];
					this.allTimestamps.push(file.mtime);
				}
			}
		}.bind(this));
		return this.allTimestamps;
	}

	// Render the HTML for the file manager
	render(data) {
		var scannedFolders = [],
			scannedFiles = [];
		if(Array.isArray(data)) {
			data.forEach(function (d) {
				if(!d) {
					console.log("ERROR: Data to render is null!");
					console.log(data);
				}else if (d.type === 'folder') {
					scannedFolders.push(d);
				}
				else if (d.type === 'file') {
					scannedFiles.push(d);
				}
			}.bind(this));
		} else if(typeof data === 'object') {
			scannedFolders = data.folders;
			scannedFiles = data.files;
		}

		// Empty the old result and make the new one
		this.fileList.empty().hide();

		if(!scannedFolders.length && !scannedFiles.length) {
			this.filemanager.find('.nothingfound').show();
		} else {
			this.filemanager.find('.nothingfound').hide();
		}

		if(scannedFolders.length) {
			scannedFolders.forEach(function(f) {
				var itemsLength = f.items.length;
				var	name = this.escapeHTML(f.name);
				var icon = '<span class="icon folder full"></span>';

				if(itemsLength == 1) {
					itemsLength += ' item';
				}
				else if(itemsLength > 1) {
					itemsLength += ' items';
				}
				else {
					itemsLength = 'Empty';
				}

				var folder = $('<li class="folders"><a data-nextDir="'+ f.path +'" title="'+ f.path +'" class="folders">'+icon+'<span class="name">' + name + '</span> <span class="details">' + itemsLength + '</span></a><span class="folder-entropy" title="Calculate entropy">E</span><span class="folder-restore" title="Restore folder"><span class="folder-restore-i1"><i class="fa fa-folder"></i></span><span class="folder-restore-i2"><i class="fa fa-undo"></i></span></span></li>');

				// restore
				folder.find('.folder-restore').on('click', function(e) {
					e.stopPropagation();
                    var sV1 = $('#slider-range').slider('values', 0);
                    var sV2 = $('#slider-range').slider('values', 1);
					var func = function() {
					    var regex = this.regex;
                        var t1 = moment.unix(this.sortedUniqueTimestamps[sV1]).unix();
                        var t2 = moment.unix(this.sortedUniqueTimestamps[sV2]).unix();
                        var hostname = this.hostname;
						this.restoreFolder(regex, hostname, f.path, f.name, t1, t2);
					}.bind(this)
					var start = moment.unix(this.sortedUniqueTimestamps[sV1]).format('MMMM Do YYYY, HH:mm:ss');
					var end = moment.unix(this.sortedUniqueTimestamps[sV2]).format('MMMM Do YYYY, HH:mm:ss');

					var message;
					if(this.regex === "") {
					    message = 'Do you really want to restore this folder from ' + start + ' until ' + end + '?';
					} else {
					    message = 'Do you really want to restore this folder from ' + start + ' until ' + end + ' with the filter ' + this.regex + '?';
					}
					this.dialog.askDialog(func, message);
				}.bind(this));

				// entropy
				folder.find('.folder-entropy').on('click', function(e) {
				    e.stopPropagation();
                    var sV1 = $('#slider-range').slider('values', 0);
                    var sV2 = $('#slider-range').slider('values', 1);
                    var func = function() {
                        var regex = this.regex;
                        var t1 = moment.unix(this.sortedUniqueTimestamps[sV1]).unix();
                        var t2 = moment.unix(this.sortedUniqueTimestamps[sV2]).unix();
                        var hostname = this.hostname;
                        this.calculateEntropy(regex, hostname, f.path, f.name, t1, t2);
                    }.bind(this)
                    var start = moment.unix(this.sortedUniqueTimestamps[sV1]).format('MMMM Do YYYY, HH:mm:ss');
                    var end = moment.unix(this.sortedUniqueTimestamps[sV2]).format('MMMM Do YYYY, HH:mm:ss');

                    var message;
                    if(this.regex === "") {
                        message = 'Do you really want to calculate the entropy of this folder from ' + start + ' until ' + end + '?';
                    } else {
                        message = 'Do you really want to calculate the entropy of this folder from ' + start + ' until ' + end + ' with the filter ' + this.regex + '?';
                    }
                    this.dialog.askDialog(func, message);
				}.bind(this));

				this.fileList.append(folder);

			}.bind(this));
		}

		if(scannedFiles.length) {
			scannedFiles.forEach(function(f) {
				var versions = f.versions.length;
				var	name = this.escapeHTML(f.name);
				var fileType = name.split('.');
				fileType = fileType[fileType.length-1];
				var url = this.serverUrl + ':8080/getFile/' + this.hostname + '?path=' + encodeURIComponent(f.path) + '&name=' + encodeURIComponent(f.name) + '&mtime=' + f.versions[0].mtime;
                if(versions == 1) {
                    versions += " version";
                } else {
                    versions += " versions";
                }

				if (fileType == "db") {
					return;
				}
				
				var icon = '<span class="icon file f-'+fileType+'">.'+fileType+'</span>';
				var file = $('<li class="files"><a title="'+ f.path +'" data-nextDir="javascript:;" class="files">'+icon+'<span class="name">'+ name +'</span> <span class="details">'+versions+'</span></a></li>');
				
				var fancyboxType = this.getFancyboxType(fileType);
				
				file.on('click', function(e) {
					// open version 1
					this.openFancybox(f, "1", fancyboxType, url);
				}.bind(this));

				file.appendTo(this.fileList);

			}.bind(this));
		}

		// Generate the breadcrumbs
		if(this.filemanager.hasClass('searching')){
			this.fileList.removeClass('animated');
		} else {
			this.fileList.addClass('animated');			
		}
		this.updateBreadcrumb();

		// Show the generated elements
		this.fileList.show();
	}

	getFancyboxType(fileType) {
		if(fileType === "jpg" || fileType === "jped" || fileType === "png") {
			return "image";
		} else if(fileType === "pdf") {
			return "iframe";
		} else {
			return "ajax";
		}
	}

	restoreFolder(regex, hostname, path, fname, mtimestart, mtimeend) {
		$.ajax({
            type: 'GET',
            url: this.serverUrl + ':8080/restoreFolder/' + hostname,
            data: {
				'regex': encodeURIComponent(regex),
                'name': encodeURIComponent(fname),
                'path': encodeURIComponent(path),
				'mtimestart': mtimestart,
				'mtimeend': mtimeend
            },
            success: function(res){
				this.dialog.showMessage(res);
            }.bind(this),
            error: function(res) {
				this.dialog.showMessage('Error: Restoring not successful. (Possible timeout)');
            }.bind(this)
        });
	}

    calculateEntropy(regex, hostname, path, fname, mtimestart, mtimeend) {
        $.ajax({
            type: 'GET',
            url: this.serverUrl + ':8080/calculateEntropy/' + hostname,
            data: {
                'regex': encodeURIComponent(regex),
                'name': encodeURIComponent(fname),
                'path': encodeURIComponent(path),
                'mtimestart': mtimestart,
                'mtimeend': mtimeend
            },
            success: function(res){
                this.dialog.showMessage(res);
            }.bind(this),
            error: function(res) {
                this.dialog.showMessage('Error: Calculating entropy not successful. (Possible timeout)');
            }.bind(this)
        });
    }

	addModalToFancyBox(f, version, instance) {

	    // add modal to fancybox
	    var modal = $('#previewModal').clone();
        modal.appendTo(instance.$refs.inner).show();

        //change title of modal
        $('.modal-title').text('Versions of ' + f.name)

        // add versions
		var ul = modal.find('ul.list-group');
        var versions = f.versions;
        for(var i = 0; i < versions.length; i++) {
			var time = moment.unix(versions[i].mtime).format('MMMM Do YYYY, HH:mm:ss');
			var li = $('<li class="list-group-item">' +
			'<h5 class="card-title">' + 'Version ' + (i+1) + '</h5>' +
			'<p class="card-text">Time: ' + time + '</p>' +
			'<p class="card-text">Filesize: ' + this.bytesToSize(versions[i].fsize) + '</p>' +
			'<span class="download-icon"><i class="fa fa-download"></i></span></li>');
            li.attr('data-mtime', versions[i].mtime);
			li.attr('data-fileName', f.name);
			li.attr('data-fileSize', versions[i].fsize);
			li.attr('data-version', i+1);
			if((i+1).toString() === version) {
				li.addClass('active');
			}
			ul.append(li);

			li.find('.download-icon').on('click', function(e) {
				e.stopPropagation();
				var $target = $(e.target);
				$target = $target.parents('.list-group-item');
				var mtime = $target.attr('data-mtime');
				var url = this.serverUrl + ':8080/getFile/' + this.hostname + '?path=' + encodeURIComponent(f.path) + '&name=' + encodeURIComponent(f.name) + '&mtime=' + mtime + '&download=true';
				this.downloadFile(url);
			}.bind(this));
			
            li.on('click', function(e) {
				var $target = $(e.target);
				if(!$target.hasClass('list-group-item')) {
					$target = $target.parents('.list-group-item');
				}

				$('.list-group-item.active').removeClass('active');
				$target.addClass('active');

				var mtime = $target.attr('data-mtime');
				var fsize = $target.attr('data-fileSize');
				var version = $target.attr('data-version');
				this.sendFileRequest(this.hostname, f, version, f.name, f.path, mtime, false);
            }.bind(this));
        }
	}

	sendFileRequest(hostname, file, version, fname, path, mtime, download) {
		$.fancybox.close();
		var fileType = fname.split('.');
		fileType = fileType[fileType.length-1];
		var fancyboxType = this.getFancyboxType(fileType);
		var url = this.serverUrl + ':8080/getFile/' + this.hostname + '?path=' + encodeURIComponent(path) + '&name=' + encodeURIComponent(fname) + '&mtime=' + mtime;
		this.openFancybox(file, version, fancyboxType, url); 
	}

	openFancybox(file, version, fancyboxType, url) {
		var isFileSmall = this.checkFilesize(file, version)
		if(!isFileSmall) {
			url = "./placeholder.txt";
		}
		$.fancybox.open({
			type: fancyboxType,
			src: url,
			clickOutside: 'close',
			opts: {
				beforeShow: function(instance, current, firstRun) {
					this.addModalToFancyBox(file, version, instance);
				}.bind(this),
				afterShow: function(instance, current, firstRun) {
					console.log('done!');
				}
			}
		})
	}

    // only show fancebox preview if file is small (<= 20 MB)
	checkFilesize(file, version) {
		var versionNumber = parseInt(version);
		var fileVersion = file.versions[versionNumber-1];
		if(fileVersion.fsize >= 20000000) {
			return false;
		} else {
			return true;
		}
	}

	downloadFile(url) {
		var a = document.createElement("a");
  		a.href = url;
  		a.setAttribute("download", "file");
		a.click();
		$(a).remove();
	}

	updateBreadcrumb() {
	    if(this.currentPath == this.rootPath) {
			this.breadcrumbs.empty();
			this.breadcrumbs.append($('<li class="breadcrumb-item active" aria-current="page"><i class="fa fa-home" aria-hidden="true"></i></li>'))
	    } else {
			this.breadcrumbs.empty();
			var path = ("/" + this.currentPath).split('/');
			for (var i = 0; i < path.length; i++) {
				if(path[i] !== "") {
					this.breadcrumbs.append($('<li class="breadcrumb-item active" aria-current="page">' + path[i] + '</li>'))
				}
			}
	    }
	}


	// This function escapes special html characters in names
	escapeHTML(text) {
		return text.replace(/\&/g,'&amp;').replace(/\</g,'&lt;').replace(/\>/g,'&gt;');
	}


	// Convert file sizes from bytes to human readable units
	bytesToSize(bytes) {
		var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		if (bytes == 0) return '0 Bytes';
		var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
		return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
	}
}





	
	
	

	


	
