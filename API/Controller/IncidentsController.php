<?php

	require_once ('Model/IncidentsModel.php');

	class IncidentsController {

		// Action: GET
		public function get($county, $nrOfMonths/*, $db*/) {

			$incidents = $this->getIncidents($county, $nrOfMonths/*, $db*/);

			if ($incidents == null) {
				header('HTTP/1.1 500 Internal Server Error');
				return "Ett problem inträffade när indicenterna skulle hämtas";
			}

			return $incidents;
			
			header('HTTP/1.1 404 Not Found');
			return $response = 'Kan inte hitta postnumret: ' . $_SERVER['PATH_INFO'];;
		}

		//GET producers
		public function getIncidents($county, $nrOfMonths) {

			$pm = new IncidentsModel(/*$db*/);

			$incidents = $pm->getIncidents($county, $nrOfMonths);

			return $incidents;
		}
	}

?>