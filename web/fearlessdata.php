<?php
require_once "config.php";
require_once "lib_autolink.php";


$db = new mysqli(DB_HOST,DB_USERNAME,DB_PASSWORD,DB_NAME);
$db->set_charset("utf8");
$server = empty($_GET['server']) ? "115332333745340416" : $_GET['server'];
?>
<!DOCTYPE html>
<html>
    <head>
        <title>FearlessBot Data Storage</title>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">

        <?php
        if ($_GET['theme']=="dark") {
            echo '<link rel="stylesheet" href="sortable-theme-dark.css" />';
            echo '<link rel="stylesheet" href="dark.css" />';
            $theme = "sortable-theme-dark";
        } else {
            echo '<link rel="stylesheet" href="sortable-theme-bootstrap.css" />';
            $theme = "sortable-theme-bootstrap";
        }
        ?>
        <style type="text/css">
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
            <table class="<?php echo $theme; ?>" data-sortable>
                <thead>
                <tr>
                    <th>Keyword</th>
                    <th>Value</th>
                    <th>Added By</th>
                    <th>Uses</th>
                </tr>
                </thead>
                <tbody>
                <?php
                $stmt = $db->prepare("SELECT keyword, value, uses, username FROM data_store
                LEFT JOIN members ON data_store.owner=members.id AND data_store.server=members.server WHERE approved=1 AND data_store.server= ? ORDER BY keyword ");
                $stmt->bind_param("s", $server);
                $stmt->execute();
                $stmt->bind_result($keyword, $value, $uses, $username);
                while ($stmt->fetch())
                {
                    echo "<tr><td>".htmlspecialchars($keyword)."</td><td>".nl2br(autolink(htmlspecialchars($value,50)))."</td><td>".htmlspecialchars($username)."</td><td>".$uses."</td></tr>";
                }
                ?>
                </tbody>
            </table>
        </div>
        <?php
        if ($server == "115332333745340416")
        {
        ?>
            <div id="channelStats">
                <h1>Channel Stats</h1>
                <table>
                    <tr><th>Channel</th><th>Total Messages</th></tr>
                    <?php
                    $query = $db->query("SELECT * FROM channel_stats WHERE web=1");
                    $total = 0;
                    while ($row = $query->fetch_array())
                    {
                        echo "<tr><td>".$row['name']."</td><td>".$row['total_messages']."</td></tr>";
                        $total += $row['total_messages'];
                    }
                    echo "<tr><td><b>Total</b></td><td>$total</td></tr>";
                    ?>
                </table>
            </div>
        <?php
        }
        ?>
        <script src="sortable.min.js"></script>
    </body>
</html>
