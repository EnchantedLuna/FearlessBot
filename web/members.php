<?php
require_once "config.php";

$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>/r/TaylorSwift Discord Member Statistics</title>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <link rel="stylesheet" href="sortable-theme-bootstrap.css" />
</head>
<body>
<div id="dataStore">
    <h1>Member Statistics</h1>
    <table class="sortable-theme-bootstrap" data-sortable>
        <thead>
        <tr>
            <th>Username</th>
            <th>Words</th>
            <th>Messages*</th>
            <th>Words/Msg</th>
            <th>Last Seen</th>
        </tr>
        </thead>
        <tbody>
        <?php
        if (isset($_GET['showinactive']))
        {
            $query = $db->query("SELECT * FROM members WHERE server='115332333745340416' ORDER BY username");
        }
        else
        {
            $query = $db->query("SELECT * FROM members WHERE server='115332333745340416' AND active=1 ORDER BY username");
        }
        while ($row = $query->fetch_array())
        {
            $average = ($row['messages'] > 0) ? round($row['words']/$row['messages'],2) : 0;
            $style =  ($row['active']) ? '' : 'color:red';
            echo "<tr style='$style'><td>".$row['username']."</td><td>".$row['words']."</td><td>".$row['messages']."</td><td>$average</td><td>".date('Y-m-d',$row['lastseen'])."</td></tr>";
        }
        ?>
        </tbody>
    </table>
</div>
*messages based on FearlessBot total. This will be less than TaylorBot's count if you have joined before words started being counted.
<script src="sortable.min.js"></script>
</body>
</html>
