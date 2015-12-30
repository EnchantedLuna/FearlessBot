<?php
require_once "config.php";
$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8");
header("Content-Type: application/json");
$query = $db->query("SELECT * FROM members ORDER BY username");
$result = array();
while ($row = $query->fetch_array())
{
    $average = ($row['messages'] > 0) ? round($row['words']/$row['messages'],2) : 0;
    $result[$row['id']] = array(
        'username' => $row['username'],
        'words' => intval($row['words']),
        'averagewords' => $average,
        'fbotmessages' => intval($row['messages'])
    );
}
echo json_encode($result);