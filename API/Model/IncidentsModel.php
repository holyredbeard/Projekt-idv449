<?php

include 'Model/simple_html_dom.php';

class IncidentsModel {

	private $m_db = null;

	public $incidents = array();
	
	public function getIncidents($county, $nrOfMonths) {

		$stopDate = strtotime('1st October 2012 -' . $nrOfMonths .' months');

		$incidents = array();
	    $retrieveArticles = true;
	    $places = array();
	    $dates = array();
	    $texts = array();
	    $theCoordinates = array();

	    $j = 0;

	    while($retrieveArticles == true) {
	    	$j++;

	        if ($i == 0) {
	            $url = 'http://brottsplatskartan.se/lan/' . $county;
	        }
	        else {
	            $url = 'http://brottsplatskartan.se/lan/' . $county . '/sida/' . $i;
	        }

	        // Initierar simple_html_dom och laddar in sidan
	        $html = new simple_html_dom();
	        $html = file_get_html($url);

	        foreach($html->find('article') as $article) {
	            // initialize array to store the cell data from each row
	            $place = $article->find('header div p span', 0);
	            $place = $place->innertext;
	            array_push($places, $place);

	            $date = $article->find('header div p span', 1);
	            $date = $date->title;
	            $articleDate = strtotime($date);

	            if ($articleDate <= $stopDate) {
					$retrieveArticles = false;
				}

	            array_push($dates, $date);

	            $text = $article->find('div', 1);
	            $text = $text->innertext;
	            array_push($texts, $text);

	            $coordinates = $article->find('p a img', 0);
	            $coordinates = $coordinates->src;

	            parse_str(parse_url($coordinates, PHP_URL_QUERY), $vars);
	            $coords = explode(',', $vars['amp;center']);

	            array_push($theCoordinates, $coords);
	        }

	        $i += 10;
	    }
	    
	    array_push($incidents, $places);
	    array_push($incidents, $dates);
	    array_push($incidents, $texts);
	    array_push($incidents, $theCoordinates);

	    return $incidents;
	}
}