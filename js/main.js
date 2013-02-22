var Capsule = {
	Map: null,				// Används av Google Maps
	Markerlatlng: null,		// Används av Google Maps
	content: null,			// Händelser
	period: 3,				// Antal månader som ska hämtas
	radius: 2,				// Radien som ska räknas in (utgår från postnumrets mittpunkt)
	zipcode: 0,				// Postnumret
	crimesPerType: 0,		// Antalet brott per typ
	crimesPerMonth: 0,		// Antalet brott per månad
	coordinates: 0,			// Koordinaterna för händelserna
	loggedIn: false,
	zipCoordinates: [],		// Koordinaterna för postnumret

	// Initierar funktioner
	Init: function() {
		Capsule.CheckForPreviousSearch();
		Capsule.SearchHandler();
		Capsule.ReloadPage();
		Capsule.ClearErrors();
	},

	// Tar bort felmeddelandet om input-fältet får fokus
	ClearErrors: function(){
		$('#zipcode').on('focus', function(){
			$('#errors').hide();
			$('#message').fadeOut();
		});
	},

	// Kollar efter tidigare sökningar via localStorage och visar dessa om användaren väljer att göra det
	CheckForPreviousSearch: function() {
		if(localStorage["crimesPerType"] != undefined) {
			$('#lastSearchDiv').show();

			$('#lastSearchButton').on('click', function(){
				Capsule.AddStatistics();
			});
		}
	},

	// Laddar om sidan om man klickar på loggan
	ReloadPage: function() {
		$('#graphHeader').on('click', function() {
			location.reload();
		});

		//$('#zipcode').focus();
	},

	// Hanterar input av postnummer och initierar hämtning av data
	SearchHandler: function() {

		// Submit är klickad
		$('#searchButton').click( function(e){
			var zipcode = $('#zipcode').val(),
				nrOfMonths = Capsule.period,
				radius = Capsule.radius;

			if(Capsule.loggedIn) {
				nrOfMonths = $('#nrOfMonths :selected').val();
				radius = $('#radius :selected').val();
			}

			zipcode = zipcode.replace(/\s+/g, '');

			// Validerarar postnumret
			if ((zipcode.length < 5) || (zipcode.length > 5)) {
				Capsule.ErrorHandling('wrong_nr_of_chars');
			}
			else if (!zipcode.match(/\b\d{5}\b/g)) {
				Capsule.ErrorHandling('illegal_chars');
			}
			else {
				Capsule.zipcode = zipcode;
				Capsule.period = nrOfMonths;
				Capsule.radius = radius;

				$('#rightCol').show();

				// Startar hämtning av data
				ApiHandlers.SearchIncidents(Capsule.period, zipcode);
			}
			
			$('#zipcode').val('');
			e.preventDefault();
		});
	},

	// Extraherar data gällande postnumret, vilket sparas i en array som skickas tillbaka till kallande funktion
	GetCoordinatesAndCounty: function(data, content, zipcode) {

		var zipCoordinates = [],
 			tempArray = [],
 			zipcodeData = [];

     	zipCoordinates[0] = content.results[0].lat;
     	zipCoordinates[1] = content.results[0].lng;

     	Capsule.zipCoordinates = zipCoordinates;

     	// Sparar postnumrets koordinater i localStorage om detta finns i användarens browser
     	if(localStorage) {
     		localStorage["zipCoordinates"] = JSON.stringify(zipCoordinates);
     	}

     	county = content.results[0].address;

     	tempArray = county.split(',');
     	county = tempArray[1];

        zipcodeData[0] = zipcode;
     	zipcodeData[1] = data;
     	zipcodeData[2] = county;
     	zipcodeData[3] = zipCoordinates;

     	return zipcodeData;
	},

	// Hämtar ut information om de enskilda brotten från arrayen som skickas med
	FindCrimesPerType: function(incidents) {

		// Objekt innehållande de olika brotten och reguljära uttryck för att hitta dem
		var INCIDENT_MATCHES = {
			battery: /\w*(bråk)\w*|överfall|slagsmål|slogs|misshandel|misshandlad|\w*(tjuv)\w*/ig,
			burglaries: /snattade|snattare|snatta|inbrott|bestulen|stöld|\w*(tjuv)\w*/ig,
			robberies: /\w*(rån)\w*|personrån|\w*(ryckning)\w*|väskryckt*/ig,
			gunfire: /skottlossning|skjuten|sköt/ig,
			drugs: /narkotikabrott|drograttfylleri/ig,
			vandalism: /skadegörelse|klotter|\w*(klottra)\w*/ig,
			trafficAccidents: /(trafik|bil)olycka|(trafik|bil)olyckor|\w*(personbil)\w*|singelolycka|kollision|\w*(kollidera)\w*|påkörd|trafik|smitningsolycka/ig,
		};

		var j = 0,
			crimesPerType = {},
	    	incidentTypes = Object.keys(INCIDENT_MATCHES);

	    // Loopar genom arrayen med händelser och kontrollerar om matchning finns för något brott
	    incidents[2].forEach(function(incident) {
 
			incidentTypes.every(function(type) {

				if(typeof crimesPerType[type] === 'undefined') {
					crimesPerType[type] = 0;
				}

				// Kontrollerar händlesen om matchning finns för aktuellt brott
				var matchFound = incident.match(INCIDENT_MATCHES[type]);
		      
		      	// Hittas matchning ökas brottet på med 1 i arrayen, nyckelord för brottet läggs till arrayen med händelser och sökning avbryts för aktuell händelse
				if(matchFound){
					crimesPerType[type] += 1;
					if (type == 'trafficAccidents') {
						incidents[3][j].push('traffic');
					}
					else {
						incidents[3][j].push('crime');
					}
					return false;
				}
				else { return true; }
	    	});
		j++;
	  });

      Capsule.coordinates = incidents[3];

	  return crimesPerType;
	},

	// Hämtar ut information om brott per månad från arrayen med händelser och sparar i ett objekt som returneras
	FindCrimesPerMonth: function(incidents) {

		var crimes_per_month = {
		    january: 0,
		    february: 0,
		    mars: 0,
		    april: 0,
		    may: 0,
		    june: 0,
		    july: 0,
		    august: 0,
		    september: 0,
		    oktober: 0,
		    november: 0,
		    december: 0
		};

		function addToMonths(month) {
		    var names = ["january", "february", "mars", "april", "may", "june", "july", "august", "september", "oktober", "november", "december"];
		    var name = names[month-1];
		    crimes_per_month[name] += 1;
		}

		for(var i = 0; i < incidents.length; i++) {
			month = incidents[i].substring(5, 7);
			addToMonths(parseInt(month));
		}

		return crimes_per_month;
	},

	// Konverterar sträng med län till det format som krävs för att hämta händelser från API:et
	ConvertCountyString: function(addresses) {

		var county = addresses[2].toLowerCase().trim().split(/\s+/).join('-');

		function Encode(str) {
		    return String(str)
	            .replace(/å/g, 'a')
	            .replace(/ä/g, 'a')
	            .replace(/ö/g, 'a');
		}

		county = Encode(county);

		return county;
	},

	// Renderar ut händelserna på klienten
	AddStatistics: function() {

		var crimesPerType = null,
			crimesPerMonth = null,
			coordinates = null;
			totalNrOfCrimesPerCrime = 0,
			totalNrOfCrimesPerMonth = 0,
			otherCrimes = 0,
			error = false;

		// Kontrollerar om data är sparad i applikationen sedan tidigare och hämtar i så fall denna
		if (Capsule.crimesPerType != 0) {
			crimesPerType = Capsule.crimesPerType;
			crimesPerMonth = Capsule.crimesPerMonth;
			coordinates = Capsule.coordinates;
			zipcode = Capsule.zipcode;
			zipCoordinates = Capsule.zipCoordinates;
		}

		// Hittades inte data i applikationen kontrolleras om den finns sparad i localStorage
		else if (localStorage["crimesPerType"] != undefined) {
			crimesPerType = JSON.parse(localStorage["crimesPerType"]);
			coordinates = JSON.parse(localStorage["coordinates"]);
			zipcode = localStorage["zipcode"];

			crimesPerMonth = JSON.parse(localStorage["crimesPerMonth"]);
			zipCoordinates = JSON.parse(localStorage["zipCoordinates"]);
		}

		// Ingen data hittades, visar fel.
		else {
			error = true;
			Capsule.ErrorHandling('no_data');
		}

		// Om inga fel inträffade renderas datan ut
		if (error == false) {

			var i = 1,
				j = 1;

			var nrOfCrimes = 0;

			var battery = crimesPerType[0],
				burglaries = crimesPerType[1],
				robberies = crimesPerType[2],
				gunfire = crimesPerType[3],
				drugs = crimesPerType[4],
				vandalism = crimesPerType[5],
				trafficAccidents = crimesPerType[6];

			// Renderar ut datan i tabeller
			for (var key in crimesPerType) {
			  var td = '#c' + i + '_data';
			  $(td).html(crimesPerType[key]);
			  i++;
			  nrOfCrimes += crimesPerType[key];

			  totalNrOfCrimesPerCrime += crimesPerType[key];
			}
			
			for (var key in crimesPerMonth) {
			  var td = '#d' + j + '_data';
			  $(td).html(crimesPerMonth[key]);
			  j++;

			  totalNrOfCrimesPerMonth += crimesPerMonth[key];
			}

			// Räknar ut hur många av brotten som inte föll inom någon av de olika brotts-kategorierna
			otherCrimes = totalNrOfCrimesPerMonth - totalNrOfCrimesPerCrime;
			$('#tableOther').html(otherCrimes);

			// Renderar graferna på klienten
			var table = $('#tablePerCrime').html();
			var myChart = $('#tablePerCrime').visualize({lineWeight: 1, height: '250px', width: '640px'}),
				myChart2 = $('#tablePerMonth').visualize({type: 'area', lineWeight: 1, height: '250px', width: '640px'});

			// Renderar lista med de olika brotten på klienten
			var stats = '<div id="statsDiv">' +
							'<div id="statsIntro">' +
								'Här visas statistik för de senaste 6 månaderna.' +
							'</div>' +
							'<div id="nrOfCrimes">' +
								'<div id="nrOfCrimesGraphDiv"></div>' +
								'<ul id="statsUl">' +
								  '<li class="statsByCrime">Misshandel: <span class="statData crimes1">' + crimesPerType.battery + '</span></li>' +
								  '<li class="statsByCrime">Stöld/inbrott: <span class="statData crimes2">' + crimesPerType.burglaries + '</span></li>' +
								  '<li class="statsByCrime">Rån: <span class="statData crimes3">' + crimesPerType.robberies +'</span></li>' +
								  '<li class="statsByCrime">Skottlossningar: <span class="statData crimes4">' + crimesPerType.gunfire + '</span></li>' +
								  '<li class="statsByCrime">Narkotikabrott: <span class="statData crimes5">' + crimesPerType.drugs + '</span></li>' +
								  '<li class="statsByCrime">Vandalism: <span class="statData crimes6">' + crimesPerType.vandalism + '</span></li>' +
								  '<li class="statsByCrime">Trafikolyckor: <span class="statData crimes7">' + crimesPerType.trafficAccidents + '</span></li>' +
								  '<li class="statsByCrime">Övrigt: <span class="statData crimes7">' + otherCrimes + '</span></li>' +
								'</ul>' +
							'</div>' +
							'<div id="crimesPerMonth">' +
								'<div id="crimesPerMonthGraphDiv"></div>' +
								'<ul id="statsUl2">' +
								  '<li class="statsPerMonth">Januari: <span class="statData">' + crimesPerMonth.january + '</span></li>' +
								  '<li class="statsPerMonth">Februari: <span class="statData">' + crimesPerMonth.february + '</span></li>' +
								  '<li class="statsPerMonth">Mars: <span class="statData">' + crimesPerMonth.mars +'</span></li>' +
								  '<li class="statsPerMonth">April: <span class="statData">' + crimesPerMonth.april + '</span></li>' +
								  '<li class="statsPerMonth">Maj: <span class="statData">' + crimesPerMonth.may + '</span></li>' +
								  '<li class="statsPerMonth">Juni: <span class="statData">' + crimesPerMonth.june + '</span></li>' +
								  '<li class="statsPerMonth">Juli: <span class="statData">' + crimesPerMonth.july + '</span></li>' +
								  '<li class="statsPerMonth">Augusti: <span class="statData">' + crimesPerMonth.august + '</span></li>' +
								  '<li class="statsPerMonth">September: <span class="statData">' + crimesPerMonth.september + '</span></li>' +
								  '<li class="statsPerMonth">Oktober: <span class="statData">' + 0 + '</span></li>' +
								  '<li class="statsPerMonth">November: <span class="statData">' + crimesPerMonth.november + '</span></li>' +
								  '<li class="statsPerMonth">December: <span class="statData">' + crimesPerMonth.december + '</span></li>' +
								'</ul>' +
							'</div>' +
						 '</div>';

			$('#header').append('<h3 id="statsHeader">Statistik för postnummer ' +
									'<span id="zipColor">' + zipcode + '</span>' +
								'</h3>');

			// Renderar knapp för ny sökning
			$('#header').append('<div id="newSearchBtnDiv"><button class="btn" id="newSearchBtn">Ny sökning</button></div>');
			$('#newSearchBtn').on('click', function(){
				location.reload();
			});

			var height = '100%'; 
		    $("#infoBox").css('height', height);

			$('#infoBox').html(stats);

			// Renderar de olika brotten och månaderna under graferna
			var crime = [];
			crime[0] = '<div class="crime">MISSHANDEL</div>';
			crime[1] = '<div class="crime">STÖLD/INBROTT</div>';
			crime[2] = '<div class="crime">RÅN</div>';
			crime[3] = '<div class="crime">SKOTTLOSSNINGAR</div>';
			crime[4] = '<div class="crime">NARKOTIKABROTT</div>';
			crime[5] = '<div class="crime">VANDALISM</div>';
			crime[6] = '<div class="crime">TRAFIKOLYCKOR</div>';
			crime[7] = '<div class="crime">ÖVRIGT';

			var month = [];
			month[0] = '<div class="crime">JANUARI</div>';
			month[1] = '<div class="crime">FEBRUARI</div>';
			month[2] = '<div class="crime">MARS</div>';
			month[3] = '<div class="crime">APRIL</div>';
			month[4] = '<div class="crime">MAJ</div>';
			month[5] = '<div class="crime">JUNI</div>';
			month[6] = '<div class="crime">JULI</div>';
			month[7] = '<div class="crime">AUGUSTI</div>';
			month[8] = '<div class="crime">SEPTEMBER</div>';
			month[9] = '<div class="crime">OKTOBER</div>';
			month[10] = '<div class="crime">NOVEMBER</div>';
			month[11] = '<div class="crime">DECEMBER</div>';

			var graphHeader = '<div id="statHeader"><h4>Brott per kategori</h4></div>',
				graphHeader2 = '<div id="statHeader2"><h4>Brott per månad</h4></div>';

			$('#nrOfCrimesGraphDiv').append(myChart);
			$('#crimesPerMonthGraphDiv').append(myChart2);

			$('#statsUl').prepend(graphHeader);
			$('#statsUl2').prepend(graphHeader2);

			$('.crimeData').each(function(i) {
				$(this).html(crime[i]);
			});

			$('.monthData').each(function(i) {
				$(this).html(month[i]);
			});

			$('#infoBox').append('<div id="mapDiv">' +
									'<h4 id="mapHeader">Ett urval av händelser på karta</h4>' +
								 	'<div id="map"></div>' +
								 '</div>');

			var clear = '<div style="clear: both;"></div>';

			// Exekverar funktionen för att rendera ut kartan
			ApiHandlers.SetMap(coordinates, zipCoordinates);
		}
	},

	// Renderar ut dropdown-boxar för sök-inställningar om användaren är inloggad
	ShowExtraFeatures: function() {
		$('#extraFeatures').html('');
		var extraFeatures = '<div id="loggedInFeatures">' +
	              				'<div id="nrOfMonthsDiv">' +
		                			'<label>Antal månader:</label>' +
		                			'<select id="nrOfMonths">' +
		                  				'<option value="1" >1 månader</option>' +
		                  				'<option selected="selected" value="3" >3 månader</option>' +
		                  				'<option value="6" >6 månader</option>' +
		                			'</select>' +
	              				'</div>' +
	              				'<div id="radiusDiv">' +
		                			'<label>Sök-radie</label>' +
		                			'<select id="radius">' +
			                  			'<option value="1" >1 km</option>' +
			                  			'<option selected="selected" value="2">2 km</option>' +
			                  			'<option value="3" >3 km</option>' +
									'</select>' +
	              				'</div>' +
	            			'</div>';

		$('#extraFeatures').append(extraFeatures);
	},

	HideExtraFeatures: function() {
		$('#extraFeatures').html('');
	},

	// Hantering av felmeddelanden på klienten
	ErrorHandling: function(errorType) {

		var errorMessage = '';

		var	ERROR_MESSAGES = {
			wrong_nr_of_chars: 'Postnumret måste vara 5 siffror.',
			illegal_chars: 'Postnumret får bara innehålla siffror.',
			no_data: 'Ett fel inträffade. Försök igen!'
		}

		if (errorType == 'wrong_nr_of_chars') { errorMessage = ERROR_MESSAGES.wrong_nr_of_chars }
		else if (errorType == 'illegal_chars') { errorMessage = ERROR_MESSAGES.illegal_chars }
		else if (errorType == 'no_data') { errorMessage = ERROR_MESSAGES.no_data }

		var error = '<strong>Fel!</strong> ' + errorMessage;

		$('#message').show();
		$('#errorContent').html(error);
	}
}

window.onload = Capsule.Init();