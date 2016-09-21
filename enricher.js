$("#gpxFile").change(loadFile);

var linesNb = 0;
var logger = $('#statusBox h4');
var log = function(text, type) {
	var logField = $("#logger");
	if( logField.length == 0)
	{
		var loggerBlock = $("<div />", {
			"class" : "callout "+ type,
			"data-closable" : "slide-out-right",
			"id" : "logger"
		});

		var closeButton = $("<button class='close-button' aria-label='Dismiss alert' type='button' data-close />");

		var spanHidden = $("<span />", {
			"aria-hidden" : "true"
		});
		spanHidden.html("&times;");

		var content = $("<h5 />", {
			id : "log"
		}).text(text);

		closeButton.append( spanHidden );
		loggerBlock.append( content );
		loggerBlock.append( closeButton );
		$("#top-bar").after( loggerBlock );
	} else {
		logger.attr("class", "callout "+type);
		$("#log").html(text);
	}
};

if (window.File && window.FileReader && window.FileList && window.Blob) {
  log('We\'re just awaiting your file !', 'success');
} else {
  log('Your browser may not be able to load the files properly', 'alert');
}

/**
 * In order to support drag and drop
 */
$(document).on('dragenter', '#upload', function() {
            $(this).css('border', '3px dashed red');
            return false;
});
 
$(document).on('dragover', '#upload', function(e){
            e.preventDefault();
            e.stopPropagation();
            $(this).css('border', '3px dashed red');
            return false;
});
 
$(document).on('dragleave', '#upload', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).css('border', '3px dashed #BBBBBB');
            return false;
});

$(function() {
     $("input:file").change(function (){
       var file = document.getElementById('gpxFile').files[0];
       parseXML(file);
     });
  });

$('#copy-content').on('click', function() {
	copyToClipboard( $('#output') );
});

$('#download-content').on('click', function() {
	text = $('#output').text();

	var element = document.createElement('a');
  	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  	element.setAttribute('download', 'GPXEnricherExport.gpx');

  	element.style.display = 'none';
  	document.body.appendChild(element);

  	element.click();

  	document.body.removeChild(element);
});

function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
}

$(document).on('drop', '#upload', function(e) {

	if(e.originalEvent.dataTransfer){
		if(e.originalEvent.dataTransfer.files.length) {
			log('Your file is loaded properly, we are currently computing it, please let us a while !', 'success');
			e.stopPropagation();
			e.preventDefault();
			$(this).css('border', '3px dashed green');

			parseXML(e.originalEvent.dataTransfer.files[0]);
		}
	} else {
		$(this).css('border', '3px dashed #BBBBBB');
	}
	return false;
});

var parseXML = function (file) {
	var reader = new FileReader();
	reader.readAsText(file);
	reader.onloadend = function() {
		var xmlData = $(reader.result);
		var gpxComputed = computeGPX(xmlData);
	};
};

var loadFile = function () {
	var file = document.getElementById("gpxFile").files[0];
	parseXML(file);
};

var computeGPX = function(gpxContent) {
	$(gpxContent).find('trkseg').each(computeSegment);
	var oSerializer = new XMLSerializer(); 
    var xmlString = oSerializer.serializeToString(gpxContent.get()[2]);
	$("#output").html(xmlString.encodeHTML());
	log('Your computed file is ready in the window below !', 'success');
	$('#copy-content').prop('disabled', false);
	$('#download-content').prop('disabled', false);
	$('pre code').each(function(i, block) {
    	hljs.highlightBlock(block);
  	});
};

var toRad = function(angle) {
	return angle/180*Math.PI;
};

var toDeg = function(angle) {
	return angle*180/Math.PI;
}

var computeDistance = function(latA, lonA, latB, lonB) {
	var R = 6371000;

	var latA = toRad(latA);
	var latB = toRad(latB);
	var lonA = toRad(lonA);
	var lonB = toRad(lonB);
	var pS = Math.sin(latA) * Math.sin(latB);
	var pC = Math.cos(lonB - lonA) * Math.cos(latB) * Math.cos(latA);
	var aC = Math.acos( 	pS + 
							pC);
	return 	R *	aC;
};  

var computeSegment = function() {
	gpsPoints = $(this).children();
	var previousLat = $(gpsPoints[0]).attr('lat');
	var previousLon = $(gpsPoints[0]).attr('lon');
	var time = $(gpsPoints[0]).find('time').text();
	var previousTime = new Date(time);
	for(var i=1; i<gpsPoints.length; i++) {
		currentLat = $(gpsPoints[i]).attr('lat');
		currentLon = $(gpsPoints[i]).attr('lon');
		var distance = computeDistance(previousLat,previousLon,currentLat, currentLon);
		var currentTime = new Date($(gpsPoints[i]).find('time').text());
		var timeDelta = (currentTime - previousTime) / 1000;
		var speed = distance/timeDelta*3.6;
		previousLon = currentLon;
		previousLat = currentLat;
		previousTime = currentTime;
		$(gpsPoints[i]).append('<speed>'+speed+'</speed>');
	}
};

if (!String.prototype.encodeHTML) {
  String.prototype.encodeHTML = function () {
    return this.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
  };
}