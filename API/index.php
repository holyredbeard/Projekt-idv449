<?php

  	require_once ('database.php');
	require_once ('Model/IncidentsModel.php');
    require_once ('Controller/IncidentsController.php');
    require_once ('request.php');
    require_once ('response.php');

    // Initialize db object
	//$database = new Database();
	$pm = new IncidentsModel(/*$db*/);

	//$db = $database->InitDB();

	// Parse the incoming request
	$req = new Request();

	// Get path
	if (isset($_SERVER['PATH_INFO'])) {
		$req->url_elements = explode('/', trim($_SERVER['PATH_INFO'], '/'));
	}

	//$req->method = strtoupper($_SERVER['REQUEST_METHOD']);
	$req->parameters = $_GET;

	// Route the request
	if (!empty($req->url_elements)) {

		// var_dump($req->url_elements);

		$county = $req->url_elements[0];
		$nrOfMonths = $req->url_elements[1];

		$controller = new IncidentsController;
		$response = call_user_func_array(array($controller, "get"), array($county, $nrOfMonths/*, $db*/));
	}
	else {
		header('HTTP/1.1 400 Bad Request');
		$response = 'Unknown request' . $_SERVER['PATH_INFO'];
	}

	if (gettype($response) != string) {

		$response_obj = Response::create($response);
		echo $response_obj->render();
	}	
	
	//echo $response;

?>