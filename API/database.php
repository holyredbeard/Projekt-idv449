<?php

	class Database {

		public function InitDB() {
			
			try {
	            $db = new PDO('sqlite:ProducersDB.sqlite');
	            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

	        }
		    catch(PDOException $e) {
		        die("Something went wrong: " . $e->getMessage());
		    }

		    return $db;
		}
	}

?>