<?php

	class Database {

		function __construct() {
			try {
	            $db = new PDO('sqlite:ProducersDB.sqlite');
	            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

	            return $db;
	        }
		    catch(PDOException $e) {
		        die("Something went wrong: " . $e->getMessage());
		    }
		}
	}

?>