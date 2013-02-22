<?php

	require_once ('responsejson.php');

	class Response {

		public static function create($data) {
			$obj = new ResponseJson($data);

			return $obj;
		}

	}

?>