<?php
include 'simple_html_dom.php';


// Kontrollerar vilken data som skickats via ajax och kallar på relevant funktion
if($_REQUEST['zipcode']) {
    $zipcode = $_REQUEST['zipcode'];
    
    GetZipData($zipcode);
}

else if($_REQUEST['county']) {
    $county = $_REQUEST['county'];
    $period = $_REQUEST['period'];

    GetIncidents($period, $county);
}

else if($_REQUEST['coordinates']) {
    $coordinates = $_REQUEST['coordinates'];
    $zipCoordinates = $_REQUEST['zipCoordinates'];
    $radius = $_REQUEST['radius'];

    ExtractIncidents($coordinates, $zipCoordinates, $radius);
}

// Funktion som hämtar data för postnumret vilket returneras till klienten
function GetZipData($zipcode) {
    
    $tempAddresses = array();
    $zipData = array();

    $url = 'http://yourmoneyisnowmymoney.com/api/zipcodes/?zipcode=' . $zipcode;
 
    $ch = curl_init($url);
            
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);

    if(!$response) {
        $info = curl_getinfo($ch);
        curl_close($ch);
        $result["API_status"] = 0;
        $result["error"] = $info;

        echo $result;
    }
    else {
        $result["API_status"] = 1;
        $result["response"] = $response;

        array_push($zipData, $response);
        curl_close($ch);

        echo json_encode($result);
    }
}

// Funktion som hämtar händelser för det det län postnumret tillhör
function GetIncidents($period, $county) {

    $url = 'http://localhost/webbteknik2/projektet/api/' . $county . '/' . $period;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);

    if(curl_errno($ch)) {
        $info = curl_getinfo($ch);
        curl_close($ch);
        $result["API_status"] = 0;
        $result["error"] = $info;

        echo json_encode($result);
    } 
    else {
        $result["API_status"] = 1;
        curl_close($ch);
        $result["response"] = $response;
        echo json_encode($result);
    }
}

// Funktion som tar koordinaterna för de olika händelserna, postnumrets koordinater och den radie som ska behandlas som parametrar.
// Sedan räknar funktionen (med hjälp av pythagoras sats) ut vilka av dessa koordinater som är inom radien som ska räknas in och skickar
// tillbaka en array innehållande dessa.
function ExtractIncidents($coordinates, $zipCoordinates, $radius) {

    function CalcDistance($lat1, $lng1, $lat2, $lng2) {

        $latD = (691 / 6) * ($lat2 - $lat1);
        $lngD = (691 / 6) * ($lng2 - $lng1) * cos($lat2 / 57.3);

        return sqrt( $latD * $latD + $lngD * $lngD );
    }

    $matches = array();

    for($i = 0; $i < count($coordinates); $i++) {
        $lat1 = $coordinates[$i][0];
        $long1 = $coordinates[$i][1];

        $distance = CalcDistance($lat1, $long1, $zipCoordinates[0], $zipCoordinates[1]);

        if ($distance <= $radius){
            array_push($matches, $i);
        }
    }

    echo json_encode($matches);
}

?>