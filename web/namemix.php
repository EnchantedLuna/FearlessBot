<?php
require_once "config.php";
header('Content-type: text/plain');
$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8mb4");

for ($i=1; $i<=2;$i++) {
    echo "Part $i:\n";
    $query = $db->query("SELECT * FROM namemix WHERE part=$i ORDER BY name_piece");
    while ($row = $query->fetch_array())
    {
        echo $row['name_piece'] ."\n";
    }
    echo "\n\n";
}