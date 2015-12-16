<?php
require_once "config.php";
require_once "lib_autolink.php";


$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8");
?>
<!DOCTYPE html>
<html>
    <head>
        <title>FearlessBot Data Storage</title>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    </head>
    <body>
        <h1>FearlessBot Data Storage</h1>
        <table>
            <tr>
            <th>Keyword</th>
            <th>Value</th>
            </tr>
            <?php
            $query = $db->query("SELECT * FROM data_store WHERE approved=1 ORDER BY keyword");
            while ($row = $query->fetch_array())
            {
                echo "<tr><td>".autolink($row['keyword'],50)."</td><td>".autolink($row['value'],50)."</td></tr>";
            }
            ?>
        </table>
        <h1>Channel Stats</h1>
        <table>
            <tr><th>Channel</th><th>Total Messages</th></tr>
            <?php
            $query = $db->query("SELECT * FROM channel_stats WHERE channel IN ('119490967253286912', '115332333745340416')");
            while ($row = $query->fetch_array())
            {
                echo "<tr><td>".$row['name']."</td><td>".$row['total_messages']."</td></tr>";
            }
            ?>
        </table>
    </body>
</html>
