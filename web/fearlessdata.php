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
        <style type="text/css">
        table, th, td {
            border: 1px solid black;
            border-collapse: collapse;
            padding:4px
        }
        #dataStore {
            margin-bottom: 10px;
            float:left;
        }
        #channelStats {
            float:left;
            margin-left: 10px;
            margin-bottom: 10px;
        }
        </style>
    </head>
    <body>
        <div id="dataStore">
            <h1>FearlessBot Data Storage</h1>
            <table>
                <tr>
                    <th>Keyword</th>
                    <th>Value</th>
                    <th>Added By</th>
                </tr>
                <?php
                $query = $db->query("SELECT keyword, value, uses, username FROM data_store LEFT JOIN members ON data_store.owner=members.id WHERE approved=1 ORDER BY keyword");
                while ($row = $query->fetch_array())
                {
                    echo "<tr><td>".autolink($row['keyword'],50)."</td><td>".nl2br(autolink($row['value'],50))."</td><td>".$row['username']."</td><td>".$row['uses']."</td></tr>";
                }
                ?>
            </table>
        </div>
        <div id="channelStats">
            <h1>Channel Stats</h1>
            <table>
                <tr><th>Channel</th><th>Total Messages</th></tr>
                <?php
                $query = $db->query("SELECT * FROM channel_stats WHERE web=1");
                while ($row = $query->fetch_array())
                {
                    echo "<tr><td>".$row['name']."</td><td>".$row['total_messages']."</td></tr>";
                }
                ?>
            </table>
        </div>
    </body>
</html>
