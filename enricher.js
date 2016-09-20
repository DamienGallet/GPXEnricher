$("#gpxFile").change(loadFile);

var linesNb = 0;
var logger = $('#statusBox h4');
var log = function(text) {
	logger.html(text);
};

if (window.File && window.FileReader && window.FileList && window.Blob) {
  log('Initialization successfull');
} else {
  log('The File APIs are not fully supported in this browser.');
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

$(document).on('drop', '#upload', function(e) {

	if(e.originalEvent.dataTransfer){
		if(e.originalEvent.dataTransfer.files.length) {
			log('Load complete');
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
	alert(gpxContent.get()[1]);
	alert(xmlString);
	$("#output").append(xmlString.encodeHTML());
	log('Computation complete');
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