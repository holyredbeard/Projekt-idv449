var ApiHandlers = {

	// Funktion som kontaktar de olika API:erna, hämtar information och skapar data att rendera ut
	SearchIncidents: function(period, zipcode) {

		ApiHandlers.GetZipData(zipcode, function(addresses) {
			ApiHandlers.GetIncidents(addresses, period, function(incidents) {
				ApiHandlers.ExtractIncidents(addresses, incidents, function(results) {

					if (results.length > 0) {
						var newIncidents = [];

						for (var i = 0; i < 4; i++) {
							newIncidents[i] = [];
						}

						for (var i = 0; i < results.length; i++) {
						    var index = results[i]
						    newIncidents[0][i] = incidents[0][index];
						    newIncidents[1][i] = incidents[1][index];
						    newIncidents[2][i] = incidents[2][index];
						    newIncidents[3][i] = incidents[3][index];
						}

						var crimesPerMonth = Capsule.FindCrimesPerMonth(newIncidents[1]),
							crimesPerType = Capsule.FindCrimesPerType(newIncidents);

						Capsule.crimesPerType = crimesPerType;
						Capsule.crimesPerMonth = crimesPerMonth;
						Capsule.zipcode = zipcode;

						if (localStorage) {
							localStorage["crimesPerType"] = JSON.stringify(crimesPerType);
							localStorage["coordinates"] = JSON.stringify(newIncidents[3]);
							localStorage["zipcode"] = zipcode;
							localStorage["crimesPerMonth"] = JSON.stringify(crimesPerMonth);
						}

						Capsule.AddStatistics();	
					}
					else {
						$('#message').show();
					}
				});
			});
		});
	},
	
	// Funktion som kontaktar API och hämtar data för postnumret
	GetZipData: function(zipcode, callbackfunc) {

		var address = [];

		$('#spinner').show();
		$('#loaderText').html('Kontrollerar postnumret...');

		$.ajax({
		     url: './php/apihandling.php',
		     type: 'post',
		     dataType: 'json',
		     data:{ 
		         zipcode: zipcode
		     },

		     success:function(data) {

		     	if (data["API_status"]) {
		     		var streets = '',
		     		zipcodeData = '',
		     		content = $.parseJSON(data.response);
		     		statusCode = content.status_code;

		     		// Kontrollerar statuskoden som mottages och agerar efter denna
			     	if (statusCode == 100) {
			     		zipcodeData = Capsule.GetCoordinatesAndCounty(data, content, zipcode);
				     	callbackfunc(zipcodeData);
			     	}
			     	else if (statusCode == 900) {
			     		ApiHandlers.ErrorHandling('incorrect_zipcode');
			     	}
			     	else if (statusCode == 901) {
			     		ApiHandlers.ErrorHandling('no_zipcode');
			     	}
			     	else {
			     		ApiHandlers.ErrorHandling('communication_error');
			     	}
		     	}
		     	else {
		     		console.log(data.error);
		        	ApiHandlers.ErrorHandling('communication_error');
		     	}
		     },
		     error: function (xhr, ajaxOptions, thrownError) {
		        ApiHandlers.ErrorHandling('communication_error');
		     }
		});
	},

	// Funktion som kontaktar API som hämtar händelserna
	GetIncidents: function(addresses, period, callbackfunc) {


		var county = Capsule.ConvertCountyString(addresses);
		console.log(county);

		$('#loaderText').html('Hämtar händelser...');

		$.ajax({
		     url:'./php/apihandling.php',
		     type:'post',
		     dataType:'json',
		     data:{ 
		         county: county, // Länet
		         period: period  // Månader som ska hämtas
		     },
		     success: function(data) {
		     	alert(data);

		     	// Kontrollerar om några errors skickades från API:et (är API_status false innebär detta error)
		     	if (data["API_status"]) {
		            content = $.parseJSON(data.response);
		            callbackfunc(content);
		        }
		        else {
		        	console.log(data.error);
		        	ApiHandlers.ErrorHandling('communication_error');
		        }
		     },
		     error: function (xhr, ajaxOptions, thrownError) {
		        ApiHandlers.ErrorHandling('communication_error');
		     }
		});
	},

	// Funktion som via php-skript extraherar data från array med händelser, och hämtar de som är aktuella för postnumret
	ExtractIncidents: function(addresses, incidents, callbackfunc) {

		var zipCoordinates = addresses[3];
		var coordinates = incidents[3];
		var radius = Capsule.radius;

		$('#loaderText').html('Presenterar händelser...');

		$.ajax({
		     url:'./php/apihandling.php',
		     type:'post',
		     dataType:'json',
		     data:{ 
		         zipCoordinates: zipCoordinates,
		         coordinates: coordinates,
		         radius: radius
		     },
		     success: function(data) {
		     	callbackfunc(data);
		     },
		     error: function (xhr, ajaxOptions, thrownError) {
		        console.log(xhr.status);
		        console.log(thrownError);
		        ApiHandlers.ErrorHandling('communication_error');
		     },
		     complete: function() {
		        $('#spinner').hide();
		     }
		});
	},

	// Funktion som renderar ut kartan (Google Maps) med markörer för de händelser som hittats
	SetMap: function(coordinates, zipCoordinates){

		var newCoordinates = [], i;

		var map = new google.maps.Map(document.getElementById('map'), {
	      zoom: 19,
	      center: new google.maps.LatLng(zipCoordinates[0], zipCoordinates[1]),
	      mapTypeId: google.maps.MapTypeId.ROADMAP,
	      disableDefaultUI: true,
    	  mapTypeId: google.maps.MapTypeId.TERRAIN,
    	  scrollwheel: true,
	      navigationControl: true,
	      mapTypeControl: true,
	      scaleControl: false,
	      draggable: true
	    });

	    var infowindow = new google.maps.InfoWindow(),
	    	marker,
	    	i,
	    	image;

	    // Loopar igenom arrayen med koordinater och visar bild beroende på om det är ett brott eller en trafikolycka
	    for (i = 0; i < coordinates.length; i++) {

	      if (coordinates[i][2] == 'crime') {
	      	image = 'http://cdn1.iconfinder.com/data/icons/windows8_icons_iconpharm/26/crime.png';
	      }
	      else if (coordinates[i][2] == 'traffic') {
	      	image = 'http://cdn1.iconfinder.com/data/icons/windows8_icons_iconpharm/26/ambulance.png';
		  }
		  else if (coordinates[i][2] == 'other') {
		  	continue;
		  }

	      marker = new google.maps.Marker({
	        position: new google.maps.LatLng(coordinates[i][0], coordinates[i][1]),
	        map: map,
	        icon: image
	      });

	      marker.setClickable(false);

	      google.maps.event.addListener(marker, 'click', (function(marker, i) {
	        return function() {
	          infowindow.setContent(coordinates[i][0]);
	          infowindow.open(map, marker);
	        }
	      })(marker, i));
	    }
	},

	// Hantering av felmeddelanden på klienten
	ErrorHandling: function(errorType) {

		var errorMessage = '';

		var	ERROR_MESSAGES = {
			communication_error: 'Det uppstod ett kommunikationsfel. Vänligen försök igen!',
			no_zipcode: 'Inget postnummer skickades med. Var god försök igen',
			incorrect_zipcode: 'Du angav ett postnummer som inte finns. Var god försök igen',
		}

		if (errorType == 'communication_error') { errorMessage = ERROR_MESSAGES.communication_error }
		else if (errorType == 'no_zipcode') { errorMessage = ERROR_MESSAGES.no_zipcode }
		else if (errorType == 'incorrect_zipcode') { errorMessage = ERROR_MESSAGES.incorrect_zipcode }

		var error = '<strong>Fel!</strong> ' + errorMessage;

		$('#spinner').hide();
		$('#message').show();
		$('#errorContent').html(error);
	}
}